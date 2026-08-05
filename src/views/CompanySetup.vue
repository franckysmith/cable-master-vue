<template>
  <div class="company-setup">

    <!-- Liste des entreprises existantes -->
    <div v-if="companies.length > 0" class="existing">
      <h3>Entreprises enregistrées</h3>
      <div
        v-for="c in companies"
        :key="c.companyid"
        class="company-card"
        :class="{ selected: selectedCompany?.companyid === c.companyid }"
        @click="selectCompany(c)"
      >
        <div class="company-info">
          <span class="company-name">{{ c.name }}</span>
          <span class="company-domain">{{ domainLabel(c.domain) }}</span>
        </div>
        <div class="company-right">
          <span class="company-city">{{ c.city }}</span>
          <button class="btn-connect" @click.stop="connectAs(c)" :class="{ active: activeCompanyId === c.companyid }">
            {{ activeCompanyId === c.companyid ? '✓ Connecté' : 'Connecter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Formulaire -->
    <div class="form-panel">
      <h3>{{ editing ? 'Modifier' : 'Nouvelle entreprise' }}</h3>
      <form @submit.prevent="submit">
        <p v-if="editing" class="lock-note">🔒 Nom, SIRET et adresse sont verrouillés après la création de l'entreprise.</p>
        <div class="form-grid">
          <div class="form-row half">
            <label>Nom de l'entreprise * <span v-if="editing" class="lock-badge">🔒</span></label>
            <input v-model="form.name" placeholder="ex: Audio Test" required :readonly="editing" :class="{ locked: editing }" />
          </div>
          <div class="form-row half">
            <label>Nom court (≈5 lettres)</label>
            <input v-model="form.short_name" placeholder="ex: Moon" maxlength="8" />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-row half">
            <label>SIRET <span v-if="editing" class="lock-badge">🔒</span></label>
            <input v-model="form.siret" placeholder="N° SIRET" inputmode="numeric" :readonly="editing" :class="{ locked: editing }" />
          </div>
        </div>
        <div class="form-row">
          <label>Départements *</label>
          <div class="domain-picker">
            <button
              v-for="d in domains"
              :key="d.value"
              type="button"
              class="domain-btn"
              :class="{ active: form.departments.includes(d.value) }"
              @click="toggleDepartment(d.value)"
            >
              {{ d.icon }} {{ d.label }}
            </button>
          </div>
          <p class="hint">Chaque département aura sa propre liste de matériel</p>
        </div>
        <div class="form-row">
          <label>Adresse <span v-if="editing" class="lock-badge">🔒</span></label>
          <input v-model="form.address" placeholder="Rue, numéro..." :readonly="editing" :class="{ locked: editing }" />
        </div>
        <div class="form-grid">
          <div class="form-row half">
            <label>Code postal <span v-if="editing" class="lock-badge">🔒</span></label>
            <input v-model="form.postal_code" placeholder="ex. 31000" inputmode="numeric" :readonly="editing" :class="{ locked: editing }" />
          </div>
          <div class="form-row half">
            <label>Ville <span v-if="editing" class="lock-badge">🔒</span></label>
            <input v-model="form.city" placeholder="Ville" :readonly="editing" :class="{ locked: editing }" />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-row half">
            <label>Pays <span v-if="editing" class="lock-badge">🔒</span></label>
            <input v-model="form.country" placeholder="Pays" :readonly="editing" :class="{ locked: editing }" />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-row half">
            <label>Téléphone</label>
            <input v-model="form.phone" placeholder="+33..." />
          </div>
          <div class="form-row half">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="contact@..." />
          </div>
        </div>

        <div class="resp-block">
          <div class="resp-title">👑 Responsable (gérant)</div>
          <div class="form-grid">
            <div class="form-row half">
              <label>Prénom</label>
              <input v-model="form.resp_firstname" placeholder="Prénom" />
            </div>
            <div class="form-row half">
              <label>Nom</label>
              <input v-model="form.resp_lastname" placeholder="Nom" />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-row half">
              <label>Surnom (diminutif)</label>
              <input v-model="form.resp_nickname" placeholder="ex. Math" />
            </div>
          </div>
          <div class="form-grid">
            <div class="form-row half">
              <label>Email</label>
              <input v-model="form.resp_email" type="email" placeholder="email@..." />
            </div>
            <div class="form-row half">
              <label>Téléphone</label>
              <input v-model="form.resp_phone" placeholder="+33..." />
            </div>
          </div>
          <p class="hint">Seul le gérant peut modifier la fiche de l'entreprise et définir les masters.</p>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="!form.name || form.departments.length === 0">
            {{ editing ? 'Enregistrer' : 'Créer l\'entreprise' }}
          </button>
          <button v-if="editing" type="button" class="btn-cancel" @click="resetForm">Annuler</button>
          <button v-if="editing" type="button" class="btn-delete" @click="deleteCompany">Supprimer</button>
        </div>
      </form>
    </div>

    <!-- Gestionnaires / suivi des affaires -->
    <div v-if="activeCompanyId" class="managers-section">
      <!-- Master principal enregistré (confirmation) -->
      <div v-if="activeCompany && (activeCompany.resp_firstname || activeCompany.resp_lastname)" class="principal-card">
        <div class="principal-title">
          👑 Gérant
          <button class="mgr-edit-btn principal-edit" @click="editPrincipal" title="Modifier le gérant">✎</button>
        </div>
        <div class="principal-name">
          {{ activeCompany.resp_firstname }} {{ activeCompany.resp_lastname }}
          <span v-if="activeCompany.resp_nickname" class="principal-nick">« {{ activeCompany.resp_nickname }} »</span>
        </div>
        <div v-if="activeCompany.resp_email || activeCompany.resp_phone" class="principal-contact">
          {{ activeCompany.resp_email }}{{ activeCompany.resp_phone ? ' · ' + activeCompany.resp_phone : '' }}
        </div>
      </div>
      <p v-else-if="activeCompany" class="hint">⚠️ Aucun gérant enregistré — renseigne le « Responsable » dans la fiche entreprise ci-dessus.</p>

      <h3>Master &amp; masters secondaires</h3>
      <p class="hint">Définis par le gérant. Le <b>master (M)</b> est le principal ; les autres sont des <b>masters secondaires</b>. Tous peuvent inviter des techniciens et créer/suivre des affaires, mais pas modifier la fiche de l'entreprise.</p>

      <div v-for="mgr in orderedManagers" :key="mgr.techid" class="manager-card" :class="{ 'is-principal': isPrincipalMaster(mgr) }">
        <template v-if="editManagerId === mgr.techid">
          <div class="form-grid">
            <div class="form-row half"><label>Prénom</label><input v-model="editManager.firstname" placeholder="Prénom" /></div>
            <div class="form-row half"><label>Nom</label><input v-model="editManager.lastname" placeholder="Nom" /></div>
          </div>
          <div class="form-grid">
            <div class="form-row half"><label>Surnom (diminutif)</label><input v-model="editManager.nickname" placeholder="ex. Kev" /></div>
          </div>
          <div class="form-grid">
            <div class="form-row half"><label>Email</label><input v-model="editManager.email" type="email" placeholder="email@..." /></div>
            <div class="form-row half"><label>Téléphone</label><input v-model="editManager.phone" placeholder="+33..." /></div>
          </div>
          <div class="form-actions">
            <button class="btn-save" @click="saveManager(mgr)">Enregistrer</button>
            <button class="btn-cancel" @click="editManagerId = null">Annuler</button>
          </div>
        </template>
        <template v-else>
          <div class="mgr-info">
            <div class="mgr-name">
              <span v-if="isPrincipalMaster(mgr)" class="mgr-badge principal">👑 Master</span>
              <span v-else class="mgr-badge secondary">Master secondaire</span>
              {{ mgr.name }}<span v-if="mgr.nickname" class="mgr-nick"> « {{ mgr.nickname }} »</span>
            </div>
            <div class="mgr-contact">{{ mgr.email }}{{ mgr.phone ? ' · ' + mgr.phone : '' }}</div>
          </div>
          <div class="mgr-actions">
            <button v-if="!isPrincipalMaster(mgr)" class="mgr-promote-btn" @click="setPrincipalMaster(mgr)" title="Désigner master principal">M</button>
            <button class="mgr-edit-btn" @click="startEditManager(mgr)" title="Modifier">✎</button>
            <button class="mgr-delete-btn" @click="deleteManager(mgr)" title="Révoquer (repasser technicien)">✕</button>
          </div>
        </template>
      </div>

      <div v-if="managers.length === 0" class="emp-empty">Aucun master secondaire</div>

      <button v-if="!showAddManager" class="btn-add-employee" @click="showAddManager = true">+ Ajouter un master</button>
      <div v-if="showAddManager" class="add-employee-form">
        <div class="form-grid">
          <div class="form-row half"><label>Prénom *</label><input v-model="newManager.firstname" placeholder="Prénom" /></div>
          <div class="form-row half"><label>Nom *</label><input v-model="newManager.lastname" placeholder="Nom" /></div>
        </div>
        <div class="form-grid">
          <div class="form-row half"><label>Surnom (diminutif)</label><input v-model="newManager.nickname" placeholder="ex. Kev" /></div>
        </div>
        <div class="form-grid">
          <div class="form-row half"><label>Email</label><input v-model="newManager.email" type="email" placeholder="email@..." /></div>
          <div class="form-row half"><label>Téléphone</label><input v-model="newManager.phone" placeholder="+33..." /></div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="addManager" :disabled="!newManager.firstname && !newManager.lastname">Ajouter</button>
          <button class="btn-cancel" @click="showAddManager = false">Annuler</button>
        </div>
      </div>
    </div>


    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { supabase } from '../lib/supabase'
import { useCableStore } from '../stores/cables'
import { copyStandardCables } from '../lib/provisioning'

const cableStore = useCableStore()
const companyName = inject('companyName', ref(''))

const companies = ref([])
const selectedCompany = ref(null)
const editing = ref(false)
const message = ref('')
const messageType = ref('')
const activeCompanyId = ref(parseInt(localStorage.getItem('cablemaster-companyid')) || null)
const employees = ref([])
const showAddEmployee = ref(false)
const newEmployee = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  can_manage_mics: false,
  can_manage_ct: false,
})

