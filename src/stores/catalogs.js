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

  // Catalogues "département" (son/lumière/vidéo) d'un contexte : entreprise via
  // company_id, sinon freelance via user_id. Exclut la biblio micros (department null).
  async function fetchDepartmentCatalogs({ companyId = null, userId = null } = {}) {
    let query = supabase
      .from('catalog')
      .select('catalogid, name, department, company_id, user_id')
      .not('department', 'is', null)
    if (companyId) query = query.eq('company_id', companyId)
    else if (userId) query = query.eq('user_id', userId)
    else return []
    const { data, error } = await query.order('department').order('catalogid')
    return error ? [] : data || []
  }

  // À partir d'un catalogue "primaire" (celui d'une affaire), retrouve tous les
  // catalogues départements du même propriétaire (entreprise ou freelance).
  async function departmentCatalogsForCatalog(catalogId) {
    if (!catalogId) return []
    const { data: cat } = await supabase
      .from('catalog')
      .select('company_id, user_id')
      .eq('catalogid', catalogId)
      .maybeSingle()
    if (!cat) return []
    return fetchDepartmentCatalogs({ companyId: cat.company_id, userId: cat.user_id })
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

  return {
    catalogs, loading, fetchCatalogs,
    fetchDepartmentCatalogs, departmentCatalogsForCatalog,
    addCatalog, updateCatalog, deleteCatalog,
  }
})
