// Synchronisation entre les colonnes de la vue multi-colonnes.
//
// Chaque colonne est un iframe de la même origine : elles ont donc chacune leur
// propre store Pinia et ne voient pas les écritures des autres. Après une
// modification (quantités d'une affaire, contenu d'un flight-case…), on publie
// un signal ; les autres colonnes rechargent la donnée concernée.
//
// BroadcastChannel quand il existe (tous les navigateurs modernes), sinon repli
// sur l'événement `storage` du localStorage, qui traverse lui aussi les
// fenêtres et les iframes de même origine.

const CHANNEL = 'cinod-prep-live'
const FALLBACK_KEY = 'cm-live-ping'

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null

// Identifie l'émetteur pour qu'une colonne ignore son propre signal.
const SELF = Math.random().toString(36).slice(2) + '-' + performance.now()

// `kind` : 'orders' | 'mfc' | 'cables' — payload libre ({ affairid }…)
export function publishChange(kind, payload = {}) {
  const msg = { from: SELF, kind, payload }
  if (channel) {
    channel.postMessage(msg)
    return
  }
  try {
    // La valeur doit changer à chaque fois, sinon l'événement `storage` ne part pas.
    localStorage.setItem(FALLBACK_KEY, JSON.stringify({ ...msg, t: performance.now() }))
  } catch (e) { /* quota : tant pis, on reste local */ }
}

// Retourne une fonction de désabonnement (à appeler dans onUnmounted).
export function onChange(handler) {
  if (channel) {
    const fn = (e) => { if (e.data?.from !== SELF) handler(e.data) }
    channel.addEventListener('message', fn)
    return () => channel.removeEventListener('message', fn)
  }
  const fn = (e) => {
    if (e.key !== FALLBACK_KEY || !e.newValue) return
    try {
      const msg = JSON.parse(e.newValue)
      if (msg.from !== SELF) handler(msg)
    } catch (err) { /* message illisible */ }
  }
  window.addEventListener('storage', fn)
  return () => window.removeEventListener('storage', fn)
}
