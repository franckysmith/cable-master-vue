<template>
  <div class="all-cases-view">
    <div v-for="g in displayGroups" :key="g.role" class="role-group">
      <div v-if="g.label" class="role-header" :style="{ color: g.color }">{{ g.label }}</div>

      <!-- Flight-cases du métier -->
      <template v-if="!g.isMicro">
        <template v-for="i in 7" :key="g.role + '-fc-' + i">
          <div v-if="fcCables(g.cables, i).length > 0" class="case-section">
            <div class="case-header" @click="toggle(g.role + 'fc' + i)">
              <span>{{ openCase === g.role + 'fc' + i ? '▼' : '▶' }}</span>
              <span v-if="isCaseComplete(g.role + '_fc' + i, fcCables(g.cables, i))" class="case-done">✅</span>
              <span class="case-title" :style="{ color: g.color }">{{ (g.labels && g.labels[`lfc${i}`]) || fcLabels[`lfc${i}`] || `FC${i}` }}</span>
              <span class="case-count">{{ fcCables(g.cables, i).length }}</span>
            </div>
            <div v-if="openCase === g.role + 'fc' + i" class="case-content">
              <div v-for="c in fcCables(g.cables, i)" :key="c.cableid" class="case-cable">
                <input type="checkbox" :checked="checkedCables[c.cableid + '_' + g.role + '_fc' + i]" @change="toggleCableCheck(c.cableid, g.role + '_fc' + i)" class="case-check" />
                <span class="case-cable-qty">{{ c[`tfc${i}`] }}</span>
                <span class="case-cable-name">{{ c.name }}</span>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- Caisse micro commune -->
      <template v-else>
        <div v-if="g.cables.length > 0" class="case-section">
          <div class="case-header" @click="toggle('micro')">
            <span>{{ openCase === 'micro' ? '▼' : '▶' }}</span>
            <span v-if="isCaseComplete('micro', g.cables)" class="case-done">✅</span>
            <span class="case-title" :style="{ color: g.color }">{{ g.label }}</span>
            <span class="case-count">{{ g.cables.length }}</span>
          </div>
          <div v-if="openCase === 'micro'" class="case-content">
            <div v-for="c in g.cables" :key="c.cableid" class="case-cable">
              <input type="checkbox" :checked="checkedCables[c.cableid + '_micro']" @change="toggleCableCheck(c.cableid, 'micro')" class="case-check" />
              <span class="case-cable-qty">{{ getMicroQty(c) }}</span>
              <span class="case-cable-name">{{ c.name }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="displayGroups.every(g => g.cables.length === 0)" class="empty">Aucun câble dans les flight-cases.</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  cables: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  affairId: { default: null },
  fcLabels: { type: Object, default: () => ({}) },
})

const openCase = ref('')
const checkedCables = ref({})

function toggle(key) {
  openCase.value = openCase.value === key ? '' : key
}

function isMicroCable(c) {
  return c.type === 'microphone' && (
    (c.spare_count || 0) + (c.tfc1 || 0) + (c.tfc2 || 0) + (c.tfc3 || 0) + (c.tfc4 || 0) + (c.tfc5 || 0) > 0
  )
}

// Si des groupes (par métier) sont fournis on les utilise ; sinon rétro-compat (liste simple)
const displayGroups = computed(() => {
  if (props.groups && props.groups.length) return props.groups
  return [
    { role: 'front', label: '', color: 'var(--color1)', isMicro: false, cables: props.cables },
    { role: 'micro', label: '🎤 Micros', color: '#eb910a', isMicro: true, cables: props.cables.filter(isMicroCable) },
  ]
})

function fcCables(cables, fcIndex) {
  return cables.filter(c => (c[`tfc${fcIndex}`] || 0) > 0)
}

function getMicroQty(cable) {
  const max = Math.max(cable.tfc1 || 0, cable.tfc2 || 0, cable.tfc3 || 0, cable.tfc4 || 0, cable.tfc5 || 0)
  return max + (cable.spare_count || 0)
}

function isCaseComplete(caseKey, cables) {
  if (cables.length === 0) return false
  return cables.every(c => checkedCables.value[c.cableid + '_' + caseKey])
}

function toggleCableCheck(cableid, caseKey) {
  const key = cableid + '_' + caseKey
  checkedCables.value[key] = !checkedCables.value[key]
  checkedCables.value = { ...checkedCables.value }
  saveChecks()
}

async function loadChecks() {
  if (!props.affairId) return
  const localKey = `cablemaster-checks-${props.affairId}`
  let localChecks = {}
  try {
    localChecks = JSON.parse(localStorage.getItem(localKey) || '{}')
  } catch { /* ignore */ }
  const { data } = await supabase
    .from('affair')
    .select('checked_cables')
    .eq('affairid', props.affairId)
    .single()
  if (data?.checked_cables && Object.keys(data.checked_cables).length > 0) {
    checkedCables.value = data.checked_cables
    localStorage.setItem(localKey, JSON.stringify(data.checked_cables))
  } else if (Object.keys(localChecks).length > 0) {
    checkedCables.value = localChecks
    await supabase.from('affair').update({ checked_cables: localChecks }).eq('affairid', props.affairId)
  }
}

async function saveChecks() {
  if (!props.affairId) return
  const localKey = `cablemaster-checks-${props.affairId}`
  localStorage.setItem(localKey, JSON.stringify(checkedCables.value))
  await supabase.from('affair').update({ checked_cables: checkedCables.value }).eq('affairid', props.affairId)
}

watch(() => props.affairId, () => loadChecks(), { immediate: true })
</script>

<style scoped>
.all-cases-view {
  padding: 0 6px;
}
.role-group {
  margin-bottom: 12px;
}
.role-header {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 10px 0 6px;
  padding-left: 2px;
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
.empty {
  text-align: center;
  padding: 15px;
  color: var(--text-muted, #999);
  font-size: 14px;
}
</style>
