import { createRouter, createWebHistory } from 'vue-router'
import Cabletech from './views/Cabletech.vue'
import CableList from './views/CableList.vue'
import MasterAffaire from './views/MasterAffaire.vue'
import FlightType from './views/FlightType.vue'
import About from './views/About.vue'
import Settings from './views/Settings.vue'
import MicLibrary from './views/MicLibrary.vue'
import CompanySetup from './views/CompanySetup.vue'
import TechList from './views/TechList.vue'
import TimelineView from './views/TimelineView.vue'
import ShareView from './views/ShareView.vue'

const routes = [
  { path: '/', component: Cabletech },
  { path: '/CableList', component: CableList },
  { path: '/MasterAffaire', component: MasterAffaire },
  { path: '/FlightType', component: FlightType },
  { path: '/micros', component: MicLibrary },
  { path: '/company', component: CompanySetup },
  { path: '/techlist', component: TechList },
  { path: '/timeline', component: TimelineView },
  { path: '/settings', component: Settings },
  { path: '/share/:token', component: ShareView },
  { path: '/about', component: About },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Seuls les masters peuvent modifier les câbles / cablekits / affaires.
// L'entreprise n'est gérable que par le super-admin (master principal).
const masterOnly = ['/CableList', '/FlightType', '/MasterAffaire', '/techlist', '/timeline']
const superOnly = ['/company']

router.beforeEach((to) => {
  const role = localStorage.getItem('cablemaster-role') || 'technician'
  const isSuper = localStorage.getItem('cablemaster-superadmin') === 'true'
  const isMaster = isSuper || role === 'master'
  if (superOnly.includes(to.path) && !isSuper) return '/'
  if (masterOnly.includes(to.path) && !isMaster) return '/'
  return true
})
