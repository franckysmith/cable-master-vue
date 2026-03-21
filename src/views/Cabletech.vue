<template>
  <div class="main">
    <AddAffair
      v-if="affairIsOpen"
      :affair="editingAffair"
      @close="affairIsOpen = false; editingAffair = null"
      @created="onAffairCreated"
    />
    <Affaires
      v-else
      @selected="onAffairSelected"
      @openNew="affairIsOpen = true; editingAffair = null"
      @edit="onAffairEdit"
    />

    <div class="content-liste" v-if="selectedAffair">
      <!-- Mode toggle + status -->
      <div class="mode-bar">
        <template v-if="!directMode">
          <button
            @click="layout = 'cableTechBase'"
            :class="{ button3: layout === 'cableTechBase' }"
          >sélectionner</button>
          <button
            @click="layout = 'flightcase'"
            :class="{ button3: layout === 'flightcase' }"
          >flightcase</button>
        </template>
        <template v-else>
          <span class="direct-label">Direct dans Flycase</span>
        </template>
        <span class="mode-separator">ou</span>
        <button
          class="direct-btn"
          :class="{ active: directMode }"
          @click="toggleDirectMode"
        >
          {{ directMode ? 'Classique' : 'Direct dans Flycase' }}
        </button>
      </div>
      <div class="status-bar" v-if="saving || totalSelected > 0">
        <span v-if="saving" class="save-status saving">sauvegarde...</span>
        <span v-else-if="allDistributed && totalSelected > 0" class="save-status done">Tout est rangé</span>
        <span v-else class="save-status">{{ totalSelected }} éléments</span>
      </div>

      <div class="content-button2">
        <input class="search" type="text" v-model="searchKey" placeholder="Rechercher élément" />
        <button class="add-btn" @click="showAddInput = !showAddInput">+</button>
        <button
          class="special-btn micro-btn"
          :class="{ active: microMode }"
          @click="toggleMicroMode"
        >Micro</button>
        <button
          class="special-btn ctype-btn"
          :class="{ active: typeChoose === 'c_type' }"
          @click="typeChoose = typeChoose === 'c_type' ? 'speaker' : 'c_type'"
        >Caisse-type</button>
      </div>

      <!-- Ajout rapide de câble -->
      <div v-if="showAddInput" class="quick-add">
        <input
          ref="addInput"
          v-model="newCableName"
          class="quick-add-input"
          :placeholder="`Nom du câble (${typeLabel(typeChoose)})`"
          @keydown.enter="quickAddCable"
        />
        <button class="quick-add-btn" @click="quickAddCable">Ajouter</button>
      </div>

      <!-- Édition de câble -->
      <div v-if="editingCable" class="cable-edit-panel">
        <div class="edit-header">
          <span>Modifier : {{ editingCable.name }}</span>
          <button class="close-btn" @click="editingCable = null">x</button>
        </div>
        <div class="edit-fields">
          <label>Nom<input v-model="editForm.name" /></label>
          <label>Type
            <select v-model="editForm.type">
              <option v-for="t in cableTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </label>
          <label>Poids<input v-model.number="editForm.weight" type="number" /></label>
        </div>
        <div class="edit-actions">
          <button class="edit-save" @click="saveEditCable">Enregistrer</button>
          <button class="edit-delete" @click="deleteEditCable">Supprimer</button>
        </div>
      </div>

      <!-- Sticky : boutons type + totaux + en-têtes colonnes -->
      <div class="sticky-header">
        <ButtonCableType v-if="!microMode" :model-value="typeChoose" :distributed-types="distributedTypes" @select="typeChoose = $event" />

        <div v-if="!microMode && categoryTotals.length" class="totals-summary">
          <span v-for="t in categoryTotals" :key="t.type" class="total-badge" :style="{ borderColor: colorForType(t.type) }">
            {{ t.label }}: <strong>{{ t.count }}</strong>
          </span>
        </div>

        <!-- En-têtes micro -->
        <div v-if="microMode" class="head-zone">
          <div class="head-spacer">
            <button class="subtract-toggle" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
              {{ subtractMode ? '−' : '+' }}
            </button>
            <button class="solo-toggle" :class="{ active: microSolo }" @click="microSolo = !microSolo">
              S
            </button>
          </div>
          <div class="head-cols">
            <div class="head-label-angled head-spare"><span>Spare</span></div>
            <div v-for="i in 5" :key="'mg'+i" class="head-label-angled">
              <input v-model="microGroupLabels[`mg${i}`]" :placeholder="`Gr${i}`" maxlength="8" />
            </div>
            <div class="head-label-angled head-qty"><span>Qté</span></div>
          </div>
        </div>

        <!-- En-têtes zones -->
        <div v-if="!microMode && !directMode && layout === 'cableTechBase'" class="head-zone">
          <div class="head-spacer">
            <button class="subtract-toggle" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
              {{ subtractMode ? '−' : '+' }}
            </button>
            <button class="solo-toggle" :class="{ active: soloMode }" @click="soloMode = !soloMode">
              S
            </button>
          </div>
          <div class="head-cols">
            <div class="head-label-angled head-spare"><span>Spare</span></div>
            <div v-for="i in 6" :key="'z'+i" class="head-label-angled">
              <input v-model="zoneLabels[`lz${i}`]" :placeholder="`Zone${i}`" />
            </div>
            <div class="head-total-spacer"></div>
          </div>
        </div>

        <!-- En-têtes flycases -->
        <div v-if="!microMode && (directMode || layout === 'flightcase')" class="head-zone">
          <div class="head-spacer-fc">
            <button class="subtract-toggle" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
              {{ subtractMode ? '−' : '+' }}
            </button>
          </div>
          <div class="head-cols">
            <div v-for="i in 7" :key="'fc'+i" class="head-label-angled-fc fc-clickable" @click="openFcDetail(`tfc${i}`, fcLabels[`lfc${i}`] || `FC${i}`)">
              <span class="fc-label-btn">{{ fcLabels[`lfc${i}`] || `FC${i}` }}</span>
            </div>
            <div class="head-total-spacer"></div>
          </div>
        </div>
      </div>

      <!-- Micro layout -->
      <div v-if="microMode" class="table-scroll">
        <MicroList :cables="filteredJoinedData" :active-cable-id="activeCableId" :subtract-mode="subtractMode" :solo-mode="microSolo" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Zones layout -->
      <div v-if="!microMode && !directMode && layout === 'cableTechBase'" class="table-scroll">
        <CableList :cables="filteredJoinedData" :active-cable-id="activeCableId" :visible-zones="6" :subtract-mode="subtractMode" :solo-mode="soloMode" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Flightcase layout -->
      <div v-if="!microMode && (directMode || layout === 'flightcase')" class="table-scroll">
        <FcaseManagement :cables="filteredJoinedData" :active-cable-id="activeCableId" :direct-mode="directMode" :visible-fc="7" :subtract-mode="subtractMode" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <div class="print-all-bar" v-if="!fcDetailVisible">
        <button class="action-btn" @click="printAllFc">Imprimer toutes les caisses</button>
      </div>

      <FcaseDetail
        :visible="fcDetailVisible"
        :fc-name="fcDetailName"
        :fc-field="fcDetailField"
        :cables="joinedData"
        :affair-name="selectedAffair?.name || ''"
        @close="fcDetailVisible = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useCableStore } from '../stores/cables'