// Entreprise active (pour afficher le master principal enregistré)
const activeCompany = computed(() => companies.value.find(c => c.companyid === activeCompanyId.value) || null)
// Gestionnaires (suivi des affaires) = techniciens marqués can_manage_affairs
const managers = computed(() => employees.value.filter(e => e.can_manage_affairs))
// Le master principal (M) de l'entreprise ; les autres managers sont « secondaires »
function isPrincipalMaster(mgr) { return !!activeCompany.value && activeCompany.value.master_techid === mgr.techid }
// Master principal en premier, puis les secondaires
const orderedManagers = computed(() =>
  [...managers.value].sort((a, b) => (isPrincipalMaster(b) ? 1 : 0) - (isPrincipalMaster(a) ? 1 : 0))
)
async function setPrincipalMaster(mgr) {
  if (!activeCompany.value) return
  const { error } = await supabase.from('company').update({ master_techid: mgr.techid }).eq('companyid', activeCompany.value.companyid)
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }
  await loadCompanies()
  showMessage(`${mgr.name} est désormais le master principal`, 'success')
}
const staff = computed(() => employees.value.filter(e => !e.can_manage_affairs))

// Postes (mêmes que TechList) — affichage 3 niveaux : foncé (principal) / clair / blanc
const postes = [
  { value: 'front', label: 'FOH' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'system', label: 'Système' },
  { value: 'stage', label: 'Stage' },
  { value: 'assistant', label: 'Assistant' },
]
function techPostes(t) {
  if (Array.isArray(t.postes) && t.postes.length) return t.postes
  return t.poste ? [t.poste] : []
}
function posteState(t, value) {
  const arr = techPostes(t)
  if (!arr.length) return ''
  if (arr[0] === value) return 'primary'
  if (arr.includes(value)) return 'secondary'
  return ''
}
function sortedPostes(t) {
  const rank = { primary: 0, secondary: 1, '': 2 }
  return [...postes].sort((a, b) => rank[posteState(t, a.value)] - rank[posteState(t, b.value)])
}
const showAddManager = ref(false)
const newManager = reactive({ firstname: '', lastname: '', nickname: '', email: '', phone: '' })
const editManagerId = ref(null)
const editManager = reactive({ firstname: '', lastname: '', nickname: '', email: '', phone: '' })

