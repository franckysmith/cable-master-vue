<template>
  <div class="settings">
    <h2>Réglages</h2>

    <!-- Mon profil -->
    <section class="section profile-section">
      <h3>Mon profil</h3>
      <div class="profile-grid">
        <div class="form-row">
          <label>Prénom</label>
          <input v-model="profile.firstname" placeholder="Prénom" @change="saveProfile" />
        </div>
        <div class="form-row">
          <label>Nom</label>
          <input v-model="profile.lastname" placeholder="Nom" @change="saveProfile" />
        </div>
      </div>
      <div class="profile-grid">
        <div class="form-row">
          <label>Email</label>
          <input v-model="profile.email" type="email" placeholder="email@..." @change="saveProfile" />
        </div>
        <div class="form-row">
          <label>Téléphone</label>
          <input v-model="profile.phone" placeholder="+33..." @change="saveProfile" />
        </div>
      </div>
      <div class="form-row">
        <label>Messagerie préférée</label>
        <div class="messaging-picker">
          <button
            v-for="m in messagingApps"
            :key="m.value"
            class="msg-btn"
            :class="{ active: profile.messaging === m.value }"
            @click="profile.messaging = m.value; saveProfile()"
          >{{ m.label }}</button>
        </div>
      </div>
      <button class="btn-save-profile" @click="saveProfile(); profileSaved = true; setTimeout(() => profileSaved = false, 2000)">
        {{ profileSaved ? '✓ Enregistré' : 'Valider mon profil' }}
      </button>
    </section>

    <section class="section">
      <button class="toggle-labels-btn" @click="showLabels = !showLabels">
        {{ showLabels ? '▼' : '▶' }} Flight-cases · Catégories · Zones
      </button>
      <div v-if="showLabels" class="labels-content">
        <h4>Flight-cases</h4>
        <div class="label-grid">
          <div v-for="i in 7" :key="'fc'+i" class="label-row">
            <span class="label-num">FC{{ i }}</span>
            <input
              v-model="settingsStore.defaultFcLabels[`lfc${i}`]"
              :placeholder="`FC ${i}`"
              class="label-input"
              maxlength="20"
            />
          </div>
        </div>
        <h4>Catégories de câbles</h4>
        <div class="label-grid">
          <div v-for="i in 10" :key="'type'+i" class="label-row">
            <span class="label-num">{{ i }}</span>
            <input
              v-model="settingsStore.defaultTypeLabels[`type${i}`]"
              :placeholder="`Type ${i}`"
              class="label-input"
              maxlength="12"
            />
          </div>
        </div>
        <h4>Zones</h4>
        <div class="label-grid">
          <div v-for="i in 6" :key="'z'+i" class="label-row">
            <span class="label-num">Z{{ i }}</span>
            <input
              v-model="settingsStore.defaultZoneLabels[`lz${i}`]"
              :placeholder="`Zone ${i}`"
              class="label-input"
              maxlength="20"
            />
          </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
const settingsStore = useSettingsStore()
const showLabels = ref(false)
const profileSaved = ref(false)

const messagingApps = [
  { value: 'email', label: '📧 Email' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'sms', label: '📱 SMS' },
  { value: 'wechat', label: '🟢 WeChat' },
  { value: 'telegram', label: '✈️ Telegram' },
]

const userId = localStorage.getItem('cablemaster-userid') || 'T'
const PROFILE_KEY = `cablemaster-profile-${userId}`

const profile = reactive({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  messaging: 'email',
})

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    Object.assign(profile, saved)
  } catch {}
})

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile }))
}
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
.profile-section .form-row {
  margin-bottom: 8px;
}
.profile-section .form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light, #666);
  margin-bottom: 2px;
}
.profile-section .form-row input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
}
.profile-section .form-row input:focus {
  border-color: var(--color1);
}
.profile-grid {
  display: flex;
  gap: 8px;
}
.profile-grid .form-row {
  flex: 1;
}
.messaging-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.msg-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 12px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
}
.msg-btn.active {
  background: var(--color1);
  border-color: var(--color1);
  color: #fff;
}
.btn-save-profile {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  transition: all 0.2s;
}
.btn-save-profile:active {
  transform: scale(0.97);
}
.toggle-labels-btn {
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #333);
  background: var(--bg-card, #f5f5f5);
  border: 2px solid var(--border-light, #ddd);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.labels-content {
  margin-top: 10px;
}
.labels-content h4 {
  font-size: 13px;
  color: var(--text-light, #666);
  margin: 12px 0 6px;
}
.label-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.label-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.label-num {
  width: 28px;
  min-width: 28px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}
.label-input {
  width: 80px;
  max-width: 80px;
  padding: 6px 6px;
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