import { useAffairStore } from '../stores/affairs'
import { useOrderStore } from '../stores/orders'
import Affaires from '../components/Affaires.vue'
import AddAffair from '../components/AddAffair.vue'
import CableList from '../components/CableList.vue'
import FcaseManagement from '../components/FcaseManagement.vue'
import FcaseDetail from '../components/FcaseDetail.vue'
import MicroList from '../components/MicroList.vue'
import ButtonCableType from '../components/ButtonCableType.vue'
import { useSettingsStore } from '../stores/settings'

const cableStore = useCableStore()
const affairStore = useAffairStore()
const orderStore = useOrderStore()
const settingsStore = useSettingsStore()

const affairIsOpen = ref(false)
const editingAffair = ref(null)
const typeChoose = ref('speaker')
const searchKey = ref('')
const layout = ref('cableTechBase')
const joinedData = ref([])
const directMode = ref(false)
const saving = ref(false)
const activeCableId = ref(null)
const subtractMode = ref(false)
const microMode = ref(false)
const microSolo = ref(false)
const soloMode = ref(false)

function toggleMicroMode() {
  microMode.value = !microMode.value
  if (microMode.value) {
    typeChoose.value = 'microphone'
    directMode.value = true
  } else {
    typeChoose.value = 'speaker'
    directMode.value = false
  }
}
const showAddInput = ref(false)
const newCableName = ref('')
const addInput = ref(null)
const editingCable = ref(null)
const editForm = reactive({ name: '', type: '', weight: 0 })

