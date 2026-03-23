<template>
  <div class="mic-library">
    <h2>🎤 Bibliothèque Micros</h2>

    <!-- Barre d'outils -->
    <div class="toolbar">
      <input v-model="search" class="search-input" placeholder="Rechercher un micro..." />
      <button class="view-toggle" @click="viewMode = viewMode === 'list' ? 'gallery' : 'list'">
        {{ viewMode === 'list' ? '🖼' : '📋' }}
      </button>
      <button class="edit-toggle" :class="{ active: editListMode }" @click="editListMode = !editListMode">
        {{ editListMode ? '🔓' : '🔒' }}
      </button>
      <button v-if="editListMode" class="upload-btn" @click="showUpload = !showUpload">+ Ajouter</button>
    </div>

    <!-- Filtres par marque -->
    <div class="brand-filters">
      <button
        class="brand-filter-btn"
        :class="{ active: !selectedBrand }"
        @click="selectedBrand = ''"
      >Tous</button>
      <button
        v-for="b in availableBrands"
        :key="b.name"
        class="brand-filter-btn"
        :class="{ active: selectedBrand === b.name }"
        :style="{ borderColor: b.color, color: selectedBrand === b.name ? '#fff' : b.color, background: selectedBrand === b.name ? b.color : 'transparent' }"
        @click="selectedBrand = selectedBrand === b.name ? '' : b.name"
      >{{ b.short }}</button>
    </div>

    <!-- Filtres par instrument -->
    <div class="instrument-filters">
      <button
        v-for="inst in instruments"
        :key="inst.key"
        class="inst-filter-btn"
        :class="{ active: selectedInstrument === inst.key }"
        @click="selectedInstrument = selectedInstrument === inst.key ? '' : inst.key"
      >{{ inst.label }}</button>
    </div>

    <!-- Upload PDF -->
    <div v-if="showUpload" class="upload-panel">
      <h4>Ajouter un micro</h4>
      <div class="form-row">
        <label>📄 PDF (fiche technique)</label>
        <input type="file" accept=".pdf" @change="onFileSelect" ref="fileInput" />
        <div v-if="extracting" class="extracting">⏳ Extraction des infos du PDF...</div>
      </div>
      <div class="form-row">
        <label>📷 Photo du micro</label>
        <input type="file" accept="image/*" @change="onImageSelect" ref="imageInput" />
        <img v-if="imagePreview" :src="imagePreview" class="image-preview" />
      </div>
      <div class="form-row">
        <label>Marque</label>
        <input v-model="newMic.brand" placeholder="Détecté automatiquement..." />
      </div>
      <div class="form-row">
        <label>Modèle</label>
        <input v-model="newMic.name" placeholder="Détecté automatiquement..." />
      </div>
      <div class="form-row">
        <label>Infos</label>
        <input v-model="newMic.info" placeholder="Détecté automatiquement..." />
      </div>
      <div v-if="uploadError" class="error-msg">{{ uploadError }}</div>
      <div class="form-actions">
        <button class="btn-add" @click="addMic" :disabled="uploading || extracting || (!newMic.brand && !newMic.name)">
          {{ uploading ? 'Upload...' : 'Ajouter à la bibliothèque' }}
        </button>
        <button class="btn-cancel" @click="showUpload = false">Annuler</button>
      </div>
    </div>

    <!-- Vue Galerie -->
    <div v-if="viewMode === 'gallery'" class="gallery">
      <div
        v-for="mic in filteredMics"
        :key="mic.cableid"
        class="gallery-card"
        :class="{ added: isInMyList(mic) }"
        @click="isInMyList(mic) ? removeFromMyList(mic) : addToMyList(mic)"
      >
        <button
          v-if="editListMode"
          class="gallery-add-btn"
          :class="{ added: isInMyList(mic) }"
          @click.stop="isInMyList(mic) ? removeFromMyList(mic) : addToMyList(mic)"
          :disabled="adding[mic.name]"
        >{{ isInMyList(mic) ? '✓' : '+' }}</button>
        <span v-else-if="isInMyList(mic)" class="gallery-badge">✓</span>
        <div class="gallery-thumb">
          <img v-if="mic.image_url" :src="mic.image_url" class="mic-image" />
          <div v-else class="no-thumb">🎤</div>
          <label v-if="canEditImage(mic)" :for="'img-' + mic.cableid" class="change-image-btn" @click.stop>
            {{ mic.image_url ? '✏️' : '+ image' }}
            <input
              :id="'img-' + mic.cableid"
              type="file"
              accept="image/*"
              class="hidden-input"
              @change="uploadMicImage(mic, $event)"
            />
          </label>
        </div>
        <div class="gallery-text">
          <div class="gallery-name">{{ mic.name }}</div>
          <div class="gallery-brand">{{ mic.brand }}</div>
          <a v-if="mic.link" :href="mic.link" target="_blank" class="gallery-pdf-link" @click.stop>📄</a>
          <button v-if="editListMode" class="gallery-edit-btn" @click.stop="openEditMic(mic)">✏️</button>
        </div>

        <!-- Panneau édition inline -->
        <div v-if="editingMicId === mic.cableid" class="mic-edit-panel" @click.stop>
          <div class="form-row">
            <label>Marque</label>
            <input v-model="editMic.brand" />
          </div>
          <div class="form-row">
            <label>Modèle</label>
            <input v-model="editMic.name" />
          </div>
          <div class="form-row">
            <label>Infos</label>
            <input v-model="editMic.info" />
          </div>
          <div class="form-row">
            <label>Remplacer le PDF</label>
            <input type="file" accept=".pdf" @change="editMic.newPdf = $event.target.files[0]" />
          </div>
          <div class="mic-edit-actions">
            <button class="btn-save-mic" @click="saveEditMic(mic)">Enregistrer</button>
            <button class="btn-delete-mic" @click="deleteMic(mic)">Supprimer</button>
            <button class="btn-cancel-mic" @click="editingMicId = null">Annuler</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue Liste par marque -->
    <template v-if="viewMode === 'list'">
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
              v-if="editListMode"
              class="btn-add-list"
              :class="{ added: isInMyList(mic), loading: adding[mic.name] }"
              @click="isInMyList(mic) ? removeFromMyList(mic) : addToMyList(mic)"
              :disabled="adding[mic.name]"
            >{{ adding[mic.name] ? '...' : isInMyList(mic) ? '✓ Ajouté' : '+ Liste' }}</button>
            <span v-else-if="isInMyList(mic)" class="added-badge">✓</span>
          </div>
        </div>
      </template>
    </div>
    </template>

    <div v-if="filteredGroups.length === 0 && filteredMics.length === 0" class="empty">
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
const viewMode = ref('gallery')
const editListMode = ref(false)
const selectedBrand = ref('')
const selectedInstrument = ref('')