const domains = [
  { value: 'sound', label: 'Son', icon: '🔊' },
  { value: 'light', label: 'Lumière', icon: '💡' },
  { value: 'video', label: 'Vidéo', icon: '🎬' },
]

const form = reactive({
  name: '',
  short_name: '',
  siret: '',
  departments: [],
  address: '',
  postal_code: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  resp_firstname: '',
  resp_lastname: '',
  resp_nickname: '',
  resp_email: '',
  resp_phone: '',
})

function toggleDepartment(d) {
  const idx = form.departments.indexOf(d)
  if (idx >= 0) form.departments.splice(idx, 1)
  else form.departments.push(d)
}

onMounted(async () => {
  // Resync : l'entreprise connectée = celle du localStorage (peut avoir changé via le sélecteur)
  activeCompanyId.value = parseInt(localStorage.getItem('cablemaster-companyid')) || activeCompanyId.value
  await loadCompanies()
  if (activeCompanyId.value) loadEmployees()
})
// Au retour sur la page (focus), resync aussi
function syncActiveCompany() {
  if (document.visibilityState === 'visible') {
    activeCompanyId.value = parseInt(localStorage.getItem('cablemaster-companyid')) || activeCompanyId.value
  }
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', syncActiveCompany)

async function loadCompanies() {
  const { data } = await supabase
    .from('company')
    .select('*')
    .order('name')
  companies.value = data || []
}

function domainLabel(d) {
  if (!d) return ''
  return d.split(',').map(v => {
    const found = domains.find(x => x.value === v)
    return found ? `${found.icon} ${found.label}` : v
  }).join(' · ')
}

function selectCompany(c) {
  selectedCompany.value = c
  editing.value = true
  form.name = c.name
  form.short_name = c.short_name || ''
  form.siret = c.siret || ''
  form.departments = c.domain ? c.domain.split(',') : []
  form.address = c.address || ''
  form.postal_code = c.postal_code || ''
  form.city = c.city || ''
  form.country = c.country || ''
  form.phone = c.phone || ''
  form.email = c.email || ''
  form.resp_firstname = c.resp_firstname || ''
  form.resp_lastname = c.resp_lastname || ''
  form.resp_nickname = c.resp_nickname || ''
  form.resp_email = c.resp_email || ''
  form.resp_phone = c.resp_phone || ''
}

// Crayon « Gérant » → ouvre la fiche entreprise pré-remplie pour modifier le responsable/gérant
function editPrincipal() {
  if (!activeCompany.value) return
  selectCompany(activeCompany.value)
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editing.value = false
  selectedCompany.value = null
  Object.assign(form, { name: '', short_name: '', siret: '', departments: [], address: '', postal_code: '', city: '', country: '', phone: '', email: '', resp_firstname: '', resp_lastname: '', resp_nickname: '', resp_email: '', resp_phone: '' })
  message.value = ''
}

const domainLabels = { sound: 'Son', light: 'Lumière', video: 'Vidéo' }

async function submit() {
  if (!form.name || form.departments.length === 0) return

  if (editing.value && selectedCompany.value) {
    const { error } = await supabase
      .from('company')
      .update({
        // name / siret / address / city / country sont verrouillés après création
        domain: form.departments.join(','),
        short_name: form.short_name,
        phone: form.phone,
        email: form.email,
        resp_firstname: form.resp_firstname,
        resp_lastname: form.resp_lastname,
        resp_nickname: form.resp_nickname,
        resp_email: form.resp_email,
        resp_phone: form.resp_phone,
      })
      .eq('companyid', selectedCompany.value.companyid)
    if (error) {
      showMessage('Erreur: ' + error.message, 'error')
    } else {
      showMessage('Entreprise modifiée', 'success')
      await loadCompanies()
      resetForm()
    }
  } else {
    // Créer un catalogue par département
    const catalogIds = {}
    for (const dept of form.departments) {
      const label = domainLabels[dept] || dept
      const { data: cat } = await supabase
        .from('catalog')
        .insert({
          name: `${form.name} - ${label}`,
          owner_name: form.name,
          description: `${label} - ${form.name}`,
          department: dept,
        })
        .select()

      if (cat?.[0]) {
        catalogIds[dept] = cat[0].catalogid
        // Copier la liste standard du département (sans effet tant que le
        // standard Lumière / Vidéo est vide)
        await copyStandardCables(cat[0].catalogid, dept)
      }
    }

    // Créer l'entreprise (catalog_id = premier catalogue)
    const firstCatId = Object.values(catalogIds)[0] || null
    const { error } = await supabase
      .from('company')
      .insert({
        name: form.name,
        short_name: form.short_name,
        siret: form.siret,
        domain: form.departments.join(','),
        address: form.address,
        postal_code: form.postal_code,
        city: form.city,
        country: form.country,
        phone: form.phone,
        email: form.email,
        resp_firstname: form.resp_firstname,
        resp_lastname: form.resp_lastname,
        resp_nickname: form.resp_nickname,
        resp_email: form.resp_email,
        resp_phone: form.resp_phone,
        catalog_id: firstCatId,
      })
      .select()

    if (error) {
      showMessage('Erreur: ' + error.message, 'error')
    } else {
      const depts = form.departments.map(d => domainLabels[d]).join(', ')
      showMessage(`${form.name} créée (${depts}) !`, 'success')
      await loadCompanies()
      resetForm()
    }
  }
}

async function deleteCompany() {
  if (!selectedCompany.value) return
  if (!confirm(`Supprimer "${selectedCompany.value.name}" ?`)) return

  const { error } = await supabase
    .from('company')
    .delete()
    .eq('companyid', selectedCompany.value.companyid)

  if (error) {
    showMessage('Erreur: ' + error.message, 'error')
  } else {
    showMessage('Entreprise supprimée', 'success')
    await loadCompanies()
    resetForm()
  }
}

async function connectAs(company) {
  activeCompanyId.value = company.companyid
  localStorage.setItem('cablemaster-companyid', company.companyid)
  localStorage.setItem('cablemaster-company', company.name)
  localStorage.setItem('cablemaster-catalogid', company.catalog_id)
  companyName.value = company.name

  // Charger le catalogue de l'entreprise
  if (company.catalog_id) {
    await cableStore.fetchCables(company.catalog_id)
  }

  showMessage(`Connecté à ${company.name}`, 'success')
  await loadEmployees()
}

// --- Employés ---

async function loadEmployees() {
  if (!activeCompanyId.value) return
  const { data } = await supabase
    .from('technician')
    .select('*')
    .eq('company_id', activeCompanyId.value)
    .order('name')
  employees.value = data || []
}

async function addEmployee() {
  if (!newEmployee.firstname && !newEmployee.lastname) return
  const name = `${newEmployee.firstname} ${newEmployee.lastname}`.trim()
  const { error } = await supabase.from('technician').insert({
    name,
    email: newEmployee.email,
    phone: newEmployee.phone,
    company_id: activeCompanyId.value,
    can_manage_mics: newEmployee.can_manage_mics,
    can_manage_ct: newEmployee.can_manage_ct,
  })
  if (error) {
    showMessage('Erreur: ' + error.message, 'error')
  } else {
    Object.assign(newEmployee, { firstname: '', lastname: '', email: '', phone: '', can_manage_mics: false, can_manage_ct: false })
    showAddEmployee.value = false
    showMessage(`${name} ajouté`, 'success')
    await loadEmployees()
  }
}

async function togglePermission(emp, field, event) {
  const value = event.target.checked
  await supabase.from('technician').update({ [field]: value }).eq('techid', emp.techid)
  emp[field] = value
}

function generatePassword(emp) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  emp._password = pwd
  // Sauvegarder le mot de passe hashé (pour l'instant en clair)
  supabase.from('technician').update({ role: pwd }).eq('techid', emp.techid)
}

