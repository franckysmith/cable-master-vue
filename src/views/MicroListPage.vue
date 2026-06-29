<template>
  <div class="micro-list-page">
    <div class="mlp-bar">
      <template v-if="!showLib">
        <button class="mlp-lib-btn" @click="showLib = true">📚 Bibliothèque des micros</button>
      </template>
      <template v-else>
        <template v-if="!libEdit">
          <button class="mlp-back-btn" @click="showLib = false">← Retour à la liste</button>
          <div class="mlp-squares">
            <button class="mlp-sq mlp-sq-edit" @click="libEdit = true">✏️ Modifier votre liste de micros</button>
            <button class="mlp-sq mlp-sq-add" @click="libRef?.toggleAdd?.()">➕ Ajouter un micro à la bibliothèque</button>
          </div>
        </template>
        <template v-else>
          <button class="mlp-save-btn" @click="saveEdit">✅ Enregistrer et voir ma liste</button>
          <button class="mlp-cancel-btn" @click="cancelEdit">Annuler</button>
          <span class="mlp-edit-hint">Touche les micros à ajouter/retirer à ta liste, puis Enregistrer</span>
        </template>
      </template>
    </div>

    <MicLibrary v-if="showLib" ref="libRef" :edit-mode="libEdit" />
    <CableList v-else :mics-only="true" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CableList from './CableList.vue'
import MicLibrary from './MicLibrary.vue'

const showLib = ref(false)
const libEdit = ref(false)
const libRef = ref(null)

async function saveEdit() {
  if (libRef.value?.saveChanges) await libRef.value.saveChanges()
  libEdit.value = false
  showLib.value = false // retour à la liste → on voit les micros ajoutés
}
function cancelEdit() {
  libRef.value?.cancelChanges?.()
  libEdit.value = false
}
</script>

<style scoped>
.mlp-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
.mlp-lib-btn { padding: 9px 16px; border: 1px solid var(--color1); border-radius: 10px; background: var(--color1); color: #fff; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: none; min-width: auto; }
.mlp-back-btn { padding: 9px 16px; border: 1px solid var(--border-light, #ccc); border-radius: 10px; background: var(--bg-card, #f5f5f5); color: var(--text, #333); font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
/* Deux carrés égaux côte à côte */
.mlp-squares { display: flex; gap: 10px; width: 100%; max-width: 460px; margin: 0 auto; }
.mlp-sq {
  flex: 1 1 0; min-width: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 12px 10px; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  color: #fff; font-size: 14px; font-weight: 800; text-align: center; line-height: 1.2;
}
.mlp-sq-edit { background: #16a34a; }
.mlp-sq-add { background: #8b5cf6; }
.mlp-sq:active { transform: scale(0.97); }
.mlp-save-btn { padding: 9px 14px; border: none; border-radius: 10px; background: #16a34a; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: none; min-width: auto; }
.mlp-cancel-btn { padding: 9px 14px; border: 1px solid var(--border-light, #ccc); border-radius: 10px; background: transparent; color: var(--text-muted, #888); font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto; }
.mlp-edit-hint { font-size: 12px; color: var(--text-muted, #888); font-style: italic; width: 100%; text-align: center; }
</style>
