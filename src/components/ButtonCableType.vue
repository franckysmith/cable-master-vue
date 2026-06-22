<template>
  <div class="post">
    <button
      v-for="t in types"
      :key="t.value"
      class="type-btn"
      @click="$emit('select', t.value)"
      :class="{
        selectedtype: modelValue === t.value,
        'has-cables': (counts[t.value] || 0) > 0,
        distributed: distributedTypes[t.value],
      }"
      :style="(counts[t.value] || 0) > 0 ? { borderColor: colorFor(t.value) } : null"
    >
      {{ t.label }}
      <span v-if="counts[t.value]" class="type-count" :style="{ background: colorFor(t.value) }">{{ counts[t.value] }}</span>
    </button>
    <button
      class="type-btn"
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
  counts: { type: Object, default: () => ({}) },
  showAll: { type: Boolean, default: false },
})
defineEmits(['select'])

const settingsStore = useSettingsStore()

const TYPE_COLORS = {
  speaker: 'var(--color1)', electrical: '#f3e309', microphone: '#eb910a',
  module: '#3b82f6', special: '#ef4444', other: '#8b5cf6',
  c_type: '#06b6d4', accessory: '#84cc16', digital: '#f97316',
  type8: '#ec4899', type9: '#14b8a6', type10: '#a855f7',
}
function colorFor(value) {
  return TYPE_COLORS[value] || '#999'
}

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
.post {
  min-height: 56px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.type-btn {
  position: relative;
  cursor: pointer;
  margin: 3px;
  padding: 5px 8px;
  min-width: 50px;
  background: var(--bg-card, #ccc);
  border: 2px solid var(--border-light, #999);
  box-sizing: border-box;
  box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  color: var(--text, #555);
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
/* Sélectionné : fond mis en avant */
.type-btn.selectedtype {
  color: #fff;
  background: #555;
  border-color: #555;
}
/* Pastille quantité (couleur du type) */
.type-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: 5px;
  padding: 0 5px;
  border-radius: 9px;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  vertical-align: middle;
}
/* Tout distribué : coche verte */
.type-btn.distributed::after {
  content: '✓';
  margin-left: 4px;
  color: #22c55e;
  font-weight: 900;
}
.type-btn.selectedtype.distributed::after {
  color: #bbf7d0;
}
</style>
