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
        over: overTypes[t.value],
        distributed: (counts[t.value] || 0) > 0 && distributedTypes[t.value] && !overTypes[t.value],
      }"
      :style="(alwaysColor || (counts[t.value] || 0) > 0) ? { borderColor: colorFor(t.value) } : null"
    >
      {{ t.label }}
      <span v-if="counts[t.value]" class="type-count" :style="{ background: colorFor(t.value) }">{{ counts[t.value] }}</span>
    </button>
    <button
      class="type-btn"
      @click="$emit('select', '')"
      :class="{ selectedtype: modelValue === '', distributed: allDone && !anyOver, over: anyOver }"
    >All</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

const props = defineProps({
  modelValue: { type: String, default: 'speaker' },
  distributedTypes: { type: Object, default: () => ({}) },
  overTypes: { type: Object, default: () => ({}) },
  counts: { type: Object, default: () => ({}) },
  showAll: { type: Boolean, default: false },
  alwaysColor: { type: Boolean, default: false }, // borde toujours les onglets de leur couleur (sans chiffres)
})
defineEmits(['select'])

const settingsStore = useSettingsStore()

const TYPE_COLORS = {
  speaker: 'var(--color1)', electrical: '#f3e309', microphone: '#eb910a',
  module: '#ef4444', special: '#3b82f6', other: '#a16207',
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
    list.push({ value: 'c_type', label: 'Cablekit' })
  }
  return list
})

// Tout distribué : tous les types qui ont des câbles sont rangés
const allDone = computed(() => {
  const withCables = types.value.filter(t => (props.counts[t.value] || 0) > 0)
  return withCables.length > 0 && withCables.every(t => props.distributedTypes[t.value])
})
// Au moins un câble en trop quelque part → erreur globale
const anyOver = computed(() => Object.values(props.overTypes).some(Boolean))
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
  color: #111;
  font-size: 11px;
  font-weight: 800;
  vertical-align: middle;
}
/* Coche « tout rangé » : place réservée en permanence (invisible), verte quand distribué */
.type-btn::after {
  content: '✓';
  margin-left: 4px;
  font-weight: 900;
  color: transparent;
}
.type-btn.distributed::after {
  color: #22c55e;
}
.type-btn.selectedtype.distributed::after {
  color: #bbf7d0;
}
/* Erreur : un câble en trop → croix rouge */
.type-btn.over::after {
  content: '✗';
  color: #ef4444;
}
</style>
