<template>
  <div class="micro-list">
    <template v-for="([brand, cables]) in groupedMics" :key="brand">
      <div class="brand-header" @click="toggleGroup(brand)">
        <span class="brand-arrow">{{ closedGroups[brand] ? '▶' : '▼' }}</span>
        <span class="brand-name">{{ brand }}</span>
        <span class="brand-count">{{ cables.length }}</span>
      </div>
      <template v-if="!closedGroups[brand]">
    <div
      v-for="(cable, rowIdx) in cables"
      :key="cable.cableid"
      class="cable-row"
      :class="{ 'row-active': cable.cableid == activeCableId, 'row-band': rowIdx % 2 === 0 }"
    >
      <div
        class="cable-name"
        :style="{ borderLeft: '4px solid #eb910a' }"
        @mousedown="startNamePress(cable, $event)"
        @mouseup="endNamePress(cable, $event)"
        @mouseleave="cancelNamePress"
        @touchstart="startNamePress(cable, $event)"
        @touchend="endNamePress(cable, $event)"
        @touchcancel="cancelNamePress"
      >
        {{ cable.name }}
      </div>
      <div class="cable-cols">
        <!-- Spare -->
        <div
          class="mic-cell col-spare"
          :class="{ disabled: cable.cableid !== activeCableId }"
          @mousedown="startPress(cable, 'spare_count', $event)"
          @mouseup="endPress(cable, 'spare_count', $event)"
          @mouseleave="cancelPress"
          @touchstart="startPress(cable, 'spare_count', $event)"
          @touchend="endPress(cable, 'spare_count', $event)"
          @touchcancel="cancelPress"
        >
          <span class="mic-value" :class="{ active: cable.spare_count > 0 }">
            {{ cable.spare_count > 0 ? cable.spare_count : '--' }}
          </span>
        </div>
        <!-- Groupes 1-5 -->
        <div
          v-for="g in 5"
          :key="'g'+g"
          class="mic-cell"
          :class="{ disabled: cable.cableid !== activeCableId }"
          @mousedown="startPress(cable, `tfc${g}`, $event)"
          @mouseup="endPress(cable, `tfc${g}`, $event)"
          @mouseleave="cancelPress"
          @touchstart="startPress(cable, `tfc${g}`, $event)"
          @touchend="endPress(cable, `tfc${g}`, $event)"
          @touchcancel="cancelPress"
        >
          <span class="mic-value" :class="{ active: cable[`tfc${g}`] > 0 }">
            {{ cable[`tfc${g}`] > 0 ? cable[`tfc${g}`] : '--' }}
          </span>
        </div>
        <!-- Qté = max(groupes) + spare -->
        <div class="mic-cell mic-qty">
          <span class="mic-value active">
            {{ getQty(cable) || '--' }}
          </span>
        </div>
      </div>
    </div>
      </template>
    </template>
    <!-- Séparateur + micros inactifs en mode solo -->
    <template v-if="soloMode && inactiveMics.length > 0">
      <div class="solo-separator"></div>
      <template v-for="([brand, cables]) in groupedInactive" :key="'i_'+brand">
        <div class="brand-header brand-inactive" @click="toggleGroup('i_'+brand)">
          <span class="brand-arrow">{{ closedGroups['i_'+brand] ? '▶' : '▼' }}</span>
          <span class="brand-name">{{ brand }}</span>
          <span class="brand-count">{{ cables.length }}</span>
        </div>
        <template v-if="!closedGroups['i_'+brand]">
      <div
        v-for="(cable, rowIdx) in cables"
        :key="cable.cableid"
        class="cable-row row-inactive"
        :class="{ 'row-active': cable.cableid == activeCableId, 'row-band': rowIdx % 2 === 0 }"
      >
        <div
          class="cable-name"
          :style="{ borderLeft: '4px solid #eb910a' }"
          @mousedown="startNamePress(cable, $event)"
          @mouseup="endNamePress(cable, $event)"
          @mouseleave="cancelNamePress"
          @touchstart="startNamePress(cable, $event)"
          @touchend="endNamePress(cable, $event)"
          @touchcancel="cancelNamePress"
        >
          {{ cable.name }}
        </div>
        <div class="cable-cols">
          <div
            class="mic-cell col-spare"
            :class="{ disabled: cable.cableid !== activeCableId }"
            @mousedown="startPress(cable, 'spare_count', $event)"
            @mouseup="endPress(cable, 'spare_count', $event)"
            @mouseleave="cancelPress"
            @touchstart="startPress(cable, 'spare_count', $event)"
            @touchend="endPress(cable, 'spare_count', $event)"
            @touchcancel="cancelPress"
          >
            <span class="mic-value" :class="{ active: cable.spare_count > 0 }">
              {{ cable.spare_count > 0 ? cable.spare_count : '--' }}
            </span>
          </div>
          <div
            v-for="g in 5"
            :key="'g'+g"
            class="mic-cell"
            :class="{ disabled: cable.cableid !== activeCableId }"
            @mousedown="startPress(cable, `tfc${g}`, $event)"
            @mouseup="endPress(cable, `tfc${g}`, $event)"
            @mouseleave="cancelPress"
            @touchstart="startPress(cable, `tfc${g}`, $event)"
            @touchend="endPress(cable, `tfc${g}`, $event)"
            @touchcancel="cancelPress"
          >
            <span class="mic-value" :class="{ active: cable[`tfc${g}`] > 0 }">
              {{ cable[`tfc${g}`] > 0 ? cable[`tfc${g}`] : '--' }}
            </span>
          </div>
          <div class="mic-cell mic-qty">
            <span class="mic-value active">
              {{ getQty(cable) || '--' }}
            </span>
          </div>
        </div>
      </div>
        </template>
      </template>
    </template>

    <div v-if="microCables.length === 0 && (!soloMode || inactiveMics.length === 0)" class="empty">Aucun micro</div>
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
})

const emit = defineEmits(['updated', 'select', 'longpress'])

const allMics = computed(() => props.cables.filter(c => c.type === 'microphone'))
const activeMics = computed(() => allMics.value.filter(c => getQty(c) > 0))
const inactiveMics = computed(() => allMics.value.filter(c => getQty(c) === 0))
const microCables = computed(() => {
  if (!props.soloMode) return allMics.value
  return activeMics.value
})

function getBrand(cable) {
  return cable.brand || cable.name.split(' ')[0] || 'Autre'
}

const groupedMics = computed(() => {
  const groups = {}
  for (const cable of microCables.value) {
    const brand = getBrand(cable)
    if (!groups[brand]) groups[brand] = []
    groups[brand].push(cable)
  }
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
})

const groupedInactive = computed(() => {
  const groups = {}
  for (const cable of inactiveMics.value) {
    const brand = getBrand(cable)
    if (!groups[brand]) groups[brand] = []
    groups[brand].push(cable)
  }
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
})

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

function isEditable(cable) {
  return cable.cableid == props.activeCableId
}

let pressTimer = null
let didLongPress = false

function startPress(cable, field, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (!isEditable(cable)) {
    return // sélection uniquement via le nom du câble, pas via les cases
  }
  didLongPress = false
}

function endPress(cable, field, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (!isEditable(cable)) return

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
}
</script>

<style scoped>
.micro-list {
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
