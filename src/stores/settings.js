import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'cablemaster-settings'

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

  const colorTheme = ref(stored.colorTheme || 'green')
  const darkMode = ref(stored.darkMode || false)
  const visibleZones = ref(stored.visibleZones || 4)
  const visibleFc = ref(stored.visibleFc || 4)

  // Appliquer le thème au chargement
  applyTheme(colorTheme.value)
  if (darkMode.value) document.documentElement.classList.add('dark')

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...defaultZoneLabels.value,
      ...defaultFcLabels.value,
      ...defaultCtLabels.value,
      ...defaultTypeLabels.value,
      colorTheme: colorTheme.value,
      darkMode: darkMode.value,
      visibleZones: visibleZones.value,
      visibleFc: visibleFc.value,
      userRole: userRole.value,
    }))
  }

  watch(colorTheme, (val) => {
    applyTheme(val)
    save()
  })

  watch(darkMode, (val) => {
    document.documentElement.classList.toggle('dark', val)
    save()
  })

  watch([visibleZones, visibleFc], save)
  watch([defaultZoneLabels, defaultFcLabels, defaultCtLabels, defaultTypeLabels], save, { deep: true })

  const userRole = ref(stored.userRole || 'technician') // 'technician' ou 'master'

  const isMaster = computed(() => userRole.value === 'master')

  watch(userRole, save)

  return { defaultZoneLabels, defaultFcLabels, defaultCtLabels, defaultTypeLabels, colorTheme, darkMode, visibleZones, visibleFc, userRole, isMaster, COLOR_THEMES }
})
