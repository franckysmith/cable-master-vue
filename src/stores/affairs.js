import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet, addToQueue, isOnline } from '../lib/offlineCache'

export const useAffairStore = defineStore('affairs', () => {
  const affairs = ref([])
  const selectedAffair = ref(null)
  const loading = ref(false)

  // Charger le cache immédiatement au démarrage
  const initialCache = cacheGet('affairs')
  if (initialCache) affairs.value = initialCache

  async function fetchAffairs() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('affair')
        .select('*')
        .is('deleted_at', null)
        .order('receipt_date', { ascending: false })
      if (!error && data) {
        affairs.value = data
        cacheSet('affairs', data)
      } else if (affairs.value.length === 0) {
        const cached = cacheGet('affairs')
        if (cached) affairs.value = cached
      }
    } catch {
      if (affairs.value.length === 0) {
        const cached = cacheGet('affairs')
        if (cached) affairs.value = cached
      }
    }
    loading.value = false
    return { data: affairs.value, error: null }
  }

  async function addAffair(affair) {
    const { data, error } = await supabase
      .from('affair')
      .insert(affair)
      .select()
    if (!error) await fetchAffairs()
    return { data, error }
  }

  async function updateAffair(affairid, updates) {
    // Mettre à jour le cache local immédiatement
    const cached = cacheGet('affairs') || []
    const idx = cached.findIndex(a => a.affairid === affairid)
    if (idx >= 0) {
      cached[idx] = { ...cached[idx], ...updates }
      cacheSet('affairs', cached)
    }

    if (!isOnline()) {
      addToQueue({ type: 'update-affair', affairid, data: updates })
      // Mettre à jour l'état local aussi
      const localIdx = affairs.value.findIndex(a => a.affairid === affairid)
      if (localIdx >= 0) affairs.value[localIdx] = { ...affairs.value[localIdx], ...updates }
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('affair')
        .update(updates)
        .eq('affairid', affairid)
        .select()
      if (error) {
        // Erreur réseau renvoyée (ex. « Load failed ») → mettre en file pour réessayer
        addToQueue({ type: 'update-affair', affairid, data: updates })
        return { data: null, error: null }
      }
      await fetchAffairs()
      return { data, error }
    } catch {
      addToQueue({ type: 'update-affair', affairid, data: updates })
      return { data: null, error: null }
    }
  }

  async function deleteAffair(affairid) {
    const { error } = await supabase
      .from('affair')
      .delete()
      .eq('affairid', affairid)
    if (!error) await fetchAffairs()
    return { error }
  }

  function selectAffair(affair) {
    selectedAffair.value = affair
  }

  return { affairs, selectedAffair, loading, fetchAffairs, addAffair, updateAffair, deleteAffair, selectAffair }
})