const cableTypes = [
  { value: 'speaker', label: 'HP' },
  { value: 'electrical', label: 'Elec' },
  { value: 'module', label: 'Modules' },
  { value: 'special', label: 'Spéciaux' },
  { value: 'other', label: 'Autres' },
  { value: 'microphone', label: 'Micros' },
  { value: 'c_type', label: 'Caisses-type' },
  { value: 'accessory', label: 'Accessoires' },
  { value: 'digital', label: 'Numériques' },
]

function typeLabel(type) {
  const found = cableTypes.find(t => t.value === type)
  return found ? found.label : type
}

async function quickAddCable() {
  const name = newCableName.value.trim()
  if (!name) return
  const type = typeChoose.value || 'other'
  const catalogId = selectedAffair.value?.catalog_id || null
  const { error } = await cableStore.addCable({ name, type, weight: 0, total: 0, reserved: 0, catalog_id: catalogId })
  if (!error) {
    newCableName.value = ''
    // Recharger les câbles du bon catalogue et reconstruire
    await cableStore.fetchCables(catalogId)
    if (selectedAffair.value) {
      const { data: orders } = await orderStore.fetchOrders({ affairid: selectedAffair.value.affairid })
      buildJoinedData(orders || [], cableStore.cables)
    }
  }
}

function onCableLongPress(cable) {
  editingCable.value = cable
  editForm.name = cable.name
  editForm.type = cable.type
  editForm.weight = cable.weight || 0
}

async function saveEditCable() {
  if (!editingCable.value) return
  await cableStore.updateCable(editingCable.value.cableid, {
    name: editForm.name,
    type: editForm.type,
    weight: editForm.weight,
  })
  // Mettre à jour le joinedData local
  const item = joinedData.value.find(c => c.cableid === editingCable.value.cableid)
  if (item) {
    item.name = editForm.name
    item.type = editForm.type
    item.weight = editForm.weight
  }
  editingCable.value = null
}

async function deleteEditCable() {
  if (!editingCable.value) return
  await cableStore.deleteCable(editingCable.value.cableid)
  joinedData.value = joinedData.value.filter(c => c.cableid !== editingCable.value.cableid)
  editingCable.value = null
}

const zoneLabels = reactive({ lz1: '', lz2: '', lz3: '', lz4: '', lz5: '', lz6: '' })
const fcLabels = reactive({ lfc1: '', lfc2: '', lfc3: '', lfc4: '', lfc5: '', lfc6: '', lfc7: '' })
const microGroupLabels = reactive({ mg1: '', mg2: '', mg3: '', mg4: '', mg5: '' })

const fcDetailVisible = ref(false)
const fcDetailField = ref('')
const fcDetailName = ref('')

function openFcDetail(field, name) {
  fcDetailField.value = field
  fcDetailName.value = name
  fcDetailVisible.value = true
}

const fcFields = ['tfc1', 'tfc2', 'tfc3', 'tfc4', 'tfc5', 'tfc6']

function getFcLabel(index) {
  const key = `lfc${index + 1}`
  return fcLabels[key] || `FC${index + 1}`
}

