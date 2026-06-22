<template>
  <div class="caisse-type">
    <!-- Sélection de la caisse type -->
    <div class="ct-header">
      <h2>Cablekit</h2>
      <div class="ct-tabs">
        <button
          v-for="i in 8"
          :key="'ct'+i"
          class="ct-tab"
          :class="{ active: selectedCt === i }"
          @click="selectCt(i)"
        >
          {{ settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}` }}
        </button>
      </div>
    </div>

    <!-- Contenu de la caisse sélectionnée -->
    <div v-if="selectedCt" class="ct-content">
      <div class="ct-toolbar">
        <input class="search" type="text" v-model="searchKey" placeholder="Rechercher câble" />
        <button class="subtract-toggle" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
          {{ subtractMode ? '−' : '+' }}
        </button>
      </div>

      <ButtonCableType :model-value="typeChoose" @select="typeChoose = $event" />

      <!-- Tableau des câbles -->
      <div class="ct-table">
        <div
          v-for="(cable, idx) in filteredCables"
          :key="cable.cableid"
          class="cable-row"
          :class="{ 'row-band': idx % 2 === 0, 'row-active': cable.cableid === activeCableId }"
        >
          <div
            class="cable-name"
            :style="{ borderLeft: `4px solid ${colorForType(cable.type)}` }"
            @click="activeCableId = activeCableId === cable.cableid ? null : cable.cableid"
          >
            {{ cable.name }}
          </div>
          <div
            class="ct-cell"
            :class="{ disabled: cable.cableid !== activeCableId }"
            @mousedown="startPress(cable, $event)"
            @mouseup="endPress(cable, $event)"
            @mouseleave="cancelPress"
            @touchstart="startPress(cable, $event)"
            @touchend="endPress(cable, $event)"
            @touchcancel="cancelPress"
          >
            <span class="ct-value" :class="{ active: getCount(cable) > 0 }">
              {{ getCount(cable) > 0 ? getCount(cable) : '--' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Résumé -->
      <div class="ct-summary" v-if="totalCount > 0">
        <strong>{{ totalCount }}</strong> câbles dans {{ settingsStore.defaultCtLabels[`ct${selectedCt}`] || `CK${selectedCt}` }}
      </div>
    </div>

    <div v-else class="ct-empty">
      Sélectionnez une caisse type
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCableStore } from '../stores/cables'
import { useMfcStore } from '../stores/mfc'
import { useSettingsStore } from '../stores/settings'
import ButtonCableType from '../components/ButtonCableType.vue'

const cableStore = useCableStore()
const mfcStore = useMfcStore()
const settingsStore = useSettingsStore()

const selectedCt = ref(null)
const typeChoose = ref('speaker')
const searchKey = ref('')
const activeCableId = ref(null)
const subtractMode = ref(false)
const cableCounts = ref({})
let usedTouch = false

onMounted(() => {
  cableStore.fetchCables()
  mfcStore.fetchMfcs()
})

const filteredCables = computed(() => {
  let list = cableStore.cables
  if (typeChoose.value) {
    list = list.filter(c => c.type === typeChoose.value)
  }
  if (searchKey.value) {
    const q = searchKey.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

const totalCount = computed(() => {
  return Object.values(cableCounts.value).reduce((sum, v) => sum + v, 0)
})

function getCount(cable) {
  return cableCounts.value[cable.cableid] || 0
}

async function selectCt(i) {
  selectedCt.value = i
  activeCableId.value = null
  // Chercher ou créer la MFC correspondante
  const ctName = settingsStore.defaultCtLabels[`ct${i}`] || `CK${i}`
  let mfc = mfcStore.mfcs.find(m => m.name === ctName || m.name === `CK${i}`)
  if (!mfc) {
    const { data } = await mfcStore.addMfc({ name: ctName, info: '' })
    mfc = data?.[0]
    if (!mfc) return
  }
  // Charger les câbles de cette MFC
  const { data } = await mfcStore.getMfcCables(mfc.mfcid)
  const counts = {}
  if (data) {
    for (const item of data) {
      counts[item.cableid] = item.count
    }
  }
  cableCounts.value = counts
}

let pressTimer = null
let didLongPress = false

function startPress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (e?.type?.startsWith('touch')) usedTouch = true
  if (cable.cableid !== activeCableId.value) return
  didLongPress = false
}

function endPress(cable, e) {
  if (e?.type?.startsWith('mouse') && usedTouch) return
  if (cable.cableid !== activeCableId.value) return

  if (!didLongPress) {
    const current = cableCounts.value[cable.cableid] || 0
    if (subtractMode.value) {
      cableCounts.value[cable.cableid] = Math.max(0, current - 1)
    } else {
      cableCounts.value[cable.cableid] = current + 1
    }
    saveCableCount(cable.cableid)
  }
}

function cancelPress() {
  clearTimeout(pressTimer)
}

async function saveCableCount(cableid) {
  const ctName = settingsStore.defaultCtLabels[`ct${selectedCt.value}`] || `CK${selectedCt.value}`
  const mfc = mfcStore.mfcs.find(m => m.name === ctName || m.name === `CK${selectedCt.value}`)
  if (!mfc) return
  const count = cableCounts.value[cableid] || 0
  await mfcStore.setCableMfc(mfc.mfcid, cableid, count)
}

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
.caisse-type {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px;
  text-align: left;
}
h2 {
  font-size: 18px;
  margin-bottom: 10px;
  text-align: center;
}
.ct-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin-bottom: 10px;
}
.ct-tab {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid #06b6d4;
  border-radius: 6px;
  background: #fff;
  color: #06b6d4;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
}
.ct-tab.active {
  background: #06b6d4;
  color: #fff;
}
.ct-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.search {
  flex: 1;
  height: 28px;
  padding: 2px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.subtract-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 18px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
}
.subtract-toggle.active {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.ct-table {
  width: 100%;
}
.cable-row {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  background: #fff;
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
.cable-row.row-active .cable-name {
  border: 1.5px solid var(--color1);
  border-radius: 6px;
  color: var(--color1-dark);
  font-weight: 800;
}
.cable-row.row-active .ct-cell {
  border: 1.5px solid var(--color1);
}
.cable-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.ct-cell {
  width: 44px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d5d5d5;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  margin-left: 6px;
}
.cable-row:not(.row-band) .ct-cell {
  background: #ebebeb;
}
.ct-cell.disabled {
  opacity: 0.5;
  cursor: default;
}
.ct-value {
  font-size: 16px;
  color: #bbb;
  font-weight: 500;
}
.ct-value.active {
  color: #2c3e50;
  font-weight: bold;
}
.ct-summary {
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: #666;
}
.ct-empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>
