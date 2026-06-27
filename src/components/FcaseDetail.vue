<template>
  <div class="fcase-detail" v-if="visible">
    <div class="detail-header">
      <h3>{{ fcName }}</h3>
      <div class="detail-actions">
        <button class="action-btn" @click="printFc" title="Imprimer">Impr.</button>
        <button class="action-btn" @click="showQr = !showQr" title="QR Code">QR</button>
        <button class="close-btn" @click="$emit('close')">x</button>
      </div>
    </div>

    <!-- QR Code -->
    <div v-if="showQr" class="qr-container">
      <canvas ref="qrCanvas"></canvas>
      <p class="qr-hint">Scanner pour voir le contenu</p>
    </div>

    <div v-for="group in groupedCables" :key="group.type" class="type-group">
      <div class="type-header" :style="{ borderLeft: `4px solid ${colorForType(group.type)}` }">
        {{ typeLabel(group.type) }}
        <span class="type-count">{{ group.total }}</span>
      </div>
      <div v-for="cable in group.cables" :key="cable.cableid" class="detail-row">
        <span class="detail-name">{{ cable.name }}</span>
        <span class="detail-count">{{ cable.qty }}</span>
      </div>
    </div>
    <div v-if="groupedCables.length === 0" class="empty">
      Aucun câble dans cette caisse.
    </div>
    <div v-else class="total-row">
      Total: <strong>{{ totalCount }}</strong> câbles
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  visible: { type: Boolean, default: false },
  fcName: { type: String, default: '' },
  fcField: { type: String, default: '' },
  cables: { type: Array, default: () => [] },
  affairName: { type: String, default: '' },
})

defineEmits(['close'])

const showQr = ref(false)
const qrCanvas = ref(null)

const groupedCables = computed(() => {
  const cablesinFc = props.cables
    .filter(c => (c[props.fcField] || 0) > 0)
    .map(c => ({ cableid: c.cableid, name: c.name, type: c.type, qty: c[props.fcField] }))

  const typeOrder = ['speaker', 'electrical', 'module', 'microphone', 'digital', 'special', 'other', 'c_type', 'accessory']
  const groups = {}

  for (const c of cablesinFc) {
    if (!groups[c.type]) groups[c.type] = { type: c.type, cables: [], total: 0 }
    groups[c.type].cables.push(c)
    groups[c.type].total += c.qty
  }

  return typeOrder
    .filter(t => groups[t])
    .map(t => groups[t])
})

const totalCount = computed(() =>
  groupedCables.value.reduce((sum, g) => sum + g.total, 0)
)

// Générer le texte compact pour QR
function buildQrText() {
  let text = `${props.affairName} | ${props.fcName}\n`
  for (const group of groupedCables.value) {
    const items = group.cables.map(c => `${c.name}×${c.qty}`).join(', ')
    text += `${typeLabel(group.type)}: ${items}\n`
  }
  text += `Total: ${totalCount.value}`
  return text
}

// Générer le QR code
watch(showQr, async (val) => {
  if (val) {
    await nextTick()
    if (qrCanvas.value) {
      QRCode.toCanvas(qrCanvas.value, buildQrText(), {
        width: 200,
        margin: 2,
      })
    }
  }
})

// Imprimer cette caisse
function printFc() {
  let html = `<html><head><title>${props.fcName}</title><style>
    body { font-family: sans-serif; padding: 20px; }
    h2 { margin: 0 0 4px; } h3 { margin: 0 0 15px; color: #666; }
    .group { margin-bottom: 12px; }
    .group-title { font-weight: bold; font-size: 14px; padding: 4px 8px; background: #f0f0f0; border-left: 4px solid #ccc; margin-bottom: 4px; display: flex; justify-content: space-between; }
    .row { display: flex; justify-content: space-between; padding: 2px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .total { font-weight: bold; margin-top: 10px; font-size: 14px; text-align: right; }
  </style></head><body>`

  html += `<h2>${props.fcName}</h2>`
  if (props.affairName) html += `<h3>${props.affairName}</h3>`

  for (const group of groupedCables.value) {
    html += `<div class="group"><div class="group-title" style="border-left-color:${colorForType(group.type)}"><span>${typeLabel(group.type)}</span><span>${group.total}</span></div>`
    for (const cable of group.cables) {
      html += `<div class="row"><span>${cable.name}</span><span>${cable.qty}</span></div>`
    }
    html += `</div>`
  }
  html += `<div class="total">Total: ${totalCount.value} câbles</div>`
  html += `</body></html>`

  const w = window.open('', '_blank', 'width=400,height=600')
  w.document.write(html)
  w.document.close()
  w.print()
}

function typeLabel(type) {
  const labels = {
    speaker: 'HP', electrical: 'Électrique', module: 'Modules',
    microphone: 'Micros', special: 'Spéciaux', other: 'Autres',
    c_type: 'Cablekit', accessory: 'Accessoires', digital: 'Digital'
  }
  return labels[type] || type
}

function colorForType(type) {
  const colors = {
    speaker: 'var(--color1)', electrical: '#f3e309', microphone: '#eb910a',
    module: '#ef4444', special: '#3b82f6', other: '#a16207',
    c_type: '#06b6d4', accessory: '#84cc16', digital: '#f97316',
  }
  return colors[type] || '#ccc'
}
</script>

<style scoped>
.fcase-detail {
  width: 100%;
  max-width: 420px;
  margin-top: 10px;
  border: 2px solid var(--color1);
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.detail-header h3 {
  font-size: 16px;
  margin: 0;
}
.detail-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.action-btn {
  cursor: pointer;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  padding: 4px 10px;
  font-weight: 600;
}
.action-btn:hover {
  background: var(--color1-light);
  border-color: var(--color1);
}
.close-btn {
  cursor: pointer;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  padding: 4px 8px;
}
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}
.qr-hint {
  font-size: 11px;
  color: #999;
  margin: 6px 0 0;
}
.type-group {
  margin-bottom: 8px;
}
.type-header {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.type-count {
  background: #2c3e50;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 10px;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}
.detail-name {
  color: #333;
}
.detail-count {
  font-weight: bold;
  color: #2c3e50;
}
.total-row {
  padding: 8px 0;
  text-align: right;
  font-size: 14px;
  color: #666;
}
.empty {
  padding: 10px;
  color: #999;
  font-size: 14px;
  font-style: italic;
  text-align: center;
}
</style>
