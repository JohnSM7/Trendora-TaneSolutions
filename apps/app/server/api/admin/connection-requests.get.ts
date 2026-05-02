/**
 * GET /api/admin/connection-requests
 *
 * Lista las solicitudes "Solicitar conexión" pendientes que clientes han
 * hecho desde Settings → Redes sociales. Útil para que Tane procese su
 * cola de onboarding asistido (Modo Free Ayrshare).
 */
export default defineEventHandler(async (event) => {
  const { admin } = await requireAdmin(event)

  const { data, error } = await admin
    .from('audit_log')
    .select(`
      id, created_at, metadata, user_id,
      organizations!inner(id, slug, name, plan, vertical, created_at)
    `)
    .eq('action', 'social.connection_requested')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    requests: (data ?? []).map((r: any) => ({
      id: r.id,
      requestedAt: r.created_at,
      org: r.organizations,
      userEmail: r.metadata?.user_email ?? '(no disponible)',
      requestedPlatforms: r.metadata?.requested_platforms ?? [],
      notes: r.metadata?.notes ?? null,
    })),
  }
})
