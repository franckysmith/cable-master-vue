<template>
  <div class="master-affaire">
    <h2>Master Affaire</h2>

    <!-- Liste des affaires avec statut -->
    <div v-if="!selected" class="affair-tabs">
      <button :class="{ active: tab === 'all' }" @click="tab = 'all'">Toutes</button>
      <button :class="{ active: tab === 'draft' }" @click="tab = 'draft'">Brouillons</button>
      <button :class="{ active: tab === 'sent' }" @click="tab = 'sent'">Envoyées</button>
      <button :class="{ active: tab === 'done' }" @click="tab = 'done'">Terminées</button>
      <button class="btn-create-inline" @click="showForm = true; editing = null">+</button>
    </div>
    <button v-if="selected" class="btn-back" @click="selected = null; showForm = false; showChatOnly = false">
      ← Retour aux affaires
    </button>

    <!-- Formulaire création/édition -->
    <div v-if="showForm && !selected" class="form-panel">
      <div class="form-header">
        <h3>{{ editing ? 'Modifier' : 'Nouvelle affaire' }}</h3>
        <button class="close-btn" @click="showForm = false">✕</button>
      </div>

      <div class="form-row">
        <label>Nom de l'affaire *</label>
        <input v-model="form.name" placeholder="ex: Festival Été 2026" required />
      </div>
      <div class="form-row">
        <label>Référence</label>
        <input v-model="form.reference" placeholder="Code référence" />
      </div>

      <div class="form-grid three">
        <div class="form-row">
          <label>Prépa</label>
          <input type="date" v-model="form.prep_date" />
        </div>
        <div class="form-row">
          <label>Sortie *</label>
          <input type="date" v-model="form.receipt_date" required />
        </div>
        <div class="form-row">
          <label>Retour</label>
          <input type="date" v-model="form.return_date" />
        </div>
      </div>

      <div class="form-section-title">Zones & Techniciens</div>
      <div class="zone-toggles">
        <button :class="{ active: form.front }" @click="form.front = !form.front" class="zone-btn facade">Front</button>
        <button :class="{ active: form.monitor }" @click="form.monitor = !form.monitor" class="zone-btn retour">Monitor</button>
        <button :class="{ active: form.stage }" @click="form.stage = !form.stage" class="zone-btn scene">Stage</button>
      </div>

      <div v-if="form.front" class="zone-tech-block facade">
        <div class="zone-tech-header">🔵 Front</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email" @change="onTechSelect('front')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('front')">+</button>
        </div>
        <div v-if="newTechZone === 'front'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('front')">Ajouter</button>
        </div>
        <div v-if="form.tech_name" class="zone-tech-info">{{ form.tech_firstname || '' }} {{ form.tech_name }} <span v-if="form.tech_phone">· {{ form.tech_phone }}</span></div>
      </div>

      <div v-if="form.monitor" class="zone-tech-block retour">
        <div class="zone-tech-header">🟠 Monitor</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_monitor" @change="onTechSelect('monitor')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('monitor')">+</button>
        </div>
        <div v-if="newTechZone === 'monitor'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('monitor')">Ajouter</button>
        </div>
        <div v-if="form.tech_name_monitor" class="zone-tech-info">{{ form.tech_firstname_monitor || '' }} {{ form.tech_name_monitor }} <span v-if="form.tech_phone_monitor">· {{ form.tech_phone_monitor }}</span></div>
      </div>

      <div v-if="form.stage" class="zone-tech-block scene">
        <div class="zone-tech-header">🟢 Stage</div>
        <div class="zone-tech-select">
          <select v-model="form.tech_email_stage" @change="onTechSelect('stage')">
            <option value="">-- Choisir --</option>
            <option v-for="t in technicians" :key="t.techid" :value="t.email">{{ t.firstname || '' }} {{ t.name }}</option>
          </select>
          <button class="btn-new-tech" @click="openNewTech('stage')">+</button>
        </div>
        <div v-if="newTechZone === 'stage'" class="new-tech-form">
          <input v-model="newTech.firstname" placeholder="Prénom" />
          <input v-model="newTech.name" placeholder="Nom" />
          <input v-model="newTech.phone" placeholder="Téléphone" />
          <input v-model="newTech.email" placeholder="Email" />
          <button @click="addTechForZone('stage')">Ajouter</button>
        </div>
        <div v-if="form.tech_name_stage" class="zone-tech-info">{{ form.tech_firstname_stage || '' }} {{ form.tech_name_stage }} <span v-if="form.tech_phone_stage">· {{ form.tech_phone_stage }}</span></div>
      </div>

      <div class="form-row">
        <label>Matériel / Notes</label>
        <textarea v-model="form.description" rows="5" placeholder="Systèmes K2, K3, wedge, subs, amplis..."></textarea>
      </div>

      <div class="form-row">
        <label>Documents joints</label>
        <input type="file" @change="onFileSelect" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple class="file-input" />
        <div v-for="(f, i) in attachmentFiles" :key="i" class="attachment-info">📎 {{ f.name }}</div>
        <div v-for="(name, i) in existingAttachments" :key="'ex'+i" class="attachment-info">📎 {{ name }}</div>
      </div>

      <div class="form-actions">
        <button class="btn-save" @click="saveAffair" :disabled="!form.name">
          {{ editing ? 'Enregistrer' : 'Créer' }}
        </button>
        <button v-if="editing" class="btn-draft" @click="setStatus('draft')">📝 Brouillon</button>
        <button v-if="editing" class="btn-delete" @click="deleteAffair">✕</button>
      </div>
    </div>

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
            </div>
            <div v-if="affair.monitor" class="tech-zone-item">
              <span class="zone-dot retour"></span>
              <span class="tech-firstname">{{ affair.tech_name_monitor || '?' }}</span>
            </div>
            <div v-if="affair.stage" class="tech-zone-item">
              <span class="zone-dot scene"></span>
              <span class="tech-firstname">{{ affair.tech_name_stage || '?' }}</span>
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
          <!-- Contacter tous -->
          <a v-if="getAllEmails(affair).length > 0" :href="'mailto:' + getAllEmails(affair).join(',')" class="fiche-contact-all">📩 Contacter tous</a>

          <!-- Personnes par zone -->
          <div v-for="zone in getAffairZones(affair)" :key="zone.key" class="fiche-person">
            <div class="fiche-person-header" :class="zone.css">{{ zone.icon }} {{ zone.label }}</div>
            <div class="fiche-person-body">
              <div class="fiche-person-line">
                <span class="fiche-person-name">{{ zone.firstname }} {{ zone.name }}</span>
                <span v-if="zone.phone" class="fiche-person-phone">{{ zone.phone }}</span>
                <span v-if="zone.email" class="fiche-person-email">{{ zone.email }}</span>
              </div>
              <div v-if="zone.phone || zone.email" class="fiche-person-actions">
                <a v-if="zone.phone" :href="'tel:' + zone.phone" class="fiche-action-btn call">📞 Appeler</a>
                <a v-if="zone.phone" :href="'sms:' + zone.phone" class="fiche-action-btn sms">💬 SMS</a>
                <a v-if="zone.email" :href="'mailto:' + zone.email" class="fiche-action-btn email">📩 Email</a>
              </div>
              <div v-if="!zone.phone && !zone.email" class="fiche-no-contact">Pas de coordonnées renseignées</div>
            </div>
          </div>
          <!-- Dates -->
          <div class="fiche-dates">
            <div v-if="affair.prep_date">🔧 Prépa : {{ formatDate(affair.prep_date) }}</div>
            <div>📦 Sortie : {{ formatDate(affair.receipt_date) }}</div>
            <div v-if="affair.return_date">↩ Retour : {{ formatDate(affair.return_date) }}</div>
          </div>
          <div v-if="affair.description" class="fiche-description">
            <strong>Notes :</strong> {{ affair.description }}
          </div>
        </div>

        <!-- Panneau Matériel (vue flight-cases) -->
        <div v-if="selected?.affairid === affair.affairid && expandedTab === 'materiel'" class="card-expanded" @click.stop>
          <div v-if="fcLoading" class="fc-loading">Chargement...</div>
          <template v-else>
            <!-- Façade -->
            <div v-if="affair.front" class="zone-block">
              <div class="zone-banner facade">🔵 Façade — {{ affair.tech_name || '?' }}</div>
              <AllCasesView
                v-if="allCables.length > 0"
                :cables="allCables"
                :affair-id="affair.affairid"
                :fc-labels="{ lfc1: affair.lfc1, lfc2: affair.lfc2, lfc3: affair.lfc3, lfc4: affair.lfc4, lfc5: affair.lfc5, lfc6: affair.lfc6, lfc7: affair.lfc7 }"
              />
              <div v-else class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- Retours -->
            <div v-if="affair.monitor" class="zone-block">
              <div class="zone-banner retour">🟠 Retours — {{ affair.tech_name_monitor || '?' }}</div>
              <div class="zone-empty">Aucun matériel préparé</div>
            </div>
            <!-- Scène -->
            <div v-if="affair.stage" class="zone-block">
              <div class="zone-banner scene">🟢 Scène — {{ affair.tech_name_stage || '?' }}</div>
              <div class="zone-empty">Aucun matériel préparé</div>
            </div>
          </template>
        </div>
      </div>
      <div v-if="filteredAffairs.length === 0" class="empty">Aucune affaire</div>
    </div>
    <!-- Message -->
    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import AllCasesView from '../components/AllCasesView.vue'

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
  reference: '',
  tech_name: '', tech_firstname: '', tech_email: '', tech_phone: '',
  tech_name_monitor: '', tech_firstname_monitor: '', tech_email_monitor: '', tech_phone_monitor: '',
  tech_name_stage: '', tech_firstname_stage: '', tech_email_stage: '', tech_phone_stage: '',
  prep_date: '',
  receipt_date: '',
  return_date: '',
  front: false,
  monitor: false,
  stage: false,
  description: '',
  attachment_name: '',
  attachment_url: '',
})