function printAllFc() {
  const typeOrder = ['speaker', 'electrical', 'module', 'microphone', 'digital', 'special', 'other', 'c_type', 'accessory']
  const typeLabels = {
    speaker: 'HP', electrical: 'Électrique', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Caisses-type', accessory: 'Accessoires', digital: 'Digital'
  }

  let html = `<html><head><title>Caisses - ${selectedAffair.value?.name || ''}</title><style>
    body { font-family: sans-serif; padding: 15px; }
    h1 { font-size: 18px; margin: 0 0 15px; }
    .fc { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 6px; padding: 10px; }
    .fc-title { font-size: 16px; font-weight: bold; margin: 0 0 8px; padding-bottom: 4px; border-bottom: 2px solid var(--color1); }
    .group { margin-bottom: 6px; }
    .group-title { font-weight: bold; font-size: 13px; padding: 3px 8px; background: #f0f0f0; border-left: 4px solid #ccc; display: flex; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; padding: 2px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .fc-total { font-weight: bold; text-align: right; margin-top: 6px; font-size: 13px; }
  </style></head><body>`

  html += `<h1>${selectedAffair.value?.name || 'Caisses'}</h1>`

  for (let i = 0; i < fcFields.length; i++) {
    const field = fcFields[i]
    const label = getFcLabel(i)
    const cablesInFc = joinedData.value
      .filter(c => (c[field] || 0) > 0)
      .map(c => ({ name: c.name, type: c.type, qty: c[field] }))

    if (cablesInFc.length === 0) continue

    const groups = {}
    for (const c of cablesInFc) {
      if (!groups[c.type]) groups[c.type] = { cables: [], total: 0 }
      groups[c.type].cables.push(c)
      groups[c.type].total += c.qty
    }

    const fcTotal = cablesInFc.reduce((s, c) => s + c.qty, 0)

    html += `<div class="fc"><div class="fc-title">${label}</div>`
    for (const type of typeOrder) {
      if (!groups[type]) continue
      html += `<div class="group"><div class="group-title" style="border-left-color:${colorForType(type)}"><span>${typeLabels[type] || type}</span><span>${groups[type].total}</span></div>`
      for (const cable of groups[type].cables) {
        html += `<div class="row"><span>${cable.name}</span><span>${cable.qty}</span></div>`
      }
      html += `</div>`
    }
    html += `<div class="fc-total">Total: ${fcTotal} câbles</div></div>`
  }

  html += `</body></html>`
  const w = window.open('', '_blank', 'width=500,height=700')
  w.document.write(html)
  w.document.close()
  w.print()
}

function onCableSelect(cableid) {
  activeCableId.value = activeCableId.value == cableid ? null : cableid
}

// Toggle mode direct
function toggleDirectMode() {
  directMode.value = !directMode.value
  if (directMode.value) {
    layout.value = 'flightcase'
  }
}

// --- Auto-sauvegarde ---
let autoSaveTimer = null

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    autoSaveNow()
  }, 1500)
}

