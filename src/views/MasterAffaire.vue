<template>
  <div class="master-affaire">
    <h2>Master Affaire</h2>

    <!-- Liste des affaires avec statut -->
    <div class="affair-tabs">
      <button :class="{ active: tab === 'all' }" @click="tab = 'all'">Toutes</button>
      <button :class="{ active: tab === 'draft' }" @click="tab = 'draft'">Brouillons</button>
      <button :class="{ active: tab === 'sent' }" @click="tab = 'sent'">Envoyées</button>
      <button :class="{ active: tab === 'done' }" @click="tab = 'done'">Terminées</button>
    </div>

    <!-- Liste -->
    <div class="affair-list">
      <div
        v-for="affair in filteredAffairs"
        :key="affair.affairid"
        class="affair-card"
        :class="{ selected: selected?.affairid === affair.affairid }"
        @click="selectAffair(affair)"
      >
        <div class="card-top">
          <span class="card-status" :class="affair.status || 'draft'">{{ statusLabel(affair.status) }}</span>
          <span class="card-name">{{ affair.name }}</span>
          <span class="card-date">{{ formatDate(affair.receipt_date) }}</span>
        </div>
        <div class="card-bottom">
          <span class="card-tech">{{ affair.tech_name || 'Pas de technicien' }}</span>
          <div class="card-tags">
            <span v-if="affair.front" class="tag-sm front">F</span>
            <span v-if="affair.monitor" class="tag-sm monitor">M</span>
            <span v-if="affair.stage" class="tag-sm stage">S</span>
          </div>
        </div>
      </div>
      <div v-if="filteredAffairs.length === 0" class="empty">Aucune affaire</div>
    </div>

    <!-- Bouton créer -->
    <button class="btn-create" @click="showForm = true; editing = null">+ Nouvelle affaire</button>

    <!-- Formulaire création/édition -->
    <div v-if="showForm" class="form-panel">
      <div class="form-header">
        <h3>{{ editing ? 'Modifier' : 'Nouvelle affaire' }}</h3>
        <button class="close-btn" @click="showForm = false">✕</button>
      </div>

      <div class="form-row">
        <label>Nom de l'affaire *</label>
        <input v-model="form.name" placeholder="ex: Festival Été 2026" required />
      </div>

      <div class="form-row">
        <label>Technicien</label>
        <select v-model="form.tech_email">
          <option value="">-- Choisir un technicien --</option>
          <option v-for="t in technicians" :key="t.techid" :value="t.email">
            {{ t.name }} ({{ t.email }})
          </option>
        </select>
        <button class="btn-add-tech" @click="showAddTech = !showAddTech">+ Nouveau</button>
      </div>

      <!-- Ajout nouveau technicien -->
      <div v-if="showAddTech" class="add-tech">
        <input v-model="newTech.name" placeholder="Nom" />
        <input v-model="newTech.email" placeholder="Email" />
        <input v-model="newTech.phone" placeholder="Téléphone" />
        <button @click="addTechnician">Ajouter</button>
      </div>

      <div class="form-grid">
        <div class="form-row half">
          <label>Prépa</label>
          <input type="date" v-model="form.prep_date" />
        </div>
        <div class="form-row half">
          <label>Réception *</label>
          <input type="date" v-model="form.receipt_date" required />
        </div>
      </div>
      <div class="form-row">
        <label>Retour *</label>
        <input type="date" v-model="form.return_date" required />
      </div>

      <div class="form-row">
        <label>Zones</label>
        <div class="zone-toggles">
          <button :class="{ active: form.front }" @click="form.front = !form.front">Front</button>
          <button :class="{ active: form.monitor }" @click="form.monitor = !form.monitor">Monitor</button>
          <button :class="{ active: form.stage }" @click="form.stage = !form.stage">Stage</button>
        </div>
      </div>

      <div class="form-row">
        <label>Description / Notes</label>
        <textarea v-model="form.description" rows="3" placeholder="Infos complémentaires..."></textarea>
      </div>

      <div class="form-actions">
        <button class="btn-save" @click="saveAffair" :disabled="!form.name || !form.receipt_date">
          {{ editing ? 'Enregistrer' : 'Créer' }}
        </button>
        <button v-if="editing" class="btn-draft" @click="setStatus('draft')">
          📝 Brouillon
        </button>
        <button v-if="editing && form.tech_email" class="btn-send" @click="sendInvitation">
          📩 Envoyer
        </button>
        <button v-if="editing" class="btn-delete" @click="deleteAffair">✕</button>
      </div>
    </div>

    <!-- Message -->
    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const tab = ref('all')