const newTech = reactive({ firstname: '', name: '', email: '', phone: '' })
const newTechZone = ref('')
const attachmentFiles = ref([])
const existingAttachments = ref([])

const unreadAffairs = ref({})
const affairMessages = ref([])
const masterReply = ref('')
const showChatOnly = ref(false)
const expandedTab = ref('')
const allCables = ref([])
const fcLoading = ref(false)

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

  if (tab === 'materiel') {
    fcLoading.value = true
    allCables.value = []
    const { data } = await supabase
      .from('order')
      .select('*, cable(name, type)')
      .eq('affairid', affair.affairid)
    // Joindre les infos cable dans chaque order
    allCables.value = (data || []).map(o => ({
      ...o,
      name: o.cable?.name || '?',
      type: o.cable?.type || '',
    })).filter(c =>
      (c.spare_count || 0) + (c.z1 || 0) + (c.z2 || 0) + (c.z3 || 0) +
      (c.z4 || 0) + (c.z5 || 0) + (c.z6 || 0) +
      (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) + (c.tfc4 || 0) +
      (c.tfc5 || 0) + (c.tfc6 || 0) + (c.tfc7 || 0) > 0
    )
    fcLoading.value = false
  }
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

function getAffairZones(affair) {
  const zones = []
  if (affair.front) {
    zones.push({
      key: 'front', css: 'facade', icon: '🔵', label: 'Façade',
      name: affair.tech_name || '?',
      firstname: affair.tech_firstname || '',
      phone: affair.tech_phone || '',
      email: affair.tech_email || '',
    })
  }
  if (affair.monitor) {
    zones.push({
      key: 'monitor', css: 'retour', icon: '🟠', label: 'Retours',
      name: affair.tech_name_monitor || '?',
      firstname: affair.tech_firstname_monitor || '',
      phone: affair.tech_phone_monitor || '',
      email: affair.tech_email_monitor || '',
    })
  }
  if (affair.stage) {
    zones.push({
      key: 'stage', css: 'scene', icon: '🟢', label: 'Scène',
      name: affair.tech_name_stage || '?',
      firstname: affair.tech_firstname_stage || '',
      phone: affair.tech_phone_stage || '',
      email: affair.tech_email_stage || '',
    })
  }
  return zones
}