async function autoSaveNow() {
  if (!selectedAffair.value) return
  clearTimeout(autoSaveTimer)
  saving.value = true

  // Sauvegarder labels + date de mise à jour
  await affairStore.updateAffair(selectedAffair.value.affairid, {
    ...zoneLabels, ...fcLabels, ...microGroupLabels,
    updated_at: new Date().toISOString(),
  })

  // Sauvegarder orders
  const toSave = joinedData.value
    .filter(c => getZoneTotal(c) > 0 || getTfcTotal(c) > 0)
    .map(c => ({
      cableid: c.cableid,
      affairid: c.affairid,
      tech_id: c.tech_id,
      done: c.done,
      count: getZoneTotal(c) > 0 ? getZoneTotal(c) : getTfcTotal(c),
      spare_count: c.spare_count,
      z1: c.z1, z2: c.z2, z3: c.z3, z4: c.z4, z5: c.z5, z6: c.z6,
      tfc1: c.tfc1, tfc2: c.tfc2, tfc3: c.tfc3, tfc4: c.tfc4, tfc5: c.tfc5, tfc6: c.tfc6,
      tfc_done: c.tfc_done,
    }))

  if (toSave.length) {
    const { error } = await orderStore.setOrders(toSave)
    if (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  saving.value = false
}

// Auto-save labels quand ils changent
watch([zoneLabels, fcLabels], () => {
  if (!selectedAffair.value) return
  scheduleAutoSave()
}, { deep: true })

function onCableUpdated() {
  scheduleAutoSave()
}

const selectedAffair = computed(() => affairStore.selectedAffair)

// Confirmation avant navigation
onBeforeRouteLeave(() => {
  if (autoSaveTimer) {
    autoSaveNow()
  }
})

async function onAffairSelected(affair) {
  // Sauvegarder avant de changer si besoin
  if (autoSaveTimer) {
    await autoSaveNow()
  }

  const dz = settingsStore.defaultZoneLabels
  const df = settingsStore.defaultFcLabels
  zoneLabels.lz1 = (affair.lz1 && affair.lz1.trim()) || dz.lz1 || ''
  zoneLabels.lz2 = (affair.lz2 && affair.lz2.trim()) || dz.lz2 || ''
  zoneLabels.lz3 = (affair.lz3 && affair.lz3.trim()) || dz.lz3 || ''
  zoneLabels.lz4 = (affair.lz4 && affair.lz4.trim()) || dz.lz4 || ''
  zoneLabels.lz5 = (affair.lz5 && affair.lz5.trim()) || dz.lz5 || ''
  zoneLabels.lz6 = (affair.lz6 && affair.lz6.trim()) || dz.lz6 || ''
  fcLabels.lfc1 = (affair.lfc1 && affair.lfc1.trim()) || df.lfc1 || ''
  fcLabels.lfc2 = (affair.lfc2 && affair.lfc2.trim()) || df.lfc2 || ''
  fcLabels.lfc3 = (affair.lfc3 && affair.lfc3.trim()) || df.lfc3 || ''
  fcLabels.lfc4 = (affair.lfc4 && affair.lfc4.trim()) || df.lfc4 || ''
  fcLabels.lfc5 = (affair.lfc5 && affair.lfc5.trim()) || df.lfc5 || ''
  fcLabels.lfc6 = (affair.lfc6 && affair.lfc6.trim()) || df.lfc6 || ''
  fcLabels.lfc7 = (affair.lfc7 && affair.lfc7.trim()) || df.lfc7 || ''
  microGroupLabels.mg1 = (affair.mg1 && affair.mg1.trim()) || ''
  microGroupLabels.mg2 = (affair.mg2 && affair.mg2.trim()) || ''
  microGroupLabels.mg3 = (affair.mg3 && affair.mg3.trim()) || ''
  microGroupLabels.mg4 = (affair.mg4 && affair.mg4.trim()) || ''
  microGroupLabels.mg5 = (affair.mg5 && affair.mg5.trim()) || ''

  // Charger les câbles du catalogue de l'affaire
  await cableStore.fetchCables(affair.catalog_id || null)

  const { data: orders } = await orderStore.fetchOrders({ affairid: affair.affairid })
  buildJoinedData(orders || [], cableStore.cables)
  activeCableId.value = null
  editingCable.value = null
  showAddInput.value = false
}

function onAffairCreated(affair) {
  affairIsOpen.value = false
  editingAffair.value = null
  affairStore.selectAffair(affair)
  onAffairSelected(affair)
}

function onAffairEdit(affair) {
  editingAffair.value = affair
  affairIsOpen.value = true
}

function buildJoinedData(orders, cables) {
  const orderMap = {}
  for (const o of orders) {
    orderMap[o.cableid] = o
  }

  joinedData.value = cables.map(cable => {
    const order = orderMap[cable.cableid]
    return {
      cableid: cable.cableid,
      affairid: selectedAffair.value?.affairid,
      tech_id: selectedAffair.value?.tech_id,
      done: order?.done ?? true,
      name: cable.name,
      type: cable.type,
      color: cable.color,
      total: cable.total,
      reserved: cable.reserved,
      info: cable.info,
      link: cable.link,
      count: parseInt(order?.count) || 0,
      spare_count: parseInt(order?.spare_count) || 0,
      tfc1: parseInt(order?.tfc1) || 0,
      tfc2: parseInt(order?.tfc2) || 0,
      tfc3: parseInt(order?.tfc3) || 0,
      tfc4: parseInt(order?.tfc4) || 0,
      tfc5: parseInt(order?.tfc5) || 0,
      tfc6: parseInt(order?.tfc6) || 0,
      z1: parseInt(order?.z1) || 0,
      z2: parseInt(order?.z2) || 0,
      z3: parseInt(order?.z3) || 0,
      z4: parseInt(order?.z4) || 0,
      z5: parseInt(order?.z5) || 0,
      z6: parseInt(order?.z6) || 0,
      tfc_done: order?.tfc_done ?? false,
    }
  })
}

const searchFiltered = computed(() =>
  joinedData.value.filter(c =>
    c.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
)

// Zones : filtré par type
const filteredJoinedData = computed(() => {
  if (typeChoose.value === '') return searchFiltered.value
  return searchFiltered.value.filter(c => c.type === typeChoose.value)
})

const totalSelected = computed(() =>
  joinedData.value.reduce((sum, c) => sum + calculateTotal(c), 0)
)

// Totaux par catégorie
const categoryTotals = computed(() => {
  const typeLabels = {
    speaker: 'HP', electrical: 'Elec', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Caisses', accessory: 'Access.', digital: 'Digital'
  }
  const counts = {}
  for (const c of joinedData.value) {
    const total = calculateTotal(c)
    if (total > 0) {
      counts[c.type] = (counts[c.type] || 0) + total
    }
  }
  return Object.entries(counts).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count
  }))
})

