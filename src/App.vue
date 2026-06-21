<template>
  <q-layout view="hHh LpR fFf">
    <!-- ===== Header (le vrai haut) ===== -->
    <q-header class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="drawer = !drawer" />
        <q-toolbar-title class="app-title">
          <span class="brand">cinod</span>
        </q-toolbar-title>
        <q-space />
        <router-link to="/about" class="header-link" title="À propos">About</router-link>
        <router-link to="/micros" class="header-icon" title="Bibliothèque Micros">🎤</router-link>
        <router-link to="/settings" class="header-icon" title="Réglages">&#9881;</router-link>
        <span class="help-btn" :class="{ active: helpMode }" @click="helpMode = !helpMode" title="Aide">?</span>
        <span class="user-selector" @click="showUserMenu = !showUserMenu">
          {{ currentUserLabel }}
        </span>
      </q-toolbar>

      <!-- Bandeaux d'état -->
      <div v-if="!online" class="offline-bar">Mode hors-ligne</div>
      <div v-if="userRole === 'master' && companyName" class="company-bar">
        🏢 {{ companyName }}
      </div>
    </q-header>

    <!-- ===== Drawer (menu latéral) ===== -->
    <q-drawer v-model="drawer" side="left" bordered :width="260" :breakpoint="599" class="app-drawer">
      <q-scroll-area class="fit">
        <div class="drawer-brand">
          <span class="drawer-brand-name">cinod</span>
          <span class="drawer-brand-sub">CableTech</span>
        </div>
        <q-list padding>
          <!-- Employeurs -->
          <q-expansion-item
            v-if="employerItems.length"
            label="Employeurs"
            icon="business"
            default-opened
            header-class="drawer-group"
          >
            <q-item
              v-for="it in employerItems"
              :key="it.to"
              clickable
              :to="it.to"
              active-class="drawer-active"
              @click="closeDrawerOnMobile"
            >
              <q-item-section avatar><q-icon :name="it.icon" /></q-item-section>
              <q-item-section>{{ it.label }}</q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- Techniciens -->
          <q-expansion-item
            label="Techniciens"
            icon="engineering"
            default-opened
            header-class="drawer-group"
          >
            <q-item
              clickable
              to="/"
              active-class="drawer-active"
              @click="closeDrawerOnMobile"
            >
              <q-item-section avatar><q-icon name="cable" /></q-item-section>
              <q-item-section>CableTech</q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- ===== Contenu (centré, type application) ===== -->
    <q-page-container>
      <q-page class="app-page">
        <div class="app-content">
          <router-view />
        </div>
      </q-page>
    </q-page-container>

    <!-- Menu sélecteur d'utilisateur (super admin) -->
    <div v-if="showUserMenu" class="user-menu">
      <div class="user-menu-title">Super Admin</div>
      <div class="user-menu-group">
        <button v-for="u in users" :key="u.id" class="user-btn" :class="[u.role, { active: currentUser === u.id }]" @click="switchUser(u)">
          {{ u.label }}
        </button>
      </div>
    </div>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from './lib/supabase'

const $q = useQuasar()
const online = ref(navigator.onLine)
const helpMode = ref(false)
// Desktop (web) : drawer ouvert par défaut et persistant (ferme uniquement via le bouton).
// Mobile : overlay qui se referme après navigation.
const isDesktop = computed(() => $q.screen.gt.sm)
const drawer = ref($q.screen.gt.sm)
function closeDrawerOnMobile() {
  if (!isDesktop.value) drawer.value = false
}
provide('helpMode', helpMode)

const users = [
  { id: 'T', label: 'T', role: 'technician', name: 'Franck (Admin)', superadmin: true, techId: 0 },
  { id: 'T1', label: 'T1', role: 'technician', name: 'Franck', techId: 1 },
  { id: 'T2', label: 'T2', role: 'technician', name: 'Robert', techId: 2 },
  { id: 'T3', label: 'T3', role: 'technician', name: 'Michel', techId: 3 },
  { id: 'M', label: 'M', role: 'master', name: 'Super Admin Master', superadmin: true, techId: 0, catalogId: null, companyId: null },
  { id: 'M1', label: 'M1', role: 'master', name: 'Pierre (TarPo)', techId: 11, catalogId: 4, companyId: 1 },
  { id: 'M2', label: 'M2', role: 'master', name: 'Sophie (TarPo)', techId: 12, catalogId: 4, companyId: 1 },
  { id: 'M3', label: 'M3', role: 'master', name: 'Jean (TarPo)', techId: 13, catalogId: 4, companyId: 1 },
]

const currentUser = ref(localStorage.getItem('cablemaster-userid') || 'T')
const showUserMenu = ref(false)

const currentUserObj = computed(() => users.find(u => u.id === currentUser.value) || users[0])
const currentUserLabel = computed(() => currentUserObj.value.label)
const userRole = ref(localStorage.getItem('cablemaster-role') || 'technician')
const companyName = ref(localStorage.getItem('cablemaster-company') || '')

// Items "Employeurs" selon le rôle / les permissions
const isSuper = computed(() => !!currentUserObj.value?.superadmin)
const employerItems = computed(() => {
  const items = []
  if (isSuper.value) {
    items.push({ label: 'Entreprise', to: '/company', icon: 'apartment' })
  }
  if (isSuper.value || userRole.value === 'master') {
    items.push(
      { label: 'CableList', to: '/CableList', icon: 'settings_input_component' },
      { label: 'FlightType', to: '/FlightType', icon: 'inventory_2' },
      { label: 'MasterAffaire', to: '/MasterAffaire', icon: 'event_note' },
    )
  }
  return items
})

