<template>
  <div v-if="open" class="aw-overlay" @click.self="$emit('close')">
    <div class="aw-modal">
      <div class="aw-head">
        <span class="aw-title">🔧 Calculateur ampli → câblage</span>
        <button class="aw-close" @click="$emit('close')">✕</button>
      </div>

      <div class="aw-body">
        <p v-if="zoneLabel" class="aw-zone">Zone : <b>{{ zoneLabel }}</b><span v-if="stereo"> — stéréo (×2)</span></p>

        <div class="aw-row">
          <label>Enceinte</label>
          <select v-model="name">
            <option value="">--</option>
            <optgroup v-for="cat in cats" :key="cat" :label="cat">
              <option v-for="s in byCat(cat)" :key="s.name" :value="s.name">{{ s.name }}</option>
            </optgroup>
          </select>
        </div>
        <div class="aw-row">
          <label>Quantité {{ stereo ? '(par côté)' : '' }}</label>
          <input type="number" min="1" v-model.number="qty" />
        </div>
        <div class="aw-row">
          <label>Ampli</label>
          <select v-model="ampType">
            <option value="LA4X">LA4X</option>
            <option value="LA12X">LA12X</option>
            <option value="LA8">LA8</option>
          </select>
        </div>
        <div class="aw-row">
          <label>Distance (m)</label>
          <input type="number" min="0" v-model.number="distance" placeholder="ex. 30" />
        </div>
        <div class="aw-row">
          <label>Par remplissage</label>
          <select v-model.number="perFill">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
          </select>
        </div>

        <!-- Résultat -->
        <div v-if="enclosure" class="aw-result">
          <div class="aw-amps">{{ totalQty }} {{ name }} → <b>{{ amps }}</b> ampli{{ amps > 1 ? 's' : '' }} ({{ ampType }})</div>
          <div class="aw-cab-title">Câblage proposé :</div>
          <div v-for="(it, i) in proposal" :key="i" class="aw-cab" :class="{ missing: !it.cableid }">
            <span class="aw-cab-qty">{{ it.qty }}</span>
            <span class="aw-cab-name">{{ it.match || it.generic }}</span>
            <span v-if="!it.cableid" class="aw-cab-warn">à créer ({{ it.generic }})</span>
          </div>
        </div>
        <p v-else class="aw-hint">Choisis une enceinte pour voir le câblage.</p>
      </div>

      <div class="aw-foot">
        <button class="aw-cancel" @click="$emit('close')">Annuler</button>
        <button class="aw-assign" :disabled="!assignable.length" @click="assign">Assigner à la zone</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ENCLOSURE_DATA } from '../lib/cabling'

const props = defineProps({
  open: { type: Boolean, default: false },
  zoneLabel: { type: String, default: '' },
  zoneIndex: { type: Number, default: null }, // 1-6 (zone), 0 = spare
  stereo: { type: Boolean, default: false },
  cables: { type: Array, default: () => [] }, // catalogue : { cableid, name, type }
})
const emit = defineEmits(['close', 'assign'])

const name = ref('')
const qty = ref(0)
const ampType = ref('LA12X')
const distance = ref(null)
const perFill = ref(1)

const cats = computed(() => [...new Set(ENCLOSURE_DATA.map(s => s.cat))])
function byCat(c) { return ENCLOSURE_DATA.filter(s => s.cat === c) }
const enclosure = computed(() => ENCLOSURE_DATA.find(s => s.name === name.value) || null)

// Pré-remplissage depuis l'étiquette de zone (ex. « 12 k2 » → 12 + K2)
watch(() => props.open, (o) => {
  if (!o) return
  // Repartir d'une base vierge à chaque ouverture
  name.value = ''
  qty.value = 0
  ampType.value = 'LA12X'
  distance.value = null
  perFill.value = 1
  const m = (props.zoneLabel || '').trim().match(/^(\d+)\s*(.+)$/)
  if (m) {
    qty.value = parseInt(m[1]) || 0
    const guess = norm(m[2])
    const found = ENCLOSURE_DATA.find(s => norm(s.name) === guess) ||
                  ENCLOSURE_DATA.find(s => norm(s.name).startsWith(guess))
    if (found) name.value = found.name
  }
})

function norm(s) { return (s || '').toLowerCase().replace(/[\s.*-]/g, '') }

const totalQty = computed(() => (props.stereo ? (qty.value || 0) * 2 : (qty.value || 0)))
const amps = computed(() => {
  const e = enclosure.value
  if (!e || !e[ampType.value] || !totalQty.value) return 0
  return Math.ceil(totalQty.value / e[ampType.value])
})

