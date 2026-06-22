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

// Démarrer la synchronisation offline
startSyncListener()
// Tenter de vider la queue au lancement
flushQueue()