function getAllEmails(affair) {
  const emails = []
  if (affair.tech_email) emails.push(affair.tech_email)
  if (affair.tech_email_monitor && !emails.includes(affair.tech_email_monitor)) emails.push(affair.tech_email_monitor)
  if (affair.tech_email_stage && !emails.includes(affair.tech_email_stage)) emails.push(affair.tech_email_stage)
  return emails
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
    reference: affair.reference || '',
    tech_name: affair.tech_name || '', tech_firstname: affair.tech_firstname || '',
    tech_email: affair.tech_email || '', tech_phone: affair.tech_phone || '',
    tech_name_monitor: affair.tech_name_monitor || '', tech_firstname_monitor: affair.tech_firstname_monitor || '',
    tech_email_monitor: affair.tech_email_monitor || '', tech_phone_monitor: affair.tech_phone_monitor || '',
    tech_name_stage: affair.tech_name_stage || '', tech_firstname_stage: affair.tech_firstname_stage || '',
    tech_email_stage: affair.tech_email_stage || '', tech_phone_stage: affair.tech_phone_stage || '',
    prep_date: affair.prep_date || '',
    receipt_date: affair.receipt_date || '',
    return_date: affair.return_date || '',
    front: affair.front || false,
    monitor: affair.monitor || false,
    stage: affair.stage || false,
    description: affair.description || '',
    attachment_name: affair.attachment_name || '',
    attachment_url: affair.attachment_url || '',
  })
  existingAttachments.value = affair.attachment_name ? affair.attachment_name.split(',') : []
  attachmentFiles.value = []
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
  console.log('saveAffair called', JSON.stringify(form))
  // Upload fichiers
  const uploadedNames = [...(existingAttachments.value || [])]
  const uploadedUrls = form.attachment_url ? form.attachment_url.split(',') : []
  for (const file of attachmentFiles.value) {
    const path = `affairs/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
      uploadedUrls.push(urlData?.publicUrl || '')
      uploadedNames.push(file.name)
    }
  }
  attachmentFiles.value = []
  form.attachment_name = uploadedNames.join(',')
  form.attachment_url = uploadedUrls.join(',')

  const payload = {
    name: form.name,
    tech_id: parseInt(localStorage.getItem('cablemaster-techid')) || 0,
    prep_date: form.prep_date || null,
    receipt_date: form.receipt_date || null,
    return_date: form.return_date || null,
    front: form.front,
    monitor: form.monitor,
    stage: form.stage,
    description: form.description || '',
    catalog_id: catalogId,
    // Tech façade
    tech_name: form.tech_name || '',
    tech_firstname: form.tech_firstname || '',
    tech_email: form.tech_email || '',
    tech_phone: form.tech_phone || '',
    // Tech retours
    tech_name_monitor: form.tech_name_monitor || '',
    tech_firstname_monitor: form.tech_firstname_monitor || '',
    tech_email_monitor: form.tech_email_monitor || '',
    tech_phone_monitor: form.tech_phone_monitor || '',
    // Tech scène
    tech_name_stage: form.tech_name_stage || '',
    tech_firstname_stage: form.tech_firstname_stage || '',
    tech_email_stage: form.tech_email_stage || '',
    tech_phone_stage: form.tech_phone_stage || '',
    // Nouvelles colonnes
    reference: form.reference || '',
    attachment_name: form.attachment_name || '',
    attachment_url: form.attachment_url || '',
  }

  if (editing.value) {
    const { error } = await supabase.from('affair').update(payload).eq('affairid', editing.value.affairid)
    if (error) showMessage('Erreur: ' + error.message, 'error')
    else { showMessage('Affaire modifiée', 'success'); await loadAffairs(); showForm.value = false }
  } else {
    console.log('Inserting payload:', JSON.stringify(payload))
    const { data: insertData, error } = await supabase.from('affair').insert(payload)
    console.log('Insert result:', { data: insertData, error })
    if (error) { console.error('Insert error:', error); alert('Erreur: ' + error.message); showMessage('Erreur: ' + error.message, 'error') }
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

function openNewTech(zone) {
  newTechZone.value = newTechZone.value === zone ? '' : zone
  Object.assign(newTech, { firstname: '', name: '', email: '', phone: '' })
}

function onTechSelect(zone) {
  const emailField = zone === 'front' ? 'tech_email' : `tech_email_${zone}`
  const email = form[emailField]
  const tech = technicians.value.find(t => t.email === email)
  if (!tech) return
  if (zone === 'front') {
    form.tech_name = tech.name || ''
    form.tech_firstname = tech.firstname || ''
    form.tech_phone = tech.phone || ''
  } else if (zone === 'monitor') {
    form.tech_name_monitor = tech.name || ''
    form.tech_firstname_monitor = tech.firstname || ''
    form.tech_phone_monitor = tech.phone || ''
  } else {
    form.tech_name_stage = tech.name || ''
    form.tech_firstname_stage = tech.firstname || ''
    form.tech_phone_stage = tech.phone || ''
  }
}

async function addTechForZone(zone) {
  if (!newTech.name) return
  const { error } = await supabase.from('technician').insert({
    name: newTech.name,
    firstname: newTech.firstname,
    email: newTech.email,
    phone: newTech.phone,
    company_id: companyId,
  })
  if (!error) {
    await loadTechnicians()
    // Auto-sélectionner
    if (zone === 'front') {
      form.tech_email = newTech.email
      form.tech_name = newTech.name
      form.tech_firstname = newTech.firstname
      form.tech_phone = newTech.phone
    } else if (zone === 'monitor') {
      form.tech_email_monitor = newTech.email
      form.tech_name_monitor = newTech.name
      form.tech_firstname_monitor = newTech.firstname
      form.tech_phone_monitor = newTech.phone
    } else {
      form.tech_email_stage = newTech.email
      form.tech_name_stage = newTech.name
      form.tech_firstname_stage = newTech.firstname
      form.tech_phone_stage = newTech.phone
    }
    newTechZone.value = ''
    Object.assign(newTech, { firstname: '', name: '', email: '', phone: '' })
    showMessage('Technicien ajouté', 'success')
  }
}

function onFileSelect(e) {
  const files = Array.from(e.target.files || [])
  attachmentFiles.value = [...attachmentFiles.value, ...files]
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
.btn-create-inline {
  width: 32px;
  height: 32px;
  background: var(--color3);
  color: #000;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: auto;
  box-shadow: none;
  flex-shrink: 0;
}
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
.zone-toggles button.active.facade { border-color: #3b82f6; background: #3b82f6; color: #fff; }
.zone-toggles button.active.retour { border-color: #f59e0b; background: #f59e0b; color: #fff; }
.zone-toggles button.active.scene { border-color: #10b981; background: #10b981; color: #fff; }
.zone-toggles button.active { border-color: var(--color1); background: var(--color1); color: #fff; }
.form-grid.three { display: flex; gap: 6px; }
.form-grid.three .form-row { flex: 1; }
.form-section-title { font-size: 13px; font-weight: 700; color: var(--text-light, #888); text-transform: uppercase; margin: 10px 0 6px; }
.zone-tech-block { margin: 6px 0; padding: 8px; border-radius: 8px; border: 1px solid var(--border-light, #eee); }
.zone-tech-block.facade { border-left: 3px solid #3b82f6; }
.zone-tech-block.retour { border-left: 3px solid #f59e0b; }
.zone-tech-block.scene { border-left: 3px solid #10b981; }
.zone-tech-header { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
.zone-tech-select { display: flex; gap: 4px; align-items: center; }
.zone-tech-select select { flex: 1; padding: 6px; font-size: 14px; border: 1px solid var(--border-light, #ccc); border-radius: 6px; background: var(--bg-input, #fff); color: var(--text, #333); }
.btn-new-tech { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--color1); color: #fff; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: auto; box-shadow: none; }
.new-tech-form { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; padding: 6px; border: 1px dashed var(--border-light, #ccc); border-radius: 6px; }
.new-tech-form input { flex: 1; min-width: 80px; padding: 6px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; background: var(--bg-input, #fff); color: var(--text, #333); }
.new-tech-form button { padding: 6px 12px; background: var(--color1); color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto; }
.zone-tech-info { font-size: 12px; color: var(--text-light, #888); margin-top: 4px; }
.zone-tech-info span { color: var(--text-muted, #999); }
.file-input { font-size: 14px; padding: 4px 0; color: var(--text, #333); }
.attachment-info { font-size: 12px; color: var(--color1); margin-top: 4px; }
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
.fiche-person { margin-bottom: 10px; border: 1px solid var(--border-light, #eee); border-radius: 8px; overflow: hidden; }
.fiche-person-header { padding: 6px 10px; font-size: 13px; font-weight: 700; }
.fiche-person-header.facade { background: rgba(59,130,246,0.1); color: #3b82f6; }
.fiche-person-header.retour { background: rgba(245,158,11,0.1); color: #f59e0b; }
.fiche-person-header.scene { background: rgba(16,185,129,0.1); color: #10b981; }
.fiche-person-body { padding: 8px 10px; }
.fiche-contact-all { display: block; text-align: center; padding: 8px; margin-bottom: 10px; background: var(--color1); color: #fff; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; }
.fiche-person-line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.fiche-person-name { font-size: 15px; font-weight: 700; color: var(--text, #333); }
.fiche-person-phone { font-size: 13px; color: var(--text-light, #888); }
.fiche-person-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.fiche-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; }
.fiche-action-btn.call { background: rgba(59,130,246,0.1); color: #3b82f6; }
.fiche-action-btn.sms { background: rgba(16,185,129,0.1); color: #10b981; }
.fiche-action-btn.email { background: rgba(245,158,11,0.1); color: #f59e0b; }
.fiche-person-email { font-size: 12px; color: var(--text-light, #888); margin-bottom: 6px; }
.fiche-no-contact { font-size: 12px; color: var(--text-muted, #999); font-style: italic; margin-top: 4px; }
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
.fc-loading { text-align: center; padding: 12px; color: var(--text-muted, #999); font-size: 13px; }
.zone-banner { padding: 6px 10px; font-size: 13px; font-weight: 700; border-radius: 6px; margin-bottom: 4px; }
.zone-banner.facade { background: rgba(59,130,246,0.1); color: #3b82f6; }
.zone-banner.retour { background: rgba(245,158,11,0.1); color: #f59e0b; }
.zone-banner.scene { background: rgba(16,185,129,0.1); color: #10b981; }
.zone-block { margin-bottom: 12px; }
.zone-empty { padding: 8px 10px; font-size: 13px; color: var(--text-muted, #999); font-style: italic; }
</style>
