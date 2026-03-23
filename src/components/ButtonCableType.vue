<template>
  <div class="post">
    <button
      v-for="t in types"
      :key="t.value"
      @click="$emit('select', t.value)"
      :class="{
        selectedtype: modelValue === t.value,
        distributed: distributedTypes[t.value]
      }"
    >
      {{ t.label }}
    </button>
    <button
      @click="$emit('select', '')"
      :class="{ selectedtype: modelValue === '' }"
    >All</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

const props = defineProps({
  modelValue: { type: String, default: 'speaker' },
  distributedTypes: { type: Object, default: () => ({}) },
  showAll: { type: Boolean, default: false },
})
defineEmits(['select'])

const settingsStore = useSettingsStore()

const typeKeys = ['speaker', 'electrical', 'module', 'special', 'other', 'accessory', 'digital', 'type8', 'type9', 'type10']
const defaultLabels = ['HP', 'Elec', 'Modules', 'Spéciaux', 'Autres', 'Accessoires', 'Numériques', '', '', '']

const types = computed(() => {
  const list = typeKeys.map((value, i) => {
    const label = settingsStore.defaultTypeLabels[`type${i + 1}`] || defaultLabels[i]
    return { value, label }
  }).filter(t => t.label)
  if (props.showAll) {
    list.push({ value: 'microphone', label: 'Micros' })
    list.push({ value: 'c_type', label: 'Caisses-type' })
  }
  return list
})
</script>

<style scoped>
.post button {
  cursor: pointer;
  margin: 3px;
  padding: 5px;
  min-width: 50px;
  background: #ccc;
  border: 1px solid #999;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  color: #555;
  font-size: 12px;
  transition: background 0.3s, color 0.3s;
}
.post button.distributed {
  background: var(--color1);
  border-color: #3ab548;
  color: #fff;
}
.post button.selectedtype {
  color: #fff;
  background: #888;
  border-color: #666;
}
.post button.selectedtype.distributed {
  background: #2ea83a;
  border-color: #259330;
}
</style>
