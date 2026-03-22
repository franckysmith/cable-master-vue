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
      <div class="mode-bar" v-if="!ctMode && !microMode">
        <template v-if="!directMode">
          <button
            @click="onHelpClick('select', () => layout = 'cableTechBase')"
            :class="{ button3: layout === 'cableTechBase' }"
          >sélectionner</button>
          <button
            @click="onHelpClick('fc', () => layout = 'flightcase')"
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
          @click="onHelpClick('direct', toggleDirectMode)"
        >
          {{ directMode ? 'Classique' : 'Direct dans Flycase' }}
        </button>
      </div>
      <div class="status-bar" v-if="saving || (allDistributed && totalSelected > 0)">
        <span v-if="saving" class="save-status saving">sauvegarde...</span>
        <span v-else class="save-status done">Tout est rangé</span>
      </div>

      <div class="content-button2">
        <input class="search" type="text" v-model="searchKey" placeholder="Rechercher élément" @focus="onHelpClick('search', () => {})" />
        <button class="add-btn" @click="onHelpClick('add', () => showAddInput = !showAddInput)">+</button>
        <button
          class="special-btn micro-btn"
          :class="{ active: microMode }"
          @click="onHelpClick('micro', toggleMicroMode)"
        >Micro</button>
        <button
          class="special-btn ctype-btn"
          :class="{ active: ctMode }"
          @click="onHelpClick('ctype', toggleCtMode)"
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
          <label>Marque<input v-model="editForm.brand" placeholder="ex: Shure, Audix..." /></label>
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

        <div v-if="!microMode && !ctMode && categoryTotals.length" class="totals-summary">
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
              <input v-model="microGroupLabels[`mg${i}`]" :placeholder="`Gr${i}`" maxlength="12" />
            </div>
            <div class="head-label-angled head-qty"><span>Qté</span></div>
          </div>
        </div>

        <!-- Sync-header Zones -->
        <div v-if="!ctMode && !microMode && !directMode && layout === 'cableTechBase'" class="sync-header" ref="zoneHeaderScroll" @scroll="syncScroll('zoneHeaderScroll','zoneBodyScroll')">
          <div class="sync-header-inner">
            <div class="head-spacer-sticky ct-btn-row">
              <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
                {{ subtractMode ? '−' : '+' }}
              </button>
              <button class="mini-btn" :class="{ 'active-orange': soloMode }" @click="soloMode = !soloMode">
                S
              </button>
              <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
                +10
              </button>
            </div>
            <div class="head-label-angled head-spare"><span>Spare</span></div>
            <div v-for="i in 6" :key="'zh'+i" class="head-label-angled">
              <input v-model="zoneLabels[`lz${i}`]" :placeholder="`Zone${i}`" />
            </div>
            <div class="head-total-spacer"></div>
          </div>
        </div>

        <!-- Sync-header Flycases -->
        <div v-if="!ctMode && !microMode && (directMode || layout === 'flightcase')" class="sync-header" ref="fcHeaderScroll" @scroll="syncScroll('fcHeaderScroll','fcBodyScroll')">
          <div class="sync-header-inner">
            <div class="head-spacer-sticky ct-btn-row">
              <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
                {{ subtractMode ? '−' : '+' }}
              </button>
              <button class="mini-btn" :class="{ 'active-orange': fcSolo }" @click="fcSolo = !fcSolo; if(!fcSolo) fcSoloFilter = null">
                S
              </button>
              <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
                +10
              </button>
            </div>
            <div v-for="i in 7" :key="'fch2'+i" class="head-label-angled-fc fc-clickable" @mousedown="startHeaderPress('fc', i)" @mouseup="endHeaderPress('fc', i)" @mouseleave="cancelHeaderPress" @touchstart="startHeaderPress('fc', i)" @touchend="endHeaderPress('fc', i)" @touchcancel="cancelHeaderPress">
              <span class="fc-label-btn" :class="{ 'solo-selected': fcSolo && fcSoloFilter === i }">{{ fcLabels[`lfc${i}`] || `FC${i}` }}</span>
            </div>
            <div class="head-total-spacer"></div>
          </div>
        </div>

        <!-- Sync-header Caisses-type -->
        <div v-if="ctMode" class="sync-header" ref="ctHeaderScroll" @scroll="syncScroll('ctHeaderScroll','ctBodyScroll')">
          <div class="sync-header-inner">
            <div class="head-spacer-sticky ct-btn-row">
              <button class="mini-btn" :class="{ active: subtractMode }" @click="subtractMode = !subtractMode">
                {{ subtractMode ? '−' : '+' }}
              </button>
              <button class="mini-btn" :class="{ 'active-orange': ctSolo }" @click="ctSolo = !ctSolo; if(!ctSolo) ctSoloFilter = null">
                S
              </button>
              <button class="mini-btn" :class="{ 'active-blue': incrementStep === 10 }" @click="incrementStep = incrementStep === 10 ? 1 : 10">
                +10
              </button>
            </div>
            <div v-for="i in 7" :key="'cth'+i" class="head-label-angled-fc" @mousedown="startHeaderPress('ct', i)" @mouseup="endHeaderPress('ct', i)" @mouseleave="cancelHeaderPress" @touchstart="startHeaderPress('ct', i)" @touchend="endHeaderPress('ct', i)" @touchcancel="cancelHeaderPress">
              <span class="ct-label-btn" :class="{ 'solo-selected': ctSolo && ctSoloFilter === i }">{{ settingsStore.defaultCtLabels[`ct${i}`] || `CT${i}` }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Caisse-type body (outside sticky) -->
      <div v-if="ctMode" class="table-scroll" ref="ctBodyScroll" @scroll="syncScroll('ctBodyScroll','ctHeaderScroll')" style="width:100%">
        <CtypeList
          :cables="ctFilteredCables"
          :active-cable-id="activeCableId"
          :subtract-mode="subtractMode"
          :solo-mode="ctSolo"
          :solo-filter="ctSoloFilter"
          :increment-step="incrementStep"
          :counts="ctAllCounts"
          @updated="onCtCableUpdated"
          @select="onCableSelect"
          @longpress="onCableLongPress"
        />
      </div>

      <!-- Micro layout -->
      <div v-if="!ctMode && microMode" class="table-scroll">
        <MicroList :cables="filteredJoinedData" :active-cable-id="activeCableId" :subtract-mode="subtractMode" :solo-mode="microSolo" :increment-step="incrementStep" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Zones layout (body only, header in sticky) -->
      <div v-if="!ctMode && !microMode && !directMode && layout === 'cableTechBase'" class="table-scroll" ref="zoneBodyScroll" @scroll="syncScroll('zoneBodyScroll','zoneHeaderScroll')" style="width:100%">
        <CableList :cables="filteredJoinedData" :active-cable-id="activeCableId" :visible-zones="6" :subtract-mode="subtractMode" :solo-mode="soloMode" :increment-step="incrementStep" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Flightcase layout (body only, header in sticky) -->
      <div v-if="!ctMode && !microMode && (directMode || layout === 'flightcase')" class="table-scroll" ref="fcBodyScroll" @scroll="syncScroll('fcBodyScroll','fcHeaderScroll')" style="width:100%">
        <FcaseManagement :cables="filteredJoinedData" :active-cable-id="activeCableId" :direct-mode="directMode" :visible-fc="7" :subtract-mode="subtractMode" :increment-step="incrementStep" :solo-mode="fcSolo" :solo-filter="fcSoloFilter" @updated="onCableUpdated" @select="onCableSelect" @longpress="onCableLongPress" />
      </div>

      <!-- Bouton imprimer la caisse sélectionnée -->
      <div class="print-all-bar" v-if="fcSolo && fcSoloFilter">
        <button class="action-btn" @click="openFcDetail(`tfc${fcSoloFilter}`, fcLabels[`lfc${fcSoloFilter}`] || `FC${fcSoloFilter}`)">
          Imprimer {{ fcLabels[`lfc${fcSoloFilter}`] || `FC${fcSoloFilter}` }}
        </button>
      </div>

      <!-- Bouton imprimer la caisse-type sélectionnée -->
      <div class="print-all-bar" v-if="ctSolo && ctSoloFilter">
        <button class="action-btn" @click="printCtCaisse(ctSoloFilter)">
          Imprimer {{ settingsStore.defaultCtLabels[`ct${ctSoloFilter}`] || `CT${ctSoloFilter}` }}
        </button>
      </div>

      <div class="print-all-bar" v-if="!fcDetailVisible && !fcSoloFilter && !ctSoloFilter">
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
      <!-- Carte d'aide -->
      <div v-if="helpMode && helpTarget" class="help-card">
        <template v-if="helpTarget === 'search'">
          <h4>🔍 Rechercher</h4>
          <p>Tapez le nom d'un câble pour le retrouver rapidement dans la liste.</p>
        </template>
        <template v-else-if="helpTarget === 'add'">
          <h4>➕ Ajouter un câble</h4>
          <p>Créer un nouveau câble dans le catalogue. Choisissez d'abord le type (HP, Elec...) puis entrez le nom.</p>
        </template>
        <template v-else-if="helpTarget === 'micro'">
          <h4>🎤 Mode Micro</h4>
          <p>Répartir les micros par groupe de musiciens. Chaque groupe correspond à un plateau. La colonne Qté calcule automatiquement le maximum + les spares.</p>
        </template>
        <template v-else-if="helpTarget === 'ctype'">
          <h4>📦 Caisse-type</h4>
          <p>Caisses pré-configurées par l'entreprise. Cliquez sur un titre de colonne pour voir son contenu. Appui long sur un titre pour le renommer.</p>
        </template>
        <template v-else-if="helpTarget === 'select'">
          <h4>✅ Sélectionner</h4>
          <p>Mode sélection : choisir les câbles nécessaires et les répartir par zone (Spare, Main, Front, Sub...).</p>
        </template>
        <template v-else-if="helpTarget === 'fc'">
          <h4>📋 Flightcase</h4>
          <p>Ranger les câbles sélectionnés dans des flightcases. Cliquez sur un titre FC pour voir son contenu. Appui long pour renommer.</p>
        </template>
        <template v-else-if="helpTarget === 'direct'">
          <h4>⚡ Direct dans Flycase</h4>
          <p>Ranger directement les câbles dans les flycases sans passer par la sélection par zone.</p>
        </template>
        <template v-else-if="helpTarget === 'solo'">
          <h4>🔵 Solo (S)</h4>
          <p>Afficher uniquement les câbles qui ont été sélectionnés. Les autres apparaissent en dessous, estompés.</p>
        </template>
        <template v-else-if="helpTarget === 'subtract'">
          <h4>➖ Mode +/−</h4>
          <p>Basculer entre ajouter (+) et retirer (−). En mode −, chaque clic retire une unité.</p>
        </template>
        <template v-else-if="helpTarget === 'step10'">
          <h4>🔟 +10</h4>
          <p>Incrémenter de 10 au lieu de 1 à chaque clic. Utile pour les grandes quantités.</p>
        </template>
      </div>

      <div v-if="helpMode && !helpTarget" class="help-card">
        <h4>❓ Mode Aide</h4>
        <p>Cliquez sur n'importe quel bouton pour voir son explication. Cliquez sur <strong>?</strong> pour quitter l'aide.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, inject } from 'vue'
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
import CtypeList from '../components/CtypeList.vue'
import ButtonCableType from '../components/ButtonCableType.vue'
import { useSettingsStore } from '../stores/settings'
import { useMfcStore } from '../stores/mfc'

