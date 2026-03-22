<template>
  <div class="list_container">
    <div v-for="cable in cables" :key="cable.cableid" class="cable-row" :class="{ inactive: cable.active === false }">
      <input
        type="checkbox"
        :checked="cable.active !== false"
        @change="toggleActive(cable)"
        class="cable-active"
      />
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

function toggleActive(cable) {
  const newVal = cable.active === false ? true : false
  cableStore.updateCable(cable.cableid, { active: newVal })
  cable.active = newVal
}
</script>

<style scoped>
.list_container {
  width: 100%;
  padding: 0 8px;
}
.cable-row {
  display: flex;
  align-items: center;
  margin: 1px 0;
  border-bottom: 1px solid var(--border-light, #eee);
  padding: 4px 0;
}
.cable-row.inactive {
  opacity: 0.4;
}
.cable-row.inactive .cable-name {
  text-decoration: line-through;
}
.cable-name {
  width: 100px;
  min-width: 100px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text, #333);
}
.cable-fields {
  display: flex;
  gap: 2px;
  flex: 1;
}
.cable-fields input {
  width: 44px;
  text-align: center;
  font-size: 13px;
  padding: 4px 2px;
  border: 1px solid var(--border-light, #ddd);
  border-radius: 4px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
}
.cable-active {
  width: 18px;
  height: 18px;
  margin-right: 4px;
  flex-shrink: 0;
  cursor: pointer;
}
.btn-delete {
  cursor: pointer;
  margin-left: 4px;
  background: transparent;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 4px;
  font-size: 11px;
  padding: 3px 6px;
  color: var(--text-muted, #999);
  box-shadow: none;
  min-width: auto;
}
</style>