const instruments = [
  { key: 'voix', label: '🎤 Voix', words: ['voix', 'vocal', 'voice', 'chant'] },
  { key: 'kick', label: '🥁 Grosse caisse', words: ['grosse caisse', 'kick', 'bass drum'] },
  { key: 'caisseclaire', label: '🪘 Caisse claire', words: ['caisse claire', 'snare'] },
  { key: 'toms', label: '🥁 Toms', words: ['tom', 'floor tom', 'rack tom'] },
  { key: 'percus', label: '🪇 Percussions', words: ['percussion', 'conga', 'djemb', 'bongo', 'timbale'] },
  { key: 'overhead', label: '🎵 Overhead', words: ['overhead', 'studio'] },
  { key: 'guitare', label: '🎸 Guitare', words: ['guitare', 'guitar', 'ampli'] },
  { key: 'basse', label: '🎸 Basse', words: ['basse', 'bass cabinet', 'bass,'] },
  { key: 'cuivres', label: '🎺 Cuivres', words: ['cuivre', 'brass', 'trompette', 'trombone', 'sax'] },
  { key: 'bois', label: '🎷 Bois', words: ['bois', 'woodwind', 'flûte', 'clarinette', 'hautbois'] },
  { key: 'piano', label: '🎹 Piano', words: ['piano'] },
  { key: 'cordes', label: '🎻 Cordes', words: ['violon', 'violoncelle', 'cello', 'cordes', 'strings'] },
  { key: 'broadcast', label: '📻 Broadcast', words: ['broadcast', 'radio'] },
]

