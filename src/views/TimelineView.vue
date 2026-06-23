<template>
  <div class="timeline-view">
    <div class="tl-head">
      <div class="tl-title-row">
        <button class="page-switch" @click="router.push('/MasterAffaire')">← Master Affaire</button>
        <h2>Timeline</h2>
      </div>
      <div class="tl-zoom">
        <button @click="setZoom(dayPx - 6)" title="Dézoomer">−</button>
        <button @click="scrollToToday" title="Aujourd'hui">Aujourd'hui</button>
        <button @click="setZoom(dayPx + 6)" title="Zoomer">+</button>
      </div>
    </div>

    <div v-if="!affairs.length" class="tl-empty">Aucune affaire à afficher</div>

    <div v-else ref="scroller" class="tl-scroll">
      <div class="tl-inner" :style="{ width: totalWidth + 'px' }">
        <!-- En-têtes mois -->
        <div class="tl-months">
          <div v-for="m in months" :key="m.key" class="tl-month" :style="{ left: m.left + 'px', width: m.width + 'px' }">{{ m.label }}</div>
        </div>
        <!-- En-têtes jours -->
        <div class="tl-days">
          <div v-for="(d, i) in days" :key="i" class="tl-day" :class="{ wkend: d.weekend, today: d.iso === todayIso }" :style="{ left: i * dayPx + 'px', width: dayPx + 'px' }">{{ d.num }}</div>
        </div>

        <!-- Ligne du jour -->
        <div v-if="todayLeft >= 0" class="tl-today-line" :style="{ left: todayLeft + 'px' }"></div>

        <!-- Lignes (lanes) d'affaires -->
        <div class="tl-lanes" :style="{ height: lanes.length * laneH + 'px' }">
          <div
            v-for="bar in bars"
            :key="bar.affairid"
            class="tl-bar"
            :class="{ sel: selected && selected.affairid === bar.affairid }"
            :style="{ left: bar.left + 'px', width: bar.width + 'px', top: bar.lane * laneH + 4 + 'px' }"
            @click="select(bar.affair)"
          >
            <!-- segments colorés -->
            <div v-for="(seg, si) in bar.segments" :key="si" class="tl-seg" :class="seg.type" :style="{ left: seg.left + 'px', width: seg.width + 'px' }"></div>
            <span class="tl-bar-label">{{ bar.affair.name || '(Sans nom)' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Légende -->
    <div class="tl-legend">
      <span class="lg"><i class="sw prep"></i> Prépa</span>
      <span class="lg"><i class="sw out"></i> Chargement</span>
      <span class="lg"><i class="sw show"></i> Show</span>
      <span class="lg"><i class="sw back"></i> Déchargement</span>
    </div>

    <!-- Détail de l'affaire sélectionnée -->
    <div v-if="selected" class="tl-detail" @click="openFullDetail">
      <div class="tl-detail-head">
        <span class="tl-detail-name">{{ selected.name || '(Sans nom)' }}</span>
        <button class="tl-detail-close" @click.stop="selected = null">✕</button>
      </div>
      <div class="tl-detail-meta">
        <span v-if="selected.event_type" class="tl-chip">{{ selected.event_type }}</span>
        <span v-if="selected.city">📍 {{ selected.city }}</span>
        <span v-if="selected.venue">🏛 {{ selected.venue }}</span>
      </div>
      <div class="tl-detail-dates">
        <div v-if="selected.prep_date">🔧 Prépa : {{ fmt(selected.prep_date) }}</div>
        <div v-if="selected.receipt_date">📦 Chargement : {{ fmt(selected.receipt_date) }}</div>
        <div v-if="selected.return_date">↩ Déchargement : {{ fmt(selected.return_date) }}</div>
      </div>
      <div class="tl-open-hint">👆 Ouvrir la fiche complète</div>
      <div class="tl-detail-people">
        <span v-if="selected.front" class="tl-person"><i class="dot facade"></i>{{ selected.tech_name || '?' }}</span>
        <span v-if="selected.monitor" class="tl-person"><i class="dot retour"></i>{{ selected.tech_name_monitor || '?' }}</span>
        <span v-if="selected.system" class="tl-person"><i class="dot systeme"></i>{{ selected.tech_name_system || '?' }}</span>
        <span v-if="selected.stage" class="tl-person"><i class="dot scene"></i>{{ selected.tech_name_stage || '?' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
function openFullDetail() {
  if (selected.value) router.push({ path: '/MasterAffaire', query: { affair: selected.value.affairid } })
}

const catalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || null
const affairs = ref([])
const selected = ref(null)
const dayPx = ref(26)
const laneH = 30
const scroller = ref(null)

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const pad = (n) => String(n).padStart(2, '0')
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const todayIso = iso(new Date())
function parse(s) { return s ? new Date(s + 'T00:00:00') : null }
function fmt(s) { const d = parse(s); return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : '' }

onMounted(async () => {
  let q = supabase.from('affair').select('*').is('deleted_at', null)
  if (catalogId) q = q.eq('catalog_id', catalogId)
  const { data } = await q
  affairs.value = data || []
  await nextTick()
  scrollToToday()
})

// Bornes temporelles de chaque affaire
function affairStart(a) {
  const cands = [a.prep_date, a.receipt_date, ...(a.out_dates || []), ...(a.tour_dates || [])].filter(Boolean).sort()
  return cands[0] || a.receipt_date || a.prep_date || todayIso
}
function affairEnd(a) {
  const cands = [a.return_date, a.receipt_date, ...(a.back_dates || []), ...(a.tour_dates || [])].filter(Boolean).sort()
  return cands[cands.length - 1] || a.receipt_date || todayIso
}

const range = computed(() => {
  const starts = affairs.value.map(affairStart).filter(Boolean).sort()
  const ends = affairs.value.map(affairEnd).filter(Boolean).sort()
  let start = starts[0] ? parse(starts[0]) : new Date()
  let end = ends[ends.length - 1] ? parse(ends[ends.length - 1]) : new Date()
  start.setDate(start.getDate() - 5)
  end.setDate(end.getDate() + 5)
  // inclure aujourd'hui
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

// Empilage : affecter chaque affaire à une "lane" libre
const layout = computed(() => {
  const sorted = [...affairs.value].sort((a, b) => (affairStart(a) < affairStart(b) ? -1 : 1))
  const laneEnds = [] // index de fin (jour) par lane
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
  // segments relatifs au début de la barre
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

function select(a) { selected.value = selected.value?.affairid === a.affairid ? null : a }
function setZoom(px) { dayPx.value = Math.max(10, Math.min(60, px)) }
function scrollToToday() {
  const el = scroller.value
  if (!el) return
  const i = dayIndex(todayIso)
  el.scrollLeft = Math.max(0, i * dayPx.value - el.clientWidth / 3)
}
</script>

<style scoped>
.timeline-view { padding: 8px; }
.tl-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.tl-title-row { display: flex; align-items: center; gap: 10px; }
.tl-head h2 { font-size: 18px; margin: 0; }
.page-switch {
  padding: 6px 12px; border: 1px solid var(--color1); border-radius: 8px;
  background: var(--color1-light, #e8f5e9); color: var(--color1-dark, #2e7d32);
  font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; white-space: nowrap;
}
.tl-zoom { display: flex; gap: 6px; }
.tl-zoom button {
  padding: 5px 10px; border: 1px solid var(--border-light, #ccc); border-radius: 8px;
  background: var(--bg-card, #f5f5f5); color: var(--text, #333); font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto;
}
.tl-empty { text-align: center; color: var(--text-muted, #999); padding: 30px; }
.tl-scroll { overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; border: 1px solid var(--border-light, #ddd); border-radius: 8px; }
.tl-inner { position: relative; padding-top: 40px; min-height: 120px; }
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
.tl-seg { position: absolute; top: 0; bottom: 0; opacity: 0.85; }
.tl-seg.prep { background: #ea580c; }
.tl-seg.out { background: rgba(59,130,246,0.4); }
.tl-seg.show { background: #22c55e; }
.tl-seg.back { background: #15803d; }
.tl-bar-label { position: relative; z-index: 1; font-size: 11px; font-weight: 700; color: #111; padding: 0 6px; white-space: nowrap; text-shadow: 0 0 3px rgba(255,255,255,0.8); }
.tl-legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; font-size: 11px; font-weight: 600; }
.tl-legend .sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: middle; margin-right: 3px; }
.sw.prep { background: #ea580c; } .sw.out { background: rgba(59,130,246,0.6); } .sw.show { background: #22c55e; } .sw.back { background: #15803d; }
.tl-detail { margin-top: 12px; border: 1.5px solid var(--color1); border-radius: 10px; padding: 12px; background: var(--bg-card, #fafafa); cursor: pointer; }
.tl-open-hint { font-size: 11px; color: var(--color1-dark, #2e7d32); font-weight: 700; margin-top: 8px; }
.tl-detail-head { display: flex; justify-content: space-between; align-items: center; }
.tl-detail-name { font-size: 16px; font-weight: 800; }
.tl-detail-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: var(--text, #333); box-shadow: none; min-width: auto; }
.tl-detail-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--text-light, #888); margin: 6px 0; }
.tl-chip { background: var(--color1); color: #fff; border-radius: 10px; padding: 1px 8px; font-weight: 700; }
.tl-detail-dates { font-size: 13px; line-height: 1.6; }
.tl-detail-people { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; font-size: 13px; font-weight: 600; }
.tl-person .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
.dot.facade { background: #3b82f6; } .dot.retour { background: #f59e0b; } .dot.systeme { background: #8b5cf6; } .dot.scene { background: #22c55e; }
</style>
