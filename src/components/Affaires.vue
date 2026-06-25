<template>
  <div class="affaires">
    <!-- Quand un projet est sélectionné : juste le titre -->
    <div v-if="affairStore.selectedAffair" class="selected-panel">
      <div class="selected-bar" @click="deselectAffair">
        <span class="sel-dot">●</span>
        <span class="sel-name">{{ affairStore.selectedAffair.name }}</span>
        <span class="sel-date">{{ formatDate(affairStore.selectedAffair.receipt_date) }}</span>
        <span class="sel-change">▼</span>
      </div>
      <div class="sel-details" @click.stop>
        <div class="sel-tags">
          <span v-if="hasUnreadMessage" class="unread-dot">★</span>
          <span class="tag tag-front role-tag" :class="{ 'role-active': activeRole === 'front' }" @click.stop="$emit('select-role', 'front')">Front</span>
          <span class="tag tag-monitor role-tag" :class="{ 'role-active': activeRole === 'monitor' }" @click.stop="$emit('select-role', 'monitor')">Monitor</span>
          <span class="tag tag-system role-tag" :class="{ 'role-active': activeRole === 'system' }" @click.stop="$emit('select-role', 'system')">System</span>
          <span class="tag tag-stage role-tag" :class="{ 'role-active': activeRole === 'stage' }" @click.stop="$emit('select-role', 'stage')">Stage</span>
        </div>
        <div class="sel-dates">
          <span class="sel-date-item">🚚 Chargement <b>{{ formatDate(affairStore.selectedAffair.receipt_date) || '—' }}</b></span>
          <span class="sel-date-item">↩️ Déchargement <b>{{ formatDate(affairStore.selectedAffair.return_date) || '—' }}</b></span>
          <span class="sel-date-item" v-if="affairStore.selectedAffair.prep_date">🔧 Prépa <b>{{ formatDate(affairStore.selectedAffair.prep_date) }}</b></span>
        </div>
        <span class="sel-catalog">{{ getCatalogName(affairStore.selectedAffair) }}</span>
        <button v-if="isLinkedToCompany" class="btn-action-sel btn-chat" :class="{ 'has-unread': hasUnreadMessage }" @click.stop="toggleChat" title="Question">❓</button>
        <button class="btn-action-sel" @click.stop="showNote = !showNote" title="Note">📝</button>
        <button class="btn-action-sel" @click.stop="showMateriel = !showMateriel" title="Matériel">
          {{ showMateriel ? '▲' : '▼' }} 🔧
        </button>
        <button class="btn-action-sel" :class="{ active: allCasesActive }" @click.stop="$emit('toggle-all-cases')" title="Vue flight-cases">🔍</button>
        <button class="btn-action-sel" @click.stop="openCalendar" title="Calendrier de tournée">📅</button>
        <button class="btn-action-sel" @click.stop="$emit('share')" title="Partager">📤</button>
      </div>

      <!-- Calendrier de tournée -->
      <div v-if="showCalendar" class="cal-overlay" @click.self="showCalendar = false">
        <div class="cal-modal">
          <div class="cal-modal-head">
            <span>📅 {{ affairStore.selectedAffair.name }} — {{ tourDates.length }} date(s)</span>
            <button class="cal-valider" @click="showCalendar = false">Valider</button>
          </div>
          <TourCalendar
            :tour-dates="tourDates"
            :out-dates="outDates"
            :back-dates="backDates"
            :out-periods="outPeriods"
            :back-periods="backPeriods"
            :prep-days="prepDays"
            :prep-date="affairStore.selectedAffair.prep_date"
            @toggle="toggleTourDate"
            @toggle-out="toggleOutDate"
            @toggle-back="toggleBackDate"
            @cycle-prep="cyclePrepDay"
          />
        </div>
      </div>

      <!-- Chat avec l'entreprise -->
      <div v-if="showChat" class="chat-panel" @click.stop>
        <div class="chat-messages">
          <div v-for="msg in chatMessages" :key="msg.messageid" class="chat-msg" :class="msg.sender_role">
            <span class="msg-role">{{ msg.sender_role === 'tech' ? '🧑‍🔧' : '🏢' }}</span>
            <div class="msg-bubble">
              <p>{{ msg.text }}</p>
              <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
          <div v-if="chatMessages.length === 0" class="chat-empty">Pas encore de messages</div>
        </div>
        <div class="chat-input">
          <input v-model="chatText" placeholder="Poser une question..." @keydown.enter="sendChat" />
          <button @click="sendChat" :disabled="!chatText.trim()">Envoyer</button>
        </div>
      </div>

      <!-- Note -->
      <div v-if="showNote" class="note-panel">
        <textarea v-model="techNote" rows="3" placeholder="Écrire une note..."></textarea>
        <div class="note-actions">
          <button class="btn-save-note" @click="saveNote">Enregistrer</button>
          <button class="btn-send-note" @click="sendNote">📩 Envoyer par mail</button>
        </div>
      </div>
      <div v-if="showMateriel" class="materiel-panel">
        <div class="materiel-section" v-if="affairStore.selectedAffair.front">
          <div class="materiel-title">🔊 Front</div>
          <textarea v-model="materielFront" rows="2" class="materiel-input" placeholder="Enceintes, subs, amplis... ex: 6 K2, 4 KS28"></textarea>
          <AmpCalculator :description="materielFront" />
        </div>
        <div class="materiel-section" v-if="affairStore.selectedAffair.monitor">
          <div class="materiel-title">🎧 Monitor</div>
          <textarea v-model="materielMonitor" rows="2" class="materiel-input" placeholder="Wedges, ears, amplis... ex: 8 X12, 2 SB18"></textarea>
          <AmpCalculator :description="materielMonitor" />
        </div>
        <div class="materiel-section" v-if="affairStore.selectedAffair.system">
          <div class="materiel-title">🎚 System</div>
          <textarea v-model="materielSystem" rows="2" class="materiel-input" placeholder="Processeurs, drives, distribution..."></textarea>
          <AmpCalculator :description="materielSystem" />
        </div>
        <div class="materiel-section" v-if="affairStore.selectedAffair.stage">
          <div class="materiel-title">🎸 Stage</div>
          <textarea v-model="materielStage" rows="2" class="materiel-input" placeholder="Front-fills, side-fills... ex: 4 X8, 2 SB15m"></textarea>
          <AmpCalculator :description="materielStage" />
        </div>
        <div v-if="!affairStore.selectedAffair.front && !affairStore.selectedAffair.monitor && !affairStore.selectedAffair.system && !affairStore.selectedAffair.stage" class="materiel-empty">
          Aucune zone définie
        </div>
        <div class="materiel-actions">
          <button class="btn-save-note" @click="saveMateriel">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Sinon : barre d'actions + liste -->
    <template v-else>
      <div class="top-bar">
        <button class="btn-new" @click="$emit('openNew', true)">New</button>
      </div>

      <div class="affair-list">
        <div v-for="group in groupedAffairs" :key="group.label" class="group">
          <div class="group-label">{{ group.label }}</div>
          <div
            v-for="affair in group.affairs"
            :key="affair.affairid"
            class="affair-card"
            @click="onAffairClick(affair)"
          >
            <div class="card-line1">
              <span class="card-dot">●</span>
              <span class="card-name">{{ affair.name }}</span>
              <span class="card-date-main">{{ formatDate(affair.receipt_date) }}</span>
            </div>
            <div class="card-line2">
              <span class="card-catalog">{{ getCatalogName(affair) }}</span>
              <span class="card-updated">MAJ {{ formatDate(affair.updated_at || affair.created_at) }}</span>
            </div>
            <div class="card-line3">
              <div class="card-tags">
                <span v-if="affair.front" class="tag tag-front">Front</span>
                <span v-if="affair.monitor" class="tag tag-monitor">Monitor</span>
                <span v-if="affair.system" class="tag tag-system">System</span>
                <span v-if="affair.stage" class="tag tag-stage">Stage</span>
                <span v-if="!affair.front && !affair.monitor && !affair.system && !affair.stage" class="tag tag-none">—</span>
              </div>
              <button class="btn-materiel" @click.stop="toggleCardMateriel(affair.affairid)">
                {{ openMaterielId === affair.affairid ? '▲ Matériel' : '▼ Matériel' }}
              </button>
            </div>
            <!-- Matériel dépliable dans la liste -->
            <div v-if="openMaterielId === affair.affairid" class="card-materiel" @click.stop>
              <div v-if="affair.front" class="materiel-section">
                <div class="materiel-title">🔊 Front</div>
                <textarea v-model="affair.materiel_front" rows="2" class="materiel-input" placeholder="Enceintes, subs, amplis..."></textarea>
              </div>
              <div v-if="affair.monitor" class="materiel-section">
                <div class="materiel-title">🎧 Monitor</div>
                <textarea v-model="affair.materiel_monitor" rows="2" class="materiel-input" placeholder="Wedges, ears, amplis..."></textarea>
              </div>
              <div v-if="affair.system" class="materiel-section">
                <div class="materiel-title">🎚 System</div>
                <textarea v-model="affair.materiel_system" rows="2" class="materiel-input" placeholder="Processeurs, drives, distribution..."></textarea>
              </div>
              <div v-if="affair.stage" class="materiel-section">
                <div class="materiel-title">🎸 Stage</div>
                <textarea v-model="affair.materiel_stage" rows="2" class="materiel-input" placeholder="Front-fills, side-fills, DI..."></textarea>
              </div>
              <div v-if="!affair.front && !affair.monitor && !affair.system && !affair.stage" class="materiel-empty">
                Aucune zone définie
              </div>
              <div class="materiel-actions">
                <button class="btn-save-note" @click.stop="saveCardMateriel(affair)">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="groupedAffairs.length === 0" class="empty">Aucune affaire trouvée</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useAffairStore } from '../stores/affairs'