async function copyPassword(pwd) {
  try {
    await navigator.clipboard.writeText(pwd)
    showMessage('Mot de passe copié', 'success')
  } catch {
    showMessage(pwd, 'success')
  }
}

async function deleteEmployee(emp) {
  if (!confirm(`Retirer ${emp.name} ?`)) return
  await supabase.from('technician').delete().eq('techid', emp.techid)
  await loadEmployees()
  showMessage(`${emp.name} retiré`, 'success')
}

// --- Gestionnaires ---

async function addManager() {
  if (!newManager.firstname && !newManager.lastname) return
  const name = `${newManager.firstname} ${newManager.lastname}`.trim()
  const { error } = await supabase.from('technician').insert({
    name,
    firstname: newManager.firstname,
    nickname: newManager.nickname || null,
    email: newManager.email,
    phone: newManager.phone,
    company_id: activeCompanyId.value,
    can_manage_affairs: true,
  })
  if (error) {
    showMessage('Erreur: ' + error.message, 'error')
  } else {
    Object.assign(newManager, { firstname: '', lastname: '', nickname: '', email: '', phone: '' })
    showAddManager.value = false
    showMessage(`${name} ajouté`, 'success')
    await loadEmployees()
  }
}

function startEditManager(mgr) {
  editManagerId.value = mgr.techid
  const fn = mgr.firstname || ''
  Object.assign(editManager, {
    firstname: fn,
    lastname: fn ? (mgr.name || '').replace(fn, '').trim() : (mgr.name || ''),
    nickname: mgr.nickname || '',
    email: mgr.email || '',
    phone: mgr.phone || '',
  })
}

