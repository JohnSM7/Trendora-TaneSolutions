/**
 * useDb() — alias de useSupabaseClient con tipos permisivos.
 *
 * Mientras `pnpm db:types` no haya generado los tipos reales del schema,
 * usamos `any` para que la API funcione. Cuando se generen, cambiar el
 * cast aquí por `Database` y todo el resto del código se beneficiará de
 * tipado estricto sin más cambios.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any

export function useDb(): SupabaseClient<AnyDb, 'public', AnyDb> {
  return useSupabaseClient() as unknown as SupabaseClient<AnyDb, 'public', AnyDb>
}
