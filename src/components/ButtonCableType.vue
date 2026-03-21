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
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: 'speaker' },
  distributedTypes: { type: Object, default: () => ({}) },
})
defineEmits(['select'])

const types = [
  { value: 'speaker', label: 'HP' },
  { value: 'electrical', label: 'Elec' },
  { value: 'module', label: 'Modules' },
  { value: 'special', label: 'Spéciaux' },
  { value: 'other', label: 'Autres' },
  { value: 'accessory', label: 'Accessoires' },
  { value: 'digital', label: 'Numériques' },
]
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
