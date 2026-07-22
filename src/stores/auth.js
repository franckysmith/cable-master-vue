import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

// Socle auth : session réelle (lien magique) → profil résolu depuis les données
// (technicien / entreprise) → écrit les clés `cablemaster-*` que le reste de
// l'app lit déjà. On ne réécrit donc pas les ~20 consommateurs de ces clés.
export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const user = ref(null)
  // profile = { type:'freelance'|'company', technician, company, role, isSuper, techId, catalogId, companyId, companyName }
  const profile = ref(null)
  const initialized = ref(false)

  let resolveReady
  const ready = new Promise((r) => { resolveReady = r })

  const isAuthed = computed(() => !!session.value)
  const hasProfile = computed(() => !!profile.value)
  const displayName = computed(
    () => profile.value?.technician?.name || user.value?.email || ''
  )

  // Écrit (ou nettoie) le "contexte actif" lu partout dans l'app.
  function persistContext(p) {
    localStorage.setItem('cablemaster-userid', user.value?.id || '')
    if (user.value?.email) localStorage.setItem('cablemaster-email', user.value.email)
    else localStorage.removeItem('cablemaster-email')

    if (!p) {
      localStorage.removeItem('cablemaster-role')
      localStorage.removeItem('cablemaster-superadmin')
      localStorage.removeItem('cablemaster-catalogid')
      localStorage.removeItem('cablemaster-companyid')
      localStorage.removeItem('cablemaster-company')
      localStorage.removeItem('cablemaster-techid')
      return
    }
    localStorage.setItem('cablemaster-role', p.role)
    if (p.isSuper) localStorage.setItem('cablemaster-superadmin', 'true')
    else localStorage.removeItem('cablemaster-superadmin')
    if (p.techId) localStorage.setItem('cablemaster-techid', p.techId)
    else localStorage.removeItem('cablemaster-techid')
    if (p.catalogId) localStorage.setItem('cablemaster-catalogid', p.catalogId)
    else localStorage.removeItem('cablemaster-catalogid')
    if (p.companyId) localStorage.setItem('cablemaster-companyid', p.companyId)
    else localStorage.removeItem('cablemaster-companyid')
    if (p.companyName) localStorage.setItem('cablemaster-company', p.companyName)
    else localStorage.removeItem('cablemaster-company')
  }

  async function resolveProfile() {
    profile.value = null
    if (!user.value) { persistContext(null); return }

    const uid = user.value.id
    const email = (user.value.email || '').toLowerCase()

    // 1) fiche technicien liée au compte
    let tech = null
    {
      const { data } = await supabase
        .from('technician').select('*').eq('user_id', uid).limit(1)
      tech = data?.[0] || null
    }
    // 2) sinon, correspondance par e-mail (auto-link : cas d'un tech pré-invité)
    if (!tech && email) {
      const { data } = await supabase
        .from('technician').select('*').ilike('email', email).order('techid').limit(1)
      const byEmail = data?.[0] || null
      if (byEmail) {
        tech = byEmail
        await supabase.from('technician').update({ user_id: uid }).eq('techid', byEmail.techid)
        tech.user_id = uid
      }
    }
    if (!tech) { persistContext(null); return } // aucun profil → onboarding

    let company = null
    if (tech.company_id) {
      const { data } = await supabase
        .from('company').select('*').eq('companyid', tech.company_id).maybeSingle()
      company = data || null
    }

    const isSuper = !!tech.is_superadmin
    const isMaster =
      isSuper || !!tech.can_manage_affairs || (company && company.master_techid === tech.techid)
    const type = tech.company_id ? 'company' : 'freelance'
    const role = isMaster ? 'master' : 'technician'

    let catalogId = company?.catalog_id || null
    if (type === 'freelance') {
      const { data } = await supabase
        .from('catalog').select('catalogid').eq('user_id', uid).order('catalogid').limit(1)
      catalogId = data?.[0]?.catalogid || null
    }

    profile.value = {
      type,
      technician: tech,
      company,
      role,
      isSuper,
      techId: tech.techid,
      catalogId,
      companyId: tech.company_id || null,
      companyName: company?.name || '',
    }
    persistContext(profile.value)
  }

  async function bootstrap() {
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user || null
      if (user.value) await resolveProfile()
      else persistContext(null)
    } catch {
      /* hors-ligne : on laisse le contexte localStorage tel quel */
    } finally {
      supabase.auth.onAuthStateChange(async (_event, sess) => {
        session.value = sess
        user.value = sess?.user || null
        if (user.value) await resolveProfile()
        else persistContext(null)
      })
      initialized.value = true
      resolveReady()
    }
  }

  async function signInWithMagicLink(email) {
    return supabase.auth.signInWithOtp({
      email: email.trim(),
      // termine par "/" → matche proprement les motifs "…/**" de l'allowlist.
      // Le template e-mail (partagé) envoie AUSSI un code OTP → cf. verifyOtp().
      options: { emailRedirectTo: window.location.origin + '/' },
    })
  }

  // Le hub envoie un code à 6 chiffres (template partagé) : on le vérifie ici.
  // On établit session + profil AVANT de rendre la main, pour que l'écran puisse
  // router de façon déterministe (sinon flash /onboarding le temps de la résolution).
  async function verifyOtp(email, token) {
    const res = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    })
    if (!res.error) {
      session.value = res.data.session
      user.value = res.data.user
      await resolveProfile()
    }
    return res
  }

  async function signOut() {
    // scope 'local' = purge la session locale sans dépendre du réseau ; try/catch
    // pour que la déconnexion aboutisse TOUJOURS (sinon un token expiré la bloque).
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      /* ignore : on nettoie l'état local de toute façon */
    }
    session.value = null
    user.value = null
    profile.value = null
    persistContext(null)
  }

  return {
    session, user, profile, initialized, ready,
    isAuthed, hasProfile, displayName,
    bootstrap, resolveProfile, signInWithMagicLink, verifyOtp, signOut,
  }
})
