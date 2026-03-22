<template>
  <div>
    <ModalDelete v-if="cableToDelete" @close="cableToDelete = null">
      <template #main>
        <p class="delete-question">Supprimer ce câble ?</p>
        <h2 class="delete-name">{{ cableToDelete.name }}</h2>
        <div class="delete-actions">
          <button class="btn-confirm-delete" @click="confirmDelete">Supprimer</button>
          <button class="btn-confirm-cancel" @click="cableToDelete = null">Annuler</button>
        </div>
      </template>
      <template #footer></template>
    </ModalDelete>

    <AddCable v-if="showAddCable" @close="showAddCable = false" />

    <ButtonCableType :model-value="typeChoose" :show-all="true" @select="typeChoose = $event" />

    <div class="ajouter">
      <button class="button3" v-if="!showAddCable" @click="showAddCable = true">
        Ajouter un élément
      </button>
      <button v-if="showAddCable" @click="showAddCable = false">Fermer</button>
      <input type="text" v-model="searchKey" placeholder="Rechercher un élément" />
    </div>

    <div class="home">
      <div class="head">
        <div>seuil</div>
        <div>total</div>
        <div>poids</div>
        <div>ordre</div>
      </div>
      <MasterCableList
        :cables="filteredCables"
        @delete="cableToDelete = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCableStore } from '../stores/cables'
import ModalDelete from '../components/ModalDelete.vue'
import AddCable from '../components/AddCable.vue'
import MasterCableList from '../components/MasterCableList.vue'
import ButtonCableType from '../components/ButtonCableType.vue'

const cableStore = useCableStore()
const typeChoose = ref('speaker')
const showAddCable = ref(false)
const searchKey = ref('')
const cableToDelete = ref(null)

const activeCatalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || 1

onMounted(() => {
  cableStore.fetchCables(activeCatalogId)
})

const searchFiltered = computed(() =>
  cableStore.cables.filter(c =>
    c.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
)

const filteredCables = computed(() => {
  if (typeChoose.value === '') return searchFiltered.value
  return searchFiltered.value.filter(c => c.type === typeChoose.value)
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
  margin-left: 60px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-light, #888);
}
.head div {
  width: 44px;
  text-align: center;
}
.head .head-active {
  width: 20px;
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
