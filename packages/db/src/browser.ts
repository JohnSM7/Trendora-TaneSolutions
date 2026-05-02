import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createBrowserClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
