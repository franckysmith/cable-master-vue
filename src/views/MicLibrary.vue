<template>
  <div class="mic-library">
    <h2>🎤 Bibliothèque Micros</h2>

    <!-- Barre d'outils -->
    <div class="toolbar">
      <input v-model="search" class="search-input" placeholder="Rechercher un micro..." />
      <button class="upload-btn" @click="showUpload = !showUpload">+ Ajouter</button>
    </div>

    <!-- Upload PDF -->
    <div v-if="showUpload" class="upload-panel">
      <h4>Ajouter un micro</h4>
      <div class="form-row">
        <label>Marque *</label>
        <input v-model="newMic.brand" placeholder="ex: Shure, Audix..." required />
      </div>
      <div class="form-row">
        <label>Modèle *</label>
        <input v-model="newMic.name" placeholder="ex: SM58, Beta 52A..." required />
      </div>
      <div class="form-row">
        <label>Infos</label>
        <input v-model="newMic.info" placeholder="Dynamique | Cardioïde | 50Hz-15kHz..." />
      </div>
      <div class="form-row">
        <label>PDF (fiche technique)</label>
        <input type="file" accept=".pdf" @change="onFileSelect" ref="fileInput" />
      </div>
      <div v-if="uploadError" class="error-msg">{{ uploadError }}</div>
      <div class="form-actions">
        <button class="btn-add" @click="addMic" :disabled="uploading">
          {{ uploading ? 'Upload...' : 'Ajouter à la bibliothèque' }}
        </button>
        <button class="btn-cancel" @click="showUpload = false">Annuler</button>
      </div>
    </div>

    <!-- Liste par marque -->
    <div v-for="[brand, mics] in filteredGroups" :key="brand" class="brand-group">
      <div class="brand-header" @click="toggleBrand(brand)">
        <span class="brand-arrow">{{ closedBrands[brand] ? '▶' : '▼' }}</span>
        <span class="brand-name">{{ brand }}</span>
        <span class="brand-count">{{ mics.length }}</span>
      </div>
      <template v-if="!closedBrands[brand]">
        <div v-for="mic in mics" :key="mic.cableid" class="mic-card">
          <div class="mic-info">
            <div class="mic-name">{{ mic.name }}</div>
            <div class="mic-specs">{{ mic.info || 'Pas de spécifications' }}</div>
          </div>
          <div class="mic-actions">
            <a v-if="mic.link" :href="mic.link" target="_blank" class="btn-pdf" title="Voir le PDF">📄</a>
            <button
              class="btn-add-list"
              :class="{ added: isInMyList(mic), loading: adding[mic.name] }"
              @click="addToMyList(mic)"
              :disabled="isInMyList(mic) || adding[mic.name]"
            >{{ adding[mic.name] ? '...' : isInMyList(mic) ? '✓ Ajouté' : '+ Liste' }}</button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="filteredGroups.length === 0" class="empty">
      {{ search ? 'Aucun micro trouvé' : 'Bibliothèque vide' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useCableStore } from '../stores/cables'

const cableStore = useCableStore()
const search = ref('')
const showUpload = ref(false)
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref(null)
const selectedFile = ref(null)
const allMics = ref([])
const myMicIds = ref(new Set())
const closedBrands = ref({})

const newMic = ref({
  brand: '',
  name: '',
  info: '',
})

onMounted(async () => {
  await loadAllMics()
  await loadMyList()
})

const LIB_CATALOG_ID = 2 // Catalogue "Bibliothèque Micros"
const activeCatalogId = parseInt(localStorage.getItem('cablemaster-catalogid')) || 1

async function loadAllMics() {
  const { data } = await supabase
    .from('cable')
    .select('*')
    .eq('type', 'microphone')
    .eq('catalog_id', LIB_CATALOG_ID)
    .order('brand', { ascending: true })
    .order('name', { ascending: true })
  allMics.value = data || []
}

async function loadMyList() {
  // Charger les micros de ma liste (catalog_id = 1)
  const { data } = await supabase
    .from('cable')
    .select('name')
    .eq('type', 'microphone')
    .eq('catalog_id', activeCatalogId)
  const ids = new Set()
  if (data) {
    for (const c of data) ids.add(c.name)
  }
  myMicIds.value = ids
}

function isInMyList(mic) {
  return myMicIds.value.has(mic.name)
}

const filteredMics = computed(() => {
  if (!search.value) return allMics.value
  const q = search.value.toLowerCase()
  return allMics.value.filter(m =>
    m.name.toLowerCase().includes(q) ||
    (m.brand || '').toLowerCase().includes(q) ||
    (m.info || '').toLowerCase().includes(q)
  )
})

const filteredGroups = computed(() => {
  const groups = {}
  for (const mic of filteredMics.value) {
    const brand = mic.brand || 'Autre'
    if (!groups[brand]) groups[brand] = []
    groups[brand].push(mic)
  }
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
})

function toggleBrand(brand) {
  closedBrands.value[brand] = !closedBrands.value[brand]
}

function onFileSelect(e) {
  selectedFile.value = e.target.files[0] || null
}

async function addMic() {
  if (!newMic.value.brand || !newMic.value.name) {
    uploadError.value = 'Marque et modèle sont obligatoires'
    return
  }

  // Vérifier doublon
  const existing = allMics.value.find(m =>
    m.name.toLowerCase() === newMic.value.name.toLowerCase()
  )
  if (existing) {
    uploadError.value = `"${newMic.value.name}" existe déjà dans la bibliothèque`
    return
  }

  uploading.value = true
  uploadError.value = ''
  let pdfUrl = ''

  // Upload PDF si sélectionné
  if (selectedFile.value) {
    const filename = `${newMic.value.brand}_${newMic.value.name}`.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'
    const { error } = await supabase.storage
      .from('microphones')
      .upload(`pdfs/${filename}`, selectedFile.value, {
        contentType: 'application/pdf',
        upsert: true,
      })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('microphones')
        .getPublicUrl(`pdfs/${filename}`)
      pdfUrl = urlData?.publicUrl || ''
    }
  }

  // Insérer dans la bibliothèque
  const { error } = await supabase
    .from('cable')
    .insert({
      name: newMic.value.name,
      type: 'microphone',
      brand: newMic.value.brand,
      info: newMic.value.info,
      link: pdfUrl,
      weight: 0,
      sortno: 0,
      total: 0,
      reserved: 0,
      catalog_id: LIB_CATALOG_ID,
    })

  if (error) {
    uploadError.value = error.message
  } else {
    newMic.value = { brand: '', name: '', info: '' }
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    showUpload.value = false
    await loadAllMics()
  }
  uploading.value = false
}

