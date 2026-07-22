<template>
  <div>
    <ModalDelete v-if="cableToDelete" @close="cableToDelete = null">
      <template #main>
        <p class="delete-question">{{ micsOnly ? 'Supprimer ce micro de la liste ?' : 'Supprimer ce câble ?' }}</p>
        <h2 class="delete-name">{{ cableToDelete.name }}</h2>
        <div class="delete-actions">
          <button class="btn-confirm-delete" @click="confirmDelete">Supprimer</button>
          <button class="btn-confirm-cancel" @click="cableToDelete = null">Annuler</button>
        </div>
      </template>
      <template #footer></template>
    </ModalDelete>

    <AddCable v-if="showAddCable" :catalog-id="activeCatalogId" @close="showAddCable = false" />

    <!-- Sélecteur de département (son/lumière/vidéo) — selon les départements du profil -->
    <div v-if="!micsOnly && deptCatalogs.length > 1" class="dept-tabs">
      <button
        v-for="c in deptCatalogs"
        :key="c.catalogid"
        class="dept-tab"
        :class="[c.department, { active: activeCatalogId === c.catalogid }]"
        @click="selectDept(c.catalogid)"
      >{{ DEPT_LABELS[c.department] || c.name }}</button>
    </div>

    <ButtonCableType v-if="!micsOnly" :model-value="typeChoose" :show-all="true" :exclude-micro="true" @select="typeChoose = $event" />

    <div class="ajouter">
      <button class="button3" v-if="!showAddCable && !micsOnly" @click="showAddCable = true">
        Ajouter un élément
      </button>
      <button v-if="showAddCable && !micsOnly" @click="showAddCable = false">Fermer</button>
      <span class="search-wrap">
        <input type="text" v-model="searchKey" :placeholder="micsOnly ? 'Rechercher un micro' : 'Rechercher un élément'" />
        <button v-if="searchKey" class="search-clear" @click="searchKey = ''" title="Effacer">✕</button>
      </span>
    </div>

    <div class="home">
      <div class="head">
        <span class="head-spacer"></span>
        <div>seuil</div>
        <div>total</div>
        <div>poids</div>
        <div>ordre</div>
        <span class="head-end"></span>
      </div>
      <MasterCableList
        :cables="filteredCables"
        :group-by-brand="micsOnly"
        @delete="cableToDelete = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCableStore } from '../stores/cables'
import { useCatalogStore } from '../stores/catalogs'
import ModalDelete from '../components/ModalDelete.vue'
import AddCable from '../components/AddCable.vue'
import MasterCableList from '../components/MasterCableList.vue'
import ButtonCableType from '../components/ButtonCableType.vue'

const props = defineProps({ micsOnly: { type: Boolean, default: false } })
const cableStore = useCableStore()
const catalogStore = useCatalogStore()
const typeChoose = ref(props.micsOnly ? 'microphone' : 'speaker')
const showAddCable = ref(false)
const searchKey = ref('')
const cableToDelete = ref(null)

const DEPT_LABELS = { sound: 'Son', light: 'Lumière', video: 'Vidéo' }
const deptCatalogs = ref([]) // catalogues départements du profil (entreprise ou freelance)
const activeCatalogId = ref(parseInt(localStorage.getItem('cablemaster-catalogid')) || 1)

async function loadDeptCatalogs() {
  if (props.micsOnly) return
  const companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || null
  const userId = localStorage.getItem('cablemaster-userid') || null
  const cats = await catalogStore.fetchDepartmentCatalogs({ companyId, userId })
  deptCatalogs.value = cats
  // Sélection par défaut : le catalogue primaire courant s'il est dans la liste, sinon le 1er.
  if (cats.length && !cats.find(c => c.catalogid === activeCatalogId.value)) {
    activeCatalogId.value = cats[0].catalogid
  }
}

function selectDept(catId) {
  activeCatalogId.value = catId
  cableStore.fetchCables(catId)
}

onMounted(async () => {
  await loadDeptCatalogs()
  cableStore.fetchCables(activeCatalogId.value)
})

const searchFiltered = computed(() =>
  cableStore.cables.filter(c =>
    c.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
)

const filteredCables = computed(() => {
  // Page Micro List : uniquement les micros. Page câbles : tout sauf les micros.
  if (props.micsOnly) return searchFiltered.value.filter(c => c.type === 'microphone')
  const base = searchFiltered.value.filter(c => c.type !== 'microphone')
  if (typeChoose.value === '') return base
  return base.filter(c => c.type === typeChoose.value)
})

async function confirmDelete() {
  if (cableToDelete.value) {
    await cableStore.deleteCable(cableToDelete.value.cableid)
    cableToDelete.value = null
  }
}
</script>

<style scoped>
.dept-tabs {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 8px 10px 0;
}
.dept-tab {
  border: 1px solid rgba(128, 128, 128, 0.4);
  background: transparent;
  color: var(--text, #333);
  border-radius: 16px;
  padding: 4px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.65;
}
.dept-tab.active { opacity: 1; color: #fff; }
.dept-tab.sound.active { background: #2563eb; border-color: #2563eb; }
.dept-tab.light.active { background: #d97706; border-color: #d97706; }
.dept-tab.video.active { background: #7c3aed; border-color: #7c3aed; }
.ajouter {
  margin: 10px;
}
.button3 {
  cursor: pointer;
  margin: 10px;
  padding: 8px 14px;
  min-width: 50px;
  background: var(--color3);
  color: #000;
  border: 1px solid #000;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
}
.buttonv {
  cursor: pointer;
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: var(--color1);
  border: 1px solid #000;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.delete-question {
  font-size: 14px;
  color: var(--text-light, #888);
  margin-bottom: 6px;
}
.delete-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--text, #333);
  margin-bottom: 16px;
}
.delete-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.btn-confirm-delete {
  padding: 10px 20px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.btn-confirm-cancel {
  padding: 10px 20px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.head {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
  box-sizing: border-box;
  padding: 5px 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: var(--text, #f0f0f0);
  /* en-tête figé en haut au défilement */
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--bg, #fff);
}
/* spacer = case à cocher + nom (grandit) → les titres se décalent à droite, en face des champs */
.head-spacer { flex: 1; min-width: 70px; }
.head-end { width: 22px; min-width: 22px; flex: none; } /* face au bouton supprimer */
.head div {
  width: 44px;
  min-width: 44px;
  flex: none;
  box-sizing: border-box;
  text-align: center;
}
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}
</style>
