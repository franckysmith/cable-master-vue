<template>
  <div class="tour-cal">
    <div class="cal-legend">
      <span class="lg lg-concert">● Concert</span>
      <span class="lg lg-prep">● Prépa</span>
      <span class="lg lg-out">● Sortie</span>
      <span class="lg lg-back">● Retour</span>
    </div>
    <div class="cal-scroll">
      <div v-for="m in months" :key="m.key" class="cal-month">
        <div class="cal-month-title">{{ m.label }}</div>
        <div class="cal-grid">
          <div v-for="d in weekdays" :key="d" class="cal-wd">{{ d }}</div>
          <div v-for="(cell, idx) in m.cells" :key="idx" class="cal-cell">
            <button
              v-if="cell"
              class="cal-day"
              :class="{
                concert: isConcert(cell),
                out: cell === receiptDate,
                back: cell === returnDate,
                prep: cell === prepDate,
                disabled: !editable,
              }"
              @click="editable && $emit('toggle', cell)"
            >{{ Number(cell.slice(-2)) }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tourDates: { type: Array, default: () => [] },
  receiptDate: { type: String, default: '' },
  returnDate: { type: String, default: '' },
  prepDate: { type: String, default: '' },
  editable: { type: Boolean, default: true },
})
defineEmits(['toggle'])

const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const pad = (n) => String(n).padStart(2, '0')
const set = computed(() => new Set(props.tourDates || []))
function isConcert(d) { return set.value.has(d) }

const months = computed(() => {
  // Mois de départ : le plus tôt entre prépa / sortie / aujourd'hui
  const candidates = [props.prepDate, props.receiptDate].filter(Boolean).sort()
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
.cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 6px 4px;
  font-size: 11px;
  font-weight: 700;
}
.lg-concert { color: #22c55e; }
.lg-prep { color: #f59e0b; }
.lg-out { color: #3b82f6; }
.lg-back { color: #8b5cf6; }
.cal-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.cal-month {
  margin-bottom: 16px;
}
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
.cal-cell {
  aspect-ratio: 1;
}
.cal-day {
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
.cal-day.out {
  border-color: #3b82f6;
  border-width: 2px;
}
.cal-day.back {
  border-color: #8b5cf6;
  border-width: 2px;
}
.cal-day.disabled {
  cursor: default;
}
</style>