const brandColors = {
  'Shure': '#1a5276',
  'Audix': '#c0392b',
  'Sennheiser': '#2c3e50',
  'Beyerdynamic': '#7d3c98',
  'Electro-Voice': '#d4ac0d',
  'AKG': '#2980b9',
  'DPA': '#27ae60',
  'Neumann': '#34495e',
  'Rode': '#e74c3c',
  'Audio-Technica': '#1abc9c',
  'Telefunken': '#e67e22',
  'Schoeps': '#8e44ad',
}

const brandShortNames = {
  'Beyerdynamic': 'Beyer',
  'Electro-Voice': 'EV',
  'Audio-Technica': 'A-T',
}

const availableBrands = computed(() => {
  const brands = new Set()
  for (const mic of allMics.value) {
    if (mic.brand) brands.add(mic.brand)
  }
  return [...brands].sort().map(name => ({
    name,
    short: brandShortNames[name] || name,
    color: brandColors[name] || '#888',
  }))
})

const newMic = ref({
  brand: '',
  name: '',
  info: '',
})
const selectedImage = ref(null)
const imagePreview = ref('')
const imageInput = ref(null)

function onImageSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  selectedImage.value = file
  imagePreview.value = URL.createObjectURL(file)
}

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
  let list = allMics.value
  if (selectedBrand.value) {
    list = list.filter(m => m.brand === selectedBrand.value)
  }
  if (selectedInstrument.value) {
    const inst = instruments.find(i => i.key === selectedInstrument.value)
    if (inst) {
      list = list.filter(m => {
        const info = (m.info || '').toLowerCase()
        return inst.words.some(w => info.includes(w))
      })
    }
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.brand || '').toLowerCase().includes(q) ||
      (m.info || '').toLowerCase().includes(q)
    )
  }
  return list
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

async function onFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  selectedFile.value = file
  uploadError.value = ''

  // Extraire le texte du PDF
  try {
    extracting.value = true
    const arrayBuffer = await file.arrayBuffer()

    // Essayer d'extraire le nom depuis le nom du fichier d'abord
    const fileName = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ')
    const fileExtracted = extractMicInfo(fileName)

    // Charger pdf.js
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()

    let fullText = ''
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        fullText += content.items.map(item => item.str).join(' ') + '\n'
      }
    } catch (pdfErr) {
      console.warn('PDF parsing fallback to filename:', pdfErr.message)
      fullText = fileName
    }

    const extracted = extractMicInfo(fullText)

    // Prendre le meilleur entre fichier et contenu PDF
    newMic.value.brand = extracted.brand || fileExtracted.brand || ''
    newMic.value.name = extracted.name || fileExtracted.name || fileName
    newMic.value.info = extracted.info || fileExtracted.info || ''

    extracting.value = false
  } catch (err) {
    console.error('Erreur extraction PDF:', err)
    // Fallback : utiliser le nom du fichier
    const fileName = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ')
    const extracted = extractMicInfo(fileName)
    newMic.value.brand = extracted.brand || ''
    newMic.value.name = extracted.name || fileName
    newMic.value.info = extracted.info || ''
    extracting.value = false
  }
}

const extracting = ref(false)