import AmpCalculator from './AmpCalculator.vue'
import TourCalendar from './TourCalendar.vue'

defineProps({ allCasesActive: { type: Boolean, default: false }, activeRole: { type: String, default: '' } })
const emit = defineEmits(['selected', 'edit', 'openNew', 'materiel', 'share', 'toggle-all-cases', 'select-role'])
const affairStore = useAffairStore()
const currentUser = inject('currentUser', ref('T'))

// --- Calendrier de tournée ---
const showCalendar = ref(false)
const tourDates = ref([])
const outDates = ref([])
const backDates = ref([])
const outPeriods = ref({})
const backPeriods = ref({})
const prepDays = ref({})

function openCalendar() {
  const a = affairStore.selectedAffair
  tourDates.value = Array.isArray(a?.tour_dates) ? [...a.tour_dates] : []
  outDates.value = Array.isArray(a?.out_dates) ? [...a.out_dates] : []
  backDates.value = Array.isArray(a?.back_dates) ? [...a.back_dates] : []
  outPeriods.value = a?.out_periods && typeof a.out_periods === 'object' ? { ...a.out_periods } : {}
  backPeriods.value = a?.back_periods && typeof a.back_periods === 'object' ? { ...a.back_periods } : {}
  prepDays.value = a?.prep_days && typeof a.prep_days === 'object' ? { ...a.prep_days } : {}
  showCalendar.value = true
}