function switchUser(u) {
  currentUser.value = u.id
  userRole.value = u.role
  localStorage.setItem('cablemaster-userid', u.id)
  localStorage.setItem('cablemaster-role', u.role)
  localStorage.setItem('cablemaster-techid', u.techId)
  if (u.catalogId) {
    localStorage.setItem('cablemaster-catalogid', u.catalogId)
  } else {
    localStorage.removeItem('cablemaster-catalogid')
  }
  if (u.companyId) {
    localStorage.setItem('cablemaster-companyid', u.companyId)
  } else {
    localStorage.removeItem('cablemaster-companyid')
  }
  if (u.superadmin) {
    localStorage.setItem('cablemaster-superadmin', 'true')
  } else {
    localStorage.removeItem('cablemaster-superadmin')
  }
  showUserMenu.value = false
  if (u.role === 'master' && !companyName.value) {
    loadCompany()
  }
}

provide('userRole', userRole)
provide('companyName', companyName)
provide('currentUser', currentUser)

async function loadCompany() {
  const { data } = await supabase.from('company').select('name').limit(1)
  if (data?.[0]) {
    companyName.value = data[0].name
    localStorage.setItem('cablemaster-company', data[0].name)
  }
}

function onOnline() { online.value = true }
function onOffline() { online.value = false }

onMounted(() => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  if (userRole.value === 'master') loadCompany()
})
onUnmounted(() => {
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
})
</script>

<style>
:root {
  /* Thème couleur (écrasé dynamiquement par le store) */
  --color1: #4dcc59;
  --color1-light: #e8f5e9;
  --color1-border: #c8e6c9;
  --color1-dark: #2e7d32;
  --color1-hover: #f0faf0;
  --color2: #f3e309;
  --color3: #eb910a;

  /* Largeur de la colonne "application" (centrée) */
  --app-max-width: 640px;

  /* Mode clair (défaut) */
  --bg: #ffffff;
  --bg-card: #fafafa;
  --bg-input: #ffffff;
  --text: #2c3e50;
  --text-light: #888;
  --text-muted: #999;
  --border: #e8e8e8;
  --border-light: #ddd;
}

:root.dark {
  --bg: #1a1a2e;
  --bg-card: #252540;
  --bg-input: #2a2a45;
  --text: #e0e0e0;
  --text-light: #aaa;
  --text-muted: #777;
  --border: #3a3a55;
  --border-light: #444;
  --color2: #f3e309;
  --color3: #eb910a;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--text);
  background: var(--bg);
  margin: 0px;
  min-height: 100vh;
}
.input,
select {
  font-size: 100%;
}

/* ===== Header ===== */
.app-header {
  background: var(--bg-card);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.app-toolbar {
  min-height: 52px;
}
.app-title .brand {
  font-weight: 900;
  letter-spacing: 1px;
  font-size: 20px;
  color: var(--color1);
}
.header-link {
  font-weight: bold;
  color: var(--text);
  text-decoration: none;
  padding: 0 8px;
  font-size: 14px;
}
.header-link.router-link-exact-active {
  color: var(--color1);
}
.header-icon {
  font-size: 18px;
  text-decoration: none;
  padding: 0 5px;
  color: var(--text);
  vertical-align: middle;
}

/* ===== Drawer ===== */
.app-drawer {
  background: var(--bg-card);
  color: var(--text);
}
.drawer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0 12px;
  border-bottom: 1px solid var(--border);
}
.drawer-brand-name {
  font-weight: 900;
  font-size: 24px;
  letter-spacing: 1px;
  color: var(--color1);
}
.drawer-brand-sub {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.drawer-group {
  font-weight: 800;
  color: var(--text);
}
.drawer-active {
  color: var(--color1);
  font-weight: 800;
  background: var(--color1-light);
}
:root.dark .drawer-active {
  background: rgba(77, 204, 89, 0.12);
}

/* ===== Page / contenu centré ===== */
.app-page {
  background: var(--bg);
}
.app-content {
  width: 100%;
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 10px 4px 24px;
  box-sizing: border-box;
}

/* ===== Sélecteur utilisateur ===== */
.company-bar {
  background: var(--color3);
  color: #fff;
  text-align: center;
  padding: 6px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.offline-bar {
  background: #ef4444;
  color: white;
  text-align: center;
  padding: 4px;
  font-size: 12px;
  font-weight: bold;
}
.user-selector {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 6px;
  vertical-align: middle;
  background: #3b82f6;
  color: #fff;
}
.user-menu {
  position: fixed;
  right: 10px;
  top: 58px;
  background: var(--bg, #fff);
  border: 2px solid var(--color1);
  border-radius: 10px;
  padding: 10px;
  z-index: 3000;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  min-width: 200px;
}
.user-menu-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #999);
  text-transform: uppercase;
  margin-bottom: 8px;
  text-align: center;
}
.user-menu-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}
.user-btn {
  padding: 6px 12px;
  border: 2px solid #ccc;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  box-shadow: none;
  min-width: auto;
}
.user-btn.technician {
  border-color: #3b82f6;
  color: #3b82f6;
}
.user-btn.master {
  border-color: #ef4444;
  color: #ef4444;
}
.user-btn.active {
  color: #fff;
}
.user-btn.active.technician {
  background: #3b82f6;
}
.user-btn.active.master {
  background: #ef4444;
}
.help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 6px;
  vertical-align: middle;
  transition: all 0.2s;
}
.help-btn.active {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}
</style>