// Câblage générique (1ère version) selon le type de câble HP de l'enceinte
const proposal = computed(() => {
  const e = enclosure.value
  if (!e || !amps.value) return []
  const out = []
  if (e.cable === 'DO') {
    out.push({ generic: 'DO10', qty: amps.value })
    out.push({ generic: 'DO07', qty: Math.max(0, totalQty.value - amps.value) })
  } else if (e.cable === 'SC32') {
    out.push({ generic: 'SC32', qty: amps.value })
  } else {
    // speakon : 1 par enceinte (÷ remplissage si chaînage)
    const q = perFill.value > 1 ? Math.ceil(totalQty.value / perFill.value) : totalQty.value
    out.push({ generic: distance.value ? `Spk ${distance.value}m` : 'Spk', qty: q })
  }
  // Mapping vers le catalogue (par nom)
  return out.map(it => {
    const cab = matchCable(it.generic)
    return { ...it, cableid: cab?.cableid || null, match: cab?.name || null }
  })
})
const assignable = computed(() => proposal.value.filter(p => p.cableid))

function matchCable(generic) {
  const g = norm(generic.replace(/\d+m$/, '')) // 'spk30m' → 'spk'
  const wantLen = (generic.match(/(\d+)m$/) || [])[1]
  const list = props.cables || []
  // 1) match sur le token (do10, do07, sc32, spk…)
  let cands = list.filter(c => norm(c.name).includes(g))
  if (!cands.length && g === 'spk') cands = list.filter(c => /spk|speakon|hp/i.test(c.name))
  if (!cands.length) return null
  // 2) si une distance est demandée, préférer la longueur la plus proche
  if (wantLen) {
    const target = parseInt(wantLen)
    cands = [...cands].sort((a, b) => Math.abs(lenOf(a) - target) - Math.abs(lenOf(b) - target))
  }
  return cands[0]
}
function lenOf(c) { const m = (c.name || '').match(/(\d+)\s*m/); return m ? parseInt(m[1]) : 9999 }

function assign() {
  emit('assign', { zone: props.zoneIndex, items: assignable.value.map(p => ({ cableid: p.cableid, qty: p.qty })) })
}
</script>

<style scoped>
.aw-overlay { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 12px; }
.aw-modal { width: 100%; max-width: 460px; max-height: 92vh; display: flex; flex-direction: column; background: var(--bg-card, #1a1a2e); border-radius: 14px; overflow: hidden; }
.aw-head { display: flex; align-items: center; padding: 12px 14px; background: #0891b2; }
.aw-title { flex: 1; font-size: 15px; font-weight: 800; color: #fff; }
.aw-close { background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer; box-shadow: none; min-width: auto; }
.aw-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px; }
.aw-zone { font-size: 13px; color: var(--text-muted, #aaa); margin: 0 0 10px; }
.aw-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.aw-row label { flex: 0 0 130px; font-size: 13px; font-weight: 700; color: var(--text, #ddd); }
.aw-row select, .aw-row input { flex: 1; min-width: 0; padding: 7px 8px; border: 1px solid var(--border-light, #444); border-radius: 8px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); font-size: 14px; }
.aw-result { margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border, #3a3a55); }
.aw-amps { font-size: 14px; color: var(--text, #ddd); margin-bottom: 8px; }
.aw-cab-title { font-size: 12px; font-weight: 700; color: var(--text-muted, #aaa); margin-bottom: 4px; }
.aw-cab { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-style: italic; color: var(--text, #ddd); }
.aw-cab-qty { min-width: 28px; text-align: center; font-weight: 800; background: var(--bg-section, #2a2a45); border-radius: 5px; padding: 1px 4px; }
.aw-cab.missing { opacity: 0.7; }
.aw-cab-warn { color: #f59e0b; font-size: 12px; font-style: normal; }
.aw-hint { font-size: 13px; color: var(--text-muted, #888); }
.aw-foot { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border, #3a3a55); }
.aw-cancel { flex: 1; padding: 11px; background: transparent; border: 1px solid var(--border-light, #555); border-radius: 10px; color: var(--text, #ccc); font-weight: 700; cursor: pointer; box-shadow: none; }
.aw-assign { flex: 2; padding: 11px; background: #0891b2; border: none; border-radius: 10px; color: #fff; font-weight: 800; cursor: pointer; box-shadow: none; }
.aw-assign:disabled { opacity: 0.4; }
</style>
