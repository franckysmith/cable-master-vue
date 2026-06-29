<template>
  <div class="zre">
    <div class="zre-title">📋 Zones de diffusion <span class="zre-sub">(noms des colonnes)</span></div>
    <div v-for="i in 6" :key="i" class="zre-item">
      <div class="zre-row">
        <span class="zre-tag">Z{{ i }}</span>
        <template v-if="isLac(i)">
          <select v-model.number="cfg(i).qty" class="zre-sel zre-qty" @change="syncLabel(i)">
            <option :value="0">Nb</option>
            <option v-for="n in 30" :key="n" :value="n">{{ n }}</option>
          </select>
          <select v-model="cfg(i).model" class="zre-sel zre-model" @change="onModel(i)">
            <option value="">Modèle</option>
            <option v-for="m in MODELS" :key="m" :value="m">{{ m }}</option>
          </select>
        </template>
        <input v-else v-model="labels['lz' + i]" maxlength="14" :placeholder="zonePlaceholders[i - 1] || '—'" />
        <button type="button" class="zre-lac" :class="{ on: isLac(i) }" @click.prevent="toggleLac(i)" title="Calcul automatique L-Acoustics">L-Ac</button>
        <button type="button" class="zre-star" :class="{ on: znStereo(labels['lz' + i]) }" @click.prevent="toggleStar(i)" title="Diffusion par côté (stéréo)"><span>par</span><span>côté</span></button>
      </div>
      <div v-if="isLac(i)" class="zre-lac-row">
        <select v-model="cfg(i).amp" class="zre-sel" @change="onAmp(i)">
          <option v-for="a in ampOptions(i)" :key="a" :value="a">{{ a }}</option>
        </select>
        <label class="zre-mini">×/ampli
          <select v-model.number="cfg(i).perAmp" class="zre-sel zre-num">
            <option v-for="n in perAmpOptions(i)" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <select v-model.number="cfg(i).dist" class="zre-sel">
          <option v-for="d in distOptions(i)" :key="d" :value="d">{{ d }} m</option>
        </select>
      </div>
      <div v-if="isLac(i)" class="zre-cabling">🔌 {{ cablingFor(i) || 'choisis modèle + nb' }}</div>
    </div>
    <div class="zre-amplis">
      <span class="zre-amplis-lbl">Amplis</span>
      <input :value="amplis" @input="$emit('update:amplis', $event.target.value)" :placeholder="amplisPlaceholder" />
    </div>
  </div>
</template>

<script setup>
// Éditeur de zones partagé (création d'affaire ET bouton « 🎛 Zones »).
// labels : { lz1..lz6 } (noms de colonnes) ; configs : { lz1..lz6 } config L-Acoustics par zone.
// Mode « L-Ac » : on calcule le câblage HP depuis qté/modèle/ampli/distance (cabling.js, base partagée).
import { ENCLOSURE_DATA, findEnclosure, cableType } from '../lib/cabling'

const props = defineProps({
  labels: { type: Object, required: true },
  configs: { type: Object, default: () => ({}) },
  amplis: { type: String, default: '' },
  zonePlaceholders: { type: Array, default: () => [] },
  amplisPlaceholder: { type: String, default: 'amplis… (ex. Rack 1, Rack 2)' },
})
defineEmits(['update:amplis'])

const MODELS = ENCLOSURE_DATA.map(e => e.name)
const DIST_DO = [0.7, 5, 10, 25]       // DO / Speakon
const DIST_SC32 = [5, 10, 25, 50]      // SC32 (L-Series) — 50 m réservé au SC32
const AMPS = ['LA4X', 'LA7', 'LA8', 'LA12X']
// Longueurs proposées selon le type de câble de l'enceinte
function distOptions(i) {
  const c = cfg(i)
  return c && c.model && cableType(c.model) === 'SC32' ? DIST_SC32 : DIST_DO
}
// Boîtes par ampli : limité au max autorisé par la base (ex. L2/LA7 = 1, K2/LA12X = 3)
function maxPerAmp(i) {
  const c = cfg(i); const sp = c && c.model ? findEnclosure(c.model) : null
  return (sp && sp[c.amp]) || 1
}
function perAmpOptions(i) { const max = maxPerAmp(i); return Array.from({ length: max }, (_, k) => k + 1) }
// Amplis compatibles avec le modèle choisi (valeur non « -- » dans la base)
function ampOptions(i) {
  const c = cfg(i)
  const sp = c && c.model ? findEnclosure(c.model) : null
  if (!sp) return AMPS
  const ok = AMPS.filter(a => sp[a])
  return ok.length ? ok : AMPS
}

function isLac(i) { return !!(props.configs['lz' + i] && props.configs['lz' + i].lac) }
function cfg(i) { return props.configs['lz' + i] }

function toggleLac(i) {
  const key = 'lz' + i
  if (isLac(i)) { props.configs[key] = { lac: false } }
  else {
    const sp = props.configs[key] || {}
    props.configs[key] = { lac: true, qty: sp.qty || 0, model: sp.model || '', amp: sp.amp || 'LA12X', perAmp: sp.perAmp || null, dist: sp.dist || 25 }
    syncLabel(i)
  }
}

