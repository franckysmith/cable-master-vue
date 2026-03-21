import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet } from '../lib/offlineCache'

export const useCatalogStore = defineStore('catalogs', () => {
  const catalogs = ref([])
  const loading = ref(false)

  async function fetchCatalogs() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .order('name', { ascending: true })
      if (!error && data) {
        catalogs.value = data
        cacheSet('catalogs', data)
      } else {
        const cached = cacheGet('catalogs')
        if (cached) catalogs.value = cached
      }
    } catch {
      const cached = cacheGet('catalogs')
      if (cached) catalogs.value = cached
    }
    loading.value = false
  }

  async function addCatalog(catalog) {
    const { data, error } = await supabase
      .from('catalog')
      .insert(catalog)
      .select()
    if (!error) await fetchCatalogs()
    return { data, error }
  }

  async function updateCatalog(catalogid, updates) {
    const { data, error } = await supabase
      .from('catalog')
      .update(updates)
      .eq('catalogid', catalogid)
      .select()
    if (!error) await fetchCatalogs()
    return { data, error }
  }

  async function deleteCatalog(catalogid) {
    const { error } = await supabase
      .from('catalog')
      .delete()
      .eq('catalogid', catalogid)
    if (!error) await fetchCatalogs()
    return { error }
  }

  return { catalogs, loading, fetchCatalogs, addCatalog, updateCatalog, deleteCatalog }
})
