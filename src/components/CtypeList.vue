<template>
  <div class="ctype-list">
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
      <div class="cable-cts">
        <div
          v-for="i in 7"
          :key="'ct'+i"
          class="ct-cell"
          :class="{ disabled: cable.cableid !== activeCableId }"
          @mousedown="startPress(cable, i, $event)"
          @mouseup="endPress(cable, i, $event)"
          @mouseleave="cancelPress"
          @touchstart="startPress(cable, i, $event)"
          @touchend="endPress(cable, i, $event)"
          @touchcancel="cancelPress"
        >
          <span class="ct-value" :class="{ active: getCount(cable.cableid, i) > 0 }">
            {{ getCount(cable.cableid, i) > 0 ? getCount(cable.cableid, i) : '--' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Séparateur + câbles inactifs en mode solo -->
    <template v-if="soloMode && !soloFilter && inactiveCables.length > 0">
      <div class="solo-separator"></div>
      <div
        v-for="(cable, rowIdx) in inactiveCables"
        :key="cable.cableid"
        class="cable-row row-inactive"
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
        <div class="cable-cts">
          <div
            v-for="i in 7"
            :key="'ct'+i"
            class="ct-cell"
            :class="{ disabled: cable.cableid !== activeCableId }"
            @mousedown="startPress(cable, i, $event)"
            @mouseup="endPress(cable, i, $event)"
            @mouseleave="cancelPress"
            @touchstart="startPress(cable, i, $event)"
            @touchend="endPress(cable, i, $event)"
            @touchcancel="cancelPress"
          >
            <span class="ct-value" :class="{ active: getCount(cable.cableid, i) > 0 }">
              {{ getCount(cable.cableid, i) > 0 ? getCount(cable.cableid, i) : '--' }}
            </span>
          </div>
        </div>
        <div class="cable-total">
          {{ getRowTotal(cable.cableid) || '' }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  activeCableId: { default: null },
  subtractMode: { type: Boolean, default: false },
  soloMode: { type: Boolean, default: false },
  soloFilter: { type: Number, default: null },
  incrementStep: { type: Number, default: 1 },
  counts: { type: Object, default: () => ({}) },
  readOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['updated', 'select', 'longpress'])

function hasAnyValue(cableid) {
  if (props.soloFilter) {
    return (props.counts[cableid]?.[props.soloFilter] || 0) > 0
  }
  return getRowTotal(cableid) > 0
}

const activeCables = computed(() => props.cables.filter(c => hasAnyValue(c.cableid)))
const inactiveCables = computed(() => props.cables.filter(c => !hasAnyValue(c.cableid)))
const displayedCables = computed(() => {
  if (!props.soloMode) return props.cables
  return activeCables.value
})

let usedTouch = false
let namePressTimer = null
let nameDidLongPress = false

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

function getCount(cableid, ctIndex) {
  return props.counts[cableid]?.[ctIndex] || 0
}

function getRowTotal(cableid) {
  const row = props.counts[cableid]
  if (!row) return 0
  return Object.values(row).reduce((sum, v) => sum + v, 0)
}

let didLongPress = false

function startPress(cable, ctIndex, e) {
  if (props.readOnly) return
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (cable.cableid !== props.activeCableId) {
    emit('select', cable.cableid)
    didLongPress = true
    return
  }
  didLongPress = false
}

function endPress(cable, ctIndex, e) {
  if (props.readOnly) return
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (cable.cableid !== props.activeCableId) return
  if (!didLongPress) {
    const current = getCount(cable.cableid, ctIndex)
    let newVal
    if (props.subtractMode) {
      newVal = Math.max(0, current - props.incrementStep)
    } else {
      newVal = current + props.incrementStep
    }
    emit('updated', { cableid: cable.cableid, ctIndex, count: newVal })
  }
}

function cancelPress() {}

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
.ctype-list {
  width: 100%;
}
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
  background: transparent;
  border-radius: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
  color: #fff;
}
.cable-row.row-active .ct-cell {
  border: 1.5px solid var(--color1);
}
.cable-row.row-active .cable-name {
  border: 1.5px solid var(--color1);
  border-radius: 6px;
  font-weight: 800;
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
  padding: 4px 6px;
  color: #fff !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.cable-cts {
  display: flex;
  gap: 0;
}
.ct-cell {
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
.cable-row:not(.row-band) .ct-cell {
  background: #ebebeb;
}
.ct-cell.disabled {
  cursor: default;
  opacity: 0.5;
}
.ct-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
  pointer-events: none;
}
.ct-value.active {
  color: #2c3e50;
  font-weight: bold;
}
.cable-total {
  width: 28px;
  min-width: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
}
.solo-separator {
  height: 2px;
  background: #ddd;
  margin: 10px 0;
}
.row-inactive {
  opacity: 0.5;
}
@media (min-width: 768px) {
  .cable-name {
    width: 200px;
    min-width: 200px;
    font-size: 17px;
  }
  .ct-cell {
    width: 44px;
    height: 40px;
    margin: 0 1px;
  }
  .ct-value {
    font-size: 18px;
  }
}
</style>
