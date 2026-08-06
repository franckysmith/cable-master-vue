<template>
  <div v-if="visible" class="info-banner">
    <div class="info-texts">
      <p class="info-fr">{{ fr }}</p>
      <p class="info-en">{{ en }}</p>
    </div>
    <div class="info-actions">
      <button class="info-ok" @click="dismiss(true)">Compris / Got it</button>
      <button class="info-close" @click="dismiss(false)" title="Fermer / Close" aria-label="Fermer">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Bandeau d'explication : lisible d'un coup d'œil, en français ET en anglais
// (l'app se partage entre techniciens qui ne parlent pas tous français).
// « Compris » = on ne le réaffiche plus jamais ; la croix ne ferme que pour
// cette fois-ci, on le reverra à la prochaine visite.
const props = defineProps({
  id: { type: String, required: true }, // identifiant de mémorisation
  fr: { type: String, required: true },
  en: { type: String, required: true },
})

const storageKey = `cablemaster-seen-${props.id}`
const visible = ref(localStorage.getItem(storageKey) !== '1')

function dismiss(forever) {
  if (forever) localStorage.setItem(storageKey, '1')
  visible.value = false
}
</script>

<style scoped>
.info-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 10px;
  color: #422006; /* toujours sur fond clair : texte sombre imposé */
}
.info-texts { flex: 1; min-width: 220px; }
.info-fr,
.info-en {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
}
.info-fr { font-weight: 700; }
.info-en { margin-top: 3px; font-style: italic; opacity: 0.85; }
.info-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.info-ok {
  cursor: pointer;
  padding: 7px 14px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  background: #b45309;
  border: none;
  border-radius: 8px;
}
.info-close {
  cursor: pointer;
  width: 30px;
  height: 30px;
  font-size: 16px;
  font-weight: 800;
  color: #422006;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 8px;
}
@media (max-width: 480px) {
  .info-fr, .info-en { font-size: 15px; }
}
</style>