const helpMode = inject('helpMode', ref(false))
const helpTarget = ref(null)

function onHelpClick(id, action) {
  if (helpMode.value) {
    helpTarget.value = helpTarget.value === id ? null : id
  } else {
    action()
  }
}

watch(helpMode, (val) => {
  if (!val) helpTarget.value = null
})

const cableStore = useCableStore()
const affairStore = useAffairStore()
const orderStore = useOrderStore()
const settingsStore = useSettingsStore()
const mfcStore = useMfcStore()

onMounted(() => {
  mfcStore.fetchMfcs()
})

const affairIsOpen = ref(false)
const editingAffair = ref(null)
const typeChoose = ref('speaker')
const searchKey = ref('')
const layout = ref('cableTechBase')
const joinedData = ref([])
const directMode = ref(false)
const saving = ref(false)
const activeCableId = ref(null)
const zoneHeaderScroll = ref(null)
const zoneBodyScroll = ref(null)
const fcHeaderScroll = ref(null)
const fcBodyScroll = ref(null)
const ctHeaderScroll = ref(null)
const ctBodyScroll = ref(null)

const scrollRefs = { zoneHeaderScroll, zoneBodyScroll, fcHeaderScroll, fcBodyScroll, ctHeaderScroll, ctBodyScroll }
let isSyncing = false
function syncScroll(source, target) {
  if (isSyncing) return
  isSyncing = true
  const srcEl = scrollRefs[source]?.value
  const tgtEl = scrollRefs[target]?.value
  if (srcEl && tgtEl) {
    tgtEl.scrollLeft = srcEl.scrollLeft
  }
  requestAnimationFrame(() => { isSyncing = false })
}
const subtractMode = ref(false)
const microMode = ref(false)
const microSolo = ref(false)
const soloMode = ref(false)
const incrementStep = ref(1)
const ctMode = ref(false)
const ctSolo = ref(false)
const ctSoloFilter = ref(null)  // null = tous, 1-7 = CT spécifique
const fcSoloFilter = ref(null)  // null = tous, 1-7 = FC spécifique

