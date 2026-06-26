<template>
  <div class="caisse-type">
    <!-- Sélection de la caisse type -->
    <div class="ct-header">
      <div class="ct-tabs">
        <button
          v-for="i in 8"
          :key="'ct'+i"
          class="ct-tab"
          :class="{ active: selectedCt === i }"
          @mousedown="startTabPress(i)" @mouseup="endTabPress(i)" @mouseleave="cancelTabPress"
          @touchstart="startTabPress(i)" @touchend.prevent="endTabPress(i)" @touchcancel="cancelTabPress"
        >
          {{ settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}` }}
        </button>
      </div>
    </div>

    <!-- Contenu de la caisse sélectionnée -->
    <div v-if="selectedCt" class="ct-content">
      <div class="ct-toolbar">
        <span class="search-wrap">
          <input class="search" type="text" v-model="searchKey" placeholder="Rechercher câble" />
          <button v-if="searchKey" class="search-clear" @click="searchKey = ''" title="Effacer">✕</button>
        </span>
        <button class="subtract-toggle" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
          {{ subtractMode ? '−' : '+' }}
        </button>
        <button class="step-toggle" :class="{ active: incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
          +10
        </button>
        <button class="solo-toggle" :class="{ active: soloMode }" @click="toggleSolo" title="Voir uniquement les câbles présents (bilan)">
          S
        </button>
      </div>

      <ButtonCableType :model-value="typeChoose" @select="typeChoose = $event" />

      <!-- Tableau des câbles -->
      <div class="ct-table">
        <div
          v-for="(cable, idx) in filteredCables"
          :key="cable.cableid"
          class="cable-row"
          :class="{ 'row-band': idx % 2 === 0, 'row-active': cable.cableid === activeCableId }"
        >
          <div
            class="cable-name"
            :style="{ borderLeft: `4px solid ${colorForType(cable.type)}` }"
            @click="activeCableId = activeCableId === cable.cableid ? null : cable.cableid"
          >
            {{ cable.name }}
          </div>
          <div
            class="ct-cell"
            :class="{ disabled: cable.cableid !== activeCableId }"
            @mousedown="startPress(cable, $event)"
            @mouseup="endPress(cable, $event)"
            @mouseleave="cancelPress"
            @touchstart="startPress(cable, $event)"
            @touchend="endPress(cable, $event)"
            @touchcancel="cancelPress"
          >
            <span class="ct-value" :class="{ active: getCount(cable) > 0 }">
              {{ getCount(cable) > 0 ? getCount(cable) : '--' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Résumé -->
      <div class="ct-summary" v-if="totalCount > 0">
        <strong>{{ totalCount }}</strong> câbles dans {{ settingsStore.defaultCtLabels[`ct${selectedCt}`] || `CK${selectedCt}` }}
      </div>
    </div>

    <div v-else class="ct-empty">
      Sélectionnez une caisse type
    </div>

    <!-- Renommer les cablekits (appui long sur un onglet, réservé à l'entreprise) -->
    <div v-if="ckEditor.open" class="ck-editor-overlay" @click.self="cancelCkEditor">
      <div class="ck-editor">
        <div class="ck-title">Renommer les cablekits</div>
        <div class="ck-rows">
          <label v-for="f in ckEditor.fields" :key="f.key" class="ck-row">
            <span class="ck-tag">{{ f.placeholder }}</span>
            <input v-model="f.value" :placeholder="f.placeholder" maxlength="20" @keydown.enter="saveCkEditor" />
          </label>
        </div>
        <div class="ck-actions">
          <button class="ck-cancel" @click="cancelCkEditor">Annuler</button>
          <button class="ck-save" @click="saveCkEditor">Valider</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useCableStore } from '../stores/cables'
import { useMfcStore } from '../stores/mfc'
import { useSettingsStore } from '../stores/settings'
import ButtonCableType from '../components/ButtonCableType.vue'

const cableStore = useCableStore()
const mfcStore = useMfcStore()
const settingsStore = useSettingsStore()

const selectedCt = ref(null)
const typeChoose = ref('speaker')
const searchKey = ref('')
const activeCableId = ref(null)
const subtractMode = ref(false)
const incrementStep = ref(1)
const soloMode = ref(false) // n'afficher que les câbles présents dans la caisse (bilan)
const cableCounts = ref({})
let usedTouch = false

function toggleSolo() {
  soloMode.value = !soloMode.value
  if (soloMode.value) searchKey.value = ''
}

onMounted(() => {
  cableStore.fetchCables()
  mfcStore.fetchMfcs()
})

const filteredCables = computed(() => {
  let list = cableStore.cables
  if (soloMode.value) {
    // Bilan : tous les câbles présents dans la caisse (count > 0), tous types confondus
    list = list.filter(c => getCount(c) > 0)
  } else if (typeChoose.value) {
    list = list.filter(c => c.type === typeChoose.value)
  }
  if (searchKey.value) {
    const q = searchKey.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

const totalCount = computed(() => {
  return Object.values(cableCounts.value).reduce((sum, v) => sum + v, 0)
})

function getCount(cable) {
  return cableCounts.value[cable.cableid] || 0
}

async function selectCt(i) {
  selectedCt.value = i
  activeCableId.value = null
  // Chercher ou créer la MFC correspondante
  const ctName = settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}`
  let mfc = mfcStore.mfcs.find(m => m.name === ctName || m.name === `CK${i}`)
  if (!mfc) {
    const { data } = await mfcStore.addMfc({ name: ctName, info: '' })
    mfc = data?.[0]
    if (!mfc) return
  }
  // Charger les câbles de cette MFC
  const { data } = await mfcStore.getMfcCables(mfc.mfcid)
  const counts = {}
  if (data) {
    for (const item of data) {
      counts[item.cableid] = item.count
    }
  }
  cableCounts.value = counts
}

