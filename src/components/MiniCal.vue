<template>
  <div v-if="days.length" class="mini-cal">
    <div v-for="d in visibleDays" :key="d.date" class="mini-cal-day">
      <span class="mcd-month">{{ d.showMonth ? d.month : '' }}</span>
      <span class="mcd-dow">{{ dowLetter(d.date) }}</span>
      <span class="mcd-num">{{ dayNum(d.date) }}</span>
      <span class="mcd-bars">
        <span v-for="(m, i) in d.marks" :key="i" class="mcd-mark" :title="EVENT_LABELS[m.type] + periodSuffix(m.period)">
          <span v-if="isArrowType(m.type)" class="mcd-arrow" :style="{ color: EVENT_COLORS[m.type] }">{{ arrowFor(m.type, m.period) }}</span>
          <span v-else class="mcd-bar" :style="{ background: EVENT_COLORS[m.type] }"></span>
        </span>
      </span>
    </div>
    <div v-if="hasMore" class="mcd-more" title="… et d'autres dates ensuite">…</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  affair: { type: Object, default: null },
  upcomingOnly: { type: Boolean, default: false }, // n'afficher qu'à partir d'aujourd'hui
  max: { type: Number, default: 0 }, // 0 = toutes ; sinon limite + « … »
})
const visibleDays = computed(() => props.max > 0 ? days.value.slice(0, props.max) : days.value)
const hasMore = computed(() => props.max > 0 && days.value.length > props.max)

const EVENT_COLORS = { prep: '#ea580c', out: '#3b82f6', show: '#22c55e', back: '#15803d' }
const EVENT_LABELS = { prep: 'Prépa', out: 'Chargement', show: 'Concert', back: 'Déchargement' }
// ︎ force le rendu TEXTE (flèche fine) au lieu d'un emoji « badge » épais sur mobile (iOS)
function arrowFor(type, period) {
  const v = '\uFE0E'
  if (type === 'out') return (period === 'am' ? '↘' : period === 'pm' ? '↗' : '→') + v
  if (type === 'back') return (period === 'am' ? '↙' : period === 'pm' ? '↖' : '←') + v
  return ''
}
function isArrowType(t) { return t === 'out' || t === 'back' }
function periodSuffix(p) { return p === 'am' ? ' (matin ↓)' : p === 'pm' ? ' (après-midi ↑)' : '' }
function dowLetter(d) { return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(d + 'T00:00:00').getDay()] }
function dayNum(d) { return parseInt(d.slice(8, 10), 10) }
const MONTHS_ABBR = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']

// Tout l'événement : prépa + chargement + concert + déchargement
const days = computed(() => {
  const a = props.affair
  if (!a) return []
  const map = {}
  const add = (d, t, period) => {
    if (!d) return
    map[d] = map[d] || []
    if (!map[d].some(m => m.type === t)) map[d].push({ type: t, period: period || null })
  }
  const pk = Object.keys(a.prep_days || {})
  if (pk.length) pk.forEach(d => add(d, 'prep')); else add(a.prep_date, 'prep')
  const out = a.out_dates || [], op = a.out_periods || {}
  if (out.length) out.forEach(d => add(d, 'out', op[d])); else add(a.receipt_date, 'out')
  ;(a.tour_dates || []).forEach(d => add(d, 'show'))
  const back = a.back_dates || [], bp = a.back_periods || {}
  if (back.length) back.forEach(d => add(d, 'back', bp[d])); else add(a.return_date, 'back')
  let all = Object.keys(map).filter(Boolean).sort().map(d => ({ date: d, marks: map[d] }))
  if (props.upcomingOnly) {
    // À partir d'aujourd'hui (repli sur tout si l'événement est entièrement passé)
    const today = new Date().toISOString().slice(0, 10)
    const upcoming = all.filter(x => x.date >= today)
    all = upcoming.length ? upcoming : all
  }
  // Libellé de mois : affiché au 1er jour et à chaque changement de mois
  let prevM = null
  return all.map(d => {
    const m = parseInt(d.date.slice(5, 7), 10) - 1
    const showMonth = m !== prevM
    prevM = m
    return { ...d, month: MONTHS_ABBR[m], showMonth }
  })
})
</script>

<style scoped>
.mini-cal { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0; }
.mini-cal-day { display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 30px; padding: 3px 2px; }
.mcd-month { font-size: 9px; font-weight: 800; color: var(--color1, #6b46c1); text-transform: uppercase; min-height: 11px; line-height: 1; }
.mcd-dow { font-size: 9px; font-weight: 700; color: var(--text, #cbd5e1); opacity: 0.85; text-transform: uppercase; }
.mcd-num { font-size: 15px; font-weight: 800; color: var(--text, #333); line-height: 1; }
.mcd-bars { display: flex; align-items: center; gap: 3px; margin-top: 2px; height: 18px; }
.mcd-mark { display: flex; align-items: center; }
.mcd-bar { width: 7px; height: 7px; border-radius: 2px; }
.mcd-arrow { font-size: 22px; font-weight: 900; line-height: 1; -webkit-text-stroke: 0.5px currentColor; }
.mcd-more { align-self: center; font-size: 18px; font-weight: 800; color: var(--text-muted, #999); padding: 0 4px; }
</style>
