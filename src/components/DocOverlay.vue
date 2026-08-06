<template>
  <div v-if="url" class="doc-overlay" @click.self="$emit('close')">
    <div class="doc-panel">
      <div class="doc-head">
        <span class="doc-title">{{ title }}</span>
        <a class="doc-newtab" :href="url" target="_blank" rel="noopener" title="Ouvrir dans un onglet">↗</a>
        <button class="doc-close" @click="$emit('close')" title="Fermer" aria-label="Fermer">✕</button>
      </div>
      <iframe class="doc-frame" :src="url" title="Document"></iframe>
    </div>
  </div>
</template>

<script setup>
// Affiche un document (fiche PDF…) par-dessus la page plutôt que dans un onglet
// à côté : on reste dans l'app, on ferme d'un bouton. Le lien ↗ reste utile là
// où le navigateur refuse d'afficher un PDF en iframe (iOS notamment).
defineProps({
  url: { type: String, default: '' },
  title: { type: String, default: '' },
})
defineEmits(['close'])
</script>

<style scoped>
.doc-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.65);
}
.doc-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  height: 100%;
  max-height: 92vh;
  overflow: hidden;
  background: var(--bg-card, #fff);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}
.doc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #1f2937;
  color: #fff;
}
.doc-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 800;
}
.doc-newtab,
.doc-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 8px;
}
.doc-close { background: #dc2626; }
.doc-frame {
  flex: 1;
  width: 100%;
  border: none;
  background: #fff;
}
</style>
