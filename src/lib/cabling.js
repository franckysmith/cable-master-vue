// ============================================================================
//  RÈGLES DE CÂBLAGE — dérivées de la SOURCE UNIQUE enceintes.json
// ============================================================================
//  enceintes.json (52 enceintes, L-Series incluses) est LE catalogue de
//  référence : noms, nb de boîtes par ampli (LA4X/LA8/LA12X…), voies.
//  Ne PAS écrire de table d'enceintes à la main ailleurs.
//
//  Les 2 seuls champs absents d'enceintes.json sont ici, dans OVERLAY :
//    - cat   : catégorie d'affichage (Line Array / Coaxial / Monitor / Sub /
//              Syva / Install) — utilisée par le calculateur d'amplis.
//    - cable : type de câble HP →
//        'DO'      = DO10 + DO07 multi-pin (K1, K2, V-DOSC, Kudo)
//        'SC32'    = connecteur L-Series (L1, L1D, L2, L2D)
//        'speakon' = speakon standard (le reste)
//
//  ENCLOSURE_DATA est GÉNÉRÉE : enceintes.json (chiffres) + OVERLAY (cat/cable).
//  Modifier un chiffre / les voies → éditer enceintes.json. Modifier un type
//  de câble / une catégorie → éditer OVERLAY ci-dessous.
// ============================================================================

import enceintesDoc from './enceintes.json' with { type: 'json' }

/** Parse une valeur d'enceintes.json : '--'/'' → null, '8*' → 8, '3.5' → 3.5. */
function num(v) {
  if (v === null || v === undefined) return null
  const s = String(v).replace('*', '').trim()
  if (s === '' || s === '--') return null
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}

// Overlay {cat, cable} par nom — seuls champs non présents dans enceintes.json.
const OVERLAY = {
  K1: ['Line Array', 'DO'], 'K1-SB': ['Line Array', 'speakon'], K2: ['Line Array', 'DO'], K3: ['Line Array', 'speakon'],
  'KARA II': ['Line Array', 'speakon'], Kara: ['Line Array', 'speakon'], 'Kiva II': ['Line Array', 'speakon'],
  'Kiva / Kilo': ['Line Array', 'speakon'], 'V-DOSC': ['Line Array', 'DO'], 'dV-DOSC': ['Line Array', 'speakon'],
  A10: ['Line Array', 'speakon'], A15: ['Line Array', 'speakon'],
  X4i: ['Coaxial', 'speakon'], '5XT': ['Coaxial', 'speakon'], X6i: ['Coaxial', 'speakon'], X8: ['Coaxial', 'speakon'],
  X8i: ['Coaxial', 'speakon'], X12: ['Coaxial', 'speakon'], X15HIQ: ['Coaxial', 'speakon'], '8XT': ['Coaxial', 'speakon'],
  '12XT actif': ['Coaxial', 'speakon'], '12XT passif': ['Coaxial', 'speakon'], '115XTHIQ': ['Coaxial', 'speakon'],
  '112XT': ['Coaxial', 'speakon'], '115XT': ['Coaxial', 'speakon'],
  MTD108a: ['Monitor', 'speakon'], MTD112b: ['Monitor', 'speakon'], MTD115a: ['Monitor', 'speakon'],
  'MTD115b-p': ['Monitor', 'speakon'], 'ARC Wide/Focus': ['Monitor', 'speakon'], ARCSII: ['Monitor', 'speakon'],
  ARCS: ['Monitor', 'speakon'], Kudo: ['Monitor', 'DO'],
  KS28: ['Sub', 'speakon'], SB28: ['Sub', 'speakon'], KS21: ['Sub', 'speakon'], SB18: ['Sub', 'speakon'],
  SB218: ['Sub', 'speakon'], SB118: ['Sub', 'speakon'], SB15m: ['Sub', 'speakon'], 'dV-SUB': ['Sub', 'speakon'],
  CS1: ['Sub', 'speakon'],
  'Syva Low': ['Syva', 'speakon'], 'Syva Sub': ['Syva', 'speakon'], Syva: ['Syva', 'speakon'],
  SB10i: ['Install', 'speakon'], Soka: ['Install', 'speakon'], SB6i: ['Install', 'speakon'],
  L1: ['Line Array', 'SC32'], L1D: ['Line Array', 'SC32'], L2: ['Line Array', 'SC32'], L2D: ['Line Array', 'SC32'],
}

/**
 * ENCLOSURE_DATA — générée depuis enceintes.json.
 * { name, cat, LA4X, LA12X, LA8, ways, cable }
 *   LA4X/LA12X/LA8 : nb de boîtes pilotées par 1 ampli de ce type (null si non applicable)
 *   ways : nombre de voies   cable : 'DO' | 'SC32' | 'speakon'
 */
export const ENCLOSURE_DATA = enceintesDoc.enceintes.map((e) => {
  const [cat, cable] = OVERLAY[e.name] || ['Autre', 'speakon']
  return {
    name: e.name,
    cat,
    LA4X: num(e.LA4X),
    LA12X: num(e.LA12X),
    LA8: num(e.LA8),
    ways: num(e.voies),
    cable,
  }
})

// --- Helpers purs (réutilisables par toutes les apps) ---

/** Retourne l'entrée enceinte par nom exact. */
export function findEnclosure(name) {
  return ENCLOSURE_DATA.find((s) => s.name === name) || null
}

/**
 * Nombre d'amplis nécessaires pour `qty` enceintes `name` avec un ampli `ampType`.
 * ampType ∈ 'LA4X' | 'LA12X' | 'LA8'. Retourne 0 si combinaison non applicable.
 */
export function ampsNeeded(name, ampType, qty) {
  const sp = findEnclosure(name)
  if (!sp || !qty || !sp[ampType]) return 0
  return Math.ceil(qty / sp[ampType])
}

/** Type de câble HP pour une enceinte ('DO' | 'SC32' | 'speakon' | null). */
export function cableType(name) {
  const sp = findEnclosure(name)
  return sp ? sp.cable : null
}

/** Liste des catégories distinctes (Line Array, Sub, …). */
export const CATEGORIES = [...new Set(ENCLOSURE_DATA.map((s) => s.cat))]