function znStereo(v) { return /\*\s*$/.test(v || '') }
function toggleStar(i) {
  const key = 'lz' + i
  const base = (props.labels[key] || '').replace(/\s*\*\s*$/, '')
  props.labels[key] = znStereo(props.labels[key]) ? base : base + '*'
}

// Défaut « boîtes par ampli » depuis la base d'enceintes selon l'ampli choisi
function defaultPerAmp(c) { const sp = findEnclosure(c.model); return (sp && sp[c.amp]) || null }
function onModel(i) {
  const c = cfg(i); if (!c) return
  const sp = findEnclosure(c.model)
  // bascule sur un ampli compatible si l'actuel ne l'est pas
  if (sp && !sp[c.amp]) { const ok = AMPS.filter(a => sp[a]); if (ok.length) c.amp = ok[0] }
  c.perAmp = defaultPerAmp(c)
  // recale la distance si elle n'existe pas pour ce type de câble
  if (!distOptions(i).includes(c.dist)) c.dist = distOptions(i)[1] || distOptions(i)[0]
  syncLabel(i)
}
function onAmp(i) { const c = cfg(i); if (c) c.perAmp = defaultPerAmp(c) }

// En mode L-Ac, le nom de la colonne = « {qté} {modèle} » (+ * si stéréo)
function syncLabel(i) {
  const c = cfg(i); if (!c) return
  const stereo = znStereo(props.labels['lz' + i])
  const base = [c.qty || '', c.model || ''].filter(Boolean).join(' ').trim()
  props.labels['lz' + i] = base + (stereo ? '*' : '')
}

// Câblage HP calculé pour la zone (DO10/DO07 ou Speakon), ×2 si par côté
function cablingFor(i) {
  const c = cfg(i)
  if (!c || !c.model || !c.qty) return ''
  const sp = findEnclosure(c.model); if (!sp) return ''
  const per = c.perAmp || sp[c.amp] || 1
  const amps = Math.max(1, Math.ceil(c.qty / per))
  // « par côté » : on affiche les chiffres PAR CÔTÉ (non doublés) + le label ; le ×2 réel
  // pour la quantité totale de câble se fera au remplissage de la grille (étape 2).
  const stereo = znStereo(props.labels['lz' + i])
  const dist = c.dist || 25
  const ct = cableType(c.model)
  let txt
  if (sp.cat === 'Sub') txt = `${amps} DO sub + porteur (${dist}m)` // règle subs : porteur + DO sub
  else if (ct === 'DO') txt = `${amps} DO10 (${dist}m) + ${c.qty} DO07`
  else if (ct === 'SC32') txt = `${amps} SC32 (${dist}m)`
  else txt = `${amps} Speakon (${dist}m)`
  return stereo ? txt + ' · par côté' : txt
}
</script>

<style scoped>
.zre { margin-top: 6px; }
.zre-title { font-size: 12px; font-weight: 800; color: var(--text-muted, #aaa); margin-bottom: 6px; }
.zre-sub { font-weight: 600; opacity: 0.8; }
.zre-item { margin-bottom: 7px; }
.zre-row { display: flex; align-items: center; gap: 6px; }
.zre-tag { flex: 0 0 26px; font-size: 11px; font-weight: 800; color: var(--text-muted, #999); text-align: center; }
.zre-row input { flex: 1; min-width: 0; padding: 6px 8px; font-size: 14px; border: 1px solid var(--border-light, #555); border-radius: 7px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); }
.zre-sel { padding: 6px 4px; font-size: 13px; border: 1px solid var(--border-light, #555); border-radius: 7px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); }
.zre-qty { flex: 0 0 58px; }
.zre-model { flex: 1; min-width: 0; }
.zre-lac { flex: 0 0 auto; padding: 4px 7px; border: 1px solid #2563eb; border-radius: 7px; background: transparent; color: #60a5fa; font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: none; min-width: auto; }
.zre-lac.on { background: #2563eb; color: #fff; }
.zre-star { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; line-height: 1.05; padding: 3px 7px; border: 1px solid var(--border-light, #777); border-radius: 7px; background: transparent; color: var(--text, #e8e8e8); font-size: 11px; font-weight: 800; cursor: pointer; box-shadow: none; min-width: auto; }
.zre-star.on { background: #f59e0b; border-color: #f59e0b; color: #fff; }
.zre-lac-row { display: flex; align-items: center; gap: 6px; margin: 4px 0 0 32px; }
.zre-mini { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted, #999); }
.zre-num { width: 46px; padding: 5px 4px; font-size: 13px; border: 1px solid var(--border-light, #555); border-radius: 7px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); }
.zre-cabling { margin: 3px 0 0 32px; font-size: 12px; font-weight: 700; color: #34d399; }
.zre-amplis { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.zre-amplis-lbl { flex: 0 0 auto; font-size: 12px; font-weight: 800; color: var(--text-muted, #999); }
.zre-amplis input { flex: 1; min-width: 0; padding: 6px 8px; font-size: 14px; border: 1px solid var(--border-light, #555); border-radius: 7px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); }
</style>
