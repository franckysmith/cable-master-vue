<template>
  <div class="caisse-type">
    <!-- Barre d'outils : recherche -->
    <div class="ct-toolbar">
      <span class="search-wrap">
        <input class="search" type="text" v-model="searchKey" placeholder="Rechercher câble" />
        <button v-if="searchKey" class="search-clear" @click="searchKey = ''" title="Effacer">✕</button>
      </span>
    </div>

    <ButtonCableType :model-value="typeChoose" :always-color="true" :counts="typeCounts" @select="typeChoose = $event" />

    <!-- Grille : lignes = câbles, colonnes = cablekits (CK1, CK2, …) -->
    <div class="ck-grid" ref="gridScroll">
      <!-- En-têtes CK (obliques) + mini-boutons à gauche + bouton ajouter -->
      <div class="ck-head-row">
        <div class="ck-head-spacer ct-btn-row">
          <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">{{ subtractMode ? '−' : '+' }}</button>
          <button class="mini-btn" :class="{ 'active-blue': soloMode }" @click="toggleSolo" title="Bilan (câbles présents)">S</button>
          <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">+10</button>
        </div>
        <div
          v-for="i in ckCount" :key="'ckh'+i" class="head-label-angled"
          :class="{ 'solo-selected': soloMode && soloCk === i }"
          @mousedown="startHeadPress(i)" @mouseup="endHeadPress(i)" @mouseleave="cancelHeadPress"
          @touchstart="startHeadPress(i)" @touchend.prevent="endHeadPress(i)" @touchcancel="cancelHeadPress"
        ><span>{{ ckLabel(i) }}</span></div>
        <div class="ck-addbar">
          <button
            v-if="ckCount < MAX_CK" class="ck-add"
            @mousedown="startAddPress" @mouseup="endAddPress" @mouseleave="cancelAddPress"
            @touchstart="startAddPress" @touchend.prevent="endAddPress" @touchcancel="cancelAddPress"
            title="Ajouter un cablekit (appui long : retirer les vides)"
          >+</button>
          <button v-if="showMinus" class="ck-add ck-minus" @click="removeEmptyCk" title="Retirer les cablekits vides">−</button>
        </div>
      </div>

      <!-- Lignes câbles -->
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
        >{{ cable.name }}</div>
        <div
          v-for="i in ckCount" :key="cable.cableid + '-' + i"
          class="ct-cell"
          :class="{ disabled: cable.cableid !== activeCableId, 'solo-col': soloMode && soloCk === i }"
          @mousedown="startPress(cable, i, $event)"
          @mouseup="endPress(cable, i, $event)"
          @mouseleave="cancelPress"
          @touchstart="startPress(cable, i, $event)"
          @touchend="endPress(cable, i, $event)"
          @touchcancel="cancelPress"
        >
          <span class="ct-value" :class="{ active: getCount(cable, i) > 0 }">
            {{ getCount(cable, i) > 0 ? getCount(cable, i) : '--' }}
          </span>
        </div>
      </div>

      <div v-if="filteredCables.length === 0" class="ct-empty">Aucun câble</div>
    </div>

    <!-- Renommer les cablekits (appui long sur un en-tête, réservé à l'entreprise) -->
    <div v-if="ckEditor.open" class="ck-editor-overlay" @click.self="cancelCkEditor">
      <div class="ck-editor">
        <div class="ck-title">Renommer les cablekits</div>
        <div class="ck-rows">
          <div v-for="(f, idx) in ckEditor.fields" :key="f.key" class="ck-row">
            <span class="ck-tag">{{ f.placeholder }}</span>
            <input v-model="f.value" :placeholder="f.placeholder" maxlength="10" @keydown.enter="saveCkEditor" />
            <button type="button" class="ck-del" @click="deleteCk(idx + 1)" title="Supprimer ce cablekit">✕</button>
          </div>
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

const MAX_CK = 15
const typeChoose = ref('speaker')
const searchKey = ref('')
const activeCableId = ref(null)
const subtractMode = ref(false)
const incrementStep = ref(1)
const soloMode = ref(false)
let usedTouch = false

// Nombre de colonnes CK affichées (dynamique, persistant)
const ckCount = ref(parseInt(localStorage.getItem('cablemaster-ckcount')) || 4)
// mfc par index de CK + comptes : counts[`${cableid}:${ck}`]
const mfcByCk = reactive({})
const counts = ref({})

function ckLabel(i) { return settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}` }
function getCount(cable, ck) { return counts.value[`${cable.cableid}:${ck}`] || 0 }
function totalForCable(cable) {
  let s = 0
  for (let i = 1; i <= ckCount.value; i++) s += getCount(cable, i)
  return s
}

function toggleSolo() {
  soloMode.value = !soloMode.value
  if (soloMode.value) searchKey.value = ''
  else soloCk.value = null
}

onMounted(async () => {
  await Promise.all([cableStore.fetchCables(), mfcStore.fetchMfcs()])
  await loadAllCk()
})

// Assure un mfc pour chaque colonne CK (nom interne stable « CK{i} ») et charge ses comptes
async function ensureMfc(i) {
  if (mfcByCk[i]) return mfcByCk[i]
  let mfc = mfcStore.mfcs.find(m => m.name === `CK${i}`)
  if (!mfc) {
    const { data } = await mfcStore.addMfc({ name: `CK${i}`, info: '' })
    mfc = data?.[0]
  }
  if (mfc) mfcByCk[i] = mfc
  return mfc
}
async function loadCk(i) {
  const mfc = await ensureMfc(i)
  if (!mfc) return
  const { data } = await mfcStore.getMfcCables(mfc.mfcid)
  const next = { ...counts.value }
  if (data) for (const item of data) next[`${item.cableid}:${i}`] = item.count
  counts.value = next
}
async function loadAllCk() {
  for (let i = 1; i <= ckCount.value; i++) await loadCk(i)
}

async function addCk() {
  if (ckCount.value >= MAX_CK) return
  ckCount.value += 1
  localStorage.setItem('cablemaster-ckcount', String(ckCount.value))
  await loadCk(ckCount.value)
}

// Appui long sur « + » → révèle le « − » (retirer les cablekits vides)
const showMinus = ref(false)
let addTimer = null
let addLong = false
function startAddPress() {
  addLong = false
  clearTimeout(addTimer)
  addTimer = setTimeout(() => { addLong = true; showMinus.value = true }, 500)
}
function endAddPress() { clearTimeout(addTimer); if (!addLong) addCk() }
function cancelAddPress() { clearTimeout(addTimer) }

function ckIsEmpty(i) {
  for (const c of cableStore.cables) if ((counts.value[`${c.cableid}:${i}`] || 0) > 0) return false
  return true
}
function removeEmptyCk() {
  // Retire les cablekits vides depuis la fin (on garde toujours au moins 1 colonne)
  let removable = 0
  for (let i = ckCount.value; i >= 1 && ckIsEmpty(i); i--) removable++
  if (removable > ckCount.value - 1) removable = ckCount.value - 1
  if (removable <= 0) { alert('Aucun cablekit vide à retirer (le dernier contient des câbles).'); return }
  if (!confirm(`Retirer ${removable} cablekit(s) vide(s) ?`)) return
  ckCount.value -= removable
  localStorage.setItem('cablemaster-ckcount', String(ckCount.value))
  showMinus.value = false
}

// Colonne CK sélectionnée en mode solo (clic sur un en-tête) → on regarde le contenu de cette caisse
const soloCk = ref(null)

const filteredCables = computed(() => {
  let list = cableStore.cables
  if (soloMode.value && soloCk.value) {
    // Contenu de la caisse choisie, filtrable par type
    list = list.filter(c => getCount(c, soloCk.value) > 0)
    if (typeChoose.value) list = list.filter(c => c.type === typeChoose.value)
  } else if (soloMode.value) {
    list = list.filter(c => totalForCable(c) > 0)
  } else if (typeChoose.value) {
    list = list.filter(c => c.type === typeChoose.value)
  }
  if (searchKey.value) {
    const q = searchKey.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

// Badges des onglets de type : nb de câbles par type dans la caisse soloée (sinon aucun)
const typeCounts = computed(() => {
  const m = {}
  if (!soloMode.value || !soloCk.value) return m
  for (const c of cableStore.cables) {
    const n = getCount(c, soloCk.value)
    if (n > 0) m[c.type] = (m[c.type] || 0) + n
  }
  return m
})

// --- Saisie dans les cases (tap = +/- pas ; maintien = décrément répété) ---
const LONG_PRESS_DELAY = 400
const REPEAT_INTERVAL = 200
let pressTimer = null
let repeatTimer = null
let didLongPress = false

function startPress(cable, ck, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (cable.cableid !== activeCableId.value) return
  didLongPress = false
  pressTimer = setTimeout(() => {
    didLongPress = true
    doDecrement(cable, ck)
    repeatTimer = setInterval(() => doDecrement(cable, ck), REPEAT_INTERVAL)
  }, LONG_PRESS_DELAY)
}
function doDecrement(cable, ck) {
  const key = `${cable.cableid}:${ck}`
  const cur = counts.value[key] || 0
  if (cur > 0) {
    counts.value = { ...counts.value, [key]: cur - 1 }
    saveCell(cable.cableid, ck)
  } else {
    clearInterval(repeatTimer); repeatTimer = null
  }
}
function endPress(cable, ck, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (cable.cableid !== activeCableId.value) return
  clearTimeout(pressTimer); clearInterval(repeatTimer); pressTimer = null; repeatTimer = null
  if (!didLongPress) {
    const key = `${cable.cableid}:${ck}`
    const current = counts.value[key] || 0
    const next = subtractMode.value ? Math.max(0, current - incrementStep.value) : current + incrementStep.value
    counts.value = { ...counts.value, [key]: next }
    saveCell(cable.cableid, ck)
  }
}
function cancelPress() {
  clearTimeout(pressTimer); clearInterval(repeatTimer); pressTimer = null; repeatTimer = null
}
async function saveCell(cableid, ck) {
  const mfc = mfcByCk[ck]
  if (!mfc) return
  await mfcStore.setCableMfc(mfc.mfcid, cableid, counts.value[`${cableid}:${ck}`] || 0)
}

// --- Renommer les cablekits (appui long sur un en-tête, réservé à l'entreprise) ---
const isMaster = computed(() => {
  const role = localStorage.getItem('cablemaster-role') || 'technician'
  const uid = localStorage.getItem('cablemaster-userid') || ''
  return role === 'master' || role === 'gerant' || uid === 'T'
})
let headPressTimer = null
let headLongFired = false
function startHeadPress() {
  headLongFired = false
  clearTimeout(headPressTimer)
  if (!isMaster.value) return
  headPressTimer = setTimeout(() => { headLongFired = true; openCkEditor() }, 500)
}
function endHeadPress(i) {
  clearTimeout(headPressTimer)
  if (headLongFired) return
  // Clic court → solo direct sur cette caisse ; re-clic sur la même = éteint
  if (soloMode.value && soloCk.value === i) { soloMode.value = false; soloCk.value = null }
  else { soloMode.value = true; soloCk.value = i; typeChoose.value = '' }
}
function cancelHeadPress() { clearTimeout(headPressTimer) }

const ckEditor = reactive({ open: false, fields: [] })
function openCkEditor() {
  ckEditor.fields = Array.from({ length: ckCount.value }, (_, k) => ({
    key: `ct${k + 1}`, placeholder: `CK${k + 1}`,
    value: settingsStore.defaultCtLabels[`ct${k + 1}`] || '',
  }))
  ckEditor.open = true
}
function saveCkEditor() {
  for (const f of ckEditor.fields) settingsStore.defaultCtLabels[f.key] = (f.value || '').trim()
  ckEditor.open = false
}

// Supprimer un cablekit : on retire la colonne k et on décale les suivantes (libellés + données)
async function deleteCk(k) {
  if (ckCount.value <= 1) { alert('Au moins un cablekit doit rester.'); return }
  if (!ckIsEmpty(k) && !confirm(`« ${ckLabel(k)} » contient des câbles. Le supprimer quand même ?`)) return
  if (ckIsEmpty(k) && !confirm(`Supprimer le cablekit « ${ckLabel(k)} » ?`)) return
  // Supprimer le mfc de la colonne k, renommer les suivants CK{i} → CK{i-1}
  const del = mfcByCk[k]
  if (del) await mfcStore.deleteMfc(del.mfcid)
  for (let i = k + 1; i <= ckCount.value; i++) {
    const m = mfcByCk[i]
    if (m) await mfcStore.updateMfc(m.mfcid, { name: `CK${i - 1}` })
  }
  // Décaler les libellés
  for (let i = k; i < ckCount.value; i++) {
    settingsStore.defaultCtLabels[`ct${i}`] = settingsStore.defaultCtLabels[`ct${i + 1}`] || ''
  }
  settingsStore.defaultCtLabels[`ct${ckCount.value}`] = ''
  ckCount.value -= 1
  localStorage.setItem('cablemaster-ckcount', String(ckCount.value))
  // Recharger mfc + comptes depuis la base
  for (const key in mfcByCk) delete mfcByCk[key]
  counts.value = {}
  await mfcStore.fetchMfcs()
  await loadAllCk()
  if (ckEditor.open) openCkEditor()
}
function cancelCkEditor() { ckEditor.open = false }

function colorForType(type) {
  const colors = {
    speaker: '#4dcc59', electrical: '#f3e309', microphone: '#eb910a',
    module: '#ef4444', special: '#3b82f6', other: '#a16207',
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
.ct-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.search-wrap { position: relative; flex: 1; display: flex; }
.search { flex: 1; height: 28px; padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
.search-clear { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; color: #999; box-shadow: none; min-width: auto; }
.subtract-toggle, .solo-toggle { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #ccc; background: #fff; font-weight: 800; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; min-width: 28px; box-shadow: none; }
.subtract-toggle { font-size: 18px; }
.solo-toggle { font-size: 14px; }
.subtract-toggle.active { background: #ef4444; border-color: #ef4444; color: #fff; }
.solo-toggle.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
.step-toggle { height: 28px; padding: 0 8px; border-radius: 14px; border: 2px solid #ccc; background: #fff; font-size: 13px; font-weight: 700; color: #666; cursor: pointer; min-width: auto; box-shadow: none; }
.step-toggle.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }

/* Grille */
.ck-grid { width: 100%; overflow-x: auto; }
.ck-head-row { display: flex; align-items: flex-end; gap: 0; margin-bottom: 6px; }
.ck-head-spacer { flex: 0 0 130px; width: 130px; position: sticky; left: 0; z-index: 6; background: var(--bg, #fff); box-shadow: 5px 0 6px -2px rgba(0, 0, 0, 0.35); }
.ct-btn-row { display: flex; align-items: flex-end; gap: 4px; padding-bottom: 4px; }
.mini-btn {
  width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ccc; background: #fff;
  font-size: 11px; font-weight: 700; color: #666; cursor: pointer; display: flex;
  align-items: center; justify-content: center; padding: 0; min-width: 26px; box-shadow: none;
}
.mini-btn.active { background: #ef4444; border-color: #ef4444; color: #fff; }
.mini-btn.active-blue { background: #3b82f6; border-color: #3b82f6; color: #fff; }
/* En-têtes CK en oblique (comme la vue zones) */
.head-label-angled {
  width: 44px; flex-shrink: 0; height: 55px; margin-left: 6px;
  display: flex; align-items: flex-end; position: relative;
  cursor: pointer; user-select: none; -webkit-user-select: none;
}
.head-label-angled span {
  display: block; transform: rotate(-55deg); transform-origin: bottom left;
  white-space: nowrap; font-size: 12px; font-weight: 800; color: #06b6d4;
  position: absolute; bottom: 0; left: 30px;
}
.head-label-angled.solo-selected span { color: #3b82f6; text-decoration: underline; }
.ck-addbar { display: flex; flex-direction: column; gap: 4px; margin-left: 8px; flex-shrink: 0; }
.ck-add {
  width: 28px; height: 28px; flex-shrink: 0;
  border: 2px solid #06b6d4; border-radius: 6px; background: transparent; color: #06b6d4;
  font-size: 18px; font-weight: 800; line-height: 1; cursor: pointer; box-shadow: none; min-width: auto;
  user-select: none; -webkit-user-select: none;
}
.ck-minus { border-color: #ef4444; color: #ef4444; }

.cable-row {
  display: flex; align-items: center; padding: 6px 4px;
  background: var(--bg-card, #fff); border-bottom: 1px solid var(--border-light, #ddd);
  margin-bottom: 2px; box-shadow: 0 2px 3px rgba(0, 0, 0, 0.12);
}
.cable-row.row-band .cable-name { background: var(--bg-section, #d5d5d5); border-radius: 8px 0 0 8px; padding-top: 4px; padding-bottom: 4px; }
.cable-row.row-active .cable-name {
  border: 2px solid #fff !important; border-radius: 8px 0 0 8px; color: var(--text) !important;
  font-weight: 800; background: var(--bg-card) !important; padding: 4px 6px !important;
}
.cable-row.row-active .ct-cell { border: 1.5px solid var(--color1); }
.cable-name {
  flex: 0 0 130px; width: 130px; font-size: 15px; font-weight: 700; padding-left: 6px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; color: var(--text, #333);
  position: sticky; left: 0; z-index: 5; background: var(--bg-card, #fff);
  border-radius: 8px 0 0 8px;
  box-shadow: 5px 0 6px -2px rgba(0, 0, 0, 0.35);
}
.ct-cell {
  width: 44px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  background: #d5d5d5; border-radius: 6px; cursor: pointer; user-select: none; -webkit-user-select: none; margin-left: 6px;
}
.cable-row:not(.row-band) .ct-cell { background: #ebebeb; }
.ct-cell.solo-col { background: #bfdbfe !important; box-shadow: inset 0 0 0 2px #3b82f6; }
.ct-cell.disabled { opacity: 0.5; cursor: default; }
.ct-value { font-size: 16px; color: #bbb; font-weight: 500; }
.ct-value.active { color: #2c3e50; font-weight: bold; }
.ct-empty { text-align: center; padding: 40px; color: #999; font-size: 16px; }

/* Éditeur de renommage */
.ck-editor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 250; padding: 16px; }
.ck-editor { background: var(--bg-card, #fff); color: var(--text, #333); border: 1px solid var(--border, #ddd); border-radius: 14px; padding: 16px; width: 100%; max-width: 340px; max-height: 80vh; overflow-y: auto; }
.ck-title { font-size: 16px; font-weight: 800; margin-bottom: 12px; }
.ck-rows { display: flex; flex-direction: column; gap: 8px; }
.ck-row { display: flex; align-items: center; gap: 8px; }
.ck-tag { flex: 0 0 46px; font-size: 12px; font-weight: 700; color: var(--text-muted, #888); }
.ck-row input { flex: 1; min-width: 0; padding: 8px 10px; font-size: 16px; border: 1px solid var(--border-light, #ccc); border-radius: 8px; background: var(--bg-input, #fff); color: var(--text, #333); }
.ck-row input:focus { outline: none; border-color: var(--color1); }
.ck-del { flex-shrink: 0; width: 30px; height: 30px; border-radius: 6px; border: 1px solid #ef4444; background: transparent; color: #ef4444; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: none; min-width: auto; padding: 0; }
.ck-actions { display: flex; gap: 8px; margin-top: 14px; }
.ck-cancel, .ck-save { flex: 1; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; box-shadow: none; }
.ck-cancel { background: var(--bg-section, #eee); color: var(--text, #333); border: 1px solid var(--border-light, #ccc); }
.ck-save { background: var(--color1); color: #fff; }
</style>
