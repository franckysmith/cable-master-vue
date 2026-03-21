<template>
  <div class="cable-list">
    <div
      v-for="(cable, rowIdx) in displayedCables"
      :key="cable.cableid"
      class="cable-row"
      :class="{ 'row-active': cable.cableid == activeCableId, 'row-band': rowIdx % 2 === 0 }"
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
      <div class="cable-zones">
        <div
          v-for="(field, idx) in fields"
          :key="field"
          class="zone-cell"
          :class="{
            pressing: isDecrementing,
            disabled: cable.cableid !== activeCableId,
            'col-even': idx % 2 === 1,
            'col-spare': field === 'spare_count'
          }"
          @mousedown="startPress(cable, field, $event)"
          @mouseup="endPress(cable, field, $event)"
          @mouseleave="cancelPress"
          @touchstart="startPress(cable, field, $event)"
          @touchend="endPress(cable, field, $event)"
          @touchcancel="cancelPress"
        >
          <span class="zone-value" :class="{ active: cable[field] > 0 }">
            {{ cable[field] > 0 ? cable[field] : '--' }}
          </span>
        </div>
      </div>
      <div class="cable-total">
        {{ getTotal(cable) || '' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  activeCableId: { default: null },
  visibleZones: { type: Number, default: 6 },
  subtractMode: { type: Boolean, default: false },
  soloMode: { type: Boolean, default: false },
})

const displayedCables = computed(() => {
  if (!props.soloMode) return props.cables
  return props.cables.filter(c => getTotal(c) > 0)
})

const emit = defineEmits(['updated', 'select', 'longpress'])

let namePressTimer = null
let nameDidLongPress = false

function startNamePress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  nameDidLongPress = false
  namePressTimer = setTimeout(() => {
    nameDidLongPress = true
    emit('longpress', cable)
  }, 500)
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

const fields = ['spare_count', 'z1', 'z2', 'z3', 'z4', 'z5', 'z6']

const LONG_PRESS_DELAY = 400
const REPEAT_INTERVAL = 200

let pressTimer = null
let repeatTimer = null
let didLongPress = false
let usedTouch = false
const isDecrementing = ref(false)

function isEditable(cable) {
  return cable.cableid == props.activeCableId
}

function startPress(cable, field, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (!isEditable(cable)) return
  didLongPress = false
  isDecrementing.value = false

  pressTimer = setTimeout(() => {
    didLongPress = true
    isDecrementing.value = true
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
  isDecrementing.value = false

  if (!didLongPress) {
    if (props.subtractMode) {
      if ((cable[field] || 0) > 0) {
        cable[field] = cable[field] - 1
        emit('updated', cable)
      }
    } else {
      cable[field] = (cable[field] || 0) + 1
      emit('updated', cable)
    }
  }
}

function cancelPress() {
  clearTimeout(pressTimer)
  clearInterval(repeatTimer)
  pressTimer = null
  repeatTimer = null
  isDecrementing.value = false
}

function getTotal(cable) {
  return fields.reduce((sum, f) => sum + (cable[f] || 0), 0)
}

function colorForType(type) {
  const colors = {
    speaker: 'var(--color1)',
    electrical: '#f3e309',
    microphone: '#eb910a',
    module: '#3b82f6',
    special: '#ef4444',
    other: '#8b5cf6',
    c_type: '#06b6d4',
    accessory: '#84cc16',
    digital: '#f97316',
  }
  return colors[type] || '#ccc'
}
</script>

<style scoped>
.cable-list {
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
  background: #d5d5d5;
  border-radius: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.cable-row:not(.row-band) .zone-cell {
  background: #ebebeb;
}
.cable-row:not(.row-band) .zone-cell.col-spare {
  background: #f5e6d0;
}
.cable-row.row-active .zone-cell {
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
}
.cable-zones {
  display: flex;
  gap: 0;
}
.zone-cell {
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
.zone-cell.col-spare {
  background: #f0d9b5;
}
.zone-cell.disabled {
  cursor: default;
  opacity: 0.5;
}
.zone-cell:not(.disabled):hover {
  background: var(--color1-light);
}
.zone-cell:not(.disabled):active {
  transform: scale(0.95);
}
.zone-cell.pressing {
  background: #ffebee;
}
.zone-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
  pointer-events: none;
}
.zone-value.active {
  color: #2c3e50;
  font-weight: bold;
}
</style>