const LONG_PRESS_DELAY = 400
const REPEAT_INTERVAL = 200
let pressTimer = null
let repeatTimer = null
let didLongPress = false

function startPress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (cable.cableid !== activeCableId.value) return
  didLongPress = false
  // Maintien → décrément continu (−1 répété), comme la vue zones/FC
  pressTimer = setTimeout(() => {
    didLongPress = true
    doDecrement(cable)
    repeatTimer = setInterval(() => doDecrement(cable), REPEAT_INTERVAL)
  }, LONG_PRESS_DELAY)
}

function doDecrement(cable) {
  const cur = cableCounts.value[cable.cableid] || 0
  if (cur > 0) {
    cableCounts.value[cable.cableid] = cur - 1
    saveCableCount(cable.cableid)
  } else {
    clearInterval(repeatTimer)
    repeatTimer = null
  }
}

function endPress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (cable.cableid !== activeCableId.value) return
  clearTimeout(pressTimer)
  clearInterval(repeatTimer)
  pressTimer = null
  repeatTimer = null

  // Tap simple → ajoute (ou retire en mode −) le pas courant (1 ou 10)
  if (!didLongPress) {
    const current = cableCounts.value[cable.cableid] || 0
    if (subtractMode.value) {
      cableCounts.value[cable.cableid] = Math.max(0, current - incrementStep.value)
    } else {
      cableCounts.value[cable.cableid] = current + incrementStep.value
    }
    saveCableCount(cable.cableid)
  }
}

function cancelPress() {
  clearTimeout(pressTimer)
  clearInterval(repeatTimer)
  pressTimer = null
  repeatTimer = null
}

async function saveCableCount(cableid) {
  const ctName = settingsStore.defaultCtLabels[`ct${selectedCt.value}`] || `CK${selectedCt.value}`
  const mfc = mfcStore.mfcs.find(m => m.name === ctName || m.name === `CK${selectedCt.value}`)
  if (!mfc) return
  const count = cableCounts.value[cableid] || 0
  await mfcStore.setCableMfc(mfc.mfcid, cableid, count)
}

// Renommage des cablekits réservé à l'entreprise (master / super-admin)
const isMaster = computed(() => {
  const role = localStorage.getItem('cablemaster-role') || 'technician'
  const uid = localStorage.getItem('cablemaster-userid') || ''
  return role === 'master' || uid === 'T'
})

// --- Renommer les cablekits (appui long sur un onglet) ---
let tabPressTimer = null
let tabLongFired = false
function startTabPress() {
  tabLongFired = false
  clearTimeout(tabPressTimer)
  if (!isMaster.value) return // renommage réservé à l'entreprise
  tabPressTimer = setTimeout(() => { tabLongFired = true; openCkEditor() }, 500)
}
function endTabPress(i) {
  clearTimeout(tabPressTimer)
  if (tabLongFired) return
  selectCt(i)
}
function cancelTabPress() { clearTimeout(tabPressTimer) }

