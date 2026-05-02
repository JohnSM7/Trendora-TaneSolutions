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

/**
 * Asegura que el usuario actual es admin de plataforma (Tane Solutions).
 * Lanza 403 si no.
 *
 * Usar SOLO en endpoints bajo /api/admin/** que ven datos cross-tenant.
 * El cliente devuelto es service-role para que el endpoint pueda leer todas
 * las orgs sin restricciones de RLS. La autorización ya se validó arriba.
 */
export async function requireAdmin(event: H3Event) {
  const { user } = await requireUser(event)

  // Validamos contra la tabla con la sesión del propio user (RLS lo permite
  // porque la policy permite que el user lea su propia row).
  const sb = await serverSupabaseClient(event)
  const { data: adminRow } = await sb
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    throw createError({ statusCode: 403, statusMessage: 'Acceso restringido al equipo de Trendora' })
  }

  // Devolvemos service-role para queries cross-tenant. Es seguro porque
  // arriba ya validamos que el user es platform admin.
  return { user, admin: serverSupabaseServiceRole(event) }
}
