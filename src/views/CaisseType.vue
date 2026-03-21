<template>
  <div class="caisse-type">
    <h2>Caisses Type (MFC)</h2>
    <div class="mfc-list">
      <div v-for="mfc in mfcStore.mfcs" :key="mfc.mfcid" class="mfc-row">
        <span class="mfc-name" @click="selectMfc(mfc)">{{ mfc.name }}</span>
        <span class="mfc-info">{{ mfc.info }}</span>
        <button @click="deleteMfc(mfc.mfcid)">x</button>
      </div>
    </div>
    <div class="add-mfc">
      <input v-model="newName" placeholder="Nom MFC" />
      <input v-model="newInfo" placeholder="Info" />
      <button @click="addMfc">Ajouter</button>
    </div>
    <div v-if="selectedMfc" class="mfc-cables">
      <h3>Câbles dans {{ selectedMfc.name }}</h3>
      <div v-for="item in mfcCables" :key="item.cableid" class="cable-row">
        <span>{{ item.cable?.name || item.cableid }}</span>
        <span>x{{ item.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMfcStore } from '../stores/mfc'

const mfcStore = useMfcStore()
const newName = ref('')
const newInfo = ref('')
const selectedMfc = ref(null)
const mfcCables = ref([])

onMounted(() => {
  mfcStore.fetchMfcs()
})

async function addMfc() {
  if (!newName.value) return
  await mfcStore.addMfc({ name: newName.value, info: newInfo.value })
  newName.value = ''
  newInfo.value = ''
}

async function deleteMfc(mfcid) {
  await mfcStore.deleteMfc(mfcid)
}

async function selectMfc(mfc) {
  selectedMfc.value = mfc
  const { data } = await mfcStore.getMfcCables(mfc.mfcid)
  mfcCables.value = data || []
}
</script>

<style scoped>
.caisse-type {
  padding: 20px;
}
.mfc-list {
  margin: 15px 0;
}
.mfc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px;
  border-bottom: 1px solid #eee;
}
.mfc-name {
  cursor: pointer;
  font-weight: bold;
  width: 150px;
}
.mfc-info {
  color: #888;
  font-size: 12px;
}
.add-mfc {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}
.add-mfc input {
  padding: 5px;
}
.add-mfc button {
  cursor: pointer;
  padding: 5px 15px;
  background: var(--color1);
  border: 1px solid #000;
  border-radius: 4px;
}
.mfc-cables {
  margin-top: 20px;
}
.cable-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid #eee;
}
</style>
