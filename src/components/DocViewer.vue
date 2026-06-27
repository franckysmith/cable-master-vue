<template>
  <div v-if="docs.length" class="doc-viewer" :class="drawerOpen ? 'side-right' : 'side-left'">
    <div class="doc-head">
      <select v-if="docs.length > 1" v-model="idx" class="doc-select">
        <option v-for="(d, i) in docs" :key="i" :value="i">{{ d.name }}</option>
      </select>
      <span v-else class="doc-single">{{ cur.name }}</span>
      <a :href="cur.url" target="_blank" class="doc-open" title="Ouvrir dans un onglet">↗</a>
    </div>
    <div class="doc-body">
      <img v-if="isImg(cur)" :src="cur.url" class="doc-media" alt="" />
      <iframe v-else :src="cur.url" class="doc-media" frameborder="0"></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const props = defineProps({ affair: { type: Object, default: null } })
// Drawer ouvert → la gauche est prise → on affiche le panneau à droite ; sinon à gauche
const drawerOpen = inject('drawerOpen', ref(false))
const idx = ref(0)

const docs = computed(() => {
  const a = props.affair
  if (!a) return []
  const names = a.attachment_name ? a.attachment_name.split(',').filter(Boolean) : []
  const urls = a.attachment_url ? a.attachment_url.split(',') : []
  return names.map((n, i) => ({ name: n, url: urls[i] || '' })).filter(d => d.url)
})
watch(docs, () => { if (idx.value >= docs.value.length) idx.value = 0 })
const cur = computed(() => docs.value[idx.value] || { name: '', url: '' })
function isImg(d) { return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(d.url || '') }
</script>

<style scoped>
/* Caché par défaut (mobile) — affiché uniquement sur grand écran, à gauche du contenu */
.doc-viewer { display: none; }
@media (min-width: 1200px) {
  .doc-viewer {
    display: flex; flex-direction: column; gap: 8px;
    position: fixed; top: 64px; bottom: 16px; width: 340px; z-index: 60;
    background: var(--bg-card, #1a1a2e); border: 1px solid var(--border, #3a3a55);
    border-radius: 12px; padding: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  }
  /* Gauche libre (drawer fermé) → à gauche ; gauche prise (drawer ouvert) → à droite */
  .doc-viewer.side-left { left: 16px; right: auto; }
  .doc-viewer.side-right { right: 16px; left: auto; }
}
@media (min-width: 1600px) { .doc-viewer { width: 440px; } }
.doc-head { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.doc-select {
  flex: 1; min-width: 0; padding: 6px 8px; border-radius: 8px;
  border: 1px solid var(--border-light, #444); background: var(--bg-input, #2a2a45);
  color: var(--text, #e0e0e0); font-size: 13px; font-weight: 700;
}
.doc-single { flex: 1; min-width: 0; font-size: 13px; font-weight: 700; color: var(--text, #e0e0e0); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-open { flex-shrink: 0; text-decoration: none; color: var(--color1); font-size: 18px; font-weight: 800; padding: 0 4px; }
.doc-body { flex: 1; min-height: 0; border-radius: 8px; overflow: hidden; background: #fff; }
.doc-media { width: 100%; height: 100%; object-fit: contain; display: block; background: #fff; }
</style>
