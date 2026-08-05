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

    <ButtonCableType
      v-if="!micsOnly"
      :model-value="typeChoose"
      :show-all="true"
      :exclude-micro="true"
      :department="activeDepartment"
      @select="typeChoose = $event"
    />

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
        <div v-if="showStock">seuil</div>
        <div v-if="showStock">total</div>
        <div>poids</div>
        <div>ordre</div>
        <span class="head-end"></span>
      </div>
      <MasterCableList
        :cables="filteredCables"
        :group-by-brand="micsOnly"
        :show-stock="showStock"
        @delete="cableToDelete = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCableStore } from '../stores/cables'
import { useCatalogStore } from '../stores/catalogs'
import { useAuthStore } from '../stores/auth'
import ModalDelete from '../components/ModalDelete.vue'
import AddCable from '../components/AddCable.vue'
import MasterCableList from '../components/MasterCableList.vue'
import ButtonCableType from '../components/ButtonCableType.vue'
import { DEPT_ORDER, activeDept, typeAllowedInDept } from '../lib/departments'

const props = defineProps({ micsOnly: { type: Boolean, default: false } })
const cableStore = useCableStore()
const catalogStore = useCatalogStore()
const typeChoose = ref(props.micsOnly ? 'microphone' : 'speaker')
const showAddCable = ref(false)
const searchKey = ref('')
const cableToDelete = ref(null)

// Seuil et total sont des notions de parc : une entreprise possède du matériel,
// un freelance non — sa liste dit ce qu'il utilise, les quantités se saisissent
// dans l'affaire.
const auth = useAuthStore()
const showStock = computed(() => auth.profile?.type !== 'freelance')

const deptCatalogs = ref([]) // catalogues départements du profil (entreprise ou freelance)
// Le métier affiché est choisi dans le drawer (Câbles Son / Lumière / Vidéo) ;
// on en déduit le catalogue à charger. `cablemaster-catalogid`, le catalogue
// "primaire" que lit le reste de l'app, n'est pas touché.
const activeDepartment = computed(() => (props.micsOnly ? 'sound' : activeDept.value))

const activeCatalogId = computed(() => {
  const match = deptCatalogs.value.find(c => c.department === activeDepartment.value)
  return (
    match?.catalogid ||
    deptCatalogs.value[0]?.catalogid ||
    parseInt(localStorage.getItem('cablemaster-catalogid')) ||
    1
  )
})

async function loadDeptCatalogs() {
  if (props.micsOnly) return
  const companyId = parseInt(localStorage.getItem('cablemaster-companyid')) || null
  const userId = localStorage.getItem('cablemaster-userid') || null
  const cats = await catalogStore.fetchDepartmentCatalogs({ companyId, userId })
  deptCatalogs.value = [...cats].sort(
    (a, b) => DEPT_ORDER.indexOf(a.department) - DEPT_ORDER.indexOf(b.department)
  )
}

// Le type sélectionné (HP, Modules…) peut ne pas exister dans le département
// où l'on arrive : on retombe alors sur le premier onglet proposé.
function ensureValidType() {
  if (props.micsOnly) return
  if (!typeAllowedInDept(typeChoose.value, activeDepartment.value)) {
    typeChoose.value = activeDepartment.value === 'sound' ? 'speaker' : 'electrical'
  }
}

onMounted(async () => {
  await loadDeptCatalogs()
  ensureValidType()
  cableStore.fetchCables(activeCatalogId.value)
})

// Changement de métier depuis le drawer → on recharge la liste correspondante.
watch(activeCatalogId, (id) => {
  ensureValidType()
  if (id) cableStore.fetchCables(id)
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