// Par type : est-ce que tous les câbles de ce type sont distribués ?
const distributedTypes = computed(() => {
  const result = {}
  const typeGroups = {}
  for (const c of joinedData.value) {
    const total = calculateTotal(c)
    if (total <= 0 && c.count <= 0) continue
    if (!typeGroups[c.type]) typeGroups[c.type] = []
    typeGroups[c.type].push(c)
  }
  for (const [type, cables] of Object.entries(typeGroups)) {
    result[type] = cables.every(c => {
      const cableTotal = calculateTotal(c) > 0 ? calculateTotal(c) : c.count
      const distributed = (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) +
        (c.tfc4 || 0) + (c.tfc5 || 0) + (c.tfc6 || 0)
      return distributed >= cableTotal
    })
  }
  return result
})

// Est-ce que tous les câbles sélectionnés sont distribués dans les FC ?
const allDistributed = computed(() => {
  if (directMode.value) return false
  const selected = joinedData.value.filter(c => calculateTotal(c) > 0 || c.count > 0)
  if (selected.length === 0) return false
  return selected.every(c => {
    const cableTotal = calculateTotal(c) > 0 ? calculateTotal(c) : c.count
    const distributed = (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) +
      (c.tfc4 || 0) + (c.tfc5 || 0) + (c.tfc6 || 0)
    return distributed >= cableTotal
  })
})

function getZoneTotal(cable) {
  return (
    (parseInt(cable.z1) || 0) +
    (parseInt(cable.z2) || 0) +
    (parseInt(cable.z3) || 0) +
    (parseInt(cable.z4) || 0) +
    (parseInt(cable.z5) || 0) +
    (parseInt(cable.z6) || 0) +
    (parseInt(cable.spare_count) || 0)
  )
}

function getTfcTotal(cable) {
  return (
    (parseInt(cable.tfc1) || 0) +
    (parseInt(cable.tfc2) || 0) +
    (parseInt(cable.tfc3) || 0) +
    (parseInt(cable.tfc4) || 0) +
    (parseInt(cable.tfc5) || 0) +
    (parseInt(cable.tfc6) || 0)
  )
}

