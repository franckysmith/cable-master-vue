<template>
  <div class="add-affair q-pa-md">
    <h3 class="text-h6 q-mb-md">{{ isEditing ? 'Modifier l\'affaire' : 'Nouvelle Affaire' }}</h3>
    <q-form class="q-gutter-sm" @submit.prevent>
      <q-input v-model="form.name" label="Nom de l'affaire / Artiste" dense outlined :rules="[val => !!val || 'Requis']" />

      <q-input
        :model-value="activeCatalogName"
        label="Liste de câbles"
        dense
        outlined
        disable
        readonly
      />

      <q-input v-model="form.ref" label="Référence" dense outlined disable readonly />
      <q-input v-model="form.description" label="Description" type="textarea" dense outlined autogrow />

      <div class="row q-col-gutter-xs">
        <div class="col-6">
          <q-input v-model="form.receipt_date" label="Sortie" type="date" dense outlined stack-label :rules="[val => !!val || 'Requis']" />
        </div>
        <div class="col-6">
          <q-input v-model="form.return_date" label="Retour" type="date" dense outlined stack-label :rules="[val => !!val || 'Requis']" />
        </div>
        <div class="col-6">
          <q-input v-model="form.prep_date" label="Prépa" type="date" dense outlined stack-label />
        </div>
      </div>

      <div class="row q-gutter-md q-mt-xs">
        <q-checkbox v-model="form.front" label="Façade" dense />
        <q-checkbox v-model="form.monitor" label="Retour" dense />
        <q-checkbox v-model="form.stage" label="Scène" dense />
      </div>

      <div class="row q-gutter-sm q-mt-md">
        <div v-if="submitError" style="color: #ef4444; font-size: 13px; font-weight: 600; margin-bottom: 6px;">{{ submitError }}</div>
        <q-btn :label="isEditing ? 'Enregistrer' : 'Créer'" color="primary" unelevated @click="submit" />
        <q-btn label="Annuler" flat @click="$emit('close')" />
        <q-btn v-if="isEditing" label="Supprimer" color="negative" flat @click="deleteAffair" />
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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

const activeCatalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || 1
const activeCatalogName = computed(() => {
  const cat = catalogStore.catalogs.find(c => c.catalogid === activeCatalogId)
  return cat ? cat.name : 'Ma liste'
})

onMounted(() => {
  catalogStore.fetchCatalogs()
})

const form = reactive({
  name: '',
  tech_name: '',
  tech_firstname: '',
  tech_email: '',
  tech_phone: '',
  tech_id: 1,
  ref: '',
  description: '',
  receipt_date: '',
  return_date: '',
  prep_date: '',
  front: true,
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
    form.tech_firstname = affair.tech_firstname || ''
    form.tech_email = affair.tech_email || ''
    form.tech_phone = affair.tech_phone || ''
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

const submitError = ref('')

async function submit() {
  submitError.value = ''

  if (!form.name) { submitError.value = 'Le nom est obligatoire'; return }
  if (!form.receipt_date) { submitError.value = 'La date de sortie est obligatoire'; return }
  if (!form.return_date) { submitError.value = 'La date de retour est obligatoire'; return }

  const payload = { ...form }
  payload.catalog_id = activeCatalogId
  if (!payload.prep_date) payload.prep_date = null

  // Remplir les infos technicien depuis le profil
  const userId = localStorage.getItem('cablemaster-userid') || 'T'
  const techId = parseInt(localStorage.getItem('cablemaster-techid')) || 0
  payload.tech_id = techId
  try {
    const profile = JSON.parse(localStorage.getItem(`cablemaster-profile-${userId}`) || '{}')
    payload.tech_name = profile.lastname || profile.firstname || userId
    payload.tech_firstname = profile.firstname || ''
    payload.tech_email = profile.email || ''
    payload.tech_phone = profile.phone || ''
  } catch {
    payload.tech_name = userId
  }

  // Pour une nouvelle affaire, inclure les noms par défaut des zones/FC
  if (!isEditing.value) {
    const dz = settingsStore.defaultZoneLabels
    const df = settingsStore.defaultFcLabels
    for (let i = 1; i <= 6; i++) payload[`lz${i}`] = dz[`lz${i}`] || ''
    for (let i = 1; i <= 7; i++) payload[`lfc${i}`] = df[`lfc${i}`] || ''
  }

  if (isEditing.value) {
    const { error } = await affairStore.updateAffair(props.affair.affairid, payload)
    if (error) { submitError.value = 'Erreur: ' + error.message; return }
    emit('created', { ...props.affair, ...payload })
  } else {
    const { data, error } = await affairStore.addAffair(payload)
    if (error) { submitError.value = 'Erreur: ' + error.message; return }
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
