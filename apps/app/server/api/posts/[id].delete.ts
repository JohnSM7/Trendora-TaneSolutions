/**
 * DELETE /api/posts/[id]
 *
 * Cancela una publicación programada (cambia status, no elimina la fila).
 * Si ya está publicada, no se puede cancelar (Ayrshare delete sería otro endpoint).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const { user, supabase } = await requireUser(event)

  const { data: draft, error } = await supabase
    .from('content_drafts')
    .select('id, status, org_id')
    .eq('id', id)
    .single()
  if (error || !draft) throw createError({ statusCode: 404, statusMessage: 'No encontrado' })

  if (draft.status === 'published') {
    throw createError({ statusCode: 400, statusMessage: 'Ya está publicado, no se puede cancelar' })
  }

  await supabase
    .from('content_drafts')
    .update({ status: 'cancelled', scheduled_at: null })
    .eq('id', id)

  const admin = adminClient(event)
  await admin.from('audit_log').insert({
    org_id: draft.org_id,
    user_id: user.id,
    action: 'post.cancelled',
    target_type: 'content_drafts',
    target_id: id,
  })

  return { ok: true }
})
