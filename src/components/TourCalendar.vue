<template>
  <div class="tour-cal">
    <!-- Mode : que marque-t-on au clic ? -->
    <div v-if="editable" class="cal-modes">
      <button type="button" class="cal-mode concert" :class="{ active: mode === 'concert' }" @click="mode = 'concert'">🟢 Show</button>
      <button type="button" class="cal-mode prep" :class="{ active: mode === 'prep' }" @click="mode = 'prep'">▦ Prépa</button>
      <button type="button" class="cal-mode out" :class="{ active: mode === 'out' }" @click="mode = 'out'">→ Chargement</button>
      <button type="button" class="cal-mode back" :class="{ active: mode === 'back' }" @click="mode = 'back'">← Déchargement</button>
    </div>

    <div class="cal-legend">
      <span class="lg lg-concert">● Show</span>
      <span class="lg lg-prep">▦ Prépa</span>
      <span class="lg lg-out">→ Chargement</span>
      <span class="lg lg-range">▒ Sorti</span>
      <span class="lg lg-back">← Déchargement</span>
    </div>
    <div v-if="editable" class="cal-hint">Clic répété : haut = après-midi, bas = matin (prépa : haut → bas → journée), puis efface.</div>
    <div class="cal-scroll" @touchstart="onTouchStart" @touchmove="onTouchMove">
      <div v-for="m in months" :key="m.key" class="cal-month">
        <div class="cal-month-title">{{ m.label }}</div>
        <div class="cal-grid">
          <div v-for="(d, i) in weekdays" :key="'wd'+i" class="cal-wd">{{ d }}</div>
          <div v-for="(cell, idx) in m.cells" :key="idx" class="cal-cell">
            <button
              v-if="cell"
              class="cal-day"
              :class="{
                concert: isConcert(cell),
                'in-range': inRange(cell),
                disabled: !editable,
              }"
              @click="onDayClick(cell)"
            >
              <span v-if="prepDays[cell]" class="cal-prep" :class="'prep-' + prepDays[cell]"></span>
              <span v-if="isOut(cell)" class="cal-arrow out" :class="outPeriods[cell] === 'am' ? 'pos-bottom' : 'pos-top'">→</span>
              <span v-if="isBack(cell)" class="cal-arrow back" :class="backPeriods[cell] === 'am' ? 'pos-bottom' : 'pos-top'">←</span>
              <span class="cal-num">{{ Number(cell.slice(-2)) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tourDates: { type: Array, default: () => [] },
  outDates: { type: Array, default: () => [] },
  backDates: { type: Array, default: () => [] },
  outPeriods: { type: Object, default: () => ({}) },
  backPeriods: { type: Object, default: () => ({}) },
  prepDays: { type: Object, default: () => ({}) },
  prepDate: { type: String, default: '' },
  editable: { type: Boolean, default: true },
})
const emit = defineEmits(['toggle', 'toggle-out', 'toggle-back', 'cycle-prep'])

const mode = ref('concert')

const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const pad = (n) => String(n).padStart(2, '0')
const concertSet = computed(() => new Set(props.tourDates || []))
const outSet = computed(() => new Set(props.outDates || []))
const backSet = computed(() => new Set(props.backDates || []))
function isConcert(d) { return concertSet.value.has(d) }
function isOut(d) { return outSet.value.has(d) }
function isBack(d) { return backSet.value.has(d) }

// Matériel "sorti" : à une date donnée, nb de départs (≤ d) > nb de retours (≤ d).
// On teinte les jours intermédiaires (les jours de départ/retour portent déjà la flèche).
function inRange(d) {
  if (isOut(d) || isBack(d)) return false
  const outs = (props.outDates || []).filter(x => x <= d).length
  const backs = (props.backDates || []).filter(x => x <= d).length
  return outs > backs
}

// Anti-tap accidentel : si le doigt a bougé (scroll), on n'enregistre pas le clic
let touchStartY = 0
let touchMoved = false
function onTouchStart(e) { touchStartY = e.touches[0].clientY; touchMoved = false }
function onTouchMove(e) { if (Math.abs(e.touches[0].clientY - touchStartY) > 8) touchMoved = true }

// Fenêtre "matériel sorti" ouverte à la date d : plus de chargements que de déchargements (≤ d)
function windowOpenAt(d) {
  const outs = (props.outDates || []).filter(x => x <= d).length
  const backs = (props.backDates || []).filter(x => x <= d).length
  return outs > backs
}

