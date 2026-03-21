<template>
  <div v-if="!online" class="offline-bar">Mode hors-ligne</div>
  <div id="nav">
    <router-link to="/Cablemaster">Cablemaster</router-link> |
    <router-link to="/MasterAffaire">MasterAffaire</router-link> |
    <router-link to="/CaisseType">CaisseType</router-link> |
    <router-link to="/about">About</router-link> |
    <router-link to="/">CableTech</router-link> |
    <router-link to="/settings" class="settings-link" title="Réglages">&#9881;</router-link>
  </div>
  <router-view />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const online = ref(navigator.onLine)
function onOnline() { online.value = true }
function onOffline() { online.value = false }

onMounted(() => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
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
.offline-bar {
  background: #ef4444;
  color: white;
  text-align: center;
  padding: 4px;
  font-size: 12px;
  font-weight: bold;
}
</style>
