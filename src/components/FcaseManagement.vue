<template>
  <div class="fcase-list">
    <div
      v-for="(cable, rowIdx) in selectedCables"
      :key="cable.cableid"
      class="cable-row"
      :class="{ 'row-active': cable.cableid == activeCableId, 'row-band': rowIdx % 2 === 0, 'flash-red': overLimitCableId === cable.cableid }"
    >
      <div
        class="cable-name"
        :style="{ borderLeft: `4px solid ${colorForType(cable.type)}` }"
        @mousedown="startNamePress(cable, $event)"
        @mouseup="endNamePress(cable, $event)"
        @mouseleave="cancelNamePress"
        @touchstart="startNamePress(cable, $event)"
        @touchend="endNamePress(cable, $event)"
        @touchcancel="cancelNamePress"
      >
        {{ cable.name }}
      </div>
      <div class="cable-fcs">
        <div
          v-for="(field, idx) in fcFields"
          :key="field"
          class="fc-cell"
          :class="{ disabled: cable.cableid !== activeCableId, 'col-even': idx % 2 === 1 }"
          @mousedown="startPress(cable, field, $event)"
          @mouseup="endPress(cable, field, $event)"
          @mouseleave="cancelPress"
          @touchstart="startPress(cable, field, $event)"
          @touchend="endPress(cable, field, $event)"
          @touchcancel="cancelPress"
        >
          <span class="fc-value" :class="{ active: cable[field] > 0 }">
            {{ cable[field] > 0 ? cable[field] : '--' }}
          </span>
        </div>
      </div>
      <div class="cable-total" :class="{ done: !directMode && getRemaining(cable) <= 0 }">
        {{ directMode ? getDistributed(cable) || '' : getRemaining(cable) }}
      </div>
    </div>
    <div v-if="selectedCables.length === 0" class="empty">
      {{ directMode ? 'Aucun câble disponible.' : 'Aucun câble sélectionné.' }}
    </div>
    <div v-else class="summary">
      <template v-if="directMode">
        <span>{{ distributedCount }} câbles au total</span>
      </template>
      <template v-else>
        <span :class="{ allDone: allDistributed }">
          {{ allDistributed ? 'Tous les câbles sont rangés !' : `${distributedCount} / ${totalCables} rangés` }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  activeCableId: { default: null },
  directMode: { type: Boolean, default: false },
  visibleFc: { type: Number, default: 6 },
  subtractMode: { type: Boolean, default: false },
  incrementStep: { type: Number, default: 1 },
  soloMode: { type: Boolean, default: false },
  soloFilter: { type: Number, default: null },
})

const emit = defineEmits(['updated', 'select', 'longpress'])

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
  }, 800)
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

const fcFields = ['tfc1', 'tfc2', 'tfc3', 'tfc4', 'tfc5', 'tfc6', 'tfc7']

function isEditable(cable) {
  return cable.cableid == props.activeCableId
}

function getZoneTotal(cable) {
  return (cable.spare_count || 0) +
    (cable.z1 || 0) + (cable.z2 || 0) + (cable.z3 || 0) +
    (cable.z4 || 0) + (cable.z5 || 0) + (cable.z6 || 0)
}

function hasFcValue(cable) {
  if (props.soloFilter) {
    return (cable[`tfc${props.soloFilter}`] || 0) > 0
  }
  return fcFields.reduce((sum, f) => sum + (cable[f] || 0), 0) > 0
}

const selectedCables = computed(() => {
  if (props.directMode) {
    if (props.soloMode) return props.cables.filter(c => hasFcValue(c))
    return props.cables
  }
  return props.cables.filter(c => getZoneTotal(c) > 0 || c.count > 0)
})

function getDistributed(cable) {
  return fcFields.reduce((sum, f) => sum + (cable[f] || 0), 0)
}

function getCableTotal(cable) {
  const zoneTotal = getZoneTotal(cable)
  return zoneTotal > 0 ? zoneTotal : cable.count
}

function getRemaining(cable) {
  return getCableTotal(cable) - getDistributed(cable)
}

const totalCables = computed(() =>
  selectedCables.value.reduce((sum, c) => sum + getCableTotal(c), 0)
)

