<template>
  <div class="add-affair q-pa-md">
    <h3 class="text-h6 q-mb-md">{{ isEditing ? 'Modifier l\'affaire' : 'Nouvelle Affaire' }}</h3>
    <q-form @submit.prevent="submit" class="q-gutter-sm">
      <q-input v-model="form.name" label="Nom" dense outlined :rules="[val => !!val || 'Requis']" />
      <q-input v-model="form.tech_name" label="Technicien" dense outlined :rules="[val => !!val || 'Requis']" />

      <q-select
        v-model="form.catalog_id"
        :options="catalogOptions"
        label="Liste de câbles"
        dense
        outlined
        emit-value
        map-options
        option-value="value"
        option-label="label"
      />

      <q-input v-model="form.ref" label="Référence" dense outlined />
      <q-input v-model="form.description" label="Description" type="textarea" dense outlined autogrow />

      <div class="row q-col-gutter-xs">
        <div class="col-6">
          <q-input v-model="form.receipt_date" label="Réception" type="date" dense outlined stack-label :rules="[val => !!val || 'Requis']" />
        </div>
        <div class="col-6">
          <q-input v-model="form.return_date" label="Retour" type="date" dense outlined stack-label :rules="[val => !!val || 'Requis']" />
        </div>
        <div class="col-6">
          <q-input v-model="form.prep_date" label="Prépa" type="date" dense outlined stack-label />
        </div>
      </div>

      <div class="row q-gutter-md q-mt-xs">
        <q-checkbox v-model="form.front" label="Front" dense />
        <q-checkbox v-model="form.monitor" label="Monitor" dense />
        <q-checkbox v-model="form.stage" label="Stage" dense />
      </div>

      <div class="row q-gutter-sm q-mt-md">
        <q-btn type="submit" :label="isEditing ? 'Enregistrer' : 'Créer'" color="primary" unelevated />
        <q-btn label="Annuler" flat @click="$emit('close')" />
        <q-btn v-if="isEditing" label="Supprimer" color="negative" flat @click="deleteAffair" />
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch } from 'vue'
import { useAffairStore } from '../stores/affairs'
import { useCatalogStore } from '../stores/catalogs'
import { useSettingsStore } from '../stores/settings'

const props = defineProps({
  affair: { type: Object, default: null },
})

const emit = defineEmits(['close', 'created'])
const affairStore = useAffairStore()
const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()

const isEditing = computed(() => !!props.affair)

const catalogOptions = computed(() => [
  { label: '-- Toutes les listes --', value: '' },
  ...catalogStore.catalogs.map(cat => ({
    label: cat.name + (cat.owner_name ? ` (${cat.owner_name})` : ''),
    value: cat.catalogid,
  })),
])

onMounted(() => {
  catalogStore.fetchCatalogs()
})

const form = reactive({
  name: '',
  tech_name: '',
  tech_id: 1,
  ref: '',
  description: '',
  receipt_date: '',
  return_date: '',
  prep_date: '',
  front: false,
  monitor: false,
  stage: false,
  done: false,
  catalog_id: '',
})

// Pré-remplir en mode édition
watch(() => props.affair, (affair) => {
  if (affair) {
    form.name = affair.name || ''
    form.tech_name = affair.tech_name || ''
    form.tech_id = affair.tech_id || 1
    form.ref = affair.ref || ''
    form.description = affair.description || ''
    form.receipt_date = affair.receipt_date || ''
    form.return_date = affair.return_date || ''
    form.prep_date = affair.prep_date || ''
    form.front = affair.front || false
    form.monitor = affair.monitor || false
    form.stage = affair.stage || false
    form.done = affair.done || false
    form.catalog_id = affair.catalog_id || ''
  }
}, { immediate: true })

async function submit() {
  const payload = { ...form }
  if (!payload.catalog_id) payload.catalog_id = null
  if (!payload.prep_date) payload.prep_date = null

  // Pour une nouvelle affaire, inclure les noms par défaut des zones/FC
  if (!isEditing.value) {
    const dz = settingsStore.defaultZoneLabels
    const df = settingsStore.defaultFcLabels
    for (let i = 1; i <= 6; i++) payload[`lz${i}`] = dz[`lz${i}`] || ''
    for (let i = 1; i <= 7; i++) payload[`lfc${i}`] = df[`lfc${i}`] || ''
  }

  if (isEditing.value) {
    const { error } = await affairStore.updateAffair(props.affair.affairid, payload)
    if (!error) {
      emit('created', { ...props.affair, ...payload })
    }
  } else {
    const { data, error } = await affairStore.addAffair(payload)
    if (!error && data?.length) {
      emit('created', data[0])
    }
  }
}

async function deleteAffair() {
  if (!confirm(`Supprimer "${form.name}" ?`)) return
  await affairStore.deleteAffair(props.affair.affairid)
  emit('close')
}
</script>
