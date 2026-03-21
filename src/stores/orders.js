import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { cacheGet, cacheSet, addToQueue, isOnline } from '../lib/offlineCache'

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([])
  const loading = ref(false)

  async function fetchOrders(filters = {}) {
    loading.value = true
    const cacheKey = `orders-${filters.affairid || 'all'}`

    try {
      let query = supabase.from('order').select('*, cable(name, type)')
      if (filters.affairid) query = query.eq('affairid', filters.affairid)
      if (filters.cableid) query = query.eq('cableid', filters.cableid)

      const { data, error } = await query
      if (!error && data) {
        orders.value = data
        cacheSet(cacheKey, data)
      } else {
        const cached = cacheGet(cacheKey)
        if (cached) orders.value = cached
      }
    } catch {
      const cached = cacheGet(cacheKey)
      if (cached) orders.value = cached
    }

    loading.value = false
    return { data: orders.value, error: null }
  }

  async function setOrder(order) {
    if (order.count === 0) {
      const { error } = await supabase
        .from('order')
        .delete()
        .eq('cableid', order.cableid)
        .eq('affairid', order.affairid)
        .eq('tech_id', order.tech_id)
      return { error }
    }

    const { data, error } = await supabase
      .from('order')
      .upsert(order, { onConflict: 'cableid,affairid,tech_id' })
      .select()
    return { data, error }
  }

  async function setOrders(ordersList) {
    if (ordersList.length === 0) return { data: [], error: null }

    // Sauvegarder en cache local immédiatement
    const affairid = ordersList[0]?.affairid
    if (affairid) {
      const cacheKey = `orders-${affairid}`
      const cached = cacheGet(cacheKey) || []
      // Fusionner : mettre à jour les existants, ajouter les nouveaux
      const map = {}
      for (const o of cached) map[o.cableid] = o
      for (const o of ordersList) map[o.cableid] = { ...map[o.cableid], ...o }
      cacheSet(cacheKey, Object.values(map))
    }

    // Tenter l'envoi réseau
    if (!isOnline()) {
      addToQueue({ type: 'upsert-orders', data: ordersList })
      return { data: ordersList, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('order')
        .upsert(ordersList, { onConflict: 'cableid,affairid,tech_id' })
        .select()

      if (error) {
        console.error('Erreur sauvegarde orders:', error)
        addToQueue({ type: 'upsert-orders', data: ordersList })
      }
      return { data, error }
    } catch {
      addToQueue({ type: 'upsert-orders', data: ordersList })
      return { data: ordersList, error: null }
    }
  }

  return { orders, loading, fetchOrders, setOrder, setOrders }
})
