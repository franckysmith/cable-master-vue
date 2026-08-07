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
      // Largeur des colonnes : 0 = toutes égales, 1 = la première plus large,
      // 2 = la dernière plus large.
      large: [0, 1, 2].includes(s.large) ? s.large : 0,
    }
  },
  getters: {
    // `grid-template-columns` correspondant à l'état courant
    // La largeur inégale n'a de sens qu'à 2 colonnes (une grande / une petite) ;
    // à 1 ou 3, les colonnes restent égales.
    gridTemplate(state) {
      const n = state.columns
      if (n !== 2 || state.large === 0) return `repeat(${n}, minmax(0, 1fr))`
      return state.large === 1
        ? 'minmax(0, 2fr) minmax(0, 1fr)'
        : 'minmax(0, 1fr) minmax(0, 2fr)'
    },
    largeLabel(state) {
      if (state.large === 1) return '1ʳᵉ large'
      if (state.large === 2) return '2ᵉ large'
      return 'égales'
    },
  },
  actions: {
    setColumns(n) {
      this.columns = Math.min(3, Math.max(1, n))
      this.persist()
    },
    // Un clic fait tourner : 1ʳᵉ large → dernière large → toutes égales
    cycleLarge() {
      this.large = (this.large + 1) % 3
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
      try { localStorage.setItem(KEY, JSON.stringify({ columns: this.columns, routes: this.routes, large: this.large })) } catch (e) { /* quota */ }
    },
  },
})