const fcSolo = ref(false)

function onCtHeaderClick(i) {
  // Clic = solo sur cette colonne, tous types
  if (ctSoloFilter.value === i) {
    // Déjà filtré sur ce CT, on désactive
    ctSolo.value = false
    ctSoloFilter.value = null
    typeChoose.value = 'speaker'
  } else {
    ctSolo.value = true
    ctSoloFilter.value = i
    typeChoose.value = ''  // tous les types
  }
}

function onFcHeaderClick(i) {
  if (fcSoloFilter.value === i) {
    fcSolo.value = false
    fcSoloFilter.value = null
    typeChoose.value = 'speaker'
  } else {
    fcSolo.value = true
    fcSoloFilter.value = i
    typeChoose.value = ''
  }
}

// Long press pour éditer les noms FC/CT
let headerPressTimer = null
let headerDidLongPress = false

function startHeaderPress(type, index) {
  headerDidLongPress = false
  headerPressTimer = setTimeout(() => {
    headerDidLongPress = true
    const currentName = type === 'fc'
      ? (fcLabels[`lfc${index}`] || `FC${index}`)
      : (settingsStore.defaultCtLabels[`ct${index}`] || `CT${index}`)
    const newName = prompt(`Renommer :`, currentName)
    if (newName !== null) {
      if (type === 'fc') {
        fcLabels[`lfc${index}`] = newName
      } else {
        settingsStore.defaultCtLabels[`ct${index}`] = newName
      }
    }
  }, 800)
}

