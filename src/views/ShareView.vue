<template>
  <div class="share-view">
    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="content" class="share-content">
      <h2>📋 {{ affairName }}</h2>
      <pre>{{ content }}</pre>
    </div>
    <div v-else class="not-found">
      <h2>Lien invalide</h2>
      <p>Ce lien de partage n'existe pas ou a expiré.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const route = useRoute()
const loading = ref(true)
const content = ref('')
const affairName = ref('')

onMounted(async () => {
  const token = route.params.token
  if (!token) { loading.value = false; return }

  const { data } = await supabase
    .from('share')
    .select('*')
    .eq('token', token)
    .limit(1)

  if (data?.[0]) {
    content.value = data[0].content
    affairName.value = data[0].affair_name
  }
  loading.value = false
})
</script>

<style scoped>
.share-view {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}
h2 {
  text-align: center;
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text, #333);
}
pre {
  background: var(--bg-card, #f5f5f5);
  color: var(--text, #333);
  padding: 16px;
  border-radius: 10px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}
.loading, .not-found {
  text-align: center;
  padding: 40px;
  color: var(--text-muted, #999);
}
</style>
