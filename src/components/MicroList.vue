<template>
  <div class="micro-list">
    <!-- En-tête des colonnes (oblique, aligné sur chaque colonne) + boutons +/− et S -->
    <div class="mic-head-row">
      <div class="mic-head-name">
        <button class="mic-mini-btn" :class="{ active: subtractMode }" @click="$emit('toggle-subtract')">{{ subtractMode ? '−' : '+' }}</button>
        <button class="mic-mini-btn" :class="{ active: soloMode }" @click="$emit('toggle-solo')">S</button>
      </div>
      <div class="mic-head-col"><span class="mic-head-angled need">Ma Liste</span></div>
      <div class="mic-head-col"><span class="mic-head-angled prop">Proposition</span></div>
      <div class="mic-head-detail">
        <span v-if="microsValidated" class="mic-validated-tag">✓ Validé</span>
        <button v-if="microsValidated" class="mic-act-btn modify" @click="$emit('unlock')">Modifier</button>
        <button v-else class="mic-act-btn validate" @click="$emit('validate')">Valider</button>
      </div>
    </div>

    <template v-for="sec in orderedSections" :key="sec.key">
      <div class="mic-cat-header" :id="'micsec-' + sec.key">{{ sec.label }}</div>
      <template v-for="([brand, cables]) in sec.brandGroups" :key="sec.key + '_' + brand">
      <div class="brand-header" @click="toggleGroup(sec.key + '_' + brand)">
        <span class="brand-arrow">{{ closedGroups[sec.key + '_' + brand] ? '▶' : '▼' }}</span>
        <span class="brand-name">{{ brand }}</span>
        <span class="brand-count">{{ cables.length }}</span>
      </div>
      <template v-if="!closedGroups[sec.key + '_' + brand]">
        <div
          v-for="(cable, rowIdx) in cables"
          :key="cable.cableid"
          class="cable-row"
          :class="{ 'row-active': cable.cableid == activeCableId, 'row-band': rowIdx % 2 === 0 }"
        >
          <div
            class="cable-name"
            :style="{ borderLeft: '4px solid #eb910a' }"
            @mousedown="startNamePress(cable, $event)" @mouseup="endNamePress(cable, $event)" @mouseleave="cancelNamePress"
            @touchstart="startNamePress(cable, $event)" @touchend="endNamePress(cable, $event)" @touchcancel="cancelNamePress"
            :title="cable.link ? 'Appui long : ouvrir la fiche PDF' : ''"
          >{{ displayName(cable) }}<span v-if="cable.link" class="mic-pdf-badge" title="Fiche PDF disponible (appui long)">📄</span></div>
          <div class="cable-cols">
            <!-- Pieds : saisie directe au clavier numérique (chiffres possibles élevés) -->
            <template v-if="catOf(cable) === 'pied'">
              <div class="mic-cell">
                <input class="mic-num" type="number" inputmode="numeric" min="0" placeholder="--"
                  :value="cable.need || ''" :readonly="!canEditNeed" @change="setNum(cable, 'need', $event)" @click.stop />
              </div>
              <div class="mic-cell" :class="propClass(cable)">
                <input class="mic-num" type="number" inputmode="numeric" min="0" placeholder="--"
                  :value="cable.proposed || ''" :readonly="!canEditProposed" @change="setNum(cable, 'proposed', $event)" @click.stop />
              </div>
            </template>
            <!-- Micros / DI / HF : tap = +, maintien = − -->
            <template v-else>
              <div class="mic-cell" :class="{ disabled: cable.cableid !== activeCableId || !canEditNeed }"
                @mousedown="startPress(cable, 'need', $event)" @mouseup="endPress(cable, 'need', $event)" @mouseleave="cancelPress"
                @touchstart="startPress(cable, 'need', $event)" @touchend="endPress(cable, 'need', $event)" @touchcancel="cancelPress">
                <span class="mic-value" :class="{ active: cable.need > 0 }">{{ cable.need > 0 ? cable.need : '--' }}</span>
              </div>
              <div class="mic-cell" :class="[propClass(cable), { disabled: cable.cableid !== activeCableId || !canEditProposed }]"
                @mousedown="startPress(cable, 'proposed', $event)" @mouseup="endPress(cable, 'proposed', $event)" @mouseleave="cancelPress"
                @touchstart="startPress(cable, 'proposed', $event)" @touchend="endPress(cable, 'proposed', $event)" @touchcancel="cancelPress">
                <span class="mic-value" :class="{ active: cable.proposed > 0 }">{{ cable.proposed > 0 ? cable.proposed : '--' }}</span>
              </div>
            </template>
            <textarea class="mic-detail" v-model="cable.detail" placeholder="…" rows="1"
              @input="onDetailInput($event, cable)" @click.stop @mousedown.stop @touchstart.stop></textarea>
          </div>
        </div>
      </template>
      </template>
    </template>

    <!-- Totaux : Ma liste vs Propositions -->
    <div v-if="shownMics.length" class="mic-totals">
      <div class="mic-totals-name">Total</div>
      <div class="mic-totals-cell">{{ totalNeed }}</div>
      <div class="mic-totals-cell" :class="totalNeed === totalProposed ? 'tot-ok' : 'tot-bad'">{{ totalProposed }}</div>
      <div class="mic-totals-detail"></div>
    </div>

    <div v-if="shownMics.length === 0" class="empty">Aucun micro</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  activeCableId: { default: null },
  subtractMode: { type: Boolean, default: false },
  soloMode: { type: Boolean, default: false },
  incrementStep: { type: Number, default: 1 },
  microsValidated: { type: Boolean, default: false },
})