const ckEditor = reactive({ open: false, fields: [] })
function openCkEditor() {
  ckEditor.fields = Array.from({ length: 8 }, (_, k) => ({
    key: `ct${k + 1}`, placeholder: `CK${k + 1}`,
    value: settingsStore.defaultCtLabels[`ct${k + 1}`] || '',
  }))
  ckEditor.open = true
}
function saveCkEditor() {
  for (const f of ckEditor.fields) settingsStore.defaultCtLabels[f.key] = (f.value || '').trim()
  ckEditor.open = false
}
function cancelCkEditor() { ckEditor.open = false }

function colorForType(type) {
  const colors = {
    speaker: '#4dcc59', electrical: '#f3e309', microphone: '#eb910a',
    module: '#8b5cf6', special: '#ef4444', other: '#a16207',
    c_type: '#06b6d4', accessory: '#84cc16', digital: '#f97316',
  }
  return colors[type] || '#ccc'
}
</script>

<style scoped>
.caisse-type {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 4px;
  text-align: left;
}
h2 {
  font-size: 18px;
  margin-bottom: 10px;
  text-align: center;
}
.ct-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 10px;
}
.ct-tab {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid #06b6d4;
  border-radius: 6px;
  background: #fff;
  color: #06b6d4;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
}
.ct-tab.active {
  background: #06b6d4;
  color: #fff;
}
.ct-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.search {
  flex: 1;
  height: 28px;
  padding: 2px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.subtract-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 18px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
}
.subtract-toggle.active {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.step-toggle {
  height: 28px;
  padding: 0 8px;
  border-radius: 14px;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: auto;
  box-shadow: none;
}
.step-toggle.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
.solo-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 14px;
  font-weight: 800;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
}
.solo-toggle.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
.ck-editor-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 250; padding: 16px;
}
.ck-editor {
  background: var(--bg-card, #fff); color: var(--text, #333);
  border: 1px solid var(--border, #ddd); border-radius: 14px;
  padding: 16px; width: 100%; max-width: 340px; max-height: 80vh; overflow-y: auto;
}
.ck-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
.ck-rows { display: flex; flex-direction: column; gap: 8px; }
.ck-row { display: flex; align-items: center; gap: 8px; }
.ck-tag { flex: 0 0 46px; font-size: 12px; font-weight: 700; color: var(--text-muted, #888); }
.ck-row input {
  flex: 1; min-width: 0; padding: 8px 10px; font-size: 16px;
  border: 1px solid var(--border-light, #ccc); border-radius: 8px;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.ck-row input:focus { outline: none; border-color: var(--color1); }
.ck-actions { display: flex; gap: 8px; margin-top: 14px; }
.ck-cancel, .ck-save {
  flex: 1; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; border: none; box-shadow: none;
}
.ck-cancel { background: var(--bg-section, #eee); color: var(--text, #333); border: 1px solid var(--border-light, #ccc); }
.ck-save { background: var(--color1); color: #fff; }
.ct-table {
  width: 100%;
}
.cable-row {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.12);
}
.cable-row.row-band .cable-name {
  background: #d5d5d5;
  border-radius: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.cable-row.row-active .cable-name {
  /* Sélection : encadré BLANC, uniforme (écrase la bordure-gauche inline, le fond
     du zébrage ET le padding pair/impair) → même taille partout, texte blanc. */
  border: 2px solid #fff !important;
  border-radius: 6px;
  color: var(--text) !important;
  font-weight: 800;
  background: var(--bg-card) !important;
  padding: 4px 6px !important;
}
.cable-row.row-active .ct-cell {
  border: 1.5px solid var(--color1);
}
.cable-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.ct-cell {
  width: 44px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d5d5d5;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  margin-left: 6px;
}
.cable-row:not(.row-band) .ct-cell {
  background: #ebebeb;
}
.ct-cell.disabled {
  opacity: 0.5;
  cursor: default;
}
.ct-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
}
.ct-value.active {
  color: #2c3e50;
  font-weight: bold;
}
.ct-summary {
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: #666;
}
.ct-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>
