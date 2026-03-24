<template>
  <div class="master-affaire">
    <h2>Master Affaire</h2>

    <!-- Liste des affaires avec statut -->
    <div v-if="!selected" class="affair-tabs">
      <button :class="{ active: tab === 'all' }" @click="tab = 'all'">Toutes</button>
      <button :class="{ active: tab === 'draft' }" @click="tab = 'draft'">Brouillons</button>
      <button :class="{ active: tab === 'sent' }" @click="tab = 'sent'">Envoyées</button>
      <button :class="{ active: tab === 'done' }" @click="tab = 'done'">Terminées</button>
    </div>
    <button v-if="selected" class="btn-back" @click="selected = null; showForm = false; showChatOnly = false">
      ← Retour aux affaires
    </button>

    <!-- Liste -->
    <div class="affair-list">
      <div
        v-for="affair in filteredAffairs"
        :key="affair.affairid"
        v-show="!selected || selected.affairid === affair.affairid"
        class="affair-card"
        :class="{ selected: selected?.affairid === affair.affairid }"
        @click="selectAffair(affair)"
      >
        <div class="card-top">
          <span class="card-status" :class="affair.status || 'draft'">{{ statusLabel(affair.status) }}</span>
          <span v-if="unreadAffairs[affair.affairid]" class="unread-star" @click.stop="openChatOnly(affair)">★</span>
          <span class="card-name">{{ affair.name }}</span>
          <span class="date-item" v-if="affair.prep_date">🔧 {{ formatDate(affair.prep_date) }}</span>
          <span class="date-item">📦 {{ formatDate(affair.receipt_date) }}</span>
          <span class="date-item" v-if="affair.return_date">↩ {{ formatDate(affair.return_date) }}</span>
        </div>
        <div class="card-bottom">
          <div class="card-techs">
            <div v-if="affair.front" class="tech-zone-item">
              <span class="zone-dot facade"></span>
              <span class="tech-firstname">{{ affair.tech_name || '?' }}</span>
              <button
                class="invite-btn facade"
                :class="{ sent: affair.status === 'sent' }"
                @click.stop
                @mousedown.stop="startInvite(affair, 'front')"
                @mouseup.stop="cancelInvite"
                @mouseleave.stop="cancelInvite"
                @touchstart.stop="startInvite(affair, 'front')"
                @touchend.stop="cancelInvite"
                @touchcancel.stop="cancelInvite"
              >{{ affair.status === 'sent' ? '✓' : '✉' }}</button>
            </div>
            <div v-if="affair.monitor" class="tech-zone-item">
              <span class="zone-dot retour"></span>
              <span class="tech-firstname">{{ affair.tech_name_monitor || '?' }}</span>
              <button
                class="invite-btn retour"
                :class="{ sent: affair.status === 'sent' }"
                @click.stop
                @mousedown.stop="startInvite(affair, 'monitor')"
                @mouseup.stop="cancelInvite"
                @mouseleave.stop="cancelInvite"
                @touchstart.stop="startInvite(affair, 'monitor')"
                @touchend.stop="cancelInvite"
                @touchcancel.stop="cancelInvite"
              >{{ affair.status === 'sent' ? '✓' : '✉' }}</button>
            </div>
            <div v-if="affair.stage" class="tech-zone-item">
              <span class="zone-dot scene"></span>
              <span class="tech-firstname">{{ affair.tech_name_stage || '?' }}</span>
              <button
                class="invite-btn scene"
                :class="{ sent: affair.status === 'sent' }"
                @click.stop
                @mousedown.stop="startInvite(affair, 'stage')"
                @mouseup.stop="cancelInvite"
                @mouseleave.stop="cancelInvite"
                @touchstart.stop="startInvite(affair, 'stage')"
                @touchend.stop="cancelInvite"
                @touchcancel.stop="cancelInvite"
              >{{ affair.status === 'sent' ? '✓' : '✉' }}</button>
            </div>
          </div>
          <!-- Boutons d'action -->
          <div class="card-action-btns">
            <button class="action-tab-btn" :class="{ active: expandedTab === 'chat' && selected?.affairid === affair.affairid }" @click.stop="toggleTab(affair, 'chat')">
              💬
              <span v-if="unreadAffairs[affair.affairid]" class="tab-dot"></span>
            </button>
            <button class="action-tab-btn" :class="{ active: expandedTab === 'fiche' && selected?.affairid === affair.affairid }" @click.stop="toggleTab(affair, 'fiche')">📋</button>
            <button class="action-tab-btn" :class="{ active: expandedTab === 'materiel' && selected?.affairid === affair.affairid }" @click.stop="toggleTab(affair, 'materiel')">🔧</button>
          </div>
        </div>
        <!-- Aperçu message non lu -->
        <div v-if="unreadAffairs[affair.affairid] && expandedTab !== 'chat'" class="card-unread-msg">
          💬 {{ unreadAffairs[affair.affairid] }}
        </div>

        <!-- Panneau Chat -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'chat'" class="card-expanded" @click.stop>
          <div class="master-chat">
            <div class="chat-messages-master">
              <div v-for="msg in affairMessages" :key="msg.messageid" class="chat-msg-m" :class="msg.sender_role">
                <span class="msg-icon">{{ msg.sender_role === 'tech' ? '🧑‍🔧' : '🏢' }}</span>
                <div class="msg-content">
                  <p>{{ msg.text }}</p>
                  <span class="msg-time-m">{{ formatTime(msg.created_at) }}</span>
                </div>
              </div>
              <div v-if="affairMessages.length === 0" class="chat-empty-m">Aucun message</div>
            </div>
            <div class="chat-input-m">
              <input v-model="masterReply" placeholder="Répondre..." @keydown.enter="sendMasterReply(affair)" />
              <button @click="sendMasterReply(affair)" :disabled="!masterReply.trim()">Envoyer</button>
            </div>
            <button v-if="unreadAffairs[affair.affairid]" class="btn-mark-read" @click.stop="markReadByMaster(affair)">
              ✓ Marquer comme traité
            </button>
          </div>
        </div>

        <!-- Panneau Fiche -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'fiche'" class="card-expanded" @click.stop>
          <div class="expanded-tech">
            <div class="tech-info">
              <strong>{{ affair.tech_name }} {{ affair.tech_firstname || '' }}</strong>
              <span v-if="affair.tech_email" class="tech-contact">{{ affair.tech_email }}</span>
              <span v-if="affair.tech_phone" class="tech-contact">{{ affair.tech_phone }}</span>
            </div>
            <div class="tech-actions">
              <a v-if="affair.tech_phone" :href="'tel:' + affair.tech_phone" class="tech-btn">📞</a>
              <a v-if="affair.tech_email" :href="'mailto:' + affair.tech_email" class="tech-btn">📩</a>
            </div>
          </div>
          <div v-if="affair.description" class="fiche-description">
            <strong>Notes :</strong> {{ affair.description }}
          </div>
          <div class="fiche-dates">
            <div v-if="affair.prep_date">🔧 Prépa : {{ formatDate(affair.prep_date) }}</div>
            <div>📦 Sortie : {{ formatDate(affair.receipt_date) }}</div>
            <div v-if="affair.return_date">↩ Retour : {{ formatDate(affair.return_date) }}</div>
          </div>
        </div>

        <!-- Panneau Matériel -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'materiel'" class="card-expanded" @click.stop>
          <div v-if="affair.front" class="materiel-zone">
            <div class="materiel-zone-header facade">🔵 Façade — {{ affair.tech_name || '?' }}</div>
            <div class="materiel-zone-content">{{ affair.materiel_front || 'Pas de matériel renseigné' }}</div>
          </div>
          <div v-if="affair.monitor" class="materiel-zone">
            <div class="materiel-zone-header retour">🟠 Retours — {{ affair.tech_name_monitor || '?' }}</div>
            <div class="materiel-zone-content">{{ affair.materiel_monitor || 'Pas de matériel renseigné' }}</div>
          </div>
          <div v-if="affair.stage" class="materiel-zone">
            <div class="materiel-zone-header scene">🟢 Scène — {{ affair.tech_name_stage || '?' }}</div>
            <div class="materiel-zone-content">{{ affair.materiel_stage || 'Pas de matériel renseigné' }}</div>
          </div>
          <button class="btn-print-materiel" @click.stop="printMateriel(affair)">🖨 Imprimer</button>
        </div>
      </div>
      <div v-if="filteredAffairs.length === 0" class="empty">Aucune affaire</div>
    </div>

    <!-- Bouton créer -->
    <button v-if="!selected" class="btn-create" @click="showForm = true; editing = null">+ Nouvelle affaire</button>

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

