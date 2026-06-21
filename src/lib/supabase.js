import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Cable-Master vit dans le schéma "mastercable" du hub Supabase partagé
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'mastercable' },
})
