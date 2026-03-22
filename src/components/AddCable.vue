<template>
  <div class="add-cable">
    <div class="add-header">
      <h3>Ajouter un élément</h3>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <form @submit.prevent="submit">
      <div class="form-row">
        <label>Nom *</label>
        <input v-model="form.name" placeholder="ex: Do 25, Beta 58..." required />
      </div>
      <div class="form-row">
        <label>Catégorie *</label>
        <select v-model="form.type" required>
          <option value="">-- Choisir --</option>
          <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="form-row">
        <label>Marque</label>
        <input v-model="form.brand" placeholder="ex: Shure, Audix, Neutrik..." />
      </div>
      <div class="form-grid">
        <div class="form-row half">
          <label>Stock total</label>
          <input v-model.number="form.total" type="number" min="0" />
        </div>
        <div class="form-row half">
          <label>Seuil réservé</label>
          <input v-model.number="form.reserved" type="number" min="0" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row half">
          <label>Poids (g)</label>
          <input v-model.number="form.weight" type="number" min="0" />
        </div>
        <div class="form-row half">
          <label>Ordre tri</label>
          <input v-model.number="form.sortno" type="number" min="0" />
        </div>
      </div>
      <div class="form-row">
        <label>Info / Description</label>
        <input v-model="form.info" placeholder="Notes, spécifications..." />
      </div>
      <div class="form-row">
        <label>Lien (URL)</label>
        <input v-model="form.link" placeholder="https://..." />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-add">Ajouter</button>
        <button type="button" class="btn-cancel" @click="$emit('close')">Annuler</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useCableStore } from '../stores/cables'
import { useSettingsStore } from '../stores/settings'

const emit = defineEmits(['close'])
const cableStore = useCableStore()
const settingsStore = useSettingsStore()

const typeKeys = ['speaker', 'electrical', 'module', 'special', 'other', 'accessory', 'digital', 'type8', 'type9', 'type10', 'microphone', 'c_type']
const defaultLabels = ['HP', 'Elec', 'Modules', 'Spéciaux', 'Autres', 'Accessoires', 'Numériques', '', '', '', 'Micros', 'Caisses-type']

const typeOptions = typeKeys.map((value, i) => {
  const label = (i < 10 ? settingsStore.defaultTypeLabels[`type${i + 1}`] : null) || defaultLabels[i]
  return { value, label }
}).filter(t => t.label)

const form = reactive({
  name: '',
  type: '',
  brand: '',
  weight: 0,
  total: 0,
  reserved: 0,
  sortno: 0,
  info: '',
  link: '',
})

async function submit() {
  if (!form.name || !form.type) return
  const payload = { ...form }
  if (!payload.brand) delete payload.brand
  if (!payload.info) delete payload.info
  if (!payload.link) delete payload.link
  const { error } = await cableStore.addCable(payload)
  if (!error) {
    Object.assign(form, { name: '', type: '', brand: '', weight: 0, total: 0, reserved: 0, sortno: 0, info: '', link: '' })
    emit('close')
  }
}
</script>

<style scoped>
.add-cable {
  max-width: 400px;
  margin: 0 auto;
  padding: 12px;
  background: var(--bg-card, #fafafa);
  border: 2px solid var(--color3);
  border-radius: 10px;
}
.add-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.add-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.close-btn {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: none;
  min-width: auto;
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
.form-row input,
.form-row select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
}
.form-row input:focus,
.form-row select:focus {
  border-color: var(--color1);
}
.form-grid {
  display: flex;
  gap: 8px;
}
.form-row.half {
  flex: 1;
}
.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.btn-add {
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
.btn-cancel {
  padding: 10px 16px;
  background: #eee;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: none;
}
</style>