function calculateTotal(cable) {
  if (directMode.value) return getTfcTotal(cable)
  return getZoneTotal(cable)
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
.content-liste {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  max-width: 600px;
  padding: 0 4px;
  text-align: center;
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg, #fff);
  width: 100%;
  padding-bottom: 2px;
}
.status-bar {
  text-align: center;
  margin: 2px 0 4px;
}
.mode-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}
.mode-separator {
  font-size: 12px;
  color: #999;
}
.direct-label {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}
.direct-btn {
  background: #ebe7df;
  color: #333;
}
.direct-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.save-status {
  font-size: 12px;
  color: #888;
}
.save-status.saving {
  color: var(--color3);
  font-weight: bold;
}
.save-status.done {
  color: var(--color1);
  font-weight: bold;
  padding: 3px 10px;
  background: var(--color1-light);
  border-radius: 12px;
}
.content-button2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
}
.search {
  width: 120px;
  height: 24px;
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}
.totals-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0;
  justify-content: center;
}
.total-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f5f5f5;
  border: 2px solid #ccc;
}
.total-badge strong {
  color: #2c3e50;
}
.button3 {
  background: var(--color3) !important;
  color: #000;
}
.head-zone {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0;
  overflow: hidden;
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
  position: absolute;
  bottom: -14px;
  left: 10px;
}
.subtract-toggle.active {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.solo-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 28px;
  box-shadow: none;
  position: absolute;
  bottom: -14px;
  left: 44px;
}
.solo-toggle.active {
  background: #eb910a;
  border-color: #eb910a;
  color: #fff;
}
.head-total-spacer {
  width: 28px;
  min-width: 28px;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y;
  scroll-snap-type: x proximity;
}
.head-cols {
  display: flex;
  gap: 0;
}
.head-spacer {
  width: 120px;
  min-width: 120px;
  position: relative;
}
.head-spacer-fc {
  width: 120px;
  min-width: 120px;
  position: relative;
}
.head-total {
  width: 28px;
  min-width: 28px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #222;
}
.head-label-angled {
  width: 34px;
  height: 55px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;
  cursor: pointer;
}
.head-label-angled-fc {
  width: 34px;
  height: 55px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  position: relative;
  cursor: pointer;
}
.head-label-angled span,
.head-label-angled input,
.head-label-angled-fc span,
.head-label-angled-fc input {
  display: block;
  transform: rotate(-55deg);
  transform-origin: bottom left;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  color: #222;
  position: absolute;
  bottom: 0;
  left: 38px;
}
.head-label-angled input,
.head-label-angled-fc input {
  width: 60px;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  padding: 4px 2px;
  outline: none;
  font-weight: 700;
  color: #222;
  -webkit-tap-highlight-color: transparent;
}
.head-label-angled input:focus,
.head-label-angled-fc input:focus {
  border-bottom-color: var(--color1);
}
.head-label-angled input::placeholder,
.head-label-angled-fc input::placeholder {
  color: #666;
  font-weight: 600;
}
.head-spare span {
  color: #e65100;
}
.fc-clickable {
  cursor: pointer;
}
.fc-label-btn {
  background: var(--color1-light);
  border: 1px solid var(--color1);
  border-radius: 4px;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 700;
  color: #2c3e50;
  display: inline-block;
  width: 42px;
  height: 22px;
  line-height: 14px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fc-clickable:hover .fc-label-btn {
  background: var(--color1);
  color: white;
}
button {
  cursor: pointer;
  margin: 3px;
  padding: 5px 10px;
  min-width: 50px;
  background: #ebe7df;
  border: 1px solid #000;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  font-size: 12px;
}
.special-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
}
.micro-btn {
  background: #eb910a;
  color: #fff;
}
.micro-btn.active {
  background: #d97706;
  border-color: #000;
}
.ctype-btn {
  background: #06b6d4;
  color: #fff;
}
.ctype-btn.active {
  background: #0891b2;
  border-color: #000;
}
.head-qty span {
  color: #eb910a;
  font-weight: 800;
}
.add-btn {
  width: 32px;
  height: 32px;
  font-size: 18px;
  font-weight: bold;
  padding: 0;
  min-width: 32px;
  background: var(--color1);
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.quick-add {
  display: flex;
  gap: 6px;
  margin: 6px 0;
  align-items: center;
  justify-content: center;
}
.quick-add-input {
  flex: 1;
  max-width: 200px;
  padding: 8px 10px;
  border: 2px solid var(--color1);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.quick-add-btn {
  background: var(--color1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}
.cable-edit-panel {
  width: 100%;
  max-width: 360px;
  margin: 8px auto;
  padding: 10px;
  border: 2px solid var(--color3);
  border-radius: 8px;
  background: #fff8f0;
}
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}
.edit-header .close-btn {
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.edit-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edit-fields label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}
.edit-fields input,
.edit-fields select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: flex-end;
}
.edit-save {
  background: var(--color1);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}
.edit-delete {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}
.print-all-bar {
  margin: 10px 0;
  text-align: center;
}
.print-all-bar .action-btn {
  background: #f5f5f5;
  border: 1px solid #ccc;
  font-size: 13px;
  padding: 8px 16px;
  font-weight: 600;
  box-shadow: none;
}
.print-all-bar .action-btn:hover {
  background: var(--color1-light);
  border-color: var(--color1);
}
</style>
