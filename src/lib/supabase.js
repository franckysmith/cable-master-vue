import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Cable-Master vit dans le schéma "mastercable" du hub Supabase partagé.
// storageKey dédié : le hub sert aussi d'autres apps (L-Acoustics) ; on isole
// la session Cable-Master pour éviter toute collision dans le même navigateur.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'mastercable' },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'cablemaster-auth',
  },
})
