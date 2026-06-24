<template>
  <div class="techlist">
    <h2>TechList</h2>
    <p class="sub">Le registre des personnes que vous pouvez affecter aux postes d'une affaire.</p>

    <div v-if="!companyId" class="empty">
      Connectez-vous à une entreprise (page Entreprise) pour gérer sa TechList.
    </div>

    <template v-else>
      <!-- Recherche + filtre par poste -->
      <div class="search-bar">
        <input v-model="search" class="search-input" placeholder="🔍 Rechercher un nom..." />
      </div>
      <div class="filter-picker">
        <button type="button" class="filter-btn" :class="{ active: posteFilter === '' }" @click="posteFilter = ''">Tous</button>
        <button v-for="p in postes" :key="p.value" type="button" class="filter-btn"
          :class="{ active: posteFilter === p.value }" @click="posteFilter = p.value">{{ p.label }}</button>
      </div>

      <!-- Liste -->
      <div v-for="t in filteredTechs" :key="t.techid" class="tech-card">
        <template v-if="editId === t.techid">
          <div class="form-grid">
            <div class="form-row half"><label>Prénom</label><input v-model="edit.firstname" placeholder="Prénom" /></div>
            <div class="form-row half"><label>Nom</label><input v-model="edit.lastname" placeholder="Nom" /></div>
          </div>
          <div class="form-grid">
            <div class="form-row half"><label>Email</label><input v-model="edit.email" type="email" placeholder="email@..." /></div>
            <div class="form-row half"><label>Téléphone</label><input v-model="edit.phone" placeholder="+33..." /></div>
          </div>
          <div class="form-row">
            <label>Poste</label>
            <div class="poste-picker">
              <button v-for="p in postes" :key="p.value" type="button" class="poste-btn"
                :class="{ active: edit.poste === p.value }" @click="edit.poste = p.value">{{ p.label }}</button>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-save" @click="saveEdit(t)">Enregistrer</button>
            <button class="btn-cancel" @click="editId = null">Annuler</button>
          </div>
        </template>
        <template v-else>
          <div class="tech-info">
            <div class="tech-name">{{ t.name }}<span v-if="t.poste" class="tech-poste">{{ posteLabel(t.poste) }}</span></div>
            <div class="tech-contact">{{ t.email }}{{ t.phone ? ' · ' + t.phone : '' }}</div>
          </div>
          <div class="tech-actions">
            <button class="ic-btn" @click="startEdit(t)" title="Modifier">✎</button>
            <button class="ic-btn" @click="remove(t)" title="Retirer">✕</button>
          </div>
        </template>
      </div>

      <div v-if="techs.length === 0" class="empty">Aucune personne enregistrée</div>
      <div v-else-if="filteredTechs.length === 0" class="empty">Aucun résultat</div>

      <!-- Ajouter -->
      <button v-if="!showAdd" class="btn-add" @click="showAdd = true">+ Ajouter une personne</button>
      <div v-if="showAdd" class="add-form">
        <div class="form-grid">
          <div class="form-row half"><label>Prénom *</label><input v-model="form.firstname" placeholder="Prénom" /></div>
          <div class="form-row half"><label>Nom *</label><input v-model="form.lastname" placeholder="Nom" /></div>
        </div>
        <div class="form-grid">
          <div class="form-row half"><label>Email</label><input v-model="form.email" type="email" placeholder="email@..." /></div>
          <div class="form-row half"><label>Téléphone</label><input v-model="form.phone" placeholder="+33..." /></div>
        </div>
        <div class="form-row">
          <label>Poste</label>
          <div class="poste-picker">
            <button v-for="p in postes" :key="p.value" type="button" class="poste-btn"
              :class="{ active: form.poste === p.value }" @click="form.poste = p.value">{{ p.label }}</button>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="add" :disabled="!form.firstname && !form.lastname">Ajouter</button>
          <button class="btn-cancel" @click="resetAdd">Annuler</button>
        </div>
      </div>
    </template>

    <div v-if="message" class="message" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const postes = [
  { value: 'front', label: 'Front' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'system', label: 'Système' },
  { value: 'stage', label: 'Stage' },
  { value: 'assistant', label: 'Assistant' },
]
const posteLabel = (v) => postes.find(p => p.value === v)?.label || v

const companyId = ref(parseInt(localStorage.getItem('cablemaster-companyid')) || null)
const techs = ref([])
const search = ref('')
const posteFilter = ref('')

const filteredTechs = computed(() => {
  const q = search.value.trim().toLowerCase()
  return techs.value.filter(t => {
    const matchName = !q || (t.name || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q)
    const matchPoste = !posteFilter.value || t.poste === posteFilter.value
    return matchName && matchPoste
  })
})
const showAdd = ref(false)
const editId = ref(null)
const message = ref('')
const messageType = ref('')

const form = reactive({ firstname: '', lastname: '', email: '', phone: '', poste: 'front' })
const edit = reactive({ firstname: '', lastname: '', email: '', phone: '', poste: 'front' })

