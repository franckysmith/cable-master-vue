// Handlers de notifications push (importé par le service worker généré).

// --- Badge sur l'icône de l'app (Badging API) — persiste le compteur en IndexedDB ---
function idbCount(method, val) {
  return new Promise((resolve) => {
    let open
    try { open = indexedDB.open('cm-badge', 1) } catch (e) { return resolve(0) }
    open.onupgradeneeded = () => open.result.createObjectStore('kv')
    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction('kv', method === 'get' ? 'readonly' : 'readwrite')
      const store = tx.objectStore('kv')
      const req = method === 'get' ? store.get('count') : store.put(val, 'count')
      req.onsuccess = () => resolve(method === 'get' ? (req.result || 0) : val)
      req.onerror = () => resolve(0)
    }
    open.onerror = () => resolve(0)
  })
}
async function bumpBadge() {
  if (!self.navigator || !self.navigator.setAppBadge) return
  const n = (await idbCount('get')) + 1
  await idbCount('put', n)
  try { await self.navigator.setAppBadge(n) } catch (e) {}
}
async function clearBadge() {
  await idbCount('put', 0)
  if (self.navigator && self.navigator.clearAppBadge) { try { await self.navigator.clearAppBadge() } catch (e) {} }
}

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Cinod-Prep'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || undefined,
    data: { url: data.url || '/MasterAffaire' },
  }
  // Affiche la notif ET pose le petit badge sur l'icône (même app éteinte)
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    bumpBadge(),
  ]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(Promise.all([
    clearBadge(),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) { try { w.navigate(url) } catch (e) {} return w.focus() }
      }
      return self.clients.openWindow(url)
    }),
  ]))
})

// L'app demande d'effacer le badge (à l'ouverture / au focus)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'clear-badge') event.waitUntil(clearBadge())
})
