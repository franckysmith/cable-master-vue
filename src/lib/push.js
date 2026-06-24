// Web Push (notifications) — abonnement côté client.
// La clé VAPID privée correspondante reste côté serveur (Edge Function).
import { supabase } from './supabase'

const VAPID_PUBLIC = 'BB7JKT3ACnu8xbyh5rHjR_EzkJZd6xptEP5xo_GbmgP1k7-3H7FL_q5wMvJ7-ahjVBEjoCg_aPsM5yhnkSuegeQ'

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Abonne l'appareil et enregistre l'abonnement en base (lié à l'email + entreprise)
export async function enableNotifications({ email, companyId } = {}) {
  if (!pushSupported()) throw new Error("Notifications non supportées sur cet appareil.")
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) throw new Error("App non installée (service worker absent). Ajoute l'app à l'écran d'accueil puis réessaie.")

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error("Permission notifications refusée.")

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscription').upsert({
    endpoint: json.endpoint,
    p256dh: json.keys && json.keys.p256dh,
    auth: json.keys && json.keys.auth,
    email: email || null,
    company_id: companyId || null,
  }, { onConflict: 'endpoint' })
  if (error) throw new Error(error.message)

  // Marque le technicien comme "installé" (nom non-italique dans la TechList)
  if (email && companyId) {
    await supabase.from('technician').update({ installed: true }).eq('email', email).eq('company_id', companyId)
  }
  return true
}

export async function notificationsActive() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}