const affairs = ref([])
const technicians = ref([])
const selected = ref(null)
const showForm = ref(false)
const showAddTech = ref(false)
const editing = ref(null)
const message = ref('')
const messageType = ref('')

const companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || null
const catalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || null

const form = reactive({
  name: '',
  tech_name: '',
  tech_email: '',
  prep_date: '',
  receipt_date: '',
  return_date: '',
  front: false,
  monitor: false,
  stage: false,
  description: '',
})

const newTech = reactive({ name: '', email: '', phone: '' })

onMounted(() => {
  loadAffairs()
  loadTechnicians()
})

async function loadAffairs() {
  let query = supabase.from('affair').select('*').order('receipt_date', { ascending: false })
  if (catalogId) query = query.eq('catalog_id', catalogId)
  const { data } = await query
  const now = new Date()
  // Passer en "done" les affaires dont la date de retour est passée
  for (const a of data || []) {
    if (a.return_date && new Date(a.return_date) < now && a.status !== 'done') {
      a.status = 'done'
      await supabase.from('affair').update({ status: 'done' }).eq('affairid', a.affairid)
    }
  }
  affairs.value = data || []
}

async function loadTechnicians() {
  if (!companyId) return
  const { data } = await supabase.from('technician').select('*').eq('company_id', companyId).order('name')
  technicians.value = data || []
}

const filteredAffairs = computed(() => {
  if (tab.value === 'all') return affairs.value
  return affairs.value.filter(a => (a.status || 'draft') === tab.value)
})

function statusLabel(s) {
  const labels = { draft: '📝', sent: '📩', in_progress: '🔧', done: '✅' }
  return labels[s] || labels.draft
}

const months = ['jan','fév','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function selectAffair(affair) {
  selected.value = affair
  editing.value = affair
  showForm.value = true
  Object.assign(form, {
    name: affair.name || '',
    tech_name: affair.tech_name || '',
    tech_email: affair.tech_email || '',
    prep_date: affair.prep_date || '',
    receipt_date: affair.receipt_date || '',
    return_date: affair.return_date || '',
    front: affair.front || false,
    monitor: affair.monitor || false,
    stage: affair.stage || false,
    description: affair.description || '',
  })
}

async function saveAffair() {
  // Trouver le nom du tech depuis l'email
  if (form.tech_email) {
    const tech = technicians.value.find(t => t.email === form.tech_email)
    if (tech) form.tech_name = tech.name
  }

  const payload = {
    name: form.name,
    tech_name: form.tech_name || '',
    tech_id: 1,
    prep_date: form.prep_date || null,
    receipt_date: form.receipt_date,
    return_date: form.return_date,
    front: form.front,
    monitor: form.monitor,
    stage: form.stage,
    description: form.description || '',
    catalog_id: catalogId,
  }

  if (editing.value) {
    const { error } = await supabase.from('affair').update(payload).eq('affairid', editing.value.affairid)
    if (error) showMessage('Erreur: ' + error.message, 'error')
    else { showMessage('Affaire modifiée', 'success'); await loadAffairs(); showForm.value = false }
  } else {
    const { error } = await supabase.from('affair').insert(payload)
    if (error) showMessage('Erreur: ' + error.message, 'error')
    else { showMessage('Affaire créée', 'success'); await loadAffairs(); showForm.value = false }
  }
}

async function sendInvitation() {
  if (!editing.value || !form.tech_email) return

  // Sauvegarder d'abord
  await saveAffair()

  const companyName = localStorage.getItem('cablemaster-company') || 'Notre entreprise'
  const techName = form.tech_name || 'Technicien'
  const affairName = form.name
  const dateStr = formatDate(form.receipt_date)
  const link = `${window.location.origin}/?affair=${editing.value.affairid}`

  const subject = encodeURIComponent(`Invitation : ${affairName} - ${dateStr}`)
  const body = encodeURIComponent(
`Bonjour ${techName},

Vous allez intervenir sur l'affaire "${affairName}" le ${dateStr}.

Merci de bien vouloir cliquer sur le lien ci-dessous pour nous informer de vos besoins en termes de micros et câblage :

${link}

Zones prévues : ${[form.front && 'Front', form.monitor && 'Monitor', form.stage && 'Stage'].filter(Boolean).join(', ') || 'Non définies'}

${form.description ? 'Notes : ' + form.description : ''}

Cordialement,
${companyName}`)

  // Ouvrir le client mail
  window.location.href = `mailto:${form.tech_email}?subject=${subject}&body=${body}`

  // Passer en statut envoyé
  await supabase.from('affair').update({ status: 'sent' }).eq('affairid', editing.value.affairid)
  showMessage(`Mail préparé pour ${form.tech_email}`, 'success')
  await loadAffairs()
  showForm.value = false
}