async function saveManager(mgr) {
  const name = `${editManager.firstname} ${editManager.lastname}`.trim()
  const { error } = await supabase.from('technician').update({
    name,
    firstname: editManager.firstname,
    nickname: editManager.nickname || null,
    email: editManager.email,
    phone: editManager.phone,
  }).eq('techid', mgr.techid)
  if (error) {
    showMessage('Erreur: ' + error.message, 'error')
  } else {
    editManagerId.value = null
    showMessage('Gestionnaire modifié', 'success')
    await loadEmployees()
  }
}

// Révoquer = rétrograder en technicien (on garde la personne, on retire juste le rôle master)
async function deleteManager(mgr) {
  if (!confirm(`Révoquer ${mgr.name} comme master ? Il redevient technicien.`)) return
  await supabase.from('technician').update({ can_manage_affairs: false }).eq('techid', mgr.techid)
  // S'il était le master principal, on libère la place
  if (isPrincipalMaster(mgr) && activeCompany.value) {
    await supabase.from('company').update({ master_techid: null }).eq('companyid', activeCompany.value.companyid)
    await loadCompanies()
  }
  await loadEmployees()
  showMessage(`${mgr.name} redevient technicien`, 'success')
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.company-setup {
  max-width: 560px;
  margin: 0 auto;
  padding: 10px 4px;
  text-align: left;
}
h2 {
  text-align: center;
  font-size: 18px;
  margin-bottom: 15px;
}
h3 {
  font-size: 15px;
  margin-bottom: 10px;
  color: var(--text, #333);
}
.existing {
  margin-bottom: 15px;
}
.company-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.company-card:hover {
  border-color: var(--color1);
}
.company-card.selected {
  border-color: var(--color1);
  background: rgba(139, 92, 246, 0.16);
}
.company-info {
  display: flex;
  flex-direction: column;
}
.company-name {
  font-size: 15px;
  font-weight: 700;
}
.company-domain {
  font-size: 12px;
  color: var(--text-light, #888);
}
.company-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.company-city {
  font-size: 13px;
  color: var(--text-muted, #999);
}
.btn-connect {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  background: var(--color1);
  color: #fff;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.btn-connect.active {
  background: #eb910a;
  color: #fff;
}
.form-panel {
  background: var(--bg-card, #fafafa);
  border: 2px solid var(--color3);
  border-radius: 10px;
  padding: 14px;
}
.form-row {
  margin-bottom: 10px;
}
.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light, #666);
  margin-bottom: 3px;
}
.form-row input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
}
.form-row input:focus {
  border-color: var(--color1);
}
.form-grid {
  display: flex;
  gap: 8px;
}
.form-row.half {
  flex: 1;
}
.domain-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.domain-btn {
  padding: 8px 12px;
  border: 2px solid var(--border-light, #ccc);
  border-radius: 8px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: none;
  min-width: auto;
}
.domain-btn.active {
  border-color: var(--color1);
  background: var(--color1);
  color: #fff;
}
.hint {
  font-size: 11px;
  color: var(--text-muted, #999);
  margin-top: 4px;
  font-style: italic;
}
.resp-block {
  margin-top: 12px;
  padding: 10px;
  border: 1px dashed var(--color1);
  border-radius: 8px;
  background: var(--bg-section);
}
.resp-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color1-dark);
  margin-bottom: 8px;
}
.lock-note {
  font-size: 11px;
  color: var(--text-muted, #999);
  margin-bottom: 8px;
  font-style: italic;
}
.lock-badge {
  font-size: 11px;
}
input.locked {
  background: rgba(139, 92, 246, 0.16) !important;
  color: var(--text, #333) !important;
  border-color: rgba(139, 92, 246, 0.5) !important;
  cursor: not-allowed;
}
.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.btn-save {
  flex: 1;
  padding: 10px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
}
.btn-save:disabled {
  opacity: 0.4;
}
.btn-cancel {
  padding: 10px 14px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
}
.btn-delete {
  padding: 10px 14px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
}
.message {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
}
.message.success {
  background: var(--color1-light);
  color: var(--color1-dark);
}
.message.error {
  background: #fecaca;
  color: #dc2626;
}
.managers-section {
  margin-top: 20px;
}
.principal-card {
  border: 1px solid var(--color1);
  background: var(--bg-section);
  border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;
}
.principal-title { font-size: 12px; font-weight: 700; color: var(--color1); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
.principal-edit { margin-left: auto; }
.principal-name { font-size: 16px; font-weight: 700; margin-top: 2px; color: var(--text); }
.principal-nick { font-weight: 600; color: var(--color1); }
.principal-contact { font-size: 13px; color: var(--text-muted, #888); margin-top: 2px; }
.mgr-nick { font-weight: 600; color: var(--color1); }
.manager-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid var(--color1);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 6px;
  background: var(--bg-section);
}
.manager-card.is-principal { border-width: 2px; box-shadow: 0 0 0 1px var(--color1) inset; }
.mgr-badge { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; padding: 1px 6px; border-radius: 6px; margin-right: 6px; vertical-align: middle; }
.mgr-badge.principal { background: var(--color1); color: #fff; }
.mgr-badge.secondary { background: rgba(139, 92, 246, 0.16); color: var(--color1); }
.mgr-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #333);
}
.mgr-contact {
  font-size: 12px;
  color: var(--text-light, #888);
}
.mgr-actions {
  display: flex;
  gap: 6px;
}
.mgr-edit-btn, .mgr-delete-btn {
  background: transparent;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 8px;
  box-shadow: none;
  min-width: auto;
}
.mgr-promote-btn {
  background: transparent;
  border: 1px solid var(--color1);
  color: var(--color1);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  padding: 2px 9px;
  box-shadow: none;
  min-width: auto;
}
.manager-card .form-grid,
.manager-card .form-actions {
  width: 100%;
}
.employees-section {
  margin-top: 20px;
}
.employees-section h3 {
  font-size: 15px;
  margin-bottom: 10px;
  color: var(--text, #333);
}
.employee-card {
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 6px;
  background: var(--bg-card, #fafafa);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.employee-card.inactive {
  opacity: 0.5;
}
/* Ligne 1 : nom à gauche, actif/clé/croix collés à droite */
.emp-head { display: flex; align-items: center; gap: 8px; }
.emp-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.emp-actions { margin-left: auto; }
/* Postes 3 niveaux (comme TechList) */
.tech-postes { display: flex; gap: 6px; flex-wrap: wrap; }
.tech-poste {
  font-size: 11px; font-weight: 600; border-radius: 10px; padding: 1px 8px;
  border: 1px solid var(--border-light, #ccc); background: var(--bg-input, #fff); color: var(--text-muted, #999);
}
.tech-poste.secondary { background: var(--color1-light, #e8f5e9); color: var(--color1-dark, #2e7d32); border-color: var(--color1-light, #e8f5e9); font-weight: 700; }
.tech-poste.primary { background: var(--color1-dark, #2e7d32); color: #fff; border-color: var(--color1-dark, #2e7d32); font-weight: 800; }
.emp-contact {
  font-size: 12px;
  color: var(--text-light, #888);
}
.active-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
}
.active-toggle input { display: none; }
.emp-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.emp-permissions {
  display: flex;
  gap: 10px;
}
.perm-toggle {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text, #333);
}
.perm-toggle input { width: 14px; height: 14px; }
.emp-actions {
  display: flex;
  gap: 4px;
}
.emp-pwd-btn, .emp-delete-btn {
  background: transparent;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  box-shadow: none;
  min-width: auto;
}
.emp-password {
  margin-top: 6px;
  padding: 6px 8px;
  background: var(--color1-light);
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.emp-password strong {
  font-family: monospace;
  font-size: 15px;
  letter-spacing: 1px;
}
.copy-pwd-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  box-shadow: none;
  min-width: auto;
}
.emp-empty {
  text-align: center;
  color: var(--text-muted, #999);
  font-size: 13px;
  padding: 15px;
}
.btn-add-employee {
  width: 100%;
  padding: 10px;
  background: var(--color3);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  margin-top: 8px;
}
.add-employee-form {
  border: 2px solid var(--color3);
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;
}
.perm-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.perm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text, #333);
}
.perm-item input { width: 16px; height: 16px; }
</style>
