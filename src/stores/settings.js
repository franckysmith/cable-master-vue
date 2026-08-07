import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { publishChange, onChange } from '../lib/liveSync'

const STORAGE_KEY = 'cablemaster-settings'
const SYNC_KEY = 'default' // clé unique pour user_settings

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const COLOR_THEMES = {
  green: {
    label: 'Vert',
    color1: '#4dcc59',
    color1Light: '#e8f5e9',
    color1Border: '#c8e6c9',
    color1Dark: '#2e7d32',
    color1Hover: '#f0faf0',
  },
  blue: {
    label: 'Bleu',
    color1: '#3b82f6',
    color1Light: '#e0ecff',
    color1Border: '#93b8f6',
    color1Dark: '#1e40af',
    color1Hover: '#eff6ff',
  },
  purple: {
    label: 'Mauve',
    color1: '#8b5cf6',
    color1Light: '#ede9fe',
    color1Border: '#c4b5fd',
    color1Dark: '#5b21b6',
    color1Hover: '#f5f3ff',
  },
}

function applyTheme(themeKey) {
  const theme = COLOR_THEMES[themeKey] || COLOR_THEMES.green
  const root = document.documentElement
  root.style.setProperty('--color1', theme.color1)
  root.style.setProperty('--color1-light', theme.color1Light)
  root.style.setProperty('--color1-border', theme.color1Border)
  root.style.setProperty('--color1-dark', theme.color1Dark)
  root.style.setProperty('--color1-hover', theme.color1Hover)
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = loadFromStorage()

  const defaultZoneLabels = ref({
    lz1: stored.lz1 || '',
    lz2: stored.lz2 || '',
    lz3: stored.lz3 || '',
    lz4: stored.lz4 || '',
    lz5: stored.lz5 || '',
    lz6: stored.lz6 || '',
  })

  const defaultFcLabels = ref({
    lfc1: stored.lfc1 || '',
    lfc2: stored.lfc2 || '',
    lfc3: stored.lfc3 || '',
    lfc4: stored.lfc4 || '',
    lfc5: stored.lfc5 || '',
    lfc6: stored.lfc6 || '',
    lfc7: stored.lfc7 || '',
  })

  const defaultCtLabels = ref({
    ct1: stored.ct1 || '',
    ct2: stored.ct2 || '',
    ct3: stored.ct3 || '',
    ct4: stored.ct4 || '',
    ct5: stored.ct5 || '',
    ct6: stored.ct6 || '',
    ct7: stored.ct7 || '',
    ct8: stored.ct8 || '',
  })

  const defaultTypeLabels = ref({
    type1: stored.type1 || 'HP',
    type2: stored.type2 || 'Elec',
    type3: stored.type3 || 'Modules',
    type4: stored.type4 || 'Spéciaux',
    type5: stored.type5 || 'Autres',
    type6: stored.type6 || 'Accessoires',
    type7: stored.type7 || 'Numériques',
    type8: stored.type8 || '',
    type9: stored.type9 || '',
    type10: stored.type10 || '',
  })

  const colorTheme = ref(stored.colorTheme || 'purple')
  const darkMode = ref(stored.darkMode !== undefined ? stored.darkMode : true)
  const visibleZones = ref(stored.visibleZones || 4)
  const visibleFc = ref(stored.visibleFc || 4)
  const userRole = ref(stored.userRole || 'technician')
  const isMaster = computed(() => userRole.value === 'master')

  // Appliquer le thème au chargement
  applyTheme(colorTheme.value)
  if (darkMode.value) document.documentElement.classList.add('dark')

  function getSettingsData() {
    return {
      ...defaultZoneLabels.value,
      ...defaultFcLabels.value,
      ...defaultCtLabels.value,
      ...defaultTypeLabels.value,
      colorTheme: colorTheme.value,
      darkMode: darkMode.value,
      visibleZones: visibleZones.value,
      visibleFc: visibleFc.value,
      userRole: userRole.value,
    }
  }

  // Sauvegarder en local ET dans Supabase
  let saveTimeout = null
  function save() {
    const data = getSettingsData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    // Debounce la synchro Supabase (éviter trop de requêtes)
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      syncToSupabase(data)
    }, 1000)
  }

  async function syncToSupabase(data) {
    try {
      await supabase
        .from('user_settings')
        .upsert({
          device_key: SYNC_KEY,
          settings: data,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'device_key' })
    } catch {}
  }

  // Charger depuis Supabase au démarrage
  async function loadFromSupabase() {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('settings, updated_at')
        .eq('device_key', SYNC_KEY)
        .limit(1)

      if (!data?.[0]?.settings) return

      const remote = data[0].settings
      const localRaw = localStorage.getItem(STORAGE_KEY)
      const local = localRaw ? JSON.parse(localRaw) : {}

      // Si les données distantes sont plus récentes, les appliquer
      const remoteTime = new Date(data[0].updated_at).getTime()
      const localTime = parseInt(localStorage.getItem('cablemaster-settings-time')) || 0

      if (remoteTime > localTime) {
        applyRemoteSettings(remote)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
        localStorage.setItem('cablemaster-settings-time', remoteTime.toString())
      }
    } catch {}
  }

  function applyRemoteSettings(s) {
    // Zones
    for (let i = 1; i <= 6; i++) {
      if (s[`lz${i}`] !== undefined) defaultZoneLabels.value[`lz${i}`] = s[`lz${i}`]
    }
    // FC
    for (let i = 1; i <= 7; i++) {
      if (s[`lfc${i}`] !== undefined) defaultFcLabels.value[`lfc${i}`] = s[`lfc${i}`]
    }
    // CT
    for (let i = 1; i <= 8; i++) {
      if (s[`ct${i}`] !== undefined) defaultCtLabels.value[`ct${i}`] = s[`ct${i}`]
    }
    // Types
    for (let i = 1; i <= 10; i++) {
      if (s[`type${i}`] !== undefined) defaultTypeLabels.value[`type${i}`] = s[`type${i}`]
    }
    // Theme
    if (s.colorTheme) { colorTheme.value = s.colorTheme; applyTheme(s.colorTheme) }
    if (s.darkMode !== undefined) { darkMode.value = s.darkMode; document.documentElement.classList.toggle('dark', s.darkMode) }
    if (s.visibleZones) visibleZones.value = s.visibleZones
    if (s.visibleFc) visibleFc.value = s.visibleFc
  }

  // Charger depuis Supabase au démarrage
  loadFromSupabase()

  // Watchers pour sauvegarder
  watch(colorTheme, (val) => {
    applyTheme(val)
    save()
    publishChange('theme', { colorTheme: val, dark: darkMode.value })
  })
  watch(darkMode, (val) => {
    document.documentElement.classList.toggle('dark', val)
    save()
    // Le thème est global : les autres colonnes (iframes) basculent aussi.
    publishChange('theme', { colorTheme: colorTheme.value, dark: val })
  })

  // Une autre colonne a changé le thème → on s'aligne. Réaffecter la même
  // valeur ne déclenche pas le watcher, donc pas de renvoi en boucle.
  onChange((msg) => {
    if (msg.kind !== 'theme') return
    if (msg.payload?.colorTheme && msg.payload.colorTheme !== colorTheme.value) {
      colorTheme.value = msg.payload.colorTheme
    }
    if (typeof msg.payload?.dark === 'boolean') darkMode.value = msg.payload.dark
  })

  watch([visibleZones, visibleFc], save)
  watch([defaultZoneLabels, defaultFcLabels, defaultCtLabels, defaultTypeLabels], save, { deep: true })
  watch(userRole, save)

  return { defaultZoneLabels, defaultFcLabels, defaultCtLabels, defaultTypeLabels, colorTheme, darkMode, visibleZones, visibleFc, userRole, isMaster, COLOR_THEMES }
})