async function saveAffairField(field, val) {
  const a = affairStore.selectedAffair
  if (!a) return
  a[field] = val
  const { supabase } = await import('../lib/supabase')
  await supabase.from('affair').update({ [field]: val }).eq('affairid', a.affairid)
}

function toggleTourDate(dateStr) {
  const arr = tourDates.value.includes(dateStr)
    ? tourDates.value.filter(d => d !== dateStr)
    : [...tourDates.value, dateStr].sort()
  tourDates.value = arr
  saveAffairField('tour_dates', arr)
}

// Cycle : rien → après-midi (pm) → matin (am) → rien
function cyclePeriod(datesRef, periodsRef, datesField, periodsField, dateStr) {
  const has = datesRef.value.includes(dateStr)
  const period = periodsRef.value[dateStr]
  if (!has) {
    datesRef.value = [...datesRef.value, dateStr].sort()
    periodsRef.value = { ...periodsRef.value, [dateStr]: 'pm' }
  } else if (period !== 'am') {
    periodsRef.value = { ...periodsRef.value, [dateStr]: 'am' }
  } else {
    datesRef.value = datesRef.value.filter(d => d !== dateStr)
    const p = { ...periodsRef.value }; delete p[dateStr]; periodsRef.value = p
  }
  saveAffairField(datesField, datesRef.value)
  saveAffairField(periodsField, periodsRef.value)
}

