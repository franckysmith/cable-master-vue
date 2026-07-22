<template>
  <div class="login-wrap">
    <div class="login-card">
      <img src="/icon-512.png" alt="Cinod-Prep" class="login-logo" />
      <div class="login-brand"><b>Prep</b> <span>cinod</span></div>
      <p class="login-sub">Connecte-toi pour accéder à tes listes de câbles.</p>

      <template v-if="!sent">
        <q-input
          v-model="email"
          type="email"
          label="Ton e-mail"
          outlined
          dense
          autofocus
          class="login-input"
          @keyup.enter="send"
        />
        <q-btn
          label="Recevoir le lien de connexion"
          color="primary"
          unelevated
          class="login-btn"
          :loading="loading"
          :disable="!validEmail"
          @click="send"
        />
        <p v-if="error" class="login-error">{{ error }}</p>
      </template>

      <template v-else>
        <div class="login-sent">
          <q-icon name="mark_email_read" size="42px" color="primary" />
          <p>Un code de connexion vient d'être envoyé à<br /><b>{{ email }}</b>.</p>
          <p class="login-hint">Saisis le code reçu par e-mail (pense à vérifier les spams).</p>
          <q-input
            v-model="code"
            label="Code reçu"
            outlined
            dense
            autofocus
            inputmode="numeric"
            class="login-input"
            @keyup.enter="verify"
          />
          <q-btn
            label="Valider le code"
            color="primary"
            unelevated
            class="login-btn"
            :loading="verifying"
            :disable="!code.trim()"
            @click="verify"
          />
          <p v-if="error" class="login-error">{{ error }}</p>
          <q-btn flat dense label="Changer d'e-mail" class="q-mt-sm" @click="reset" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const code = ref('')
const loading = ref(false)
const verifying = ref(false)
const sent = ref(false)
const error = ref('')

const validEmail = computed(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()))

async function send() {
  if (!validEmail.value) return
  loading.value = true
  error.value = ''
  const { error: err } = await auth.signInWithMagicLink(email.value)
  loading.value = false
  if (err) {
    error.value = err.message || "Impossible d'envoyer le code."
    return
  }
  sent.value = true
}

async function verify() {
  if (!code.value.trim()) return
  verifying.value = true
  error.value = ''
  const { error: err } = await auth.verifyOtp(email.value, code.value)
  verifying.value = false
  if (err) {
    error.value = err.message || 'Code invalide ou expiré.'
    return
  }
  // Session + profil résolus dans le store → routage déterministe.
  router.replace(auth.hasProfile ? '/' : '/onboarding')
}

function reset() {
  sent.value = false
  code.value = ''
  error.value = ''
}

// Déjà connecté en arrivant sur /login (ex. session persistée) → router au bon endroit.
// (Le routage post-vérification du code se fait explicitement dans verify().)
onMounted(() => {
  if (auth.isAuthed) router.replace(auth.hasProfile ? '/' : '/onboarding')
})
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #1b1030 0%, #2a1650 100%);
}
.login-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
  background: #ffffff;
  color: #222;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}
.login-logo { width: 72px; height: 72px; border-radius: 16px; }
.login-brand { font-size: 22px; margin-top: 8px; }
.login-brand span { color: #888; }
.login-sub { color: #666; margin: 8px 0 20px; font-size: 14px; }
.login-input { margin-bottom: 14px; }
.login-btn { width: 100%; }
.login-error { color: #c62828; margin-top: 12px; font-size: 13px; }
.login-sent p { margin: 12px 0; }
.login-hint { color: #888; font-size: 13px; }
</style>
