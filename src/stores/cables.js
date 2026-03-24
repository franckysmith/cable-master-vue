import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/offlineCache'

export const useCableStore = defineStore('cables', () => {
  const cables = ref([])
  const loading = ref(false)

  async function fetchCables(catalogId = null) {
    loading.value = true
    // Si pas de catalogId, utiliser celui du localStorage
    if (!catalogId) {
      catalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || null
    }
    const cacheKey = catalogId ? `cables-${catalogId}` : 'cables'
    try {
      let query = supabase
        .from('cable')
        .select('*')
        .order('sortno', { ascending: true })
        .order('name', { ascending: true })
      if (catalogId) {
        query = query.eq('catalog_id', catalogId)
      }

      const { data, error } = await query
      if (!error && data) {
        cables.value = data
        cacheSet(cacheKey, data)
      } else {
        const cached = cacheGet(cacheKey)
        if (cached) cables.value = cached
      }
    } catch {
      const cached = cacheGet(catalogId ? `cables-${catalogId}` : 'cables')
      if (cached) cables.value = cached
    }
    loading.value = false
    return { data: cables.value, error: null }
  }

  async function addCable(cable) {
    const { data, error } = await supabase
      .from('cable')
      .insert(cable)
      .select()
    if (!error) await fetchCables()
    return { data, error }
  }

  async function updateCable(cableid, updates) {
    const { data, error } = await supabase
      .from('cable')
      .update(updates)
      .eq('cableid', cableid)
      .select()
    if (!error) await fetchCables()
    return { data, error }
  }

  let lastCatalogId = null

  async function deleteCable(cableid) {
    const { error } = await supabase
      .from('cable')
      .delete()
      .eq('cableid', cableid)
    if (!error) {
      cables.value = cables.value.filter(c => c.cableid !== cableid)
    }
    return { error }
  }

  function cablesByType(type) {
    return computed(() =>
      cables.value.filter(c => c.type === type)
    )
  }

  function searchCables(query) {
    return computed(() =>
      cables.value.filter(c =>
        c.name.toLowerCase().includes(query.value.toLowerCase())
      )
    )
  }

  return { cables, loading, fetchCables, addCable, updateCable, deleteCable, cablesByType, searchCables }
})