async function setStatus(status) {
  if (!editing.value) return
  await supabase.from('affair').update({ status }).eq('affairid', editing.value.affairid)
  showMessage(`Statut : ${statusLabel(status)}`, 'success')
  await loadAffairs()
  showForm.value = false
}

async function deleteAffair() {
  if (!editing.value || !confirm('Supprimer cette affaire ?')) return
  await supabase.from('affair').delete().eq('affairid', editing.value.affairid)
  showMessage('Affaire supprimée', 'success')
  await loadAffairs()
  showForm.value = false
  editing.value = null
}

async function addTechnician() {
  if (!newTech.name) return
  const { error } = await supabase.from('technician').insert({ ...newTech, company_id: companyId })
  if (!error) {
    await loadTechnicians()
    Object.assign(newTech, { name: '', email: '', phone: '' })
    showAddTech.value = false
    showMessage('Technicien ajouté', 'success')
  }
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.master-affaire {
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
  text-align: left;
}
h2 { text-align: center; font-size: 18px; margin-bottom: 12px; }
h3 { font-size: 16px; margin: 0; }
.affair-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  justify-content: center;
}
.affair-tabs button {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.affair-tabs button.active {
  background: var(--color1);
  color: #fff;
  border-color: var(--color1);
}
.affair-list { margin-bottom: 10px; }
.affair-card {
  padding: 10px;
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  background: var(--bg-card, #fafafa);
}
.affair-card.selected { border-color: var(--color1); }
.card-top { display: flex; align-items: center; gap: 6px; }
.card-status { font-size: 14px; }
.card-name { flex: 1; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text, #333); }
.card-date { font-size: 13px; font-weight: 600; color: var(--color3); white-space: nowrap; }
.card-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-left: 22px; }
.card-tech { font-size: 12px; color: var(--text-light, #888); }
.card-tags { display: flex; gap: 3px; }
.tag-sm { font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px; color: #fff; }
.tag-sm.front { background: #3b82f6; }
.tag-sm.monitor { background: #f59e0b; }
.tag-sm.stage { background: #10b981; }
.btn-create {
  width: 100%;
  padding: 10px;
  background: var(--color3);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 10px;
  box-shadow: none;
}
.form-panel {
  background: var(--bg, #fff);
  border: 2px solid var(--color3);
  border-radius: 10px;
  padding: 14px;
}
.form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.close-btn { background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.form-row { margin-bottom: 10px; }
.form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-light, #666); margin-bottom: 3px; }
.form-row input, .form-row select, .form-row textarea {
  width: 100%; padding: 8px 10px; border: 1px solid var(--border-light, #ccc);
  border-radius: 6px; font-size: 16px; outline: none;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.form-row input:focus, .form-row select:focus, .form-row textarea:focus { border-color: var(--color1); }
.form-grid { display: flex; gap: 8px; }
.form-row.half { flex: 1; }
.zone-toggles { display: flex; gap: 6px; }
.zone-toggles button {
  padding: 6px 14px; border: 2px solid var(--border-light, #ccc); border-radius: 6px;
  background: var(--bg-input, #fff); color: var(--text, #333);
  font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto;
}
.zone-toggles button.active { border-color: var(--color1); background: var(--color1); color: #fff; }
.btn-add-tech {
  margin-top: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--color1); border-radius: 4px; background: transparent;
  color: var(--color1); cursor: pointer; box-shadow: none; min-width: auto;
}
.add-tech {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; padding: 8px;
  border: 1px dashed var(--border-light, #ccc); border-radius: 6px;
}
.add-tech input { flex: 1; min-width: 100px; padding: 6px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; background: var(--bg-input, #fff); color: var(--text, #333); }
.add-tech button { padding: 6px 12px; background: var(--color1); color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.form-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.btn-save { flex: 1; padding: 10px; background: var(--color1); color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: none; }
.btn-save:disabled { opacity: 0.4; }
.btn-draft { padding: 10px 14px; background: var(--bg-card, #eee); color: var(--text, #333); border: 1px solid var(--border-light, #ccc); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.btn-send { padding: 10px 14px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.btn-delete { padding: 10px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; box-shadow: none; min-width: auto; }
.empty { text-align: center; padding: 20px; color: var(--text-muted, #999); font-size: 14px; }
.message { text-align: center; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 14px; font-weight: 600; }
.message.success { background: var(--color1-light); color: var(--color1-dark); }
.message.error { background: #fecaca; color: #dc2626; }
</style>
