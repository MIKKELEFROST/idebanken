import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'Mangler VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Kopiér .env.example til .env.local og udfyld dem.',
  )
}

export const supabase = createClient(url, key)
