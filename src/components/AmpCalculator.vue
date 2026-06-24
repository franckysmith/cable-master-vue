<template>
  <div class="amp-calc">
    <div class="calc-header" @click="open = !open">
      <span>🔧 Calculateur Amplis</span>
      <span>{{ open ? '▼' : '▶' }}</span>
    </div>
    <div v-if="open" class="calc-body">
      <!-- En-têtes -->
      <div class="calc-table">
        <!-- Lignes -->
        <div v-for="(line, i) in lines" :key="i" class="calc-card">
          <div class="card-inputs">
            <input v-model.number="line.qty" type="number" min="1" class="input-nb" placeholder="Nb" />
            <select v-model="line.name" class="input-sys">
              <option value="">-- Enceinte --</option>
              <optgroup v-for="cat in speakerCategories(line.ampType)" :key="cat.label" :label="cat.label">
                <option v-for="s in cat.items" :key="s.name" :value="s.name">{{ s.name }}</option>
              </optgroup>
            </select>
            <select v-model="line.ampType" class="input-amp">
              <option value="LA4X">4X</option>
              <option value="LA12X">12X</option>
              <option value="LA8">8</option>
            </select>
            <button class="btn-del" @click="lines.splice(i, 1)">✕</button>
          </div>
          <div v-if="line.name && line.qty" class="card-results">
            <span class="res-item"><strong>{{ getAmps(line) }}</strong> ampli{{ getAmps(line) > 1 ? 's' : '' }}</span>
            <template v-if="line.ampType !== 'LA4X'">
              <span class="res-item rack">{{ getRacks(line) }} rack{{ getRacks(line) > 1 ? 's' : '' }}</span>
              <span v-if="getDispo(line)" class="res-item dispo">{{ getDispo(line) }} dispo</span>
            </template>
            <span class="res-item cable">{{ getCabling(line) }}</span>
          </div>
        </div>

        <!-- Ajout -->
        <button class="btn-add-line" @click="addLine">+ Ajouter une ligne</button>

        <!-- Total -->
        <div v-if="lines.some(l => l.name && l.qty)" class="calc-total">
          <span class="total-label">Total</span>
          <span class="total-val">{{ totalAmps }} amplis</span>
          <span v-if="totalRacks" class="total-val rack">{{ totalRacks }} racks</span>
          <span v-if="totalDispo" class="total-val dispo">{{ totalDispo }} dispo</span>
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
// Règles de câblage : copie locale (autonome pour le déploiement) de @cinod/shared
import { ENCLOSURE_DATA } from '../lib/cabling'

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

// Table des enceintes → importée depuis la source unique @cinod/shared.
const speakers = ENCLOSURE_DATA

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
.calc-body { padding: 8px; }
.calc-table { width: 100%; }

/* Card par ligne */
.calc-card {
  border: 1px solid var(--border-light, #ddd);
  border-radius: 8px;
  margin-bottom: 6px;
  overflow: hidden;
}
.card-inputs {
  display: flex;
  gap: 4px;
  padding: 6px;
  align-items: center;
}
.input-nb {
  width: 50px; padding: 8px 4px; border: 1px solid var(--border-light, #ccc);
  border-radius: 6px; font-size: 16px; text-align: center; font-weight: 700;
  background: var(--bg-input, #fff); color: var(--text, #333);
  flex-shrink: 0;
}
.input-sys {
  flex: 1; min-width: 0; padding: 8px 4px; border: 1px solid var(--border-light, #ccc);
  border-radius: 6px; font-size: 14px;
  background: var(--bg-input, #fff); color: var(--text, #333);
}
.input-amp {
  width: 54px; padding: 8px 2px; border: 1px solid var(--border-light, #ccc);
  border-radius: 6px; font-size: 13px; font-weight: 700;
  background: var(--bg-input, #fff); color: var(--text, #333);
  flex-shrink: 0; text-align: center;
}
.btn-del {
  width: 24px; height: 24px; border-radius: 50%; border: none;
  background: #ef4444; color: #fff; font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0; min-width: auto; box-shadow: none; flex-shrink: 0;
}
/* Résultats sous les inputs */
.card-results {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 8px 6px;
  background: rgba(59,130,246,0.05);
  border-top: 1px solid var(--border-light, #eee);
}
.res-item {
  font-size: 12px;
  font-weight: 700;
  color: #3b82f6;
  background: rgba(59,130,246,0.1);
  padding: 2px 8px;
  border-radius: 10px;
}
.res-item strong { font-size: 14px; }
.res-item.rack { color: var(--color1); background: rgba(77,204,89,0.1); }
.res-item.dispo { color: #f59e0b; background: rgba(245,158,11,0.1); }
.res-item.cable { color: var(--text-light, #888); background: var(--bg-card, #f0f0f0); font-size: 11px; }

/* Bouton ajout */
.btn-add-line {
  display: block; width: 100%;
  padding: 8px; border: 1px dashed var(--border-light, #ccc);
  border-radius: 6px; background: transparent; color: var(--text-muted, #999);
  font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: none; min-width: auto;
  text-align: center; margin-bottom: 6px;
}
/* Total */
.calc-total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-top: 2px solid var(--border, #ddd);
  margin-top: 4px;
}
.total-label { font-size: 14px; font-weight: 800; color: var(--text, #333); }
.total-val {
  font-size: 14px; font-weight: 800; color: var(--color1);
  background: rgba(77,204,89,0.1); padding: 3px 10px; border-radius: 10px;
}
.total-val.rack { color: #3b82f6; background: rgba(59,130,246,0.1); }
.total-val.dispo { color: #f59e0b; background: rgba(245,158,11,0.1); }
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
