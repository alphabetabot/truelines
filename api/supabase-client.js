// Lazy-loaded Supabase client to avoid initialization errors during Vercel builds
import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
  }
  return supabaseInstance
}