function toggleOutDate(dateStr) {
  cyclePeriod(outDates, outPeriods, 'out_dates', 'out_periods', dateStr)
}

function toggleBackDate(dateStr) {
  cyclePeriod(backDates, backPeriods, 'back_dates', 'back_periods', dateStr)
}

function cyclePrepDay(dateStr) {
  const cur = prepDays.value[dateStr]
  const next = { top: 'bottom', bottom: 'full', full: null }
  const nv = cur ? next[cur] : 'top'
  const p = { ...prepDays.value }
  if (nv) p[dateStr] = nv; else delete p[dateStr]
  prepDays.value = p
  saveAffairField('prep_days', p)
}

const search = ref('')
const searchInput = ref(null)
const editMode = ref(false)
const showMateriel = ref(false)
const showChat = ref(false)
const chatMessages = ref([])
const chatText = ref('')
const hasUnreadMessage = ref(false)

const isLinkedToCompany = computed(() => {
  const a = affairStore.selectedAffair
  return a?.catalog_id && a.catalog_id > 1
})

async function toggleChat() {
  showChat.value = !showChat.value
  if (showChat.value) {
    await loadChatMessages()
    // Marquer comme lu par le technicien
    await markReadByTech()
  }
}

async function loadChatMessages() {
  const a = affairStore.selectedAffair
  if (!a) return
  const { supabase } = await import('../lib/supabase')
  const { data } = await supabase
    .from('message')
    .select('*')
    .eq('affairid', a.affairid)
    .order('created_at', { ascending: true })
  chatMessages.value = data || []
  // Vérifier s'il y a des messages non lus du master
  hasUnreadMessage.value = (data || []).some(m => m.sender_role === 'master' && !m.read_by_tech)
}

// Email du technicien courant sur cette affaire (pour ranger son message dans son fil 1:1)
function myPeerEmail(a) {
  const techId = parseInt(localStorage.getItem('cablemaster-techid')) || 0
  if (!techId) return null
  if (a.tech_id === techId) return a.tech_email || null
  if (a.tech_id_monitor === techId) return a.tech_email_monitor || null
  if (a.tech_id_system === techId) return a.tech_email_system || null
  if (a.tech_id_stage === techId) return a.tech_email_stage || null
  const as = (Array.isArray(a.assistants) ? a.assistants : []).find(x => x.tech_id === techId)
  return as ? (as.email || null) : null
}

async function sendChat() {
  if (!chatText.value.trim()) return
  const a = affairStore.selectedAffair
  if (!a) return
  const { supabase } = await import('../lib/supabase')
  await supabase.from('message').insert({
    affairid: a.affairid,
    sender_role: 'tech',
    text: chatText.value.trim(),
    peer_email: myPeerEmail(a),
    read_by_tech: true,
    read_by_master: false,
  })
  chatText.value = ''
  await loadChatMessages()
}

