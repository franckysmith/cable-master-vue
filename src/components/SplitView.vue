<template>
  <transition-group name="col" tag="div" class="split-view" :style="{ gridTemplateColumns: split.gridTemplate }">
    <!-- Plus de barre de sélection : on choisit la page dans le drawer, qui
         demande ensuite dans quelle colonne la poser. -->
    <div v-for="i in split.columns" :key="i" class="split-col">
      <iframe :src="iframeSrc(split.routes[i - 1])" class="split-col-frame" frameborder="0" :title="`Colonne ${i}`" loading="lazy"></iframe>
    </div>
  </transition-group>
</template>

<script setup>
import { useSplitViewStore } from '../stores/splitView'

const split = useSplitViewStore()

// Une colonne contient un document si ce n'est pas une route interne (http… ou un fichier)
function isDoc(r) { return /^https?:\/\//i.test(r || '') || /\.(pdf|png|jpe?g|gif|webp)(\?|$)/i.test(r || '') }

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
  /* Filet de sécurité : si le `grid-template-columns` en ligne manquait (le temps
     d'un rechargement à chaud, par exemple), les colonnes s'empilaient les unes
     sous les autres. Par défaut, on reste en colonnes. */
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
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
.split-col-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: 0;
  background: #fff;
}
</style>