const distributedCount = computed(() =>
  selectedCables.value.reduce((sum, c) => sum + Math.min(getDistributed(c), getCableTotal(c)), 0)
)

const allDistributed = computed(() =>
  selectedCables.value.length > 0 && selectedCables.value.every(c => getRemaining(c) <= 0)
)

const LONG_PRESS_DELAY = 400
const REPEAT_INTERVAL = 200
let pressTimer = null
let repeatTimer = null
let didLongPress = false

function startPress(cable, field, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (!isEditable(cable)) {
    emit('select', cable.cableid)
    didLongPress = true
    return
  }
  didLongPress = false
  pressTimer = setTimeout(() => {
    didLongPress = true
    doDecrement(cable, field)
    repeatTimer = setInterval(() => {
      doDecrement(cable, field)
    }, REPEAT_INTERVAL)
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
      // Vérifier si on a atteint la limite (mode non-direct)
      if (!props.directMode && getRemaining(cable) <= 0) {
        flashOverLimit(cable)
        return
      }
      cable[field] = (cable[field] || 0) + props.incrementStep
      emit('updated', cable)
    }
  }
}

const overLimitCableId = ref(null)
function flashOverLimit(cable) {
  overLimitCableId.value = cable.cableid
  setTimeout(() => {
    overLimitCableId.value = null
  }, 500)
}

function cancelPress() {
  clearTimeout(pressTimer)
  clearInterval(repeatTimer)
  pressTimer = null
  repeatTimer = null
}

function colorForType(type) {
  const colors = {
    speaker: 'var(--color1)', electrical: '#f3e309', microphone: '#eb910a',
    module: '#3b82f6', special: '#ef4444', other: '#8b5cf6',
    c_type: '#06b6d4', accessory: '#84cc16', digital: '#f97316',
  }
  return colors[type] || '#ccc'
}
</script>

<style scoped>
.fcase-list {
  width: 100%;
}
.cable-row {
  display: flex;
  align-items: center;
  padding: 6px 2px 6px 4px;
  background: #fff;
  transition: background 0.15s;
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
.cable-row:not(.row-band) .fc-cell {
  background: #ebebeb;
}
.cable-row.row-active .fc-cell {
  border: 1.5px solid var(--color1);
}
.cable-row.row-active .cable-name {
  border: 1.5px solid var(--color1);
  border-radius: 6px;
}
.cable-name {
  width: 120px;
  min-width: 120px;
  position: sticky;
  left: 0;
  z-index: 1;
  background: inherit;
  text-align: left;
  font-size: 15px;
  font-weight: 700;
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.row-active .cable-name {
  color: var(--color1-dark);
  font-weight: 800;
}
.cable-total {
  width: 28px;
  min-width: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
  border-radius: 4px;
  transition: all 0.3s;
}
.cable-total.done {
  background: var(--color1);
  color: white;
}
.cable-fcs {
  display: flex;
  gap: 0;
}
.fc-cell {
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
  transition: background 0.15s, transform 0.1s;
}
.fc-cell.disabled {
  cursor: default;
  opacity: 0.5;
}
.fc-cell:not(.disabled):hover {
  background: var(--color1-light);
}
.fc-cell:not(.disabled):active {
  transform: scale(0.95);
}
.fc-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
  pointer-events: none;
}
.fc-value.active {
  color: #2c3e50;
  font-weight: bold;
}
.empty {
  padding: 15px;
  color: #999;
  font-size: 14px;
  font-style: italic;
  text-align: center;
}
.summary {
  padding: 8px;
  text-align: center;
  font-size: 14px;
  color: #666;
}
.allDone {
  color: var(--color1);
  font-weight: bold;
}
.flash-red {
  animation: flashRed 0.5s ease;
}
@keyframes flashRed {
  0% { background: #fff; }
  25% { background: #fecaca; }
  50% { background: #ef4444; }
  75% { background: #fecaca; }
  100% { background: #fff; }
}
@media (min-width: 768px) {
  .cable-name {
    width: 200px;
    min-width: 200px;
    font-size: 17px;
  }
  .fc-cell {
    width: 44px;
    height: 40px;
    margin: 0 1px;
  }
  .fc-value {
    font-size: 18px;
  }
  .cable-total {
    width: 40px;
    min-width: 40px;
    font-size: 17px;
  }
}
</style>