const emit = defineEmits(['updated', 'select', 'longpress', 'toggle-subtract', 'toggle-solo', 'validate', 'unlock'])

// L'utilisateur courant est-il un master (entreprise) ?
const isMaster = computed(() => {
  const role = localStorage.getItem('cablemaster-role') || 'technician'
  const uid = localStorage.getItem('cablemaster-userid') || ''
  return role === 'master' || uid === 'T'
})
// Droits d'édition :
// - « Ma liste » (besoin) : éditable tant que pas validée par le technicien
// - « Proposition » : master uniquement (il remplit une fois la liste validée)
const canEditNeed = computed(() => !props.microsValidated)
const canEditProposed = computed(() => isMaster.value)

// Sections de la page Micro
const MIC_SECTIONS = [
  { key: 'micro', label: 'Micro' },
  { key: 'di', label: 'DI' },
  { key: 'hf_micro', label: 'HF micro' },
  { key: 'pied', label: 'Pied de micro' }, // en bas de la liste, pas dans la barre de raccourcis
]
const allMicsRaw = computed(() => props.cables.filter(c => c.type === 'microphone'))
function catOf(c) { return c.mic_category || 'micro' }
function sectionCount(key) { return allMicsRaw.value.filter(c => catOf(c) === key).length }

function getBrand(cable) {
  return cable.brand || cable.name.split(' ')[0] || 'Autre'
}
// Nom affiché : on retire la marque du début si elle est déjà le titre du groupe
// (ex. groupe « Audix » → « Audix D2 » s'affiche « D2 »)
function displayName(cable) {
  const b = getBrand(cable)
  const n = cable.name || ''
  if (b && n.toLowerCase().startsWith(b.toLowerCase() + ' ')) return n.slice(b.length).trim()
  return n
}

// Micros affichés. En mode Solo (S) : uniquement ceux avec besoin/proposé.
const shownMics = computed(() => {
  if (!props.soloMode) return allMicsRaw.value
  return allMicsRaw.value.filter(c => (c.need || 0) > 0 || (c.proposed || 0) > 0)
})

// Liste continue ordonnée Micro → DI → HF micro, chaque section groupée par marque
const orderedSections = computed(() => {
  return MIC_SECTIONS.map(s => {
    const cables = shownMics.value.filter(c => catOf(c) === s.key)
    const groups = {}
    for (const c of cables) {
      const b = getBrand(c)
      if (!groups[b]) groups[b] = []
      groups[b].push(c)
    }
    const brandGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
    return { ...s, count: cables.length, brandGroups }
  }).filter(s => s.count > 0)
})

