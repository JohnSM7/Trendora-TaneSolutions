import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Asegura que hay usuario autenticado y devuelve el cliente Supabase con su sesión
 * (RLS aplicada). Usar en endpoints que actúan en nombre del usuario.
 */
export async function requireUser(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  const supabase = await serverSupabaseClient(event)
  return { user, supabase }
}

/**
 * Asegura que el usuario es miembro de la organización indicada por slug y
 * devuelve la org. Lanza 403 si no.
 */
export async function requireOrgMember(event: H3Event, orgSlug: string) {
  const { user, supabase } = await requireUser(event)

  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, slug, name, plan, vertical, ayrshare_profile_key')
    .eq('slug', orgSlug)
    .single()

  if (error || !org) {
    throw createError({ statusCode: 404, statusMessage: 'Organización no encontrada' })
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes acceso a esta organización' })
  }

  return { user, org, role: membership.role, supabase }
}

/**
 * Cliente service-role (bypass RLS). SOLO usar en webhooks y jobs internos.
 */
export function adminClient(event: H3Event) {
  return serverSupabaseServiceRole(event)
}
