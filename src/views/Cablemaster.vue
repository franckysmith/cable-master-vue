<template>
  <div>
    <ModalDelete v-if="cableToDelete" @close="cableToDelete = null">
      <template #main>
        <h2>{{ cableToDelete.name }}</h2>
        <button @click="confirmDelete">Supprimer</button>
      </template>
      <template #footer>
        <button class="buttonv" @click="cableToDelete = null">Non</button>
      </template>
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
        <div class="head-active">✓</div>
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

onMounted(() => {
  cableStore.fetchCables()
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
  padding: 5px;
  min-width: 50px;
  background: var(--color3);
  border: 1px solid #000;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
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
.head {
  display: flex;
  margin-left: 118px;
  text-align: left;
  font-size: 12px;
  gap: 16px;
}
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 90vh;
}
</style>