function scrollToSection(key) {
  const el = document.getElementById('micsec-' + key)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Couleur de la colonne « Propositions » : vert = proposé CORRESPOND au besoin
// (proposé = besoin) ; rouge dès que ça ne correspond plus (manque ou écart).
function propClass(cable) {
  if (!cable.need) return ''
  return (cable.proposed || 0) === cable.need ? 'prop-green' : 'prop-red'
}
// Totaux bas de tableau (sur la liste affichée)
const totalNeed = computed(() => shownMics.value.reduce((s, c) => s + (c.need || 0), 0))
const totalProposed = computed(() => shownMics.value.reduce((s, c) => s + (c.proposed || 0), 0))

const closedGroups = ref({})
function toggleGroup(brand) {
  closedGroups.value[brand] = !closedGroups.value[brand]
}

function getQty(cable) {
  const maxGroup = Math.max(
    cable.tfc1 || 0,
    cable.tfc2 || 0,
    cable.tfc3 || 0,
    cable.tfc4 || 0,
    cable.tfc5 || 0
  )
  const spare = cable.spare_count || 0
  return maxGroup + spare
}

let namePressTimer = null
let nameDidLongPress = false
let usedTouch = false

function startNamePress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  nameDidLongPress = false
  namePressTimer = setTimeout(() => {
    nameDidLongPress = true
    emit('longpress', cable)
  }, 1200)
}

function endNamePress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  clearTimeout(namePressTimer)
  if (!nameDidLongPress) {
    emit('select', cable.cableid)
  }
}

function cancelNamePress() {
  clearTimeout(namePressTimer)
}

function isEditable(cable) {
  return cable.cableid == props.activeCableId
}

const LONG_PRESS_DELAY = 400
const REPEAT_INTERVAL = 200
let pressTimer = null
let repeatTimer = null
let didLongPress = false

function canEditField(field) {
  return field === 'proposed' ? canEditProposed.value : canEditNeed.value
}

// Saisie directe (pieds) : on tape le nombre au clavier numérique
function setNum(cable, field, e) {
  if (field === 'proposed' ? !canEditProposed.value : !canEditNeed.value) return
  cable[field] = Math.max(0, parseInt(e.target.value) || 0)
  emit('updated', cable)
}

function onDetailInput(e, cable) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 46) + 'px'
  emit('updated', cable)
}

function startPress(cable, field, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (!isEditable(cable)) {
    return // sélection uniquement via le nom du câble, pas via les cases
  }
  if (!canEditField(field)) return // colonne verrouillée (validé) ou réservée au master
  didLongPress = false
  // Maintien → décrément continu (−1 répété)
  pressTimer = setTimeout(() => {
    didLongPress = true
    doDecrement(cable, field)
    repeatTimer = setInterval(() => doDecrement(cable, field), REPEAT_INTERVAL)
  }, LONG_PRESS_DELAY)
}

function doDecrement(cable, field) {
  if (cable[field] > 0) {
    cable[field] = cable[field] - 1
    emit('updated', cable)
  } else {
    clearInterval(repeatTimer)
    repeatTimer = null
  }
}

function endPress(cable, field, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (!isEditable(cable)) return
  if (!canEditField(field)) return
  clearTimeout(pressTimer)
  clearInterval(repeatTimer)
  pressTimer = null
  repeatTimer = null

  if (!didLongPress) {
    if (props.subtractMode) {
      const newVal = (cable[field] || 0) - props.incrementStep
      cable[field] = Math.max(0, newVal)
      emit('updated', cable)
    } else {
      cable[field] = (cable[field] || 0) + props.incrementStep
      emit('updated', cable)
    }
  }
}

function cancelPress() {
  clearTimeout(pressTimer)
  clearInterval(repeatTimer)
  pressTimer = null
  repeatTimer = null
}
</script>

