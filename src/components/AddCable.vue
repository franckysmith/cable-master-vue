<template>
  <div class="add-cable">
    <h3>Ajouter un élément</h3>
    <form @submit.prevent="submit">
      <input v-model="form.name" placeholder="Nom" required />
      <select v-model="form.type">
        <option value="">-- Type --</option>
        <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
      </select>
      <input v-model.number="form.weight" type="number" placeholder="Poids" />
      <input v-model.number="form.total" type="number" placeholder="Total" />
      <input v-model.number="form.reserved" type="number" placeholder="Réservé" />
      <input v-model="form.info" placeholder="Info" />
      <input v-model="form.link" placeholder="Lien" />
      <button type="submit">Ajouter</button>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useCableStore } from '../stores/cables'

const emit = defineEmits(['close'])
const cableStore = useCableStore()

const types = ['electrical', 'speaker', 'microphone', 'module', 'special', 'other', 'c_type', 'accessory', 'digital']

const form = reactive({
  name: '',
  type: '',
  weight: 0,
  total: 0,
  reserved: 0,
  info: '',
  link: '',
})

async function submit() {
  const { error } = await cableStore.addCable({ ...form })
  if (!error) {
    Object.assign(form, { name: '', type: '', weight: 0, total: 0, reserved: 0, info: '', link: '' })
    emit('close')
  }
}
</script>

<style scoped>
.add-cable {
  padding: 10px;
}
.add-cable input,
.add-cable select {
  margin: 3px;
  padding: 4px;
}
.add-cable button {
  cursor: pointer;
  margin: 5px;
  padding: 5px 15px;
  background: var(--color3);
  border: 1px solid #000;
  border-radius: 4px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>
