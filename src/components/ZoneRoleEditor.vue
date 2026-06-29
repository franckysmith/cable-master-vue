<template>
  <div class="zre">
    <div class="zre-title">📋 Zones de diffusion <span class="zre-sub">(noms des colonnes)</span></div>
    <label v-for="i in 6" :key="i" class="zre-row">
      <span class="zre-tag">Z{{ i }}</span>
      <input v-model="labels['lz' + i]" maxlength="14" :placeholder="zonePlaceholders[i - 1] || '—'" />
      <button type="button" class="zre-star" :class="{ on: znStereo(labels['lz' + i]) }" @click.prevent="znToggle('lz' + i)" title="Diffusion par côté (stéréo)"><span class="zre-star-par">par</span><span class="zre-star-ast">*</span></button>
    </label>
    <div class="zre-amplis">
      <span class="zre-amplis-lbl">Amplis</span>
      <input :value="amplis" @input="$emit('update:amplis', $event.target.value)" :placeholder="amplisPlaceholder" />
    </div>
  </div>
</template>

<script setup>
// Éditeur de zones partagé (création d'affaire ET bouton « 🎛 Zones »).
// labels : objet réactif { lz1..lz6 } (modifié sur place) ; amplis : v-model texte.
// Les exemples passent par `placeholder` → ils ne sont jamais enregistrés ni vus par le technicien.
const props = defineProps({
  labels: { type: Object, required: true },
  amplis: { type: String, default: '' },
  zonePlaceholders: { type: Array, default: () => [] },
  amplisPlaceholder: { type: String, default: 'amplis… (ex. Rack 1, Rack 2)' },
})
defineEmits(['update:amplis'])

function znStereo(v) { return /\*\s*$/.test(v || '') }
function znToggle(key) {
  const base = (props.labels[key] || '').replace(/\s*\*\s*$/, '')
  props.labels[key] = znStereo(props.labels[key]) ? base : base + '*'
}
</script>

<style scoped>
.zre { margin-top: 6px; }
.zre-title { font-size: 12px; font-weight: 800; color: var(--text-muted, #aaa); margin-bottom: 6px; }
.zre-sub { font-weight: 600; opacity: 0.8; }
.zre-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.zre-tag { flex: 0 0 26px; font-size: 11px; font-weight: 800; color: var(--text-muted, #999); text-align: center; }
.zre-row input { flex: 1; min-width: 0; padding: 6px 8px; font-size: 14px; border: 1px solid var(--border-light, #555); border-radius: 7px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); }
.zre-star { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; line-height: 1; padding: 2px 8px; border: 1px solid var(--border-light, #777); border-radius: 7px; background: transparent; color: var(--text, #e8e8e8); font-weight: 800; cursor: pointer; box-shadow: none; min-width: auto; }
.zre-star-par { font-size: 11px; }
.zre-star-ast { font-size: 17px; line-height: 0.9; }
.zre-star.on { background: #f59e0b; border-color: #f59e0b; color: #fff; }
.zre-amplis { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.zre-amplis-lbl { flex: 0 0 auto; font-size: 12px; font-weight: 800; color: var(--text-muted, #999); }
.zre-amplis input { flex: 1; min-width: 0; padding: 6px 8px; font-size: 14px; border: 1px solid var(--border-light, #555); border-radius: 7px; background: var(--bg-input, #2a2a45); color: var(--text, #e0e0e0); }
</style>