function endHeaderPress(type, index, e) {
  clearTimeout(headerPressTimer)
  if (!headerDidLongPress) {
    if (type === 'fc') {
      onFcHeaderClick(index)
    } else {
      onCtHeaderClick(index)
    }
  }
}

function cancelHeaderPress() {
  clearTimeout(headerPressTimer)
}

function toggleCtMode() {
  ctMode.value = !ctMode.value
  if (ctMode.value) {
    microMode.value = false
    directMode.value = false
    typeChoose.value = 'speaker'
    loadAllCtCables()
  } else {
    typeChoose.value = 'speaker'
  }
}

// { cableid: { 1: count, 2: count, ... } }
const ctAllCounts = ref({})

const ctFilteredCables = computed(() => {
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
const ctMfcIds = ref({}) // { 1: mfcid, 2: mfcid, ... }

async function loadAllCtCables() {
  const counts = {}
  const ids = {}
  for (let i = 1; i <= 7; i++) {
    const ctName = settingsStore.defaultCtLabels[`ct${i}`] || `CT${i}`
    const mfc = mfcStore.mfcs.find(m => m.name === ctName || m.name === `CT${i}`)
    if (!mfc) continue
    ids[i] = mfc.mfcid
    const { data } = await mfcStore.getMfcCables(mfc.mfcid)
    if (data) {
      for (const item of data) {
        if (!counts[item.cableid]) counts[item.cableid] = {}
        counts[item.cableid][i] = item.count
      }
    }
  }
  ctAllCounts.value = counts
  ctMfcIds.value = ids
}

async function onCtCableUpdated({ cableid, ctIndex, count }) {
  // Mettre à jour localement
  if (!ctAllCounts.value[cableid]) ctAllCounts.value[cableid] = {}
  ctAllCounts.value[cableid][ctIndex] = count
  ctAllCounts.value = { ...ctAllCounts.value }

  // Sauvegarder dans Supabase
  let mfcid = ctMfcIds.value[ctIndex]
  if (!mfcid) {
    const ctName = settingsStore.defaultCtLabels[`ct${ctIndex}`] || `CT${ctIndex}`
    const { data } = await mfcStore.addMfc({ name: ctName, info: '' })
    if (data?.[0]) {
      mfcid = data[0].mfcid
      ctMfcIds.value[ctIndex] = mfcid
    } else return
  }
  await mfcStore.setCableMfc(mfcid, cableid, count)
}

function toggleMicroMode() {
  microMode.value = !microMode.value
  if (microMode.value) {
    ctMode.value = false
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
const editForm = reactive({ name: '', type: '', weight: 0, brand: '' })

const typeKeys = ['speaker', 'electrical', 'module', 'special', 'other', 'accessory', 'digital', 'type8', 'type9', 'type10']
const defaultLabels = ['HP', 'Elec', 'Modules', 'Spéciaux', 'Autres', 'Accessoires', 'Numériques', '', '', '']

const cableTypes = computed(() => {
  const all = typeKeys.map((value, i) => ({
    value,
    label: settingsStore.defaultTypeLabels[`type${i + 1}`] || defaultLabels[i]
  })).filter(t => t.label)
  // Ajouter micro et caisse-type (toujours présents)
  all.push({ value: 'microphone', label: 'Micros' })
  all.push({ value: 'c_type', label: 'Caisses-type' })
  return all
})

function typeLabel(type) {
  const found = cableTypes.value.find(t => t.value === type)
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
  editForm.brand = cable.brand || ''
}

async function saveEditCable() {
  if (!editingCable.value) return
  await cableStore.updateCable(editingCable.value.cableid, {
    name: editForm.name,
    type: editForm.type,
    weight: editForm.weight,
    brand: editForm.brand,
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

const fcFields = ['tfc1', 'tfc2', 'tfc3', 'tfc4', 'tfc5', 'tfc6', 'tfc7']

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

function printCtCaisse(ctIndex) {
  const ctName = settingsStore.defaultCtLabels[`ct${ctIndex}`] || `CT${ctIndex}`
  const counts = ctAllCounts.value
  const cables = cableStore.cables
    .filter(c => (counts[c.cableid]?.[ctIndex] || 0) > 0)
    .map(c => ({ name: c.name, type: c.type, qty: counts[c.cableid][ctIndex] }))

  if (cables.length === 0) return

  const typeOrder = ['speaker', 'electrical', 'module', 'microphone', 'digital', 'special', 'other', 'c_type', 'accessory']
  const typeLabels = {
    speaker: 'HP', electrical: 'Électrique', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Caisses-type', accessory: 'Accessoires', digital: 'Digital'
  }

  const groups = {}
  for (const c of cables) {
    if (!groups[c.type]) groups[c.type] = { cables: [], total: 0 }
    groups[c.type].cables.push(c)
    groups[c.type].total += c.qty
  }
  const total = cables.reduce((s, c) => s + c.qty, 0)

  let html = `<html><head><title>${ctName}</title><style>
    body { font-family: sans-serif; padding: 15px; }
    h1 { font-size: 18px; margin: 0 0 15px; }
    .group-title { font-weight: bold; font-size: 13px; padding: 3px 8px; background: #f0f0f0; border-left: 4px solid #ccc; display: flex; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; padding: 2px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
    .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; }
  </style></head><body>`
  html += `<h1>${ctName}</h1>`

  for (const type of typeOrder) {
    if (!groups[type]) continue
    html += `<div class="group-title" style="border-left-color:${colorForType(type)}"><span>${typeLabels[type] || type}</span><span>${groups[type].total}</span></div>`
    for (const cable of groups[type].cables) {
      html += `<div class="row"><span>${cable.name}</span><span>${cable.qty}</span></div>`
    }
  }
  html += `<div class="total">Total: ${total} câbles</div>`
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
    c.active !== false &&
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
    type8: '#ec4899', type9: '#14b8a6', type10: '#a855f7',
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
  max-width: 900px;
  padding: 0 10px;
  text-align: center;
}
@media (min-width: 768px) {
  .content-liste {
    padding: 0 20px;
  }
  .cable-row {
    font-size: 16px;
  }
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
  margin-top: 10px;
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
.step-toggle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 9px;
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
  left: 78px;
}
.step-toggle.active {
  background: #3b82f6;
  border-color: #3b82f6;
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
}
.scroll-inner {
  min-width: fit-content;
}
.sync-header {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-top: 10px;
}
.sync-header::-webkit-scrollbar {
  display: none;
}
.sync-header-inner {
  display: flex;
  align-items: center;
  min-width: fit-content;
  gap: 0;
}
.head-zone-scroll {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0;
  margin-top: 10px;
}
.head-spacer-sticky {
  width: 120px;
  min-width: 120px;
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg, #fff);
}
.ct-btn-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding-bottom: 4px;
}
.mini-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: #fff;
  font-size: 11px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: 26px;
  box-shadow: none;
}
.mini-btn.active {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}
.mini-btn.active-orange {
  background: #eb910a;
  border-color: #eb910a;
  color: #fff;
}
.mini-btn.active-blue {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
.help-wrap {
  position: relative;
  display: inline-flex;
}
.help-card {
  position: fixed;
  bottom: 40px;
  left: 15px;
  right: 15px;
  background: #ef4444;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
  z-index: 300;
}
.help-card h4 {
  font-size: 17px;
  margin-bottom: 6px;
}
.help-card p {
  font-weight: 400;
  font-size: 14px;
  margin: 0;
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
.ct-label-btn {
  background: #06b6d4 !important;
  border: 1px solid #0891b2;
  border-radius: 4px;
  padding: 2px 2px;
  font-size: 8px;
  font-weight: 700;
  color: #fff !important;
  display: inline-block;
  width: 55px;
  height: 18px;
  line-height: 14px;
  text-align: center;
  white-space: nowrap;
  white-space: nowrap;
}
.head-zone-scroll .head-label-angled-fc span,
.sync-header-inner .head-label-angled-fc span {
  left: 28px;
}
.solo-selected {
  outline: 3px solid #ef4444 !important;
  outline-offset: 1px;
}
.fc-clickable {
  cursor: pointer;
}
.fc-label-btn {
  background: var(--color1-light);
  border: 1px solid var(--color1);
  border-radius: 4px;
  padding: 2px 2px;
  font-size: 8px;
  font-weight: 700;
  color: #2c3e50;
  display: inline-block;
  width: 55px;
  height: 18px;
  line-height: 14px;
  text-align: center;
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
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
  transition: all 0.2s;
}
.micro-btn {
  background: #eb910a;
  color: #fff;
}
.micro-btn.active {
  background: #d97706;
  border-color: #fff;
  box-shadow: 0 0 0 3px #eb910a, 0 0 12px rgba(235, 145, 10, 0.5);
  transform: scale(1.05);
}
.ctype-btn {
  background: #06b6d4;
  color: #fff;
}
.ctype-btn.active {
  background: #0891b2;
  border-color: #fff;
  box-shadow: 0 0 0 3px #06b6d4, 0 0 12px rgba(6, 182, 212, 0.5);
  transform: scale(1.05);
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
  font-size: 16px;
  font-weight: 800;
  color: #000;
}
.edit-header .close-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 16px;
  font-weight: 700;
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
.ct-tabs-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  margin: 6px 0;
}
.ct-tab-btn {
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  border: 2px solid #06b6d4;
  border-radius: 6px;
  background: #fff;
  color: #06b6d4;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
}
.ct-tab-btn.active {
  background: #06b6d4;
  color: #fff;
}
.ctype-btn.editing {
  border-color: #ef4444;
  animation: pulse-edit 1s infinite;
}
@keyframes pulse-edit {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.ct-edit-list {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.ct-edit-list .cable-row {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  margin-bottom: 2px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.12);
}
.ct-edit-list .cable-row.row-band .cable-name {
  background: #d5d5d5;
  border-radius: 6px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.ct-edit-list .cable-row.row-active .cable-name {
  border: 1.5px solid var(--color1);
  border-radius: 6px;
  color: var(--color1-dark);
  font-weight: 800;
}
.ct-edit-list .cable-row.row-active .ct-cell {
  border: 1.5px solid var(--color1);
}
.ct-edit-list .cable-name {
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
.ct-edit-list .cable-row:not(.row-band) .ct-cell {
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
.ct-readonly-list {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
.ct-readonly-list .cable-row {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.ct-readonly-list .cable-row.row-band {
  background: #f5f5f5;
}
.ct-readonly-list .cable-name {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  padding-left: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ct-qty {
  width: 40px;
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: #06b6d4;
}
.ct-empty-msg {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}
.ct-total-bar {
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: #666;
}
@media (min-width: 768px) {
  .head-label-angled,
  .head-label-angled-fc {
    width: 46px;
    height: 65px;
  }
  .head-label-angled span,
  .head-label-angled input,
  .head-label-angled-fc span,
  .head-label-angled-fc input {
    font-size: 14px;
  }
  .fc-label-btn {
    width: 50px;
    height: 24px;
    font-size: 13px;
  }
  .head-spacer,
  .head-spacer-fc {
    width: 200px;
    min-width: 200px;
  }
}
</style>