async function markReadByTech() {
  const a = affairStore.selectedAffair
  if (!a) return
  const { supabase } = await import('../lib/supabase')
  await supabase
    .from('message')
    .update({ read_by_tech: true })
    .eq('affairid', a.affairid)
    .eq('sender_role', 'master')
    .eq('read_by_tech', false)
  hasUnreadMessage.value = false
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
const openMaterielId = ref(null)

function toggleCardMateriel(affairId) {
  openMaterielId.value = openMaterielId.value === affairId ? null : affairId
}

async function saveCardMateriel(affair) {
  const { supabase } = await import('../lib/supabase')
  await supabase.from('affair').update({
    materiel_front: affair.materiel_front || '',
    materiel_monitor: affair.materiel_monitor || '',
    materiel_system: affair.materiel_system || '',
    materiel_stage: affair.materiel_stage || '',
  }).eq('affairid', affair.affairid)
  openMaterielId.value = null
}
const showNote = ref(false)
const techNote = ref('')
const materielFront = ref('')
const materielMonitor = ref('')
const materielSystem = ref('')
const materielStage = ref('')

// Charger la note et le matériel quand on sélectionne une affaire
import { watch } from 'vue'
watch(() => affairStore.selectedAffair, (a) => {
  if (a) {
    techNote.value = a.tech_note || ''
    materielFront.value = a.materiel_front || ''
    materielMonitor.value = a.materiel_monitor || ''
    materielSystem.value = a.materiel_system || ''
    materielStage.value = a.materiel_stage || ''
    // Vérifier messages non lus
    if (a.catalog_id && a.catalog_id > 1) loadChatMessages()
  }
  showNote.value = false
  showMateriel.value = false
  showChat.value = false
})

async function saveMateriel() {
  if (!affairStore.selectedAffair) return
  const { supabase } = await import('../lib/supabase')
  await supabase.from('affair').update({
    materiel_front: materielFront.value,
    materiel_monitor: materielMonitor.value,
    materiel_system: materielSystem.value,
    materiel_stage: materielStage.value,
  }).eq('affairid', affairStore.selectedAffair.affairid)
  affairStore.selectedAffair.materiel_front = materielFront.value
  affairStore.selectedAffair.materiel_monitor = materielMonitor.value
  affairStore.selectedAffair.materiel_system = materielSystem.value
  affairStore.selectedAffair.materiel_stage = materielStage.value
  showMateriel.value = false
}

async function saveNote() {
  if (!affairStore.selectedAffair) return
  const { supabase } = await import('../lib/supabase')
  await supabase.from('affair').update({ tech_note: techNote.value }).eq('affairid', affairStore.selectedAffair.affairid)
  affairStore.selectedAffair.tech_note = techNote.value
  showNote.value = false
}

async function sendNote() {
  if (!affairStore.selectedAffair) return
  await saveNote()
  const a = affairStore.selectedAffair
  const subject = encodeURIComponent(`Note - ${a.name}`)
  const body = encodeURIComponent(`Note concernant l'affaire "${a.name}" (${formatDate(a.receipt_date)}) :\n\n${techNote.value}\n\nCordialement`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}

async function shareAffair() {
  const a = affairStore.selectedAffair
  if (!a) return

  const catalogName = getCatalogName(a)
  const zones = [a.front && 'Front', a.monitor && 'Monitor', a.stage && 'Stage'].filter(Boolean).join(', ')

  const subject = encodeURIComponent(`Câblage - ${a.name} - ${formatDate(a.receipt_date)}`)
  const body = encodeURIComponent(
`Bonjour,

Concernant l'affaire "${a.name}"
📅 Date : ${formatDate(a.receipt_date)}
${a.return_date ? '📅 Retour : ' + formatDate(a.return_date) : ''}
${a.prep_date ? '📅 Prépa : ' + formatDate(a.prep_date) : ''}
🏢 Matériel : ${catalogName}
🎯 Zones : ${zones || 'Non définies'}

${a.description ? '📋 Description :\n' + a.description + '\n' : ''}
${a.tech_note ? '📝 Note :\n' + a.tech_note + '\n' : ''}

Cordialement`)

  // Essayer le partage natif (mobile), sinon mailto
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Câblage - ${a.name}`,
        text: decodeURIComponent(body),
      })
    } catch {}
  } else {
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }
}
const catalogs = ref({})

onMounted(async () => {
  affairStore.fetchAffairs()
  // Charger les noms des catalogues
  const { supabase } = await import('../lib/supabase')
  const { data } = await supabase.from('catalog').select('catalogid, name, owner_name')
  if (data) {
    for (const c of data) {
      catalogs.value[c.catalogid] = c.owner_name || c.name
    }
  }
})

function getCatalogName(affair) {
  if (!affair.catalog_id) return 'Ma liste'
  return catalogs.value[affair.catalog_id] || 'Ma liste'
}


const userAffairs = computed(() => {
  const uid = currentUser.value
  const techId = parseInt(localStorage.getItem('cablemaster-techid')) || 0

  // Admin (T, M) voit tout
  if (techId === 0) return affairStore.affairs

  // Technicien voit seulement ses affaires (filtre par tech_id)
  return affairStore.affairs.filter(a => a.tech_id === techId)
})

const filteredAffairs = computed(() => {
  let list = userAffairs.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.ref || '').toLowerCase().includes(q) ||
      (a.tech_name || '').toLowerCase().includes(q) ||
      (a.receipt_date || '').includes(q)
    )
  }
  return list
})

const groupedAffairs = computed(() => {
  const now = new Date()
  const groups = {
    current: { label: 'En cours', affairs: [] },
    upcoming: { label: 'À venir', affairs: [] },
    past: { label: 'Passées', affairs: [] },
  }

  for (const a of filteredAffairs.value) {
    const receipt = a.receipt_date ? new Date(a.receipt_date) : null
    const ret = a.return_date ? new Date(a.return_date) : null

    if (ret && ret < now) {
      groups.past.affairs.push(a)
    } else if (receipt && receipt <= now) {
      groups.current.affairs.push(a)
    } else {
      groups.upcoming.affairs.push(a)
    }
  }

  return [groups.current, groups.upcoming, groups.past].filter(g => g.affairs.length > 0)
})

const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function selectAffair(affair) {
  affairStore.selectAffair(affair)
  emit('selected', affair)
  search.value = ''
  editMode.value = false
}

function onAffairClick(affair) {
  if (editMode.value) {
    emit('edit', affair)
    editMode.value = false
  } else {
    selectAffair(affair)
  }
}

function deselectAffair() {
  affairStore.selectAffair(null)
}
</script>

<style scoped>
.affaires {
  padding: 5px 10px;
  text-align: left;
}
.top-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.selected-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
}
.sel-dot {
  color: var(--color1);
  font-size: 16px;
}
.sel-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text, #333);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sel-date {
  font-size: 13px;
  color: #facc15;
  font-weight: 700;
  white-space: nowrap;
}
.sel-change {
  font-size: 12px;
  color: #888;
}
.selected-panel {
  margin-bottom: 4px;
  background: var(--bg, #fff);
  border-radius: 10px;
  border: 2px solid var(--color1);
  overflow: hidden;
}
.sel-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
}
.sel-tags {
  display: flex;
  gap: 4px;
  flex: 1;
}
.sel-catalog {
  font-size: 11px;
  color: var(--color1);
  font-weight: 600;
}
.cal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}
.cal-modal {
  background: var(--bg, #fff);
  border-radius: 12px;
  width: 100%;
  max-width: 460px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
.cal-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 4px;
}
.cal-valider {
  padding: 7px 16px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: none;
}
.sel-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  font-size: 12px;
  color: var(--text-light, #888);
}
.sel-date-item b {
  color: #facc15;
  font-weight: 700;
}
.btn-action-sel {
  font-size: 14px;
  background: var(--bg-card, #f0f0f0);
  border: 1px solid var(--border-light, #ddd);
  border-radius: 6px;
  cursor: pointer;
  padding: 4px 8px;
  min-width: auto;
  box-shadow: none;
  transition: transform 0.1s;
}
.btn-action-sel:active {
  transform: scale(0.9);
}
.btn-action-sel.active {
  background: var(--color1);
  border-color: var(--color1);
}
.btn-chat.has-unread {
  animation: pulse-red 1.5s infinite;
}
@keyframes pulse-red {
  0%, 100% { background: var(--bg-card, #f0f0f0); }
  50% { background: #ef4444; }
}
.unread-dot {
  color: #ef4444;
  font-size: 14px;
  animation: pulse-red-text 1.5s infinite;
}
@keyframes pulse-red-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.chat-panel {
  margin: 0;
  padding: 8px 12px;
  border-top: 1px solid var(--border-light, #eee);
}
.chat-messages {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 8px;
}
.chat-msg {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  align-items: flex-start;
}
.chat-msg.tech {
  flex-direction: row;
}
.chat-msg.master {
  flex-direction: row-reverse;
}
.msg-role {
  font-size: 16px;
  flex-shrink: 0;
}
.msg-bubble {
  background: var(--bg-card, #f0f0f0);
  padding: 6px 10px;
  border-radius: 10px;
  max-width: 80%;
}
.chat-msg.master .msg-bubble {
  background: var(--color1-light);
}
.msg-bubble p {
  margin: 0;
  font-size: 13px;
  color: var(--text, #333);
}
.msg-time {
  font-size: 10px;
  color: var(--text-muted, #999);
}
.chat-empty {
  text-align: center;
  color: var(--text-muted, #999);
  font-size: 12px;
  padding: 10px;
}
.chat-input {
  display: flex;
  gap: 6px;
}
.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  outline: none;
}
.chat-input input:focus {
  border-color: var(--color1);
}
.chat-input button {
  padding: 8px 12px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.chat-input button:disabled {
  opacity: 0.4;
}
.note-panel {
  margin: 0;
  padding: 8px 12px;
  border-top: 1px solid var(--border-light, #eee);
}
.note-panel textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  outline: none;
}
.note-panel textarea:focus {
  border-color: var(--color1);
}
.note-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.btn-save-note {
  padding: 6px 12px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.btn-send-note {
  padding: 6px 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.btn-materiel-sel {
  display: none;
}
.card-materiel {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border-light, #eee);
}
.materiel-panel {
  margin: 0;
  padding: 4px 12px 8px;
  border-top: 1px solid var(--border-light, #eee);
}
.materiel-section {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-light, #eee);
}
.materiel-section:last-child {
  border-bottom: none;
}
.materiel-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
}
.materiel-content {
  font-size: 12px;
  color: var(--text-light, #888);
  font-style: italic;
}
.materiel-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  outline: none;
  font-family: inherit;
}
.materiel-input:focus {
  border-color: var(--color1);
}
.materiel-actions {
  padding: 8px 12px;
  text-align: right;
}
.materiel-empty {
  padding: 12px;
  text-align: center;
  color: var(--text-muted, #999);
  font-size: 12px;
}
.affair-list {
  max-height: 60vh;
  overflow-y: auto;
}
.search-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
}
.search-input:focus {
  border-color: var(--color1);
}
.btn-edit-mode {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 2px solid #ccc;
  border-radius: 6px;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-edit-mode.active {
  background: var(--color3);
  border-color: var(--color3);
  color: white;
}
.group {
  margin-bottom: 4px;
}
.group-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  padding: 6px 6px 2px;
  letter-spacing: 0.5px;
}
.affair-card {
  position: relative;
  padding: 8px 10px;
  margin: 6px 4px;
  border-radius: 6px;
  border: 1px solid var(--border, #e8e8e8);
  background: var(--bg-card, #fafafa);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.affair-card:hover {
  border-color: var(--color1);
}
.affair-card.selected {
  border-color: var(--color1);
}
.card-line1 {
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-dot {
  color: var(--color1);
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}
.card-name {
  font-size: 17px;
  font-weight: 700;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-date-main {
  font-size: 14px;
  font-weight: 700;
  color: var(--color3);
  white-space: nowrap;
  flex-shrink: 0;
}
.card-line2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  padding-left: 26px;
}
.card-catalog {
  font-size: 12px;
  font-weight: 600;
  color: var(--color1);
}
.card-updated {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}
.card-line3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  padding-left: 26px;
}
.card-tags {
  display: flex;
  gap: 4px;
}
.tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.tag-front {
  background: #3b82f6;
  color: #fff;
}
.tag-monitor {
  background: #f59e0b;
  color: #fff;
}
.tag-stage {
  background: #10b981;
  color: #fff;
}
.tag-system {
  background: #8b5cf6;
  color: #fff;
}
/* Sélecteur de métier : le métier choisi ressort, les autres sont atténués */
.role-tag {
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 0.15s, box-shadow 0.15s;
}
.role-tag.role-active {
  opacity: 1;
  box-shadow: 0 0 0 2px var(--bg, #fff), 0 0 0 4px currentColor;
}
.tag-none {
  color: #999;
  font-size: 12px;
}
.btn-materiel {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  background: transparent;
  border: 1px solid var(--color3);
  color: var(--color3);
  border-radius: 4px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.empty {
  padding: 15px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.btn-new {
  cursor: pointer;
  padding: 6px 12px;
  background: var(--color3);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
