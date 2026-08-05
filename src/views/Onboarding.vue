<template>
  <div class="onb-wrap">
    <div class="onb-card">
      <div class="onb-brand"><b>Bienvenue</b></div>
      <p class="onb-sub">Dis-nous qui tu es — tu n'atterriras pas au même endroit.</p>

      <!-- Étape 1 : choix du type -->
      <template v-if="!choice">
        <div class="onb-choices">
          <button class="onb-choice" @click="choice = 'freelance'">
            <q-icon name="person" size="34px" />
            <span class="onb-choice-title">Freelance / indépendant</span>
            <span class="onb-choice-desc">J'ai ma propre liste de câbles (copie du standard, modifiable).</span>
          </button>
          <button class="onb-choice" @click="choice = 'company'">
            <q-icon name="apartment" size="34px" />
            <span class="onb-choice-title">Une entreprise</span>
            <span class="onb-choice-desc">Je gère une société avec son catalogue et ses techniciens.</span>
          </button>
        </div>
      </template>

      <!-- Étape 2a : freelance -->
      <template v-else-if="choice === 'freelance'">
        <q-input v-model="displayName" label="Ton nom (affiché sur tes listes)" outlined dense autofocus class="onb-input" />
        <div class="onb-depts">
          <span class="onb-depts-label">Tu fais :</span>
          <q-checkbox v-model="freelanceDepts" val="sound" label="Son" />
          <q-checkbox v-model="freelanceDepts" val="light" label="Lumière" />
          <q-checkbox v-model="freelanceDepts" val="video" label="Vidéo" />
        </div>
        <div class="onb-actions">
          <q-btn flat label="Retour" @click="choice = ''" :disable="loading" />
          <q-btn label="Créer ma liste" color="primary" unelevated :loading="loading" :disable="!freelanceReady" @click="submitFreelance" />
        </div>
      </template>

      <!-- Étape 2b : entreprise -->
      <template v-else>
        <q-input v-model="company.name" label="Nom de l'entreprise" outlined dense autofocus class="onb-input" />
        <q-input v-model="company.shortName" label="Nom court (optionnel)" outlined dense class="onb-input" />
        <div class="onb-depts">
          <span class="onb-depts-label">Départements :</span>
          <q-checkbox v-model="company.departments" val="sound" label="Son" />
          <q-checkbox v-model="company.departments" val="light" label="Lumière" />
          <q-checkbox v-model="company.departments" val="video" label="Vidéo" />
        </div>
        <div class="onb-actions">
          <q-btn flat label="Retour" @click="choice = ''" :disable="loading" />
          <q-btn label="Créer l'entreprise" color="primary" unelevated :loading="loading" :disable="!companyReady" @click="submitCompany" />
        </div>
      </template>

      <p v-if="error" class="onb-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { provisionFreelance, provisionCompany } from '../lib/provisioning'

const auth = useAuthStore()
const router = useRouter()

const choice = ref('')
const loading = ref(false)
const error = ref('')

const displayName = ref('')
const freelanceDepts = ref(['sound'])
const freelanceReady = computed(() => displayName.value.trim() && freelanceDepts.value.length > 0)
const company = reactive({ name: '', shortName: '', departments: ['sound'] })
const companyReady = computed(() => company.name.trim() && company.departments.length > 0)

onMounted(() => {
  // Pré-remplir le nom depuis l'e-mail (partie avant @)
  const email = auth.user?.email || ''
  displayName.value = email.split('@')[0] || ''
  // Sécurité : si déjà un profil (auto-link), sortir de l'onboarding
  if (auth.hasProfile) router.replace('/')
})

async function submitFreelance() {
  loading.value = true
  error.value = ''
  const { error: err } = await provisionFreelance({
    userId: auth.user.id,
    displayName: displayName.value.trim(),
    email: auth.user.email || '',
    departments: freelanceDepts.value,
  })
  if (err) { error.value = err.message || 'Erreur à la création.'; loading.value = false; return }
  await auth.resolveProfile()
  loading.value = false
  router.replace('/CableList')
}

async function submitCompany() {
  loading.value = true
  error.value = ''
  const { error: err } = await provisionCompany({
    userId: auth.user.id,
    name: company.name.trim(),
    shortName: company.shortName.trim(),
    departments: company.departments,
    email: auth.user.email || '',
    resp: {},
  })
  if (err) { error.value = err.message || 'Erreur à la création.'; loading.value = false; return }
  await auth.resolveProfile()
  loading.value = false
  router.replace('/company')
}
</script>

<style scoped>
.onb-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: linear-gradient(160deg, #1b1030 0%, #2a1650 100%); }
.onb-card {
  width: 100%; max-width: 440px; text-align: center; color: #222;
  background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px;
  padding: 32px 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.08);
}
.onb-brand { font-size: 22px; }
.onb-sub { color: #666; margin: 8px 0 22px; font-size: 14px; }
.onb-choices { display: flex; flex-direction: column; gap: 14px; }
.onb-choice {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px;
  background: #fafafa; cursor: pointer; transition: all .15s;
  /* carte blanche : on impose la couleur du texte, sinon le thème sombre
     global peint les <button> en blanc → titres invisibles */
  color: #1a1a2e;
}
.onb-choice:hover { border-color: var(--q-primary, #1976d2); background: #f0f6ff; }
.onb-choice :deep(.q-icon) { color: #4a3d7a; }
.onb-choice-title { font-weight: 600; font-size: 16px; color: #1a1a2e; }
.onb-choice-desc { color: #555; font-size: 13px; }
.onb-input { margin-bottom: 12px; text-align: left; }
.onb-depts { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 6px 0 16px; }
.onb-depts-label { color: #666; font-size: 14px; }
.onb-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; }
.onb-error { color: #c62828; margin-top: 14px; font-size: 13px; }

/* La carte est blanche même en mode sombre : on force le texte des composants
   Quasar en noir, sinon les règles globales `.dark .q-…` les rendent illisibles
   (gris très clair sur blanc) — cases à cocher Son / Lumière / Vidéo, champs. */
.onb-card :deep(.q-checkbox__label),
.onb-card :deep(.q-field__native),
.onb-card :deep(.q-field__input),
.onb-card :deep(.q-field__prefix),
.onb-card :deep(.q-field__suffix) { color: #1a1a2e !important; }
.onb-card :deep(.q-field__label) { color: #666 !important; }
.onb-card :deep(.q-field--outlined .q-field__control) { border-color: rgba(0,0,0,0.24) !important; }
.onb-card :deep(.q-checkbox__inner) { color: rgba(0,0,0,0.6); }
.onb-card :deep(.q-checkbox__inner--truthy) { color: var(--q-primary, #1976d2); }
.onb-card :deep(.q-btn--flat) { color: #444 !important; }
</style>
