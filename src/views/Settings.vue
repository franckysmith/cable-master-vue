<template>
  <div class="settings">
    <h2>Réglages</h2>

    <section class="section">
      <h3>Noms par défaut des caisses (Flycases)</h3>
      <div class="label-grid">
        <div v-for="i in 7" :key="'fc'+i" class="label-row">
          <span class="label-num">FC{{ i }}</span>
          <input
            v-model="settingsStore.defaultFcLabels[`lfc${i}`]"
            :placeholder="`Flycase ${i}`"
            class="label-input"
          />
        </div>
      </div>
    </section>

    <section class="section">
      <h3>Noms par défaut des zones</h3>
      <div class="label-grid">
        <div v-for="i in 6" :key="'z'+i" class="label-row">
          <span class="label-num">Zone {{ i }}</span>
          <input
            v-model="settingsStore.defaultZoneLabels[`lz${i}`]"
            :placeholder="`Zone ${i}`"
            class="label-input"
          />
        </div>
      </div>
    </section>

    <section class="section">
      <h3>Couleur principale</h3>
      <div class="theme-picker">
        <button
          v-for="(theme, key) in settingsStore.COLOR_THEMES"
          :key="key"
          class="theme-btn"
          :class="{ active: settingsStore.colorTheme === key }"
          :style="{ background: theme.color1 }"
          @click="settingsStore.colorTheme = key"
        >
          {{ theme.label }}
        </button>
      </div>
    </section>

    <section class="section">
      <h3>Mode sombre</h3>
      <label class="dark-toggle">
        <input type="checkbox" v-model="settingsStore.darkMode" />
        <span>{{ settingsStore.darkMode ? 'Activé' : 'Désactivé' }}</span>
      </label>
    </section>

    <p class="hint">Les réglages sont sauvegardés automatiquement.</p>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings'
const settingsStore = useSettingsStore()
</script>

<style scoped>
.settings {
  max-width: 400px;
  margin: 0 auto;
  padding: 10px 15px;
}
h2 {
  font-size: 18px;
  margin-bottom: 15px;
}
.section {
  margin-bottom: 20px;
}
.section h3 {
  font-size: 14px;
  margin-bottom: 8px;
  color: #555;
}
.label-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label-num {
  width: 60px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
}
.label-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.label-input:focus {
  border-color: var(--color1);
}
.theme-picker {
  display: flex;
  gap: 10px;
}
.theme-btn {
  padding: 8px 16px;
  border: 3px solid transparent;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.1s;
}
.theme-btn.active {
  border-color: #222;
  transform: scale(1.05);
}
.dark-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}
.dark-toggle input {
  width: 18px;
  height: 18px;
}
.hint {
  font-size: 12px;
  color: #999;
  font-style: italic;
  margin-top: 15px;
}
</style>
