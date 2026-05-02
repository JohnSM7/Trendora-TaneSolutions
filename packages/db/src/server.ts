/**
 * @tane/db/server — clientes server-only.
 *
 * createServerClient(): respeta sesión del usuario (RLS aplicada).
 * createAdminClient():  bypass RLS, SOLO para webhooks y jobs internos.
 */
import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from './types'

export interface CookieRecord {
  name: string
  value: string
  options?: Record<string, unknown>
}

export interface CookieAdapter {
  getAll: () => CookieRecord[]
  setAll: (cookies: CookieRecord[]) => void
}

export function createServerClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookies: CookieAdapter,
) {
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookies.getAll()
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
      ) {
        cookies.setAll(
          cookiesToSet.map((c) => ({
            name: c.name,
            value: c.value,
            options: c.options,
          })),
        )
      },
    },
  })
}

/**
 * ⚠️ Bypass RLS. Usar SOLO en:
 *   - Webhooks (Stripe, Ayrshare)
 *   - Jobs Inngest
 *   - Tareas administrativas internas
 * Nunca exponer a request de usuario sin re-validar permisos.
 */
export function createAdminClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
