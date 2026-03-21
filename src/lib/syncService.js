import { supabase } from './supabase'
import { getQueue, clearQueue, isOnline } from './offlineCache'

let syncing = false

export async function flushQueue() {
  if (syncing || !isOnline()) return
  const queue = getQueue()
  if (queue.length === 0) return

  syncing = true
  const failed = []

  for (const op of queue) {
    try {
      if (op.type === 'upsert-orders') {
        const { error } = await supabase
          .from('order')
          .upsert(op.data, { onConflict: 'cableid,affairid,tech_id' })
          .select()
        if (error) { failed.push(op); continue }
      } else if (op.type === 'update-affair') {
        const { error } = await supabase
          .from('affair')
          .update(op.data)
          .eq('affairid', op.affairid)
          .select()
        if (error) { failed.push(op); continue }
      }
    } catch {
      failed.push(op)
    }
  }

  // Remettre en queue ce qui a échoué
  if (failed.length > 0) {
    localStorage.setItem('cm-sync-queue', JSON.stringify(failed))
  } else {
    clearQueue()
  }

  syncing = false
  return { synced: queue.length - failed.length, failed: failed.length }
}

// Écouter le retour en ligne
export function startSyncListener() {
  window.addEventListener('online', () => {
    console.log('[Sync] Retour en ligne, synchronisation...')
    flushQueue()
  })
}