function extractMicInfo(text) {
  const result = { brand: '', name: '', info: '' }
  const textLower = text.toLowerCase()

  // Marques connues
  const brands = [
    { names: ['shure'], brand: 'Shure' },
    { names: ['audix'], brand: 'Audix' },
    { names: ['sennheiser'], brand: 'Sennheiser' },
    { names: ['beyerdynamic'], brand: 'Beyerdynamic' },
    { names: ['electro-voice', 'electrovoice', 'electro voice'], brand: 'Electro-Voice' },
    { names: ['akg'], brand: 'AKG' },
    { names: ['dpa'], brand: 'DPA' },
    { names: ['neumann'], brand: 'Neumann' },
    { names: ['rode', 'røde'], brand: 'Rode' },
    { names: ['audio-technica', 'audio technica'], brand: 'Audio-Technica' },
    { names: ['telefunken'], brand: 'Telefunken' },
    { names: ['schoeps'], brand: 'Schoeps' },
    { names: ['earthworks'], brand: 'Earthworks' },
  ]
  for (const b of brands) {
    if (b.names.some(n => textLower.includes(n))) {
      result.brand = b.brand
      break
    }
  }

  // Type de transducteur
  let transducer = ''
  if (textLower.includes('condenser') || textLower.includes('condensateur') || textLower.includes('electret')) transducer = 'Condensateur'
  else if (textLower.includes('dynamic') || textLower.includes('dynamique')) transducer = 'Dynamique'
  else if (textLower.includes('ribbon') || textLower.includes('ruban')) transducer = 'Ruban'

  // Directivité
  let polar = ''
  if (textLower.includes('hypercardioid') || textLower.includes('hypercardioïde')) polar = 'Hypercardioïde'
  else if (textLower.includes('supercardioid') || textLower.includes('supercardioïde')) polar = 'Supercardioïde'
  else if (textLower.includes('cardioid') || textLower.includes('cardioïde')) polar = 'Cardioïde'
  else if (textLower.includes('omnidirectional') || textLower.includes('omnidirectionnel')) polar = 'Omnidirectionnel'
  else if (textLower.includes('figure-8') || textLower.includes('figure 8') || textLower.includes('bidirectionnel')) polar = 'Bidirectionnel'

  // Réponse en fréquence
  let freq = ''
  const freqMatch = text.match(/(\d{2,3})\s*(?:Hz)?\s*[-–]\s*(\d{1,3}[.,]?\d*)\s*(?:kHz|KHz|khz)/i)
  if (freqMatch) freq = `${freqMatch[1]}Hz-${freqMatch[2]}kHz`

  // Modèle - chercher des patterns courants de noms de micros
  const modelPatterns = [
    /(?:model|modèle|modele)\s*:?\s*([A-Z]+[\s\-]?\d{2,4}[A-Z]*(?:\s*[A-Z]{1,3})?)/i,
    /((?:SM|KSM|Beta|BETA|KMS|MD|RE|PGA|MXL|AT|AE|PRO|VP)\s?\d{2,4}\s?[A-Z]{0,3})/,
    /((?:D|i|e|f)\d{1,4}[A-Z]?)/,
    /(C\d{3,4}[A-Z]*)/,
    /(4\d{3}[A-Z]?)/,
    /(M\s?\d{2,3}\s?[A-Z]{0,3})/,
  ]
  for (const pattern of modelPatterns) {
    const match = text.match(pattern)
    if (match) {
      const candidate = match[1].trim()
      if (candidate.length >= 2 && candidate.length < 20) {
        result.name = candidate
        break
      }
    }
  }

  // Préfixer avec la marque si le modèle ne la contient pas
  if (result.name && result.brand) {
    if (!result.name.toLowerCase().startsWith(result.brand.toLowerCase())) {
      // Ne pas préfixer pour les modèles connus qui n'ont pas besoin de marque
    }
  }

  // Construire la ligne info
  const infoParts = [transducer, polar, freq].filter(Boolean)
  result.info = infoParts.join(' | ')

  return result
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
  let imageUrl = ''
  const safeName = `${newMic.value.brand}_${newMic.value.name}`.replace(/[^a-zA-Z0-9]/g, '_')

  // Upload PDF si sélectionné
  if (selectedFile.value) {
    const { error } = await supabase.storage
      .from('microphones')
      .upload(`pdfs/${safeName}.pdf`, selectedFile.value, {
        contentType: 'application/pdf',
        upsert: true,
      })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('microphones')
        .getPublicUrl(`pdfs/${safeName}.pdf`)
      pdfUrl = urlData?.publicUrl || ''
    }
  }

  // Upload image si sélectionnée
  if (selectedImage.value) {
    const ext = selectedImage.value.name.split('.').pop() || 'jpg'
    const { error } = await supabase.storage
      .from('microphones')
      .upload(`images/${safeName}.${ext}`, selectedImage.value, {
        contentType: selectedImage.value.type,
        upsert: true,
      })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('microphones')
        .getPublicUrl(`images/${safeName}.${ext}`)
      imageUrl = urlData?.publicUrl || ''
    }
  }

  // Insérer dans la bibliothèque
  const insertData = {
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
  }
  if (imageUrl) insertData.image_url = imageUrl

  const { error } = await supabase
    .from('cable')
    .insert(insertData)

  if (error) {
    uploadError.value = error.message
  } else {
    newMic.value = { brand: '', name: '', info: '' }
    selectedFile.value = null
    selectedImage.value = null
    imagePreview.value = ''
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

const isSuperAdmin = localStorage.getItem('cablemaster-superadmin') === 'true'
const editingMicId = ref(null)
const editMic = ref({ brand: '', name: '', info: '', newPdf: null })

function openEditMic(mic) {
  editingMicId.value = editingMicId.value === mic.cableid ? null : mic.cableid
  editMic.value = {
    brand: mic.brand || '',
    name: mic.name || '',
    info: mic.info || '',
    newPdf: null,
  }
}

async function saveEditMic(mic) {
  const updates = {
    brand: editMic.value.brand,
    name: editMic.value.name,
    info: editMic.value.info,
  }

  // Remplacer le PDF si nouveau
  if (editMic.value.newPdf) {
    const safeName = `${editMic.value.brand}_${editMic.value.name}`.replace(/[^a-zA-Z0-9]/g, '_')
    const { error } = await supabase.storage
      .from('microphones')
      .upload(`pdfs/${safeName}.pdf`, editMic.value.newPdf, {
        contentType: 'application/pdf',
        upsert: true,
      })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('microphones')
        .getPublicUrl(`pdfs/${safeName}.pdf`)
      updates.link = urlData?.publicUrl || ''
    }
  }

  await supabase.from('cable').update(updates).eq('cableid', mic.cableid)

  // Mettre à jour localement
  mic.brand = updates.brand
  mic.name = updates.name
  mic.info = updates.info
  if (updates.link) mic.link = updates.link

  editingMicId.value = null
}