function onDayClick(cell) {
  if (!props.editable) return
  if (touchMoved) { touchMoved = false; return }
  if (mode.value === 'out') emit('toggle-out', cell)
  else if (mode.value === 'back') emit('toggle-back', cell)
  else if (mode.value === 'prep') emit('cycle-prep', cell)
  else {
    // Show : ajout autorisé seulement si une fenêtre chargement→déchargement est ouverte
    // (s'il n'y a aucun chargement, Show reste libre). La suppression est toujours permise.
    const adding = !isConcert(cell)
    if (adding && (props.outDates || []).length && !windowOpenAt(cell)) return
    emit('toggle', cell)
  }
}

const months = computed(() => {
  // Mois de départ : le plus tôt entre prépa / 1ʳᵉ sortie / 1ʳᵉ date / aujourd'hui
  const candidates = [props.prepDate, ...Object.keys(props.prepDays || {}), ...(props.outDates || []), ...(props.tourDates || [])].filter(Boolean).sort()
  const start = candidates[0] ? new Date(candidates[0] + 'T00:00:00') : new Date()
  let y = start.getFullYear()
  let mo = start.getMonth()
  const list = []
  for (let k = 0; k < 9; k++) {
    const year = y + Math.floor((mo + k) / 12)
    const month = (mo + k) % 12
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWd = (new Date(year, month, 1).getDay() + 6) % 7 // Lundi = 0
    const cells = []
    for (let i = 0; i < firstWd; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`)
    list.push({ key: `${year}-${month}`, label: `${monthNames[month]} ${year}`, cells })
  }
  return list
})
</script>

<style scoped>
.tour-cal {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cal-modes {
  display: flex;
  gap: 6px;
  padding: 4px 2px 8px;
}
.cal-mode {
  flex: 1;
  padding: 7px 4px;
  border: 2px solid var(--border-light, #ccc);
  border-radius: 8px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.cal-mode { flex: 1 1 calc(50% - 3px); }
.cal-mode.concert.active { border-color: #22c55e; background: #22c55e; color: #fff; }
.cal-mode.prep.active { border-color: #ea580c; background: #ea580c; color: #fff; }
.cal-mode.out.active { border-color: #3b82f6; background: #3b82f6; color: #fff; }
.cal-mode.back.active { border-color: #15803d; background: #15803d; color: #fff; }
.cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 4px;
  font-size: 11px;
  font-weight: 700;
}
.lg-concert { color: #22c55e; }
.lg-out { color: #3b82f6; }
.lg-range { color: #93c5fd; }
.lg-back { color: #22c55e; }
.lg-prep { color: #f59e0b; }
.cal-hint { font-size: 10px; color: var(--text-muted, #999); padding: 0 4px 4px; font-style: italic; }
.cal-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.cal-month { margin-bottom: 16px; }
.cal-month-title {
  font-size: 15px;
  font-weight: 800;
  text-align: center;
  margin: 6px 0;
  text-transform: capitalize;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}
.cal-wd {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted, #999);
  padding-bottom: 2px;
}
.cal-cell { aspect-ratio: 1; }
.cal-day {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-light, #ddd);
  border-radius: 6px;
  background: var(--bg-card, #fafafa);
  color: var(--text, #333);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  min-width: auto;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Période matériel sorti (entre Sortie et Retour) */
.cal-day.in-range {
  background: rgba(96, 165, 250, 0.45);
  border-color: rgba(96, 165, 250, 0.7);
}
.cal-day.concert {
  background: #22c55e;
  border-color: #16a34a;
  color: #fff;
  font-weight: 800;
}
.cal-day.prep {
  border-color: #f59e0b;
  border-width: 2px;
}
.cal-day.disabled { cursor: default; }
/* Prépa : demi-cases bleues (haut / bas / pleine) */
.cal-prep {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(234, 88, 12, 0.6);
  z-index: 0;
  pointer-events: none;
  border-radius: 5px;
}
.cal-prep.prep-top { top: 0; height: 50%; border-radius: 5px 5px 0 0; }
.cal-prep.prep-bottom { bottom: 0; height: 50%; border-radius: 0 0 5px 5px; }
.cal-prep.prep-full { top: 0; height: 100%; }
/* Flèches Chargement (→) / Déchargement (←) — bien voyantes sur fond sombre */
.cal-arrow {
  position: absolute;
  top: 0;
  z-index: 2;
  font-size: 19px;
  font-weight: 900;
  line-height: 1;
  -webkit-text-stroke: 1px currentColor;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.85), 0 1px 2px rgba(0, 0, 0, 0.7);
}
.cal-arrow.out { left: 2px; color: #60a5fa; }
.cal-arrow.back { right: 2px; color: #22c55e; }
.cal-arrow.pos-top { top: 0; bottom: auto; }
.cal-arrow.pos-bottom { bottom: 0; top: auto; }
.cal-day.concert .cal-arrow { text-shadow: 0 0 3px rgba(0, 0, 0, 0.9); }
.cal-num { margin-top: 0; position: relative; z-index: 1; }
</style>
