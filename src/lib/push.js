// Web Push (notifications) — abonnement côté client.
// La clé VAPID privée correspondante reste côté serveur (Edge Function).
import { supabase } from './supabase'

const VAPID_PUBLIC = 'BB7JKT3ACnu8xbyh5rHjR_EzkJZd6xptEP5xo_GbmgP1k7-3H7FL_q5wMvJ7-ahjVBEjoCg_aPsM5yhnkSuegeQ'

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Abonne l'appareil et enregistre l'abonnement en base (lié à l'email + entreprise)
export async function enableNotifications({ email } = {}) {
  if (!pushSupported()) throw new Error("Notifications non supportées (installe l'app via l'écran d'accueil).")

  // IMPORTANT iOS : requestPermission() doit être le 1er await, dans le geste du tap (pas d'await avant)
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error("Permission notifications refusée.")

  // Entreprise active (repli 1ʳᵉ) — APRÈS la demande de permission
  let companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || null
  if (!companyId) {
    const { data } = await supabase.from('company').select('companyid').order('companyid').limit(1)
    companyId = data && data[0] ? data[0].companyid : null
  }

  // Email : profil → sinon le technicien courant (pour relier l'abonnement et marquer "installé")
  let emailVal = (email || '').trim()
  if (!emailVal) {
    const techId = parseInt(localStorage.getItem('cablemaster-techid')) || 0
    if (techId) {
      const { data } = await supabase.from('technician').select('email').eq('techid', techId).maybeSingle()
      if (data && data.email) emailVal = data.email
    }
  }

  let reg = await navigator.serviceWorker.getRegistration()
  if (!reg) reg = await navigator.serviceWorker.ready
  if (!reg) throw new Error("Service worker absent (recharge l'app installée).")

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscription').upsert({
    endpoint: json.endpoint,
    p256dh: json.keys && json.keys.p256dh,
    auth: json.keys && json.keys.auth,
    email: emailVal || null,
    company_id: companyId || null,
  }, { onConflict: 'endpoint' })
  if (error) throw new Error(error.message)

  // Marque le technicien comme "installé" (point plein / nom non-italique)
  if (emailVal) {
    let q = supabase.from('technician').update({ installed: true }).eq('email', emailVal)
    if (companyId) q = q.eq('company_id', companyId)
    await q
  }
  return true
}

export async function notificationsActive() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}
