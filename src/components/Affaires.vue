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
          <span v-if="affairStore.selectedAffair.front" class="tag tag-front">Façade</span>
          <span v-if="affairStore.selectedAffair.monitor" class="tag tag-monitor">Retours</span>
          <span v-if="affairStore.selectedAffair.stage" class="tag tag-stage">Scène</span>
        </div>
        <span class="sel-catalog">{{ getCatalogName(affairStore.selectedAffair) }}</span>
        <button class="btn-action-sel" @click.stop="showNote = !showNote" title="Note">📝</button>
        <button class="btn-action-sel" @click.stop="showMateriel = !showMateriel" title="Matériel">
          {{ showMateriel ? '▲' : '▼' }} 🔧
        </button>
        <button class="btn-action-sel" @click.stop="$emit('share')" title="Partager">📤</button>
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
          <div class="materiel-title">🔊 Façade</div>
          <textarea v-model="materielFront" rows="2" class="materiel-input" placeholder="Enceintes, subs, amplis..."></textarea>
        </div>
        <div class="materiel-section" v-if="affairStore.selectedAffair.monitor">
          <div class="materiel-title">🎧 Retour</div>
          <textarea v-model="materielMonitor" rows="2" class="materiel-input" placeholder="Wedges, ears, amplis..."></textarea>
        </div>
        <div class="materiel-section" v-if="affairStore.selectedAffair.stage">
          <div class="materiel-title">🎸 Scène</div>
          <textarea v-model="materielStage" rows="2" class="materiel-input" placeholder="Front-fills, side-fills, DI..."></textarea>
        </div>
        <div v-if="!affairStore.selectedAffair.front && !affairStore.selectedAffair.monitor && !affairStore.selectedAffair.stage" class="materiel-empty">
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
        <button class="btn-new" @click="$emit('openNew', true)">+ Nouvelle</button>
        <input
          ref="searchInput"
          v-model="search"
          class="search-input"
          placeholder="Rechercher..."
        />
        <button
          class="btn-edit-mode"
          :class="{ active: editMode }"
          @click="editMode = !editMode"
        >edit</button>
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
                <span v-if="affair.front" class="tag tag-front">Façade</span>
                <span v-if="affair.monitor" class="tag tag-monitor">Retours</span>
                <span v-if="affair.stage" class="tag tag-stage">Scène</span>
                <span v-if="!affair.front && !affair.monitor && !affair.stage" class="tag tag-none">—</span>
              </div>
              <button class="btn-materiel" @click.stop="toggleCardMateriel(affair.affairid)">
                {{ openMaterielId === affair.affairid ? '▲ Matériel' : '▼ Matériel' }}
              </button>
            </div>
            <!-- Matériel dépliable dans la liste -->
            <div v-if="openMaterielId === affair.affairid" class="card-materiel" @click.stop>
              <div v-if="affair.front" class="materiel-section">
                <div class="materiel-title">🔊 Façade</div>
                <textarea v-model="affair.materiel_front" rows="2" class="materiel-input" placeholder="Enceintes, subs, amplis..."></textarea>
              </div>
              <div v-if="affair.monitor" class="materiel-section">
                <div class="materiel-title">🎧 Retours</div>
                <textarea v-model="affair.materiel_monitor" rows="2" class="materiel-input" placeholder="Wedges, ears, amplis..."></textarea>
              </div>
              <div v-if="affair.stage" class="materiel-section">
                <div class="materiel-title">🎸 Scène</div>
                <textarea v-model="affair.materiel_stage" rows="2" class="materiel-input" placeholder="Front-fills, side-fills, DI..."></textarea>
              </div>
              <div v-if="!affair.front && !affair.monitor && !affair.stage" class="materiel-empty">
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
import { ref, computed, onMounted } from 'vue'
import { useAffairStore } from '../stores/affairs'

const emit = defineEmits(['selected', 'edit', 'openNew', 'materiel', 'share'])
const affairStore = useAffairStore()

const search = ref('')
const searchInput = ref(null)
const editMode = ref(false)
const showMateriel = ref(false)
const openMaterielId = ref(null)

function toggleCardMateriel(affairId) {
  openMaterielId.value = openMaterielId.value === affairId ? null : affairId
}

async function saveCardMateriel(affair) {
  const { supabase } = await import('../lib/supabase')
  await supabase.from('affair').update({
    materiel_front: affair.materiel_front || '',
    materiel_monitor: affair.materiel_monitor || '',
    materiel_stage: affair.materiel_stage || '',
  }).eq('affairid', affair.affairid)
  openMaterielId.value = null
}
const showNote = ref(false)
const techNote = ref('')
const materielFront = ref('')
const materielMonitor = ref('')
const materielStage = ref('')

// Charger la note et le matériel quand on sélectionne une affaire
import { watch } from 'vue'
watch(() => affairStore.selectedAffair, (a) => {
  if (a) {
    techNote.value = a.tech_note || ''
    materielFront.value = a.materiel_front || ''
    materielMonitor.value = a.materiel_monitor || ''
    materielStage.value = a.materiel_stage || ''
  }
  showNote.value = false
  showMateriel.value = false
})

async function saveMateriel() {
  if (!affairStore.selectedAffair) return
  const { supabase } = await import('../lib/supabase')
  await supabase.from('affair').update({
    materiel_front: materielFront.value,
    materiel_monitor: materielMonitor.value,
    materiel_stage: materielStage.value,
  }).eq('affairid', affairStore.selectedAffair.affairid)
  affairStore.selectedAffair.materiel_front = materielFront.value
  affairStore.selectedAffair.materiel_monitor = materielMonitor.value
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


const filteredAffairs = computed(() => {
  if (!search.value) return affairStore.affairs
  const q = search.value.toLowerCase()
  return affairStore.affairs.filter(a =>
    (a.name || '').toLowerCase().includes(q) ||
    (a.ref || '').toLowerCase().includes(q) ||
    (a.tech_name || '').toLowerCase().includes(q) ||
    (a.receipt_date || '').includes(q)
  )
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
  color: #555;
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
  margin: 2px 4px;
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
