import { createRouter, createWebHistory } from 'vue-router'
import Cabletech from './views/Cabletech.vue'
import CableList from './views/CableList.vue'
import MasterAffaire from './views/MasterAffaire.vue'
import FlightType from './views/FlightType.vue'
import About from './views/About.vue'
import Settings from './views/Settings.vue'
import MicLibrary from './views/MicLibrary.vue'
import CompanySetup from './views/CompanySetup.vue'
import ShareView from './views/ShareView.vue'

const routes = [
  { path: '/', component: Cabletech },
  { path: '/CableList', component: CableList },
  { path: '/MasterAffaire', component: MasterAffaire },
  { path: '/FlightType', component: FlightType },
  { path: '/micros', component: MicLibrary },
  { path: '/company', component: CompanySetup },
  { path: '/settings', component: Settings },
  { path: '/share/:token', component: ShareView },
  { path: '/about', component: About },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
