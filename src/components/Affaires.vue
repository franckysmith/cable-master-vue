<template>
  <div class="affaires">
    <!-- Quand un projet est sélectionné : juste le titre -->
    <div v-if="affairStore.selectedAffair" class="selected-bar" @click="deselectAffair">
      <span class="sel-dot">●</span>
      <span class="sel-name">{{ affairStore.selectedAffair.name }}</span>
      <span class="sel-date">{{ formatDate(affairStore.selectedAffair.receipt_date) }}</span>
      <span class="sel-change">▼</span>
    </div>

    <!-- Sinon : barre d'actions + liste -->
    <template v-else>
      <div class="top-bar">
        <button class="btn-new" @click="$emit('openNew', true)">+ Nouvelle</button>
        <input
          ref="searchInput"
          v-model="search"
          class="search-input"
          placeholder="Rechercher..."
        />
        <button
          class="btn-edit-mode"
          :class="{ active: editMode }"
          @click="editMode = !editMode"
        >edit</button>
      </div>

      <div class="affair-list">
        <div v-for="group in groupedAffairs" :key="group.label" class="group">
          <div class="group-label">{{ group.label }}</div>
          <div
            v-for="affair in group.affairs"
            :key="affair.affairid"
            class="affair-card"
            @click="onAffairClick(affair)"
          >
            <div class="card-line1">
              <span class="card-dot">●</span>
              <span class="card-name">{{ affair.name }}</span>
              <span class="card-date">{{ formatDate(affair.receipt_date) }}</span>
            </div>
            <div class="card-line2">
              <span class="card-created">édité le {{ formatDate(affair.created_at) }}</span>
              <span class="card-updated" v-if="affair.updated_at">modifié le {{ formatDate(affair.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-if="groupedAffairs.length === 0" class="empty">Aucune affaire trouvée</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAffairStore } from '../stores/affairs'

const emit = defineEmits(['selected', 'edit', 'openNew'])
const affairStore = useAffairStore()

const search = ref('')
const searchInput = ref(null)
const editMode = ref(false)

onMounted(() => {
  affairStore.fetchAffairs()
})


const filteredAffairs = computed(() => {
  if (!search.value) return affairStore.affairs
  const q = search.value.toLowerCase()
  return affairStore.affairs.filter(a =>
    (a.name || '').toLowerCase().includes(q) ||
    (a.ref || '').toLowerCase().includes(q) ||
    (a.tech_name || '').toLowerCase().includes(q) ||
    (a.receipt_date || '').includes(q)
  )
})

const groupedAffairs = computed(() => {
  const now = new Date()
  const groups = {
    current: { label: 'En cours', affairs: [] },
    upcoming: { label: 'À venir', affairs: [] },
    past: { label: 'Passées', affairs: [] },
  }

  for (const a of filteredAffairs.value) {
    const receipt = a.receipt_date ? new Date(a.receipt_date) : null
    const ret = a.return_date ? new Date(a.return_date) : null

    if (ret && ret < now) {
      groups.past.affairs.push(a)
    } else if (receipt && receipt <= now) {
      groups.current.affairs.push(a)
    } else {
      groups.upcoming.affairs.push(a)
    }
  }

  return [groups.current, groups.upcoming, groups.past].filter(g => g.affairs.length > 0)
})

const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function selectAffair(affair) {
  affairStore.selectAffair(affair)
  emit('selected', affair)
  search.value = ''
  editMode.value = false
}

function onAffairClick(affair) {
  if (editMode.value) {
    emit('edit', affair)
    editMode.value = false
  } else {
    selectAffair(affair)
  }
}

function deselectAffair() {
  affairStore.selectAffair(null)
}
</script>

<style scoped>
.affaires {
  padding: 5px 10px;
  text-align: left;
}
.top-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.selected-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color1-light);
  border: 2px solid var(--color1);
  border-radius: 8px;
  cursor: pointer;
}
.sel-dot {
  color: var(--color1);
  font-size: 16px;
}
.sel-name {
  font-size: 16px;
  font-weight: 700;
  color: #000;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sel-date {
  font-size: 13px;
  color: #555;
  white-space: nowrap;
}
.sel-change {
  font-size: 12px;
  color: #888;
}
.affair-list {
  max-height: 60vh;
  overflow-y: auto;
}
.search-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
}
.search-input:focus {
  border-color: var(--color1);
}
.btn-edit-mode {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 2px solid #ccc;
  border-radius: 6px;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-edit-mode.active {
  background: var(--color3);
  border-color: var(--color3);
  color: white;
}
.group {
  margin-bottom: 4px;
}
.group-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #999;
  padding: 6px 6px 2px;
  letter-spacing: 0.5px;
}
.affair-card {
  position: relative;
  padding: 8px 10px;
  margin: 2px 4px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  background: #fafafa;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.affair-card:hover {
  background: var(--color1-hover);
  border-color: var(--color1-border);
}
.affair-card.selected {
  background: var(--color1-light);
  border-color: var(--color1);
}
.card-line1 {
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-dot {
  color: var(--color1);
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1;
}
.card-name {
  font-size: 17px;
  font-weight: 700;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-date {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  flex-shrink: 0;
}
.card-line2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  padding-left: 26px;
}
.card-created {
  font-size: 13px;
  color: #888;
}
.card-updated {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}
.empty {
  padding: 15px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.btn-new {
  cursor: pointer;
  padding: 6px 12px;
  background: var(--color3);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
