<template>
  <div v-if="!online" class="offline-bar">Mode hors-ligne</div>
  <div v-if="userRole === 'master' && companyName" class="company-bar">
    🏢 {{ companyName }}
  </div>
  <div id="nav">
    <template v-if="userRole === 'master'">
      <router-link to="/company">Entreprise</router-link> |
      <router-link to="/Cablemaster">Cablemaster</router-link> |
      <router-link to="/MasterAffaire">MasterAffaire</router-link> |
      <router-link to="/CaisseType">CaisseType</router-link> |
    </template>
    <span class="refresh-btn" @click="refreshPage" title="Actualiser">↻</span>
    <router-link to="/about">About</router-link> |
    <router-link to="/">CableTech</router-link> |
    <router-link to="/micros" class="mic-link" title="Bibliothèque Micros">🎤</router-link>
    <router-link to="/settings" class="settings-link" title="Réglages">&#9881;</router-link>
    <span class="help-btn" :class="{ active: helpMode }" @click="helpMode = !helpMode" title="Aide">?</span>
    <span class="role-toggle" :class="userRole" @click="toggleRole" :title="userRole === 'master' ? 'Mode Entreprise' : 'Mode Technicien'">
      {{ userRole === 'master' ? 'M' : 'T' }}
    </span>
  </div>
  <router-view />
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { supabase } from './lib/supabase'

const online = ref(navigator.onLine)
const helpMode = ref(false)
provide('helpMode', helpMode)

const userRole = ref(localStorage.getItem('cablemaster-role') || 'technician')
const companyName = ref(localStorage.getItem('cablemaster-company') || '')

function toggleRole() {
  userRole.value = userRole.value === 'technician' ? 'master' : 'technician'
  localStorage.setItem('cablemaster-role', userRole.value)
  if (userRole.value === 'master' && !companyName.value) {
    loadCompany()
  }
}
provide('userRole', userRole)
provide('companyName', companyName)

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
  font-size: 18px;
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
.role-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  margin-left: 6px;
  vertical-align: middle;
  transition: all 0.2s;
}
.role-toggle.technician {
  background: #3b82f6;
  color: #fff;
}
.role-toggle.master {
  background: #ef4444;
  color: #fff;
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
