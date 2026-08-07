// Départements (son / lumière / vidéo) : libellés, types de matériel pertinents,
// et département couramment consulté.
//
// Tout le monde reçoit les trois départements à l'inscription : on ne pose plus
// la question au départ, chacun remplit ce qui le concerne. Le choix se fait
// ensuite dans le drawer (Câbles Son / Lumière / Vidéo).

import { ref } from 'vue'

export const DEPT_LABELS = { sound: 'Son', light: 'Lumière', video: 'Vidéo' }

export const DEPT_ORDER = ['sound', 'light', 'video']

export const ALL_DEPARTMENTS = [...DEPT_ORDER]

// Les trois métiers ne câblent pas avec le même matériel : les HP et les modules
// n'ont de sens qu'au son, le numérique surtout en vidéo. Les "spéciaux" ne sont
// pas proposés hors son : leur contenu n'a rien à voir d'un métier à l'autre,
// chacun se crée ses propres libellés (types personnalisables `type8..type10`).
// On ne masque que des onglets : les types restent identiques en base.
const DEPT_TYPES = {
  sound: null, // tous
  light: ['electrical', 'other', 'accessory'],
  video: ['electrical', 'other', 'accessory', 'digital'],
}

export function typeAllowedInDept(type, dept) {
  const allowed = DEPT_TYPES[dept]
  if (!allowed) return true
  if (/^type\d+$/.test(type)) return true // types créés par l'utilisateur : partout
  return allowed.includes(type)
}

// Postes tenus par les membres de la Team, par métier. Un même poste peut être
// tenu par plusieurs personnes (deux techniciens plateau, par exemple).
// Vidéo : noms provisoires, en attendant les intitulés du métier.
export const POSTES_BY_DEPT = {
  sound: [
    { value: 'front', label: 'FOH' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'system', label: 'Système' },
    { value: 'stage', label: 'Stage' },
    { value: 'assistant', label: 'Assistant' },
  ],
  light: [
    { value: 'light_pupitre', label: 'Pupitre' },
    { value: 'light_blocker', label: 'Blocker' },
    { value: 'light_tech', label: 'Technicien' },
  ],
  video: [
    { value: 'video_1', label: 'Vidéo 1' },
    { value: 'video_2', label: 'Vidéo 2' },
    { value: 'video_3', label: 'Vidéo 3' },
  ],
}

// Liste à plat, dans l'ordre Son → Lumière → Vidéo
export const ALL_POSTES = DEPT_ORDER.flatMap((d) =>
  POSTES_BY_DEPT[d].map((p) => ({ ...p, department: d }))
)

export function posteLabelFor(value) {
  return ALL_POSTES.find((p) => p.value === value)?.label || value
}

// Département affiché dans la liste de câbles. Partagé entre le drawer (App.vue)
// et la vue CableList, et conservé d'une session à l'autre.
const STORAGE_KEY = 'cablemaster-listdept'
export const activeDept = ref(localStorage.getItem(STORAGE_KEY) || 'sound')

export function setActiveDept(dept) {
  if (!DEPT_ORDER.includes(dept)) return
  activeDept.value = dept
  localStorage.setItem(STORAGE_KEY, dept)
}