const adding = ref({})

async function addToMyList(mic) {
  if (isInMyList(mic) || adding.value[mic.name]) return

  adding.value[mic.name] = true

  // Vérifier doublon dans la base
  const { data: existing } = await supabase
    .from('cable')
    .select('cableid')
    .eq('name', mic.name)
    .eq('type', 'microphone')
    .eq('catalog_id', activeCatalogId)
    .limit(1)

  if (existing?.length > 0) {
    myMicIds.value = new Set([...myMicIds.value, mic.name])
    adding.value[mic.name] = false
    return
  }

  const { error } = await supabase
    .from('cable')
    .insert({
      name: mic.name,
      type: 'microphone',
      brand: mic.brand,
      info: mic.info,
      link: mic.link,
      weight: mic.weight || 0,
      sortno: 0,
      total: 0,
      reserved: 0,
      catalog_id: activeCatalogId,
    })

  adding.value[mic.name] = false

  if (error) {
    console.error('Erreur ajout micro:', error.message)
  } else {
    myMicIds.value = new Set([...myMicIds.value, mic.name])
  }
}
</script>

<style scoped>
.mic-library {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px;
  text-align: left;
}
h2 {
  text-align: center;
  font-size: 18px;
  margin-bottom: 12px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.search-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  outline: none;
}
.search-input:focus {
  border-color: var(--color1);
}
.upload-btn {
  padding: 8px 14px;
  background: var(--color3);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.upload-panel {
  background: var(--bg-card, #fafafa);
  border: 2px solid var(--color3);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}
.upload-panel h4 {
  margin: 0 0 10px;
  font-size: 15px;
}
.form-row {
  margin-bottom: 8px;
}
.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 2px;
}
.form-row input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
}
.form-row input:focus {
  border-color: var(--color1);
}
.error-msg {
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  margin: 6px 0;
}
.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.btn-add {
  flex: 1;
  padding: 10px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn-add:disabled {
  opacity: 0.5;
}
.btn-cancel {
  padding: 10px 14px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.brand-group {
  margin-bottom: 4px;
}
.brand-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 2px solid #eb910a;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 4px;
  box-shadow: 0 3px 8px rgba(235, 145, 10, 0.35);
  transition: box-shadow 0.2s, transform 0.1s;
}
.brand-header:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(235, 145, 10, 0.3);
}
.brand-arrow {
  font-size: 10px;
  width: 12px;
}
.brand-name {
  font-size: 15px;
  font-weight: 700;
  flex: 1;
}
.brand-count {
  font-size: 12px;
  font-weight: 600;
  background: #eb910a;
  color: #fff;
  padding: 1px 8px;
  border-radius: 10px;
}
.mic-card {
  display: flex;
  align-items: center;
  padding: 8px 10px 8px 20px;
}
.mic-info {
  flex: 1;
  min-width: 0;
}
.mic-name {
  font-size: 14px;
  font-weight: 700;
}
.mic-specs {
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mic-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-pdf {
  font-size: 20px;
  text-decoration: none;
}
.btn-add-list {
  padding: 4px 10px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.btn-add-list.added {
  background: #ccc;
  color: #666;
  cursor: default;
}
.btn-add-list.loading {
  background: #fbbf24;
  color: #fff;
}
.empty {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}
</style>
