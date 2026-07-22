import { createRouter, createWebHistory } from 'vue-router'
import Cabletech from './views/Cabletech.vue'
import CableList from './views/CableList.vue'
import MicroListPage from './views/MicroListPage.vue'
import MasterAffaire from './views/MasterAffaire.vue'
import FlightType from './views/FlightType.vue'
import About from './views/About.vue'
import Settings from './views/Settings.vue'
import MicLibrary from './views/MicLibrary.vue'
import CompanySetup from './views/CompanySetup.vue'
import TechList from './views/TechList.vue'
import ShareView from './views/ShareView.vue'
import Login from './views/Login.vue'
import Onboarding from './views/Onboarding.vue'
import { useAuthStore } from './stores/auth'

const routes = [
  { path: '/login', component: Login },
  { path: '/onboarding', component: Onboarding },
  { path: '/', component: Cabletech },
  { path: '/CableList', component: CableList },
  { path: '/miclist', component: MicroListPage },
  { path: '/MasterAffaire', component: MasterAffaire },
  { path: '/FlightType', component: FlightType },
  { path: '/micros', component: MicLibrary },
  { path: '/company', component: CompanySetup },
  { path: '/techlist', component: TechList },
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
// Outils de liste : accessibles au master d'entreprise ET au freelance (sa propre liste).
const listEditRoutes = ['/CableList', '/miclist', '/FlightType']
// Pages entreprise : master d'entreprise uniquement.
const companyMasterRoutes = ['/MasterAffaire', '/techlist']
const superOnly = ['/company']

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ready

  // Lien de partage : public (lecture seule par token)
  if (to.path.startsWith('/share/')) return true

  // Non connecté → login
  if (!auth.isAuthed) return to.path === '/login' ? true : '/login'

  // Connecté mais sans profil (freelance/entreprise pas encore choisi) → onboarding
  if (!auth.hasProfile) return to.path === '/onboarding' ? true : '/onboarding'

  // Connecté + profil : login/onboarding n'ont plus lieu d'être
  if (to.path === '/login' || to.path === '/onboarding') return '/'

  // Contrôle de rôle (rôle réel issu du profil)
  const isSuper = !!auth.profile?.isSuper
  const isMaster = isSuper || auth.profile?.role === 'master'
  const isFreelance = auth.profile?.type === 'freelance'
  if (superOnly.includes(to.path) && !isSuper) return '/'
  if (companyMasterRoutes.includes(to.path) && !isMaster) return '/'
  if (listEditRoutes.includes(to.path) && !isMaster && !isFreelance) return '/'
  return true
})
