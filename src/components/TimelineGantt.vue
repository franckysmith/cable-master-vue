<template>
  <div class="tl-gantt">
    <div class="tl-bar-head">
      <button class="tl-hidden-toggle" :class="{ active: showHidden }" @click="showHidden = !showHidden">
        {{ showHidden ? '👁 Masqués' : 'Masqués' }}
      </button>
      <span class="tl-hint">↔ naviguer · ↕ zoomer</span>
    </div>

    <div v-if="!shown.length" class="tl-empty">Aucune affaire à afficher</div>

    <div v-else ref="scroller" class="tl-scroll">
      <div class="tl-inner" :style="{ width: totalWidth + 'px' }">
        <div class="tl-months">
          <div v-for="m in months" :key="m.key" class="tl-month" :style="{ left: m.left + 'px', width: m.width + 'px' }">{{ m.label }}</div>
        </div>
        <div class="tl-days">
          <div v-for="(d, i) in days" :key="i" class="tl-day" :class="{ wkend: d.weekend, today: d.iso === todayIso }" :style="{ left: i * dayPx + 'px', width: dayPx + 'px' }">{{ d.num }}</div>
        </div>
        <div v-if="todayLeft >= 0" class="tl-today-line" :style="{ left: todayLeft + 'px' }"></div>
        <div class="tl-lanes" :style="{ height: lanes.length * laneH + 'px' }">
          <div
            v-for="bar in bars"
            :key="bar.affairid"
            class="tl-bar"
            :class="{ sel: selectedId === bar.affairid, dim: bar.affair.hidden }"
            :style="{ left: bar.left + 'px', width: bar.width + 'px', top: bar.lane * laneH + 4 + 'px' }"
            @click="$emit('select', bar.affair)"
          >
            <div v-for="(seg, si) in bar.segments" :key="si" class="tl-seg" :class="seg.type" :style="{ left: seg.left + 'px', width: seg.width + 'px' }"></div>
            <span class="tl-bar-label">{{ bar.affair.name || '(Sans nom)' }}</span>
            <button v-if="showHidden" class="tl-bar-hide" @click.stop="toggleHidden(bar.affair)" :title="bar.affair.hidden ? 'Réafficher' : 'Masquer'">{{ bar.affair.hidden ? '−' : '+' }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="tl-legend">
      <span class="lg"><i class="sw prep"></i> Prépa</span>
      <span class="lg"><i class="sw out"></i> Chargement</span>
      <span class="lg"><i class="sw show"></i> Show</span>
      <span class="lg"><i class="sw back"></i> Déchargement</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '../lib/supabase'

defineProps({ selectedId: { type: Number, default: null } })
defineEmits(['select'])

const catalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || null
const affairs = ref([])
const showHidden = ref(false)
const dayPx = ref(26)
const laneH = 30
const scroller = ref(null)

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const pad = (n) => String(n).padStart(2, '0')
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const todayIso = iso(new Date())
function parse(s) { return s ? new Date(s + 'T00:00:00') : null }

const shown = computed(() => showHidden.value ? affairs.value : affairs.value.filter(a => !a.hidden))

async function toggleHidden(a) {
  const nv = !a.hidden
  a.hidden = nv
  await supabase.from('affair').update({ hidden: nv }).eq('affairid', a.affairid)
}

onMounted(async () => {
  let q = supabase.from('affair').select('*').is('deleted_at', null)
  if (catalogId) q = q.eq('catalog_id', catalogId)
  const { data } = await q
  affairs.value = data || []
  await nextTick()
  scrollToToday()
  const el = scroller.value
  if (el) {
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
  }
})
onUnmounted(() => {
  const el = scroller.value
  if (el) {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
  }
})

function affairStart(a) {
  const cands = [a.prep_date, a.receipt_date, ...(a.out_dates || []), ...(a.tour_dates || [])].filter(Boolean).sort()
  return cands[0] || a.receipt_date || a.prep_date || todayIso
}
function affairEnd(a) {
  const cands = [a.return_date, a.receipt_date, ...(a.back_dates || []), ...(a.tour_dates || [])].filter(Boolean).sort()
  return cands[cands.length - 1] || a.receipt_date || todayIso
}

const range = computed(() => {
  const starts = shown.value.map(affairStart).filter(Boolean).sort()
  const ends = shown.value.map(affairEnd).filter(Boolean).sort()
  let start = starts[0] ? parse(starts[0]) : new Date()
  let end = ends[ends.length - 1] ? parse(ends[ends.length - 1]) : new Date()
  start.setDate(start.getDate() - 5)
  end.setDate(end.getDate() + 5)
  const t = new Date()
  if (t < start) start = new Date(t)
  if (t > end) end = new Date(t)
  return { start, end }
})

const days = computed(() => {
  const out = []
  const d = new Date(range.value.start)
  while (d <= range.value.end) {
    out.push({ iso: iso(d), num: d.getDate(), weekend: d.getDay() === 0 || d.getDay() === 6 })
    d.setDate(d.getDate() + 1)
  }
  return out
})
const totalWidth = computed(() => days.value.length * dayPx.value)

function dayIndex(isoStr) {
  const d = parse(isoStr)
  if (!d) return -1
  return Math.round((d - range.value.start) / 86400000)
}
const todayLeft = computed(() => {
  const i = dayIndex(todayIso)
  return i >= 0 ? i * dayPx.value + dayPx.value / 2 : -1
})

const months = computed(() => {
  const res = []
  let i = 0
  while (i < days.value.length) {
    const d = parse(days.value[i].iso)
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    let j = i
    while (j < days.value.length && parse(days.value[j].iso).getMonth() === d.getMonth()) j++
    res.push({ key: label, label, left: i * dayPx.value, width: (j - i) * dayPx.value })
    i = j
  }
  return res
})

const layout = computed(() => {
  const sorted = [...shown.value].sort((a, b) => (affairStart(a) < affairStart(b) ? -1 : 1))
  const laneEnds = []
  const placed = []
  for (const a of sorted) {
    const s = dayIndex(affairStart(a))
    const e = dayIndex(affairEnd(a))
    let lane = laneEnds.findIndex(end => end < s)
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e) } else { laneEnds[lane] = e }
    placed.push({ affair: a, s, e, lane })
  }
  return { placed, laneCount: laneEnds.length }
})
const lanes = computed(() => Array.from({ length: layout.value.laneCount }))