const unreadAffairs = ref({})
const affairMessages = ref([])
const masterReply = ref('')
const showChatOnly = ref(false)
const expandedTab = ref('')

async function toggleTab(affair, tab) {
  if (selected.value?.affairid === affair.affairid && expandedTab.value === tab) {
    expandedTab.value = ''
    return
  }
  selected.value = affair
  editing.value = affair
  expandedTab.value = tab
  showForm.value = false

  if (tab === 'chat') {
    const { data } = await supabase
      .from('message')
      .select('*')
      .eq('affairid', affair.affairid)
      .order('created_at', { ascending: true })
    affairMessages.value = data || []
  }
}

function printMateriel(affair) {
  const zones = []
  if (affair.front) zones.push({ title: '🔵 Façade — ' + (affair.tech_name || '?'), content: affair.materiel_front || 'Pas de matériel' })
  if (affair.monitor) zones.push({ title: '🟠 Retours — ' + (affair.tech_name_monitor || '?'), content: affair.materiel_monitor || 'Pas de matériel' })
  if (affair.stage) zones.push({ title: '🟢 Scène — ' + (affair.tech_name_stage || '?'), content: affair.materiel_stage || 'Pas de matériel' })

  let html = `<html><head><title>${affair.name} - Matériel</title><style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { font-size: 20px; margin-bottom: 15px; }
    .zone { margin-bottom: 20px; page-break-inside: avoid; }
    .zone-title { font-size: 16px; font-weight: bold; padding: 8px; border-bottom: 2px solid #333; margin-bottom: 8px; }
    .zone-content { white-space: pre-wrap; font-size: 14px; padding: 8px; }
  </style></head><body>`
  html += `<h1>${affair.name}</h1>`
  for (const z of zones) {
    html += `<div class="zone"><div class="zone-title">${z.title}</div><div class="zone-content">${z.content}</div></div>`
  }
  html += `</body></html>`
  const w = window.open('', '_blank', 'width=500,height=700')
  w.document.write(html)
  w.document.close()
  w.print()
}

