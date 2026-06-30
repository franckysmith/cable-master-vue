<template>
  <transition-group name="col" tag="div" class="split-view" :style="{ gridTemplateColumns: `repeat(${split.columns}, minmax(0, 1fr))` }">
    <div v-for="i in split.columns" :key="i" class="split-col">
      <div class="split-col-bar">
        <select class="split-col-select" :value="isDoc(split.routes[i - 1]) ? '__doc' : split.routes[i - 1]" @change="onPick(i - 1, $event)">
          <option v-for="p in PAGES" :key="p.path" :value="p.path">{{ p.label }}</option>
          <option v-if="isDoc(split.routes[i - 1])" value="__doc">📄 Document</option>
        </select>
        <a :href="rawHref(split.routes[i - 1])" target="_blank" class="split-col-open" title="Ouvrir dans un onglet">↗</a>
      </div>
      <iframe :src="iframeSrc(split.routes[i - 1])" class="split-col-frame" frameborder="0" :title="`Colonne ${i}`" loading="lazy"></iframe>
    </div>
  </transition-group>
</template>

<script setup>
import { useSplitViewStore } from '../stores/splitView'

const split = useSplitViewStore()

const PAGES = [
  { label: 'Master Affaire', path: '/MasterAffaire' },
  { label: 'CableList', path: '/CableList' },
  { label: 'Bibliothèque Micros', path: '/micros' },
  { label: 'Cablekit', path: '/FlightType' },
  { label: 'TechList', path: '/techlist' },
  { label: 'Home (câblage)', path: '/' },
]

// Une colonne contient un document si ce n'est pas une route interne (http… ou un fichier)
function isDoc(r) { return /^https?:\/\//i.test(r || '') || /\.(pdf|png|jpe?g|gif|webp)(\?|$)/i.test(r || '') }
function rawHref(r) { return isDoc(r) ? r : iframeSrc(r) }

// URL de l'iframe : doc/URL → tel quel ; route interne → on ajoute nochrome=1 (cache header/drawer)
function iframeSrc(r) {
  if (isDoc(r)) return r
  const sep = (r || '/').includes('?') ? '&' : '?'
  return (r || '/') + sep + 'nochrome=1'
}

function onPick(i, e) {
  const v = e.target.value
  if (v && v !== '__doc') split.setRoute(i, v)
}
</script>

<style scoped>
.split-view {
  display: grid;
  gap: 8px;
  width: 100%;
  height: calc(100dvh - 56px); /* sous le header */
  padding: 4px;
  box-sizing: border-box;
}
/* Ouverture douce des colonnes */
.col-enter-active { transition: opacity 0.28s ease, transform 0.28s ease; }
.col-leave-active { transition: opacity 0.18s ease; }
.col-enter-from { opacity: 0; transform: scale(0.96) translateY(10px); }
.col-leave-to { opacity: 0; }
.split-col {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--border, #d0d0d0);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.split-col-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: var(--bg-card, #f3f3f3);
  border-bottom: 1px solid var(--border-light, #ddd);
  flex-shrink: 0;
}
.split-col-select {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  background: var(--bg-input, #fff);
  color: var(--text, #222);
}
.split-col-open {
  flex-shrink: 0;
  text-decoration: none;
  color: var(--color1, #2563eb);
  font-size: 16px;
  font-weight: 800;
  padding: 0 4px;
}
.split-col-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #fff;
}
</style>