<style scoped>
.micro-list {
  width: 100%;
}
.mic-sections {
  display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;
}
.mic-section-btn {
  flex: 1 1 0; min-width: 0; padding: 6px 8px;
  background: var(--bg-card, #f5f5f5); color: var(--text, #333);
  border: 1px solid var(--border-light, #ccc); border-radius: 8px;
  font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
}
.mic-section-btn.active { background: var(--color1); border-color: var(--color1); color: #fff; }
.mic-section-count {
  font-size: 11px; font-weight: 800; background: rgba(0,0,0,0.18);
  border-radius: 8px; padding: 0 5px; min-width: 16px; text-align: center;
}
.mic-section-btn.active .mic-section-count { background: rgba(255,255,255,0.3); }
.cable-row {
  display: flex;
  align-items: center;
  padding: 6px 2px 6px 4px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.12);
}
.cable-row.row-band .cable-name {
  background: var(--color1);
  border-radius: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
  color: #fff;
}
.cable-row.row-active .mic-cell {
  border: 1.5px solid var(--color1);
}
.cable-row.row-active .cable-name {
  border: 1.5px solid var(--color1);
  border-radius: 6px;
  color: #fff;
  font-weight: 800;
}
.cable-name {
  flex: 1;
  min-width: 80px;
  text-align: left;
  font-size: 15px;
  font-weight: 700;
  padding: 4px 6px;
  color: #fff !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.mic-pdf-badge { margin-left: 5px; font-size: 12px; opacity: 0.95; }
.cable-cols {
  display: flex;
  gap: 0;
}
.mic-cell {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 1px;
  background: #d5d5d5;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.cable-row:not(.row-band) .mic-cell {
  background: #ebebeb;
}
.mic-cell.col-spare {
  background: #f0d9b5;
}
.cable-row:not(.row-band) .mic-cell.col-spare {
  background: #f5e6d0;
}
.mic-cell.mic-qty {
  background: var(--color3);
  font-weight: 800;
}
.mic-cell.mic-qty .mic-value {
  color: #000;
  font-weight: 800;
}
.mic-cell.disabled {
  cursor: default;
  opacity: 0.5;
}
.mic-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
  pointer-events: none;
}
.mic-value.active {
  color: #2c3e50;
  font-weight: bold;
}

/* --- Page Micro : colonnes Ma liste / Propositions / Détails --- */
.cable-row { gap: 4px; }
.cable-name { flex: 0 0 100px !important; width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
.cable-cols { flex: 1; align-items: center; gap: 4px; }
.cable-cols .mic-cell { flex: 0 0 auto; width: 40px; height: 34px; margin: 0; }
/* Vert/rouge en fond CLAIR + texte NOIR — spécificité renforcée pour battre les
   surcharges .dark .cable-row:not(.row-band) .mic-cell (sinon vert 1 ligne sur 2) */
.cable-row .cable-cols .mic-cell.prop-green,
:global(.dark) .cable-row .cable-cols .mic-cell.prop-green { background: #86efac !important; }
.cable-row .cable-cols .mic-cell.prop-red,
:global(.dark) .cable-row .cable-cols .mic-cell.prop-red { background: #fca5a5 !important; }
.mic-cell.prop-green .mic-value, .mic-cell.prop-red .mic-value,
.mic-cell.prop-green .mic-num, .mic-cell.prop-red .mic-num { color: #111 !important; font-weight: 800; }
/* Saisie numérique des pieds */
.mic-cell .mic-num {
  width: 100%; height: 100%; border: none; background: transparent; text-align: center;
  font-size: 16px; font-weight: 800; color: #1a1a2e; padding: 0; box-sizing: border-box;
  -moz-appearance: textfield; appearance: textfield;
}
.mic-cell .mic-num::-webkit-outer-spin-button,
.mic-cell .mic-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.mic-cell .mic-num::placeholder { color: #777; }
.mic-cell.prop-green .mic-num, .mic-cell.prop-red .mic-num { color: #fff; }
.mic-cell .mic-num:focus { outline: none; }
.mic-detail {
  flex: 1; min-width: 0; height: 34px; min-height: 34px;
  border: 1px solid var(--border-light, #ccc); border-radius: 6px;
  background: var(--bg-input, #fff); color: var(--text, #333);
  padding: 7px 8px; font-size: 14px; box-sizing: border-box;
  resize: none; overflow: hidden; line-height: 18px; font-family: inherit;
}
.mic-detail:focus { outline: none; border-color: var(--color1); }
/* En-tête des colonnes */
.mic-head-row { display: flex; align-items: flex-end; gap: 4px; height: 80px; margin: 2px 0; }
.mic-head-name { flex: 0 0 100px; display: flex; align-items: flex-end; gap: 6px; }
.mic-head-col { flex: 0 0 40px; position: relative; height: 100%; }
.mic-head-detail { flex: 1; display: flex; align-items: flex-end; justify-content: flex-end; gap: 6px; padding-bottom: 2px; }
.mic-act-btn { padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; border: none; box-shadow: none; min-width: auto; }
.mic-act-btn.modify { background: #3b82f6; color: #fff; }
.mic-act-btn.validate { background: #16a34a; color: #fff; }
.mic-validated-tag { font-size: 12px; font-weight: 800; color: #16a34a; align-self: flex-end; padding-bottom: 6px; }
.mic-head-angled {
  position: absolute; bottom: 2px; left: 28px;
  transform: rotate(-50deg); transform-origin: bottom left;
  white-space: nowrap; font-size: 15px; font-weight: 800; letter-spacing: 0.5px;
}
.mic-head-angled.need { color: var(--color3, #eb910a); }
.mic-head-angled.prop { color: #ef4444; }
.mic-mini-btn {
  width: 28px; height: 28px; border-radius: 50%; padding: 0;
  border: 2px solid var(--border-light, #ccc); background: var(--bg-card, #fff);
  color: var(--text, #666); font-size: 14px; font-weight: 800; cursor: pointer;
  box-shadow: none; display: flex; align-items: center; justify-content: center; flex: none;
}
.mic-mini-btn.active { background: var(--color1); border-color: var(--color1); color: #fff; }
/* Totaux */
.mic-totals { display: flex; align-items: center; gap: 4px; margin-top: 10px; padding: 8px 0; border-top: 2px solid var(--border, #444); }
.mic-totals-name { flex: 0 0 100px; font-size: 13px; font-weight: 800; color: var(--text, #333); }
.mic-totals-cell { flex: 0 0 40px; text-align: center; font-size: 16px; font-weight: 800; color: var(--text, #333); }
.mic-totals-cell.tot-ok { color: #16a34a; }
.mic-totals-cell.tot-bad { color: #dc2626; }
.mic-totals-detail { flex: 1; }
.mic-cat-header {
  margin: 12px 2px 4px;
  padding: 6px 10px;
  background: var(--color3);
  color: #000;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 8px;
  scroll-margin-top: 8px;
}
.brand-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: transparent;
  color: var(--text, #222);
  border: 2px solid #eb910a;
  cursor: pointer;
  border-radius: 6px;
  margin: 4px 2px 2px;
  user-select: none;
}
.brand-header.brand-inactive {
  border-color: #888;
  opacity: 0.5;
}
.brand-arrow {
  font-size: 10px;
  width: 12px;
}
.brand-name {
  font-size: 14px;
  font-weight: 700;
  flex: 1;
}
.brand-count {
  font-size: 12px;
  font-weight: 600;
  background: #eb910a;
  color: #fff;
  padding: 1px 6px;
  border-radius: 10px;
}
.solo-separator {
  height: 2px;
  background: #ddd;
  margin: 10px 0;
}
.row-inactive {
  opacity: 0.5;
}
.empty {
  padding: 15px;
  color: #999;
  font-size: 14px;
  text-align: center;
}
@media (min-width: 768px) {
  .cable-name {
    width: 200px;
    min-width: 200px;
    font-size: 17px;
  }
  .mic-cell {
    width: 44px;
    height: 40px;
    margin: 0 1px;
  }
  .mic-value {
    font-size: 18px;
  }
}
</style>