const bars = computed(() => layout.value.placed.map(p => {
  const a = p.affair
  const left = p.s * dayPx.value
  const width = Math.max((p.e - p.s + 1) * dayPx.value, dayPx.value)
  const segs = []
  const segFor = (d1, d2, type) => {
    const i1 = dayIndex(d1), i2 = dayIndex(d2)
    if (i1 < 0 || i2 < 0) return
    segs.push({ type, left: (Math.min(i1, i2) - p.s) * dayPx.value, width: Math.max((Math.abs(i2 - i1) + 1) * dayPx.value, dayPx.value) })
  }
  if (a.prep_date && a.receipt_date) segFor(a.prep_date, a.receipt_date, 'prep')
  else if (a.prep_date) segFor(a.prep_date, a.prep_date, 'prep')
  if (a.receipt_date && a.return_date) segFor(a.receipt_date, a.return_date, 'out')
  ;(a.tour_dates || []).forEach(d => segFor(d, d, 'show'))
  if (a.return_date) segFor(a.return_date, a.return_date, 'back')
  return { affairid: a.affairid, affair: a, left, width, lane: p.lane, segments: segs }
}))

function scrollToToday() {
  const el = scroller.value
  if (!el) return
  const i = dayIndex(todayIso)
  el.scrollLeft = Math.max(0, i * dayPx.value - el.clientWidth / 3)
}