onMounted(load)

async function load() {
  // Repli : si aucune entreprise active (ex. Super Admin), prendre la 1ʳᵉ entreprise
  if (!companyId.value) {
    const { data: comps } = await supabase.from('company').select('companyid').order('companyid').limit(1)
    if (comps?.[0]) companyId.value = comps[0].companyid
  }
  if (!companyId.value) return
  const { data } = await supabase
    .from('technician')
    .select('*')
    .eq('company_id', companyId.value)
    .order('name')
  techs.value = data || []
}

function resetAdd() {
  Object.assign(form, { firstname: '', lastname: '', email: '', phone: '', poste: 'front' })
  showAdd.value = false
}

async function add() {
  if (!form.firstname && !form.lastname) return
  const name = `${form.firstname} ${form.lastname}`.trim()
  const { error } = await supabase.from('technician').insert({
    name,
    firstname: form.firstname,
    email: form.email,
    phone: form.phone,
    poste: form.poste,
    company_id: companyId.value,
  })
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }
  resetAdd()
  showMessage(`${name} ajouté`, 'success')
  await load()
}

function startEdit(t) {
  editId.value = t.techid
  const fn = t.firstname || ''
  Object.assign(edit, {
    firstname: fn,
    lastname: fn ? (t.name || '').replace(fn, '').trim() : (t.name || ''),
    email: t.email || '',
    phone: t.phone || '',
    poste: t.poste || 'front',
  })
}

async function saveEdit(t) {
  const name = `${edit.firstname} ${edit.lastname}`.trim()
  const { error } = await supabase.from('technician').update({
    name,
    firstname: edit.firstname,
    email: edit.email,
    phone: edit.phone,
    poste: edit.poste,
  }).eq('techid', t.techid)
  if (error) { showMessage('Erreur: ' + error.message, 'error'); return }
  editId.value = null
  showMessage('Personne modifiée', 'success')
  await load()
}

async function remove(t) {
  if (!confirm(`Retirer ${t.name} ?`)) return
  await supabase.from('technician').delete().eq('techid', t.techid)
  await load()
  showMessage(`${t.name} retiré`, 'success')
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
</script>

<style scoped>
.techlist {
  max-width: 560px;
  margin: 0 auto;
  padding: 10px 4px;
  text-align: left;
}
h2 {
  text-align: center;
  font-size: 18px;
  margin-bottom: 4px;
}
.sub {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted, #999);
  margin-bottom: 14px;
}
.search-bar { margin-bottom: 8px; }
.search-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
}
.search-input:focus { border-color: var(--color1); }
.filter-picker {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.filter-btn {
  padding: 5px 10px;
  border: 2px solid var(--border-light, #ccc);
  border-radius: 14px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.filter-btn.active {
  border-color: var(--color1);
  background: var(--color1);
  color: #fff;
}
.tech-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid var(--border, #e0e0e0);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 6px;
  background: var(--bg-card, #fafafa);
}
.tech-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text, #333);
  display: flex;
  align-items: center;
  gap: 8px;
}
.tech-poste {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--color1);
  border-radius: 10px;
  padding: 1px 8px;
}
.tech-contact {
  font-size: 12px;
  color: var(--text-light, #888);
}
.tech-actions { display: flex; gap: 6px; }
.ic-btn {
  background: transparent;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 8px;
  box-shadow: none;
  min-width: auto;
}
.tech-card .form-grid,
.tech-card .form-row,
.tech-card .form-actions { width: 100%; }
.form-row { margin-bottom: 10px; }
.form-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light, #666);
  margin-bottom: 3px;
}
.form-row input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-light, #ccc);
  border-radius: 6px;
  font-size: 16px;
  outline: none;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
}
.form-row input:focus { border-color: var(--color1); }
.form-grid { display: flex; gap: 8px; }
.form-row.half { flex: 1; }
.poste-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.poste-btn {
  padding: 6px 12px;
  border: 2px solid var(--border-light, #ccc);
  border-radius: 8px;
  background: var(--bg-input, #fff);
  color: var(--text, #333);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
}
.poste-btn.active {
  border-color: var(--color1);
  background: var(--color1);
  color: #fff;
}
.btn-add {
  width: 100%;
  padding: 10px;
  background: var(--color3);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  margin-top: 8px;
}
.add-form {
  border: 2px solid var(--color3);
  border-radius: 10px;
  padding: 12px;
  margin-top: 8px;
}
.form-actions { display: flex; gap: 8px; margin-top: 12px; }
.btn-save {
  flex: 1;
  padding: 10px;
  background: var(--color1);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
}
.btn-save:disabled { opacity: 0.4; }
.btn-cancel {
  padding: 10px 14px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
}
.empty {
  text-align: center;
  color: var(--text-muted, #999);
  font-size: 13px;
  padding: 20px;
}
.message {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
}
.message.success { background: var(--color1-light); color: var(--color1-dark); }
.message.error { background: #fecaca; color: #dc2626; }
</style>
