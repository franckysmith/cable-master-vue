import { useSplitViewStore } from '../stores/splitView'

// Ouvre un document / lien (PDF, plan de scène…) de façon « intelligente » :
// - dans une colonne iframe → demande au parent de l'ouvrir dans une autre colonne ;
// - sur grand écran (hors iframe) → l'ouvre dans une colonne de la vue multi-colonnes ;
// - sinon (mobile) → nouvel onglet.
export function openDocSmart(url) {
  if (!url) return
  if (window.top !== window.self) {
    try {
      window.parent.postMessage({ type: 'cinod-open-doc', url }, window.location.origin)
      return
    } catch (e) { /* cross-origin → repli */ }
  }
  if (window.innerWidth >= 1024) {
    try {
      useSplitViewStore().openDoc(url)
      return
    } catch (e) { /* store non prêt → repli */ }
  }
  window.open(url, '_blank')
}