// Zoom au glissement vertical (l'horizontal reste le scroll natif via touch-action: pan-x)
let zStartY = 0, zStartX = 0, zStartPx = 0, zAnchorDay = 0, zFingerX = 0, zActive = false
function onTouchStart(e) {
  if (e.touches.length !== 1) return
  const el = scroller.value
  zStartY = e.touches[0].clientY
  zStartX = e.touches[0].clientX
  zStartPx = dayPx.value
  zActive = false
  if (el) {
    const rect = el.getBoundingClientRect()
    zFingerX = e.touches[0].clientX - rect.left
    zAnchorDay = (el.scrollLeft + zFingerX) / dayPx.value
  }
}
function onTouchMove(e) {
  if (e.touches.length !== 1) return
  const dy = e.touches[0].clientY - zStartY
  const dx = e.touches[0].clientX - zStartX
  if (!zActive) {
    if (Math.abs(dy) < 8) return
    if (Math.abs(dx) > Math.abs(dy)) return
    zActive = true
  }
  e.preventDefault()
  const newPx = Math.max(10, Math.min(60, zStartPx - dy * 0.15))
  dayPx.value = newPx
  const el = scroller.value
  if (el) nextTick(() => { el.scrollLeft = Math.max(0, zAnchorDay * newPx - zFingerX) })
}
</script>

<style scoped>
.tl-gantt { margin-bottom: 10px; }
.tl-bar-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.tl-hidden-toggle {
  padding: 6px 12px; border: 1px solid var(--border-light, #ccc); border-radius: 8px;
  background: var(--bg-card, #f5f5f5); color: var(--text, #333); font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto;
}
.tl-hidden-toggle.active { background: var(--color1); border-color: var(--color1); color: #fff; }
.tl-empty { text-align: center; color: var(--text-muted, #999); padding: 20px; }
.tl-scroll { overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid var(--border-light, #ddd); border-radius: 8px; touch-action: pan-x; }
.tl-inner { position: relative; padding-top: 40px; min-height: 100px; }
.tl-months { position: absolute; top: 0; left: 0; height: 20px; }
.tl-month { position: absolute; top: 0; height: 20px; font-size: 11px; font-weight: 800; color: var(--text-light, #888); text-transform: capitalize; padding-left: 4px; border-left: 1px solid var(--border-light, #eee); box-sizing: border-box; }
.tl-days { position: absolute; top: 20px; left: 0; height: 20px; }
.tl-day { position: absolute; top: 0; height: 20px; font-size: 10px; text-align: center; color: var(--text-muted, #999); box-sizing: border-box; }
.tl-day.wkend { background: rgba(127,127,127,0.08); }
.tl-day.today { color: #ef4444; font-weight: 800; }
.tl-today-line { position: absolute; top: 20px; bottom: 0; width: 2px; background: #ef4444; z-index: 3; }
.tl-lanes { position: relative; }
.tl-bar {
  position: absolute; height: 22px; border-radius: 6px; background: var(--bg-card, #eee);
  border: 1px solid var(--border-light, #ccc); overflow: hidden; cursor: pointer; display: flex; align-items: center;
}
.tl-bar.sel { outline: 2px solid var(--color1); z-index: 2; }
.tl-bar.dim { opacity: 0.45; }
.tl-bar-hide {
  position: absolute; right: 1px; top: 1px; z-index: 2;
  width: 18px; height: 18px; line-height: 1; border-radius: 4px;
  border: none; background: rgba(0,0,0,0.55); color: #fff; font-size: 14px; font-weight: 900;
  cursor: pointer; padding: 0; box-shadow: none; min-width: auto;
}
.tl-seg { position: absolute; top: 0; bottom: 0; opacity: 0.85; }
.tl-seg.prep { background: #ea580c; }
.tl-seg.out { background: rgba(59,130,246,0.4); }
.tl-seg.show { background: #22c55e; }
.tl-seg.back { background: #15803d; }
.tl-bar-label { position: relative; z-index: 1; font-size: 11px; font-weight: 700; color: #111; padding: 0 6px; white-space: nowrap; text-shadow: 0 0 3px rgba(255,255,255,0.8); }
.tl-hint { font-size: 10px; color: var(--text-muted, #999); font-style: italic; }
.tl-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 11px; font-weight: 600; }
.tl-legend .sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: middle; margin-right: 3px; }
.sw.prep { background: #ea580c; } .sw.out { background: rgba(59,130,246,0.6); } .sw.show { background: #22c55e; } .sw.back { background: #15803d; }
</style>