onMounted(() => {
  loadAffairs()
  loadTechnicians()
})

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function loadAffairs() {
  let query = supabase.from('affair').select('*').order('prep_date', { ascending: true, nullsFirst: false }).order('receipt_date', { ascending: true })
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

  // Charger les messages non lus par le master
  const unread = {}
  for (const a of affairs.value) {
    const { data: msgs } = await supabase
      .from('message')
      .select('text')
      .eq('affairid', a.affairid)
      .eq('sender_role', 'tech')
      .eq('read_by_master', false)
      .order('created_at', { ascending: false })
      .limit(1)
    if (msgs?.length > 0) {
      unread[a.affairid] = msgs[0].text.substring(0, 60) + (msgs[0].text.length > 60 ? '...' : '')
    }
  }
  unreadAffairs.value = unread
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
  return `${d.getDate()} ${months[d.getMonth()]}`
}

let inviteTimer = null

function startInvite(affair, zone) {
  inviteTimer = setTimeout(() => {
    sendZoneInvite(affair, zone)
  }, 800)
}

function cancelInvite() {
  clearTimeout(inviteTimer)
}

async function sendZoneInvite(affair, zone) {
  const techEmail = affair.tech_email || ''
  const techName = affair.tech_name || 'Technicien'
  const affairName = affair.name
  const dateStr = formatDate(affair.receipt_date)
  const zoneName = zone === 'front' ? 'Façade' : zone === 'monitor' ? 'Retours' : 'Scène'
  const link = `${window.location.origin}/?affair=${affair.affairid}`

  const subject = encodeURIComponent(`Invitation : ${affairName} - ${zoneName}`)
  const body = encodeURIComponent(
`Bonjour ${techName},

Vous êtes invité(e) à préparer le câblage ${zoneName} pour l'affaire "${affairName}" (${dateStr}).

Merci de cliquer sur le lien ci-dessous pour renseigner vos besoins :

${link}

Cordialement`)

  // Ouvrir le mail
  if (techEmail) {
    window.location.href = `mailto:${techEmail}?subject=${subject}&body=${body}`
  }

  // Enregistrer l'envoi dans la base
  const key = `invite_${zone}`
  const inviteData = affair._invites || {}
  inviteData[zone] = { sent_at: new Date().toISOString(), email: techEmail }
  affair._invites = inviteData

  // Sauvegarder le statut d'envoi
  await supabase.from('affair').update({
    status: 'sent',
    description: (affair.description || '')
  }).eq('affairid', affair.affairid)

  // Marquer visuellement
  const uiKey = `_invite${zone.charAt(0).toUpperCase() + zone.slice(1)}`
  affair[uiKey] = true

  await loadAffairs()
}

