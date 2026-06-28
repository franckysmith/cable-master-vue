import { defineStore } from 'pinia'

// Vue multi-colonnes (web / grand écran) : 1 à 3 colonnes, chacune un iframe.
// Chaque colonne contient soit une route interne ('/MasterAffaire'…), soit une URL
// externe / un PDF (plan de scène, lien d'affaire). Persisté en localStorage.
const KEY = 'cm-split-view'
const DEFAULT_ROUTES = ['/MasterAffaire', '/CableList', '/micros']

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export const useSplitViewStore = defineStore('splitView', {
  state: () => {
    const s = load()
    const routes = Array.isArray(s.routes) && s.routes.length ? s.routes.slice(0, 3) : [...DEFAULT_ROUTES]
    while (routes.length < 3) routes.push(DEFAULT_ROUTES[routes.length] || '/MasterAffaire')
    return {
      columns: Math.min(3, Math.max(1, s.columns || 1)),
      routes,
    }
  },
  actions: {
    setColumns(n) {
      this.columns = Math.min(3, Math.max(1, n))
      this.persist()
    },
    setRoute(i, value) {
      if (i < 0 || i > 2 || !value) return
      const r = [...this.routes]
      r[i] = value
      this.routes = r
      this.persist()
    },
    // Ouvre un document / lien dans une colonne : passe à 2 colonnes si on est à 1,
    // sinon réutilise la dernière colonne.
    openDoc(url) {
      if (!url) return
      if (this.columns < 2) {
        this.setRoute(1, url)
        this.columns = 2
      } else {
        this.setRoute(this.columns - 1, url)
      }
      this.persist()
    },
    persist() {
      try { localStorage.setItem(KEY, JSON.stringify({ columns: this.columns, routes: this.routes })) } catch (e) { /* quota */ }
    },
  },
})
