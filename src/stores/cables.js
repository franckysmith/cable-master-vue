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

  // Charge l'UNION des câbles de plusieurs catalogues (affaire multi-départements).
  // `catalogList` = tableau d'objets { catalogid, department } (cf. catalogsForContext).
  // Chaque câble reçoit un champ dérivé `department` (via son catalog_id).
  async function fetchCablesForCatalogs(catalogList = []) {
    loading.value = true
    const ids = catalogList.map((c) => c.catalogid).filter(Boolean)
    const deptMap = {}
    for (const c of catalogList) deptMap[c.catalogid] = c.department || null
    const cacheKey = ids.length ? `cables-multi-${[...ids].sort((a, b) => a - b).join('-')}` : 'cables'
    try {
      if (!ids.length) {
        cables.value = []
        loading.value = false
        return { data: [], error: null }
      }
      const { data, error } = await supabase
        .from('cable')
        .select('*')
        .in('catalog_id', ids)
        .order('sortno', { ascending: true })
        .order('name', { ascending: true })
      if (!error && data) {
        const tagged = data.map((c) => ({ ...c, department: deptMap[c.catalog_id] || null }))
        cables.value = tagged
        cacheSet(cacheKey, tagged)
      } else {
        const cached = cacheGet(cacheKey)
        if (cached) cables.value = cached
      }
    } catch {
      const cached = cacheGet(cacheKey)
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

  return { cables, loading, fetchCables, fetchCablesForCatalogs, addCable, updateCable, deleteCable, cablesByType, searchCables }
})
