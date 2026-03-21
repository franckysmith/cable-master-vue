// Cache local + file d'attente pour mode hors-ligne

const CACHE_PREFIX = 'cm-cache-'
const QUEUE_KEY = 'cm-sync-queue'

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function cacheSet(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data))
  } catch {
    // localStorage plein — on ignore silencieusement
  }
}

// File d'attente des opérations en attente de sync
export function getQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToQueue(operation) {
  const queue = getQueue()
  queue.push({ ...operation, timestamp: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

export function isOnline() {
  return navigator.onLine
}
