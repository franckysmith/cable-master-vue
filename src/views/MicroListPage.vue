<template>
  <div class="micro-list-page">
    <!-- Deux faces de la même page : ce que j'ai retenu, et le vivier où piocher -->
    <div class="mlp-bar">
      <div class="mlp-switch">
        <button class="mlp-tab" :class="{ active: !showLib }" @click="showLib = false">Ma liste</button>
        <button class="mlp-tab" :class="{ active: showLib }" @click="showLib = true">Bibliothèque</button>
      </div>
      <p v-if="showLib" class="mlp-hint">Touche un micro pour l'ajouter à ta liste (✓), touche-le à nouveau pour le retirer.</p>
    </div>

    <MicLibrary v-if="showLib" ref="libRef" />
    <CableList v-else :mics-only="true" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CableList from './CableList.vue'
import MicLibrary from './MicLibrary.vue'

// La bibliothèque écrit directement dans ma liste (plus de Modifier /
// Enregistrer) : on coche, on revient sur « Ma liste », c'est là.
const showLib = ref(false)
const libRef = ref(null)
</script>

<style scoped>
.mlp-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
/* Bascule Ma liste / Bibliothèque */
.mlp-switch {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: var(--bg-card, #eee);
  border: 1px solid var(--border-light, #ccc);
}
.mlp-tab {
  padding: 8px 20px;
  min-width: auto;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-muted, #888);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: none;
}
.mlp-tab.active { background: var(--color1); color: #fff; }
.mlp-hint { width: 100%; margin: 0; text-align: center; font-size: 12px; font-style: italic; color: var(--text-muted, #888); }
</style>
