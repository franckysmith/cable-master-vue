<template>
  <div class="master-affaire">
    <h2>Master Affaire</h2>
    <Affaires @selected="onSelect" @openNew="showAdd = true" />
    <AddAffair v-if="showAdd" @close="showAdd = false" @created="showAdd = false" />
    <div v-if="selected" class="detail">
      <h3>{{ selected.name }}</h3>
      <p>Tech: {{ selected.tech_name }}</p>
      <p>Réception: {{ selected.receipt_date }} - Retour: {{ selected.return_date }}</p>
      <p>{{ selected.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Affaires from '../components/Affaires.vue'
import AddAffair from '../components/AddAffair.vue'

const selected = ref(null)
const showAdd = ref(false)

function onSelect(affair) {
  selected.value = affair
}
</script>

<style scoped>
.master-affaire {
  padding: 20px;
}
.detail {
  margin-top: 20px;
  text-align: left;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
