import { createRouter, createWebHistory } from 'vue-router'
import Cabletech from './views/Cabletech.vue'
import Cablemaster from './views/Cablemaster.vue'
import MasterAffaire from './views/MasterAffaire.vue'
import CaisseType from './views/CaisseType.vue'
import About from './views/About.vue'
import Settings from './views/Settings.vue'
import MicLibrary from './views/MicLibrary.vue'
import CompanySetup from './views/CompanySetup.vue'

const routes = [
  { path: '/', component: Cabletech },
  { path: '/Cablemaster', component: Cablemaster },
  { path: '/MasterAffaire', component: MasterAffaire },
  { path: '/CaisseType', component: CaisseType },
  { path: '/micros', component: MicLibrary },
  { path: '/company', component: CompanySetup },
  { path: '/settings', component: Settings },
  { path: '/about', component: About },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
