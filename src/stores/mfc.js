import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { publishChange } from '../lib/liveSync'

export const useMfcStore = defineStore('mfc', () => {
  const mfcs = ref([])
  const loading = ref(false)

  async function fetchMfcs() {
    loading.value = true
    const { data, error } = await supabase
      .from('mfc')
      .select('*')
      .order('name', { ascending: true })
    if (!error) mfcs.value = data
    loading.value = false
    return { data, error }
  }

  async function addMfc(mfc) {
    const { data, error } = await supabase
      .from('mfc')
      .insert(mfc)
      .select()
    if (!error) await fetchMfcs()
    return { data, error }
  }

  async function updateMfc(mfcid, updates) {
    const { data, error } = await supabase
      .from('mfc')
      .update(updates)
      .eq('mfcid', mfcid)
      .select()
    if (!error) await fetchMfcs()
    return { data, error }
  }

  async function deleteMfc(mfcid) {
    const { error } = await supabase
      .from('mfc')
      .delete()
      .eq('mfcid', mfcid)
    if (!error) await fetchMfcs()
    return { error }
  }

  async function getMfcCables(mfcid) {
    const { data, error } = await supabase
      .from('cablemfc')
      .select('*, cable(name, type, weight, info, link)')
      .eq('mfcid', mfcid)
    return { data, error }
  }

  async function setCableMfc(mfcid, cableid, count) {
    if (count === 0) {
      const { error } = await supabase
        .from('cablemfc')
        .delete()
        .eq('mfcid', mfcid)
        .eq('cableid', cableid)
      if (!error) publishChange('mfc', { mfcid })
      return { error }
    }

    const { data, error } = await supabase
      .from('cablemfc')
      .upsert({ mfcid, cableid, count }, { onConflict: 'mfcid,cableid' })
      .select()
    if (!error) publishChange('mfc', { mfcid })
    return { data, error }
  }

  return { mfcs, loading, fetchMfcs, addMfc, updateMfc, deleteMfc, getMfcCables, setCableMfc }
})
