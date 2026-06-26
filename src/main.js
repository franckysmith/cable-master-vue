import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'
import quasarLangFr from 'quasar/lang/fr'
import { router } from './router'
import App from './App.vue'

// Quasar styles
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

import './style.css'
import { startSyncListener, flushQueue } from './lib/syncService'

const app = createApp(App)
app.use(createPinia())
app.use(Quasar, { lang: quasarLangFr })
app.use(router)
app.mount('#app')

// Désactiver le zoom de la page (pincement iOS + double-tap + Ctrl/molette desktop)
// — c'est lui qui provoquait le "flottement" horizontal une fois zoomé.
// IMPORTANT : ne PAS bloquer sur les champs de saisie / en-têtes éditables, sinon
// le preventDefault tactile empêche iOS d'ouvrir le clavier (appui long → édition).
function isInteractiveTarget(t) {
  return !!(t && t.closest && t.closest(
    'input, textarea, select, [contenteditable="true"], .head-label-angled, .head-label-angled-fc'
  ))
}
;['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
  document.addEventListener(ev, (e) => { if (!isInteractiveTarget(e.target)) e.preventDefault() }, { passive: false })
)
let lastTouchEnd = 0
document.addEventListener('touchend', (e) => {
  if (isInteractiveTarget(e.target)) return
  const now = Date.now()
  if (now - lastTouchEnd <= 300) e.preventDefault() // bloque le double-tap zoom
  lastTouchEnd = now
}, { passive: false })
document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault() }, { passive: false })
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault()
})

// En DEV : supprimer tout service worker / cache laissé par un build de prod
// (sinon il resert l'ancien bundle et masque les modifications). Retiré du build prod.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {})
  if (window.caches?.keys) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {})
}

// Démarrer la synchronisation offline
startSyncListener()
// Tenter de vider la queue au lancement
flushQueue()