async function deleteMic(mic) {
  if (!confirm(`Supprimer "${mic.name}" de la bibliothèque ?`)) return
  await supabase.from('cable').delete().eq('cableid', mic.cableid)
  editingMicId.value = null
  await loadAllMics()
}

function canEditImage(mic) {
  if (!editListMode.value) return false
  // Pas d'image = on peut toujours en ajouter une
  if (!mic.image_url) return true
  // Superadmin peut toujours modifier
  if (isSuperAdmin) return true
  // Sinon : modifiable dans l'heure qui suit l'upload
  if (mic.updated_at) {
    const uploadTime = new Date(mic.updated_at).getTime()
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    return (now - uploadTime) < oneHour
  }
  return false
}

async function uploadMicImage(mic, e) {
  const file = e.target.files[0]
  if (!file) return
  const safeName = `${mic.brand}_${mic.name}`.replace(/[^a-zA-Z0-9]/g, '_')
  const ext = file.name.split('.').pop() || 'jpg'
  const { error } = await supabase.storage
    .from('microphones')
    .upload(`images/${safeName}.${ext}`, file, {
      contentType: file.type,
      upsert: true,
    })
  if (!error) {
    const { data: urlData } = supabase.storage
      .from('microphones')
      .getPublicUrl(`images/${safeName}.${ext}`)
    const imageUrl = urlData?.publicUrl || ''
    const now = new Date().toISOString()
    await supabase.from('cable').update({ image_url: imageUrl, updated_at: now }).eq('cableid', mic.cableid)
    mic.image_url = imageUrl
    mic.updated_at = now
  }
}

