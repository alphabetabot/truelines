import { supabase } from './supabase'

export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Please sign in to use AI analysis.')
  }

  return { Authorization: `Bearer ${token}` }
}
