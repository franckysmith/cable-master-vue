<template>
  <div class="amp-calc">
    <div class="calc-header" @click="open = !open">
      <span>🔧 Calculateur Amplis</span>
      <span>{{ open ? '▼' : '▶' }}</span>
    </div>
    <div v-if="open" class="calc-body">
      <!-- En-têtes -->
      <div class="calc-table">
        <div class="calc-row header">
          <span class="col-nb">Nb</span>
          <span class="col-sys">System</span>
          <span class="col-amp">Ampli</span>
          <span class="col-res">Amplis</span>
          <span class="col-rack-group">
            <span class="col-rack-sub">Racks</span>
            <span class="col-rack-sub">Dispo</span>
          </span>
          <span class="col-cable">Câblage</span>
          <span class="col-del"></span>
        </div>

        <!-- Lignes -->
        <div v-for="(line, i) in lines" :key="i" class="calc-row data">
          <input v-model.number="line.qty" type="number" min="1" class="col-nb input-nb" placeholder="0" />
          <select v-model="line.name" class="col-sys input-sys">
            <option value="">--</option>
            <optgroup v-for="cat in speakerCategories(line.ampType)" :key="cat.label" :label="cat.label">
              <option v-for="s in cat.items" :key="s.name" :value="s.name">{{ s.name }}</option>
            </optgroup>
          </select>
          <select v-model="line.ampType" class="col-amp input-amp">
            <option value="LA4X">LA4X</option>
            <option value="LA12X">LA12X</option>
            <option value="LA8">LA8</option>
          </select>
          <span class="col-res val">{{ getAmps(line) || '–' }}</span>
          <span class="col-rack-group">
            <span class="col-rack-sub val">{{ getRacks(line) || '–' }}</span>
            <span class="col-rack-sub val dispo">{{ getDispo(line) || '–' }}</span>
          </span>
          <span class="col-cable val small">{{ getCabling(line) }}</span>
          <button class="col-del btn-del" @click="lines.splice(i, 1)">✕</button>
        </div>

        <!-- Ligne vide pour ajout -->
        <div class="calc-row add-row">
          <button class="btn-add-line" @click="addLine">+ Ajouter une ligne</button>
        </div>

        <!-- Total -->
        <div v-if="lines.some(l => l.name && l.qty)" class="calc-row total">
          <span class="col-nb"></span>
          <span class="col-sys total-label">Total</span>
          <span class="col-amp"></span>
          <span class="col-res val total-val">{{ totalAmps }}</span>
          <span class="col-rack-group">
            <span class="col-rack-sub val total-val">{{ totalRacks }}</span>
            <span class="col-rack-sub val total-val dispo">{{ totalDispo }}</span>
          </span>
          <span class="col-cable"></span>
          <span class="col-del"></span>
        </div>
      </div>

      <!-- Racks par rack + optimiser -->
      <div v-if="lines.some(l => l.name && l.qty)" class="rack-footer">
        <div class="rack-config">
          <span>Amplis par rack :</span>
          <button @click="ampsPerRack = Math.max(1, ampsPerRack - 1)">−</button>
          <strong>{{ ampsPerRack }}</strong>
          <button @click="ampsPerRack++">+</button>
        </div>
        <button v-if="totalDispo > 0" class="btn-optimize" @click="optimize">⚡ Optimiser</button>
        <div v-if="optimizeMsg" class="optimize-msg">{{ optimizeMsg }}</div>
      </div>

      <!-- Insérer -->
      <button v-if="lines.some(l => l.name && l.qty)" class="btn-copy" @click="$emit('insert', summaryText)">📋 Insérer dans les notes</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  description: { type: String, default: '' },
})
defineEmits(['insert'])

const open = ref(false)
const ampsPerRack = ref(3)
const optimizeMsg = ref('')

const lines = ref([
  { qty: null, name: '', ampType: 'LA12X' },
  { qty: null, name: '', ampType: 'LA12X' },
])