async function removeFromMyList(mic) {
  if (!isInMyList(mic) || adding.value[mic.name]) return

  adding.value[mic.name] = true

  const { error } = await supabase
    .from('cable')
    .delete()
    .eq('name', mic.name)
    .eq('type', 'microphone')
    .eq('catalog_id', activeCatalogId)

  adding.value[mic.name] = false

  if (!error) {
    const ids = new Set(myMicIds.value)
    ids.delete(mic.name)
    myMicIds.value = ids
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
.extracting {
  color: var(--color3);
  font-size: 13px;
  font-weight: 600;
  margin-top: 4px;
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
  font-size: 12px;
  color: var(--text-light, #666);
  line-height: 1.4;
  white-space: normal;
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
.instrument-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.inst-filter-btn {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 12px;
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
  transition: all 0.15s;
}
.inst-filter-btn.active {
  background: var(--color3);
  border-color: var(--color3);
  color: #000;
}
.brand-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.brand-filter-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  border: 2px solid #888;
  border-radius: 14px;
  background: transparent;
  color: #888;
  cursor: pointer;
  min-width: auto;
  box-shadow: none;
  transition: all 0.15s;
}
.brand-filter-btn.active {
  color: #fff !important;
}
.edit-toggle {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  background: var(--bg-card, #f5f5f5);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  min-width: auto;
  padding: 0;
}
.edit-toggle.active {
  background: #ef4444;
  border-color: #ef4444;
}
.gallery-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color1);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.added-badge {
  color: var(--color1);
  font-size: 16px;
  font-weight: 800;
}
.view-toggle {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  background: var(--bg-card, #f5f5f5);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  min-width: auto;
  padding: 0;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
@media (min-width: 500px) {
  .gallery { grid-template-columns: repeat(3, 1fr); }
}
.gallery-card {
  background: var(--bg-card, #fafafa);
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s, transform 0.1s;
  position: relative;
}
.gallery-card:active {
  transform: scale(0.97);
}
.gallery-card.added {
  border-color: var(--color1);
}
.gallery-thumb {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: #fff;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mic-image {
  max-width: 80%;
  max-height: 150px;
  object-fit: contain;
}
.no-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  font-size: 40px;
  background: var(--bg-card, #f0f0f0);
}
.gallery-text {
  padding: 4px 8px 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.gallery-name {
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text, #333);
  flex: 1;
}
.gallery-brand {
  font-size: 10px;
  color: var(--text-light, #888);
}
.gallery-pdf-link {
  font-size: 14px;
  text-decoration: none;
  flex-shrink: 0;
}
.gallery-add-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--color1);
  background: rgba(255,255,255,0.9);
  color: var(--color1);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-width: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: all 0.15s;
  z-index: 2;
}
.gallery-add-btn.added {
  background: var(--color1);
  color: #fff;
}
.hidden-input {
  display: none;
}
.gallery-edit-btn {
  font-size: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  min-width: auto;
  box-shadow: none;
}
.mic-edit-panel {
  padding: 8px;
  border-top: 1px solid var(--border-light, #eee);
  background: var(--bg, #fff);
}
.mic-edit-panel .form-row {
  margin-bottom: 6px;
}
.mic-edit-panel .form-row label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-light, #888);
  margin-bottom: 2px;
}
.mic-edit-panel .form-row input {
  width: 100%;
  padding: 5px 6px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 4px;
  font-size: 13px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  outline: none;
}
.mic-edit-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.btn-save-mic {
  flex: 1;
  padding: 6px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.btn-delete-mic {
  padding: 6px 10px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.btn-cancel-mic {
  padding: 6px 10px;
  background: var(--bg-card, #eee);
  color: var(--text, #666);
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.change-image-btn {
  font-size: 11px;
  font-weight: 600;
  color: var(--color1);
  cursor: pointer;
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255,255,255,0.8);
  padding: 2px 6px;
  border-radius: 4px;
}
.image-preview {
  max-width: 100px;
  max-height: 80px;
  margin-top: 6px;
  border-radius: 6px;
  border: 1px solid var(--border-light, #ccc);
}
.empty {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}
</style>
