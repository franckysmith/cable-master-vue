<template>
  <div class="list_container">
    <div v-for="cable in cables" :key="cable.cableid" class="cable-row">
      <div class="cable-name">{{ cable.name }}</div>
      <div class="cable-fields">
        <input
          type="number"
          :value="cable.reserved"
          @change="update(cable, 'reserved', $event)"
          title="seuil"
        />
        <input
          type="number"
          :value="cable.total"
          @change="update(cable, 'total', $event)"
          title="total"
        />
        <input
          type="number"
          :value="cable.weight"
          @change="update(cable, 'weight', $event)"
          title="poids"
        />
        <input
          type="number"
          :value="cable.sortno"
          @change="update(cable, 'sortno', $event)"
          title="ordre"
        />
      </div>
      <button class="btn-delete" @click="$emit('delete', cable)">x</button>
    </div>
  </div>
</template>

<script setup>
import { useCableStore } from '../stores/cables'

defineProps({
  cables: { type: Array, default: () => [] },
})
const emit = defineEmits(['delete'])
const cableStore = useCableStore()

function update(cable, field, event) {
  const value = parseInt(event.target.value) || 0
  cableStore.updateCable(cable.cableid, { [field]: value })
}
</script>

<style scoped>
.list_container {
  width: 375px;
}
.cable-row {
  display: flex;
  align-items: center;
  margin: 2px 0;
  border-bottom: 1px solid #eee;
  padding: 2px 0;
}
.cable-name {
  width: 120px;
  text-align: left;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cable-fields {
  display: flex;
  gap: 4px;
}
.cable-fields input {
  width: 40px;
  text-align: center;
  font-size: 12px;
}
.btn-delete {
  cursor: pointer;
  margin-left: 5px;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 10px;
  padding: 2px 5px;
}
</style>
