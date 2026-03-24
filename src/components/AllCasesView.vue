<template>
  <div class="all-cases-view">
    <template v-for="i in 7" :key="'fc-section-'+i">
      <div v-if="getFcCables(i).length > 0" class="case-section">
        <div class="case-header" @click="openCase = openCase === 'fc'+i ? '' : 'fc'+i">
          <span>{{ openCase === 'fc'+i ? '▼' : '▶' }}</span>
          <span v-if="isCaseComplete('fc' + i, getFcCables(i))" class="case-done">✅</span>
          <span class="case-title fc-color">{{ fcLabels[`lfc${i}`] || `FC${i}` }}</span>
          <span class="case-count">{{ getFcCables(i).length }}</span>
        </div>
        <div v-if="openCase === 'fc'+i" class="case-content">
          <div v-for="c in getFcCables(i)" :key="c.cableid" class="case-cable">
            <input type="checkbox" :checked="checkedCables[c.cableid + '_fc' + i]" @change="toggleCableCheck(c.cableid, 'fc' + i)" class="case-check" />
            <span class="case-cable-qty">{{ c[`tfc${i}`] }}</span>
            <span class="case-cable-name">{{ c.name }}</span>
          </div>
        </div>
      </div>
    </template>
    <div v-if="getMicroCables().length > 0" class="case-section">
      <div class="case-header" @click="openCase = openCase === 'micro' ? '' : 'micro'">
        <span>{{ openCase === 'micro' ? '▼' : '▶' }}</span>
        <span v-if="isCaseComplete('micro', getMicroCables())" class="case-done">✅</span>
        <span class="case-title micro-color">🎤 Micros</span>
        <span class="case-count">{{ getMicroCables().length }}</span>
      </div>
      <div v-if="openCase === 'micro'" class="case-content">
        <div v-for="c in getMicroCables()" :key="c.cableid" class="case-cable">
          <input type="checkbox" :checked="checkedCables[c.cableid + '_micro']" @change="toggleCableCheck(c.cableid, 'micro')" class="case-check" />
          <span class="case-cable-qty">{{ getMicroQty(c) }}</span>
          <span class="case-cable-name">{{ c.name }}</span>
        </div>
      </div>
    </div>
    <div v-if="cables.length === 0" class="empty">Aucun câble dans les flight-cases.</div>
    <div v-if="allCasesReady && cables.length > 0" class="all-ready-banner">✅ Tout est prêt !</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  affairId: { default: null },
  fcLabels: { type: Object, default: () => ({}) },
})

const openCase = ref('')
const checkedCables = ref({})

// Charger les coches depuis Supabase
async function loadChecks() {
  if (!props.affairId) return
  const localKey = `cablemaster-checks-${props.affairId}`
  // Charger localStorage (coches existantes du technicien)
  let localChecks = {}
  try {
    localChecks = JSON.parse(localStorage.getItem(localKey) || '{}')
  } catch { /* ignore */ }
  // Charger depuis Supabase
  const { data } = await supabase
    .from('affair')
    .select('checked_cables')
    .eq('affairid', props.affairId)
    .single()
  if (data?.checked_cables && Object.keys(data.checked_cables).length > 0) {
    // Supabase a des données — c'est la source de vérité
    checkedCables.value = data.checked_cables
    localStorage.setItem(localKey, JSON.stringify(data.checked_cables))
  } else if (Object.keys(localChecks).length > 0) {
    // Supabase vide mais localStorage a des coches — migration initiale
    checkedCables.value = localChecks
    await supabase
      .from('affair')
      .update({ checked_cables: localChecks })
      .eq('affairid', props.affairId)
  }
}

async function saveChecks() {
  if (!props.affairId) return
  const localKey = `cablemaster-checks-${props.affairId}`
  localStorage.setItem(localKey, JSON.stringify(checkedCables.value))
  await supabase
    .from('affair')
    .update({ checked_cables: checkedCables.value })
    .eq('affairid', props.affairId)
}

function toggleCableCheck(cableid, caseKey) {
  const key = cableid + '_' + caseKey
  checkedCables.value[key] = !checkedCables.value[key]
  checkedCables.value = { ...checkedCables.value }
  saveChecks()
}

function getFcCables(fcIndex) {
  return props.cables.filter(c => (c[`tfc${fcIndex}`] || 0) > 0)
}

function getMicroCables() {
  return props.cables.filter(c => c.type === 'microphone' && (
    (c.spare_count || 0) + (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) + (c.tfc4 || 0) + (c.tfc5 || 0) > 0
  ))
}

function getMicroQty(cable) {
  const max = Math.max(cable.tfc1 || 0, cable.tfc2 || 0, cable.tfc3 || 0, cable.tfc4 || 0, cable.tfc5 || 0)
  return max + (cable.spare_count || 0)
}

function isCaseComplete(caseKey, cables) {
  if (cables.length === 0) return false
  return cables.every(c => checkedCables.value[c.cableid + '_' + caseKey])
}

const allCasesReady = computed(() => {
  for (let i = 1; i <= 7; i++) {
    const cables = getFcCables(i)
    if (cables.length > 0 && !isCaseComplete('fc' + i, cables)) return false
  }
  const mics = getMicroCables()
  if (mics.length > 0 && !isCaseComplete('micro', mics)) return false
  return true
})

watch(() => props.affairId, () => loadChecks(), { immediate: true })
</script>

<style scoped>
.all-cases-view {
  padding: 0 6px;
}
.case-section {
  margin-bottom: 6px;
  border: 1px solid var(--border-light, #ddd);
  border-radius: 8px;
  overflow: hidden;
}
.case-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-card, #f5f5f5);
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  user-select: none;
}
.case-title.fc-color {
  color: var(--color1);
}
.case-title.micro-color {
  color: #eb910a;
}
.case-count {
  margin-left: auto;
  background: var(--border, #e0e0e0);
  color: var(--text, #333);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}
.case-done {
  font-size: 14px;
}
.case-content {
  border-top: 1px solid var(--border-light, #eee);
}
.case-cable {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border, #eee);
  font-size: 14px;
}
.case-cable:last-child {
  border-bottom: none;
}
.case-check {
  width: 20px;
  height: 20px;
  accent-color: var(--color1);
  cursor: pointer;
  flex-shrink: 0;
}
.case-cable-qty {
  font-weight: 800;
  color: var(--color1);
  min-width: 24px;
  text-align: center;
}
.case-cable-name {
  color: var(--text, #333);
  font-weight: 600;
}
.all-ready-banner {
  text-align: center;
  padding: 12px;
  font-size: 16px;
  font-weight: 800;
  color: var(--color1);
  background: var(--color1-light);
  border-radius: 8px;
  margin: 8px 0;
}
.empty {
  text-align: center;
  padding: 15px;
  color: var(--text-muted, #999);
  font-size: 14px;
}
</style>