// Données : nombre d'enceintes qu'un ampli peut driver
// ways: nombre de voies (3=tri-amp DO, 2=bi-amp, 1=mono speakon)
// cable: 'DO' = DO10 + DO07 multi-pin, 'speakon' = speakon standard
const speakers = [
  { name: 'K1', cat: 'Line Array', LA4X: null, LA12X: 2, LA8: 2, ways: 3, cable: 'DO' },
  { name: 'K1-SB', cat: 'Line Array', LA4X: null, LA12X: 4, LA8: 4, ways: 1, cable: 'speakon' },
  { name: 'K2', cat: 'Line Array', LA4X: 1, LA12X: 3, LA8: 3, ways: 3, cable: 'DO' },
  { name: 'K3', cat: 'Line Array', LA4X: 2, LA12X: 6, LA8: 4, ways: 2, cable: 'speakon' },
  // 2 voies
  { name: 'KARA II', cat: 'Line Array', LA4X: 4, LA12X: 6, LA8: 6, ways: 2, cable: 'speakon' },
  { name: 'Kara', cat: 'Line Array', LA4X: 4, LA12X: 6, LA8: 6, ways: 2, cable: 'speakon' },
  { name: 'Kiva II', cat: 'Line Array', LA4X: 8, LA12X: 24, LA8: 16, ways: 1, cable: 'speakon' },
  { name: 'Kiva / Kilo', cat: 'Line Array', LA4X: 8, LA12X: 12, LA8: 12, ways: 1, cable: 'speakon' },
  { name: 'V-DOSC', cat: 'Line Array', LA4X: null, LA12X: 2, LA8: null, ways: 3, cable: 'DO' },
  { name: 'dV-DOSC', cat: 'Line Array', LA4X: null, LA12X: 6, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'A10', cat: 'Line Array', LA4X: 8, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  { name: 'A15', cat: 'Line Array', LA4X: 4, LA12X: 12, LA8: 8, ways: 2, cable: 'speakon' },
  // Coaxial - 1 voie sauf X15
  { name: 'X4i', cat: 'Coaxial', LA4X: 16, LA12X: 24, LA8: 24, ways: 1, cable: 'speakon' },
  { name: '5XT', cat: 'Coaxial', LA4X: 16, LA12X: 24, LA8: 24, ways: 1, cable: 'speakon' },
  { name: 'X6i', cat: 'Coaxial', LA4X: 8, LA12X: 12, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'X8', cat: 'Coaxial', LA4X: 8, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  { name: 'X8i', cat: 'Coaxial', LA4X: 8, LA12X: 12, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'X12', cat: 'Coaxial', LA4X: 4, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  { name: 'X15HIQ', cat: 'Coaxial', LA4X: 2, LA12X: 6, LA8: 4, ways: 2, cable: 'speakon' },
  { name: '8XT', cat: 'Coaxial', LA4X: 8, LA12X: 12, LA8: 12, ways: 1, cable: 'speakon' },
  { name: '12XT actif', cat: 'Coaxial', LA4X: 4, LA12X: 6, LA8: 6, ways: 2, cable: 'speakon' },
  { name: '12XT passif', cat: 'Coaxial', LA4X: 4, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  { name: '115XTHIQ', cat: 'Coaxial', LA4X: 2, LA12X: 6, LA8: 4, ways: 2, cable: 'speakon' },
  // Monitors
  { name: 'MTD108a', cat: 'Monitor', LA4X: null, LA12X: 12, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'MTD112b', cat: 'Monitor', LA4X: null, LA12X: 8, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'MTD115a', cat: 'Monitor', LA4X: null, LA12X: 4, LA8: null, ways: 2, cable: 'speakon' },
  { name: 'MTD115b-p', cat: 'Monitor', LA4X: null, LA12X: 8, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'ARC Wide/Focus', cat: 'Monitor', LA4X: 4, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  { name: 'ARCSII', cat: 'Monitor', LA4X: 2, LA12X: 6, LA8: 4, ways: 2, cable: 'speakon' },
  { name: 'ARCS', cat: 'Monitor', LA4X: null, LA12X: 6, LA8: null, ways: 2, cable: 'speakon' },
  { name: 'Kudo', cat: 'Monitor', LA4X: 1, LA12X: null, LA8: 3, ways: 3, cable: 'DO' },
  // Subs - 1 voie, speakon
  { name: 'KS28', cat: 'Sub', LA4X: null, LA12X: 4, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'SB28', cat: 'Sub', LA4X: null, LA12X: 4, LA8: 4, ways: 1, cable: 'speakon' },
  { name: 'KS21', cat: 'Sub', LA4X: 4, LA12X: 8, LA8: 6, ways: 1, cable: 'speakon' },
  { name: 'SB18', cat: 'Sub', LA4X: 4, LA12X: 12, LA8: 12, ways: 1, cable: 'speakon' },
  { name: 'SB218', cat: 'Sub', LA4X: null, LA12X: 4, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'SB118', cat: 'Sub', LA4X: null, LA12X: 8, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'SB15m', cat: 'Sub', LA4X: 4, LA12X: 12, LA8: 6, ways: 1, cable: 'speakon' },
  { name: 'dV-SUB', cat: 'Sub', LA4X: null, LA12X: 4, LA8: null, ways: 1, cable: 'speakon' },
  // Syva
  { name: 'Syva Low', cat: 'Syva', LA4X: 4, LA12X: 6, LA8: 4, ways: 2, cable: 'speakon' },
  { name: 'Syva Sub', cat: 'Syva', LA4X: 4, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  { name: 'Syva', cat: 'Syva', LA4X: 4, LA12X: 12, LA8: 8, ways: 1, cable: 'speakon' },
  // Install
  { name: 'SB10i', cat: 'Install', LA4X: 8, LA12X: 12, LA8: 12, ways: 1, cable: 'speakon' },
  { name: 'Soka', cat: 'Install', LA4X: 8, LA12X: 12, LA8: null, ways: 1, cable: 'speakon' },
  { name: 'SB6i', cat: 'Install', LA4X: 4, LA12X: 8, LA8: null, ways: 1, cable: 'speakon' },
]

function speakerCategories(ampKey) {
  const cats = {}
  for (const s of speakers) {
    if (!s[ampKey]) continue
    if (!cats[s.cat]) cats[s.cat] = { label: s.cat, items: [] }
    cats[s.cat].items.push(s)
  }
  return Object.values(cats)
}

function getSpeaker(name) {
  return speakers.find(s => s.name === name)
}

function getAmps(line) {
  if (!line.name || !line.qty) return 0
  const sp = getSpeaker(line.name)
  if (!sp || !sp[line.ampType]) return 0
  return Math.ceil(line.qty / sp[line.ampType])
}

function getRacks(line) {
  if (line.ampType === 'LA4X') return 0
  const amps = getAmps(line)
  return amps ? Math.ceil(amps / ampsPerRack.value) : 0
}

function getCabling(line) {
  if (!line.name || !line.qty) return ''
  const sp = getSpeaker(line.name)
  if (!sp || !sp[line.ampType]) return ''
  if (sp.cable === 'DO') {
    // DO10 : ampli → 1ère boîte (1 par sortie ampli utilisée)
    // DO07 : entre chaque boîte dans la chaîne
    const amps = getAmps(line)
    const do10 = amps // 1 DO10 par ampli (sortie principale)
    const do07 = line.qty // 1 DO07 par boîte (liaison inter-boîtes)
    return `${do10} DO10 + ${do07} DO07`
  }
  // Speakon : 1 par enceinte
  return `${line.qty} Spk`
}

function getDispo(line) {
  if (line.ampType === 'LA4X') return 0
  const amps = getAmps(line)
  if (!amps) return 0
  const racks = getRacks(line)
  const totalSlots = racks * ampsPerRack.value
  return totalSlots - amps
}

const totalDispo = computed(() => {
  // Total des places dispo dans tous les racks
  const byType = {}
  for (const l of lines.value) {
    if (!l.name || !l.qty || l.ampType === 'LA4X') continue
    if (!byType[l.ampType]) byType[l.ampType] = 0
    byType[l.ampType] += getAmps(l)
  }
  let dispo = 0
  for (const [type, amps] of Object.entries(byType)) {
    const racks = Math.ceil(amps / ampsPerRack.value)
    dispo += (racks * ampsPerRack.value) - amps
  }
  return dispo
})

function optimize() {
  optimizeMsg.value = ''
  // Grouper les lignes par type d'ampli (hors LA4X)
  const groups = {}
  for (const l of lines.value) {
    if (!l.name || !l.qty || l.ampType === 'LA4X') continue
    if (!groups[l.ampType]) groups[l.ampType] = []
    groups[l.ampType].push(l)
  }

  let saved = 0
  for (const [type, groupLines] of Object.entries(groups)) {
    // Total d'amplis nécessaires pour ce type
    const totalAmpsNeeded = groupLines.reduce((sum, l) => sum + getAmps(l), 0)
    const racksBefore = groupLines.reduce((sum, l) => sum + getRacks(l), 0)
    const racksAfter = Math.ceil(totalAmpsNeeded / ampsPerRack.value)
    saved += racksBefore - racksAfter
  }

  if (saved > 0) {
    optimizeMsg.value = `✅ ${saved} rack(s) économisé(s) en regroupant les amplis ${Object.keys(groups).join(' + ')}`
  } else {
    optimizeMsg.value = '✅ Déjà optimisé !'
  }
}

// Auto-parsing de la description pour pré-remplir
function parseDescription(text) {
  if (!text) return
  const parsed = []
  const normalized = text.toLowerCase()
  for (const sp of speakers) {
    // Chercher des patterns comme "6 K2", "12 KS28", "6x Kara"
    const name = sp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(\\d+)\\s*x?\\s*${name}\\b`, 'gi')
    const match = regex.exec(text)
    if (match) {
      parsed.push({ qty: parseInt(match[1]), name: sp.name, ampType: 'LA12X' })
    }
  }
  if (parsed.length > 0) {
    lines.value = [...parsed, { qty: null, name: '', ampType: 'LA12X' }]
  }
}

let hasParsed = false
watch(() => props.description, (val) => {
  if (val && !hasParsed) {
    parseDescription(val)
    hasParsed = true
  }
}, { immediate: true })

function addLine() {
  lines.value.push({ qty: null, name: '', ampType: 'LA12X' })
}

const totalAmps = computed(() =>
  lines.value.reduce((sum, l) => sum + getAmps(l), 0)
)

const totalRacks = computed(() => {
  // Grouper par ampType pour le total de racks
  const byType = {}
  for (const l of lines.value) {
    if (!l.name || !l.qty || l.ampType === 'LA4X') continue
    byType[l.ampType] = (byType[l.ampType] || 0) + getAmps(l)
  }
  return Object.values(byType).reduce((sum, amps) => sum + Math.ceil(amps / ampsPerRack.value), 0)
})

const summaryText = computed(() => {
  let text = ''
  for (const l of lines.value) {
    if (!l.name || !l.qty) continue
    text += `${l.qty}x ${l.name} (${l.ampType}) → ${getAmps(l)} ampli(s)`
    if (l.ampType !== 'LA4X') text += ` = ${getRacks(l)} rack(s)`
    text += '\n'
  }
  if (totalAmps.value) text += `Total : ${totalAmps.value} amplis`
  if (totalRacks.value) text += ` = ${totalRacks.value} rack(s)`
  text += '\n'
  return text
})
</script>

<style scoped>
.amp-calc {
  border: 1px solid var(--border-light, #ddd);
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;
}
.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-card, #f5f5f5);
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #333);
  user-select: none;
}
.calc-body {
  padding: 8px;
}
.calc-table {
  width: 100%;
}
.calc-row {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 0;
}
.calc-row.header {
  border-bottom: 2px solid var(--border, #ddd);
  padding-bottom: 6px;
  margin-bottom: 4px;
}
.calc-row.header span {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-light, #888);
  text-transform: uppercase;
  text-align: center;
}
.col-nb { width: 42px; text-align: center; flex-shrink: 0; }
.col-sys { flex: 1; min-width: 0; }
.col-amp { width: 62px; flex-shrink: 0; }
.col-res { width: 38px; text-align: center; flex-shrink: 0; }
.col-rack-group {
  display: flex; flex-shrink: 0; border: 1px solid var(--border-light, #ddd);
  border-radius: 4px; overflow: hidden; background: rgba(59,130,246,0.04);
}
.col-rack-sub { width: 36px; text-align: center; }
.col-rack-sub + .col-rack-sub { border-left: 1px solid var(--border-light, #ddd); }
.header .col-rack-group { border: none; background: none; }
.header .col-rack-sub { font-size: 9px; }
.val.dispo { color: #f59e0b; background: rgba(245,158,11,0.08); }
.total-val.dispo { color: #f59e0b !important; background: rgba(245,158,11,0.1) !important; }
.col-cable { width: 90px; text-align: center; flex-shrink: 0; }
.col-del { width: 22px; flex-shrink: 0; }

.input-nb {
  width: 42px; padding: 5px 2px; border: 1px solid var(--border-light, #ccc);
  border-radius: 4px; font-size: 14px; text-align: center; font-weight: 700;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.input-sys {
  width: 100%; padding: 5px 2px; border: 1px solid var(--border-light, #ccc);
  border-radius: 4px; font-size: 13px;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.input-amp {
  width: 62px; padding: 5px 1px; border: 1px solid var(--border-light, #ccc);
  border-radius: 4px; font-size: 11px; font-weight: 600;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.val {
  font-size: 14px;
  font-weight: 800;
  color: #3b82f6;
  background: rgba(59,130,246,0.08);
  border-radius: 4px;
  padding: 4px 0;
}
.val.small {
  font-size: 10px;
  font-weight: 600;
}
.btn-del {
  width: 20px; height: 20px; border-radius: 50%; border: none;
  background: #ef4444; color: #fff; font-size: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0; min-width: auto; box-shadow: none;
}
.add-row {
  justify-content: center;
  padding: 4px 0;
}
.btn-add-line {
  padding: 4px 12px; border: 1px dashed var(--border-light, #ccc);
  border-radius: 6px; background: transparent; color: var(--text-muted, #999);
  font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto;
}
.calc-row.total {
  border-top: 2px solid var(--border, #ddd);
  margin-top: 4px;
  padding-top: 6px;
}
.total-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--text, #333);
}
.total-val {
  font-size: 16px !important;
  color: var(--color1) !important;
  background: rgba(77,204,89,0.1) !important;
}
.rack-config {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 12px;
  color: var(--text-light, #888);
}
.rack-config button {
  width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--border-light, #ccc);
  background: var(--bg-input, #fff); color: var(--text, #333); font-size: 14px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  padding: 0; min-width: auto; box-shadow: none;
}
.rack-config strong {
  font-size: 16px;
  color: var(--text, #333);
}
.rack-footer { margin: 8px 0; }
.btn-optimize {
  display: block; width: 100%; padding: 6px; margin-top: 6px;
  background: #f59e0b; color: #fff; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: none; min-width: auto;
}
.optimize-msg {
  text-align: center; font-size: 12px; font-weight: 600;
  color: var(--color1); margin-top: 4px;
}
.btn-copy {
  width: 100%;
  padding: 8px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
  margin-top: 4px;
}
</style>
