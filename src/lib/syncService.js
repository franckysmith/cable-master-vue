import { supabase } from './supabase'
import { getQueue, clearQueue, isOnline } from './offlineCache'

let syncing = false

// Une erreur renvoyée par PostgREST (et non une exception réseau) signifie que la
// requête a bien atteint le serveur mais a été rejetée : violation de clé étrangère
// (23xxx), donnée invalide (22xxx), accès/syntaxe (42xxx) ou requête malformée (PGRST).
// La re-tenter ne servira jamais à rien → on abandonne l'opération au lieu de la
// remettre en file (ce qui spammait la console à chaque ouverture).
function isPermanentError(error) {
  if (!error) return false
  const code = String(error.code || '')
  return /^(22|23|42)/.test(code) || code.startsWith('PGRST')
}

export async function flushQueue() {
  if (syncing || !isOnline()) return
  const queue = getQueue()
  if (queue.length === 0) return

  syncing = true
  const failed = []   // erreurs réseau : à retenter
  const dropped = []  // rejets définitifs du serveur : à abandonner

  for (const op of queue) {
    try {
      let error = null
      if (op.type === 'upsert-orders') {
        ({ error } = await supabase
          .from('order')
          .upsert(op.data, { onConflict: 'cableid,affairid,role' })
          .select())
      } else if (op.type === 'update-affair') {
        ({ error } = await supabase
          .from('affair')
          .update(op.data)
          .eq('affairid', op.affairid)
          .select())
      }
      if (error) {
        if (isPermanentError(error)) dropped.push({ op, reason: error.code || error.message })
        else failed.push(op)
      }
    } catch {
      // Exception (fetch échoué = réseau) → retentable
      failed.push(op)
    }
  }

  // Ne remettre en file que les erreurs réseau ; les rejets définitifs sont jetés.
  if (failed.length > 0) {
    localStorage.setItem('cm-sync-queue', JSON.stringify(failed))
  } else {
    clearQueue()
  }

  if (dropped.length > 0) {
    console.warn(`[Sync] ${dropped.length} opération(s) abandonnée(s) (rejet serveur définitif)`, dropped)
  }

  syncing = false
  return { synced: queue.length - failed.length - dropped.length, failed: failed.length, dropped: dropped.length }
}

// Écouter le retour en ligne
export function startSyncListener() {
  window.addEventListener('online', () => {
    console.log('[Sync] Retour en ligne, synchronisation...')
    flushQueue()
  })
}
