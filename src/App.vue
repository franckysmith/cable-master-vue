<template>
  <div v-if="!online" class="offline-bar">Mode hors-ligne</div>
  <div v-if="userRole === 'master' && companyName" class="company-bar">
    🏢 {{ companyName }}
  </div>
  <div id="nav">
    <!-- Super admin (T) : accès à tout -->
    <template v-if="currentUserObj?.superadmin && userRole === 'technician'">
      <router-link to="/company">Entreprise</router-link> |
      <router-link to="/Cablemaster">Cablemaster</router-link> |
      <router-link to="/MasterAffaire">MasterAffaire</router-link> |
      <router-link to="/CaisseType">CaisseType</router-link> |
    </template>
    <!-- Super admin master (M) : accès à tout -->
    <template v-if="currentUserObj?.superadmin && userRole === 'master'">
      <router-link to="/company">Entreprise</router-link> |
      <router-link to="/Cablemaster">Cablemaster</router-link> |
      <router-link to="/MasterAffaire">MasterAffaire</router-link> |
      <router-link to="/CaisseType">CaisseType</router-link> |
    </template>
    <!-- Masters normaux (M1/M2/M3) : Cablemaster, MasterAffaire, CaisseType -->
    <template v-if="!currentUserObj?.superadmin && userRole === 'master'">
      <router-link to="/Cablemaster">Cablemaster</router-link> |
      <router-link to="/MasterAffaire">MasterAffaire</router-link> |
      <router-link to="/CaisseType">CaisseType</router-link> |
    </template>
    <router-link to="/about">About</router-link> |
    <router-link to="/">CableTech</router-link> |
    <router-link to="/micros" class="mic-link" title="Bibliothèque Micros">🎤</router-link>
    <router-link to="/settings" class="settings-link" title="Réglages">&#9881;</router-link>
    <span class="help-btn" :class="{ active: helpMode }" @click="helpMode = !helpMode" title="Aide">?</span>
    <span class="user-selector" @click="showUserMenu = !showUserMenu">
      {{ currentUserLabel }}
    </span>
    <div v-if="showUserMenu" class="user-menu">
      <div class="user-menu-title">Super Admin</div>
      <div class="user-menu-group">
        <button v-for="u in users" :key="u.id" class="user-btn" :class="[u.role, { active: currentUser === u.id }]" @click="switchUser(u)">
          {{ u.label }}
        </button>
      </div>
    </div>
  </div>
  <router-view />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { supabase } from './lib/supabase'

const online = ref(navigator.onLine)
const helpMode = ref(false)
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

function refreshPage() {
  window.location.reload()
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
  padding-top: 10px;
  min-height: 100vh;
}
.input,
select {
  font-size: 100%;
}
#nav {
  margin: auto;
}
#nav a {
  font-weight: bold;
  color: var(--text);
  text-decoration: none;
  padding: 0 5px;
}
#nav a.router-link-exact-active {
  color: var(--color1);
}
.settings-link {
  font-size: 24px;
  padding: 0 4px;
}
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
.mic-link {
  font-size: 18px;
  text-decoration: none;
  vertical-align: middle;
}
.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 24px;
  font-weight: bold;
  color: var(--text);
  cursor: pointer;
  margin: 0 4px;
  vertical-align: middle;
  user-select: none;
}
.refresh-btn:active {
  transform: rotate(180deg);
  transition: transform 0.3s;
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
  position: absolute;
  right: 10px;
  top: 60px;
  background: var(--bg, #fff);
  border: 2px solid var(--color1);
  border-radius: 10px;
  padding: 10px;
  z-index: 200;
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
