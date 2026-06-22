<template>
  <div class="date-field">
    <q-input
      :model-value="displayValue"
      :label="label"
      dense
      outlined
      stack-label
      readonly
      placeholder="jj/mm/aaaa"
      class="date-field-input"
    >
      <template #append>
        <q-icon name="event" />
      </template>
    </q-input>
    <q-popup-proxy v-model="open" cover transition-show="jump-up" transition-hide="jump-down">
      <q-date
        :model-value="modelValue || ''"
        mask="YYYY-MM-DD"
        minimal
        dark
        color="deep-purple-5"
        today-btn
        class="cm-date"
        @update:model-value="onPick"
      />
    </q-popup-proxy>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const [y, m, d] = props.modelValue.split('-')
  return d && m && y ? `${d}/${m}/${y}` : props.modelValue
})

function onPick(val) {
  emit('update:modelValue', val || '')
  open.value = false
}
</script>

<style scoped>
.date-field { position: relative; cursor: pointer; }
.date-field :deep(.q-field__native),
.date-field :deep(.q-field__append) { cursor: pointer; }
</style>

<style>
/* Calendrier (popup) — thème sombre arrondi, teinte mauve de l'app */
.cm-date.q-date {
  background: #1e1b2e;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  width: 290px;
  max-width: 92vw;
}
.cm-date .q-date__header {
  background: #8b5cf6;
  border-radius: 16px 16px 0 0;
}
.cm-date .q-date__calendar-item .q-btn .q-btn__content {
  font-weight: 600;
}
/* Jour sélectionné en mauve plein */
.cm-date .q-date__calendar-item--in .q-btn--unelevated.bg-deep-purple-5 {
  background: #8b5cf6 !important;
}
.cm-date .q-date__calendar-item--in .q-btn .q-focus-helper { display: none; }
</style>
