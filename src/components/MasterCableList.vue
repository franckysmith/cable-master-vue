<template>
  <div class="list_container">
    <template v-for="row in rows" :key="row.key">
      <div v-if="row.type === 'header'" class="brand-group-head">{{ row.brand }}</div>
      <div v-else-if="row.type === 'pieds-header'" class="pieds-head">🎚 {{ row.brand }}</div>
      <div v-else class="cable-row" :class="{ inactive: row.cable.active === false }">
      <input
        type="checkbox"
        :checked="row.cable.active !== false"
        @change="toggleActive(row.cable)"
        class="cable-active"
      />
      <div class="cable-name">{{ row.cable.name }}</div>
      <div class="cable-fields">
        <input
          type="number"
          :value="row.cable.reserved"
          @change="update(row.cable, 'reserved', $event)"
          title="seuil"
        />
        <input
          type="number"
          :value="row.cable.total"
          :class="stockClass(row.cable)"
          @change="update(row.cable, 'total', $event)"
          title="total"
        />
        <input
          type="number"
          :value="row.cable.weight"
          @change="update(row.cable, 'weight', $event)"
          title="poids"
        />
        <input
          type="number"
          :value="row.cable.sortno"
          @change="update(row.cable, 'sortno', $event)"
          title="ordre"
        />
      </div>
      <button class="btn-delete" @click="$emit('delete', row.cable)">x</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCableStore } from '../stores/cables'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  groupByBrand: { type: Boolean, default: false }, // Micro List : en-têtes par marque
})
const emit = defineEmits(['delete'])
const cableStore = useCableStore()

// Un « pied de micro » (pas un micro) → regroupé tout à la fin
function isPied(c) { return /pied/i.test(c.name || '') || /pied/i.test(c.brand || '') }

// Lignes à afficher : plat, ou groupé par marque (en-tête + micros) si groupByBrand,
// avec les pieds de micro tout à la fin sous un séparateur « Pieds ».
const rows = computed(() => {
  if (!props.groupByBrand) {
    return props.cables.map(c => ({ type: 'cable', key: 'c' + c.cableid, cable: c }))
  }
  const pieds = props.cables.filter(isPied)
  const mics = props.cables.filter(c => !isPied(c))
  const groups = {}
  for (const c of mics) {
    const b = (c.brand || '').trim() || 'Autres'
    ;(groups[b] = groups[b] || []).push(c)
  }
  const out = []
  for (const b of Object.keys(groups).sort((a, z) => a.localeCompare(z))) {
    out.push({ type: 'header', key: 'h' + b, brand: b })
    for (const c of groups[b]) out.push({ type: 'cable', key: 'c' + c.cableid, cable: c })
  }
  if (pieds.length) {
    out.push({ type: 'pieds-header', key: 'pieds', brand: 'Pieds' })
    for (const c of pieds) out.push({ type: 'cable', key: 'c' + c.cableid, cable: c })
  }
  return out
})

function update(cable, field, event) {
  const value = parseInt(event.target.value) || 0
  cableStore.updateCable(cable.cableid, { [field]: value })
}

// Alerte stock : total au niveau/sous le seuil → rouge ; un peu au-dessus → orange
function stockClass(cable) {
  const seuil = parseInt(cable.reserved) || 0
  const total = parseInt(cable.total) || 0
  if (seuil <= 0) return ''
  if (total <= seuil) return 'stock-low'
  if (total <= seuil * 1.3) return 'stock-warn'
  return ''
}

function toggleActive(cable) {
  const newVal = cable.active === false ? true : false
  cableStore.updateCable(cable.cableid, { active: newVal })
  cable.active = newVal
}
</script>

<style scoped>
.list_container {
  width: 100%;
  padding: 0 8px;
}
.brand-group-head {
  font-size: 13px; font-weight: 800; color: var(--color1);
  padding: 8px 6px 3px; margin-top: 4px;
  border-bottom: 2px solid var(--color1); text-transform: uppercase; letter-spacing: 0.3px;
}
.pieds-head {
  font-size: 14px; font-weight: 800; color: #eb910a;
  padding: 10px 6px 4px; margin-top: 14px;
  border-top: 3px solid #eb910a; border-bottom: 2px solid #eb910a;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.cable-row {
  display: flex;
  align-items: center;
  margin: 1px 0;
  border-bottom: 1px solid var(--border-light, #eee);
  padding: 4px 0;
}
.cable-row.inactive {
  opacity: 0.4;
}
.cable-row.inactive .cable-name {
  text-decoration: line-through;
}
.cable-name {
  flex: 1;
  min-width: 70px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text, #333);
}
.cable-fields {
  display: flex;
  gap: 2px;
  flex: none;
}
.cable-fields input {
  width: 44px;
  box-sizing: border-box;
  text-align: center;
  font-size: 13px;
  padding: 4px 2px;
  border: 1px solid var(--border-light, #ddd);
  border-radius: 4px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
}
/* Pas d'incrément : on tape simplement le chiffre (flèches masquées) */
.cable-fields input::-webkit-outer-spin-button,
.cable-fields input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.cable-fields input { -moz-appearance: textfield; appearance: textfield; }
/* Alerte stock sur le total */
.cable-fields input.stock-warn { background: #fed7aa !important; color: #9a3412 !important; border-color: #f59e0b !important; font-weight: 800; }
.cable-fields input.stock-low { background: #fecaca !important; color: #991b1b !important; border-color: #ef4444 !important; font-weight: 800; }
.cable-active {
  width: 18px;
  height: 18px;
  margin-right: 4px;
  flex-shrink: 0;
  cursor: pointer;
}
.btn-delete {
  cursor: pointer;
  margin-left: 4px;
  background: transparent;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 4px;
  font-size: 11px;
  padding: 3px 6px;
  color: var(--text-muted, #999);
  box-shadow: none;
  min-width: auto;
}
</style>