async function openChatOnly(affair) {
  selected.value = affair
  editing.value = affair
  showForm.value = false
  showChatOnly.value = true
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', affair.affairid)
    .order('created_at', { ascending: true })
  affairMessages.value = data || []
}

async function selectAffair(affair) {
  if (selected.value?.affairid === affair.affairid) {
    selected.value = null
    showForm.value = false
    showChatOnly.value = false
    return
  }
  showChatOnly.value = false
  selected.value = affair
  editing.value = affair
  showForm.value = true
  masterReply.value = ''
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
  // Charger les messages
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', affair.affairid)
    .order('created_at', { ascending: true })
  affairMessages.value = data || []
}

async function sendMasterReply(affair) {
  if (!masterReply.value.trim()) return
  await supabase.from('message').insert({
    affairid: affair.affairid,
    sender_role: 'master',
    text: masterReply.value.trim(),
    read_by_tech: false,
    read_by_master: true,
  })
  masterReply.value = ''
  // Recharger messages
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', affair.affairid)
    .order('created_at', { ascending: true })
  affairMessages.value = data || []
}

async function markReadByMaster(affair) {
  await supabase
    .from('message')
    .update({ read_by_master: true })
    .eq('affairid', affair.affairid)
    .eq('sender_role', 'tech')
    .eq('read_by_master', false)
  delete unreadAffairs.value[affair.affairid]
  unreadAffairs.value = { ...unreadAffairs.value }
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
.date-item { font-size: 10px; color: var(--text-light, #888); white-space: nowrap; flex-shrink: 0; margin-left: 6px; }
.btn-back { width: 100%; padding: 8px; background: transparent; border: 1px solid var(--border-light, #ccc); border-radius: 6px; color: var(--text, #333); font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 8px; box-shadow: none; min-width: auto; text-align: left; }
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
.card-techs { display: flex; gap: 8px; flex-wrap: wrap; }
.tech-zone-item { display: flex; align-items: center; gap: 3px; }
.zone-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.zone-dot.facade { background: #3b82f6; }
.zone-dot.retour { background: #f59e0b; }
.zone-dot.scene { background: #10b981; }
.tech-firstname { font-size: 12px; color: var(--text, #333); font-weight: 600; }
.invite-btn { width: 22px; height: 22px; border-radius: 50%; border: none; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: auto; box-shadow: none; color: #fff; transition: all 0.15s; }
.invite-btn.facade { background: #3b82f6; }
.invite-btn.retour { background: #f59e0b; }
.invite-btn.scene { background: #10b981; }
.invite-btn.sent { background: #ccc; color: #666; }
.invite-btn:active { transform: scale(0.85); }
.card-action-btns { display: flex; gap: 4px; margin-left: auto; }
.action-tab-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border-light, #ccc); background: var(--bg-card, #f5f5f5); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: auto; box-shadow: none; position: relative; transition: all 0.15s; }
.action-tab-btn.active { background: var(--color1); border-color: var(--color1); }
.action-tab-btn:active { transform: scale(0.9); }
.tab-dot { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
.fiche-description { font-size: 13px; color: var(--text, #333); padding: 6px 0; border-bottom: 1px solid var(--border-light, #eee); margin-bottom: 6px; }
.fiche-dates { font-size: 12px; color: var(--text-light, #888); }
.fiche-dates div { padding: 2px 0; }
.materiel-zone { margin-bottom: 10px; }
.materiel-zone-header { font-size: 14px; font-weight: 700; padding: 6px 8px; border-radius: 6px; margin-bottom: 4px; }
.materiel-zone-header.facade { background: rgba(59,130,246,0.15); color: #3b82f6; }
.materiel-zone-header.retour { background: rgba(245,158,11,0.15); color: #f59e0b; }
.materiel-zone-header.scene { background: rgba(16,185,129,0.15); color: #10b981; }
.materiel-zone-content { font-size: 13px; color: var(--text, #333); padding: 4px 8px; white-space: pre-wrap; }
.btn-print-materiel { width: 100%; padding: 8px; background: var(--color3); color: #000; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; margin-top: 8px; }
.unread-star { color: #ef4444; font-size: 14px; animation: blink-star 1.5s infinite; }
@keyframes blink-star { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.card-unread-msg { padding: 4px 8px 4px 22px; font-size: 12px; color: #ef4444; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-expanded { padding: 8px; border-top: 1px solid var(--border-light, #eee); margin-top: 6px; }
.expanded-tech { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.tech-info { display: flex; flex-direction: column; gap: 2px; }
.tech-info strong { font-size: 14px; color: var(--text, #333); }
.tech-contact { font-size: 12px; color: var(--text-light, #888); }
.tech-actions { display: flex; gap: 6px; }
.tech-btn { font-size: 20px; text-decoration: none; padding: 4px; }
.master-chat { border: 1px solid var(--border-light, #eee); border-radius: 8px; padding: 8px; }
.chat-messages-master { max-height: 150px; overflow-y: auto; margin-bottom: 6px; }
.chat-msg-m { display: flex; gap: 6px; margin-bottom: 6px; }
.chat-msg-m.tech { flex-direction: row; }
.chat-msg-m.master { flex-direction: row-reverse; }
.msg-icon { font-size: 14px; flex-shrink: 0; }
.msg-content { background: var(--bg-card, #f0f0f0); padding: 4px 8px; border-radius: 8px; max-width: 80%; }
.chat-msg-m.master .msg-content { background: var(--color1-light); }
.msg-content p { margin: 0; font-size: 13px; color: var(--text, #333); }
.msg-time-m { font-size: 9px; color: var(--text-muted, #999); }
.chat-empty-m { text-align: center; color: var(--text-muted, #999); font-size: 11px; padding: 8px; }
.chat-input-m { display: flex; gap: 4px; margin-bottom: 6px; }
.chat-input-m input { flex: 1; padding: 6px 8px; border: 1px solid var(--border-light, #ccc); border-radius: 6px; font-size: 14px; background: var(--bg-input, #fff); color: var(--text, #333); outline: none; }
.chat-input-m button { padding: 6px 10px; background: var(--color1); color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.chat-input-m button:disabled { opacity: 0.4; }
.btn-mark-read { width: 100%; padding: 6px; background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.empty { text-align: center; padding: 20px; color: var(--text-muted, #999); font-size: 14px; }
.message { text-align: center; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 14px; font-weight: 600; }
.message.success { background: var(--color1-light); color: var(--color1-dark); }
.message.error { background: #fecaca; color: #dc2626; }
</style>
