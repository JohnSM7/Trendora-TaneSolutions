/**
 * POST /api/orgs/create
 *
 * Crea una organización + membership + brand kit por defecto en una sola
 * transacción. Mejor que llamar `rpc('create_organization')` desde el cliente
 * porque podemos enriquecer con defaults vertical-específicos.
 */
import { z } from 'zod'

const Body = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  vertical: z.enum([
    'restaurante',
    'cafeteria',
    'gimnasio',
    'clinica-dental',
    'peluqueria',
    'tienda',
    'saas-b2b',
    'otro',
  ]),
})

// Voice prompt vertical-específico para arrancar el brand kit con algo útil.
const DEFAULT_VOICE_PROMPTS: Record<string, string> = {
  restaurante:
    'Comunica el día a día del restaurante con autenticidad. Producto fresco, técnica honesta, equipo visible. Nunca uses superlativos vacíos ("la mejor pizza del mundo"). Mejor concreto: ingredientes, proveedores, tradición.',
  cafeteria:
    'Tono cercano de barrio. Cuenta el origen de los granos, el latte art del día, los habitués. Foco en momentos cotidianos: el primer café del lunes, la pausa de las 11.',
  gimnasio:
    'Inspiración sin tóxica. Celebra esfuerzo y constancia, no perfección. Resaltar comunidad, transformaciones reales con permiso, conocimiento técnico de los entrenadores.',
  'clinica-dental':
    'Profesional pero cercano. Educar sobre salud oral, mostrar el equipo humano, generar confianza. CUIDADO con normativa sanitaria: nunca prometer resultados, sin antes/después sin consentimiento.',
  peluqueria:
    'Visual y aspiracional. Cada cambio de imagen es una historia. Resaltar técnica y producto. Tono fresco, con emojis bien usados.',
  tienda:
    'Producto como protagonista. Calidad, materiales, origen. Conectar con la comunidad local. Llamadas a la acción claras "ven a la tienda" / "reserva el tuyo".',
  'saas-b2b':
    'Profesional, técnico cuando toca, humano cuando toca. Caso de uso > feature. Mostrar el problema antes que la solución. Crítica constructiva del sector OK.',
  otro: 'Comunica con autenticidad y cercanía. Tutea siempre. Datos concretos > superlativos vacíos.',
}

const DEFAULT_TONE: Record<string, string[]> = {
  restaurante: ['cercano', 'autentico', 'familiar'],
  cafeteria: ['cercano', 'cuidado', 'cotidiano'],
  gimnasio: ['inspirador', 'directo', 'comunidad'],
  'clinica-dental': ['profesional', 'cercano', 'experto'],
  peluqueria: ['fresco', 'visual', 'aspiracional'],
  tienda: ['cuidado', 'cercano', 'producto'],
  'saas-b2b': ['profesional', 'directo', 'experto'],
  otro: ['cercano', 'profesional'],
}

const DEFAULT_DO_NOT_SAY: Record<string, string[]> = {
  restaurante: ['barato', 'fast food', 'la mejor del mundo'],
  cafeteria: ['barato', 'cafe normal'],
  gimnasio: ['cuerpo perfecto', 'antes/despues sin permiso', 'transformacion radical'],
  'clinica-dental': ['garantizamos resultados', 'sin dolor', 'el mejor dentista'],
  peluqueria: ['barato', 'low cost'],
  tienda: ['liquidacion total', 'ultimas unidades' /* solo si es real */],
  'saas-b2b': ['10x', 'revolucionario', 'rockstar', 'ninja', 'growth hack'],
  otro: ['revoluciona', 'transforma tu vida', 'viraliza'],
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, Body.parse)
  const { user, supabase } = await requireUser(event)
  const admin = adminClient(event)

  // 1. Crear organización
  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({
      name: body.name,
      slug: body.slug,
      vertical: body.vertical,
    })
    .select('id, slug')
    .single()

  if (orgErr) {
    if (orgErr.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Ya existe una organización con ese slug' })
    }
    throw createError({ statusCode: 500, statusMessage: orgErr.message })
  }

  // 2. Membership owner
  const { error: memberErr } = await admin.from('memberships').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'owner',
    accepted_at: new Date().toISOString(),
  })
  if (memberErr) {
    // Rollback manual
    await admin.from('organizations').delete().eq('id', org.id)
    throw createError({ statusCode: 500, statusMessage: memberErr.message })
  }

  // 3. Brand kit por defecto vertical-específico
  await admin.from('brand_kits').insert({
    org_id: org.id,
    name: `${body.name} — Marca principal`,
    is_default: true,
    voice_prompt: DEFAULT_VOICE_PROMPTS[body.vertical] ?? DEFAULT_VOICE_PROMPTS.otro,
    tone: DEFAULT_TONE[body.vertical] ?? DEFAULT_TONE.otro,
    do_not_say: DEFAULT_DO_NOT_SAY[body.vertical] ?? DEFAULT_DO_NOT_SAY.otro,
    primary_color: '#5B5BD6',
    accent_color: '#00D4A4',
  })

  // 4. Audit log
  await admin.from('audit_log').insert({
    org_id: org.id,
    user_id: user.id,
    action: 'org.created',
    metadata: { vertical: body.vertical },
  })

  // 5. Welcome email (silencioso si Resend no configurado)
  if (user.email) {
    await sendTrendoraEmail(
      event,
      'welcome',
      { name: user.user_metadata?.full_name as string | undefined, orgSlug: org.slug },
      user.email,
    )
  }

  return { id: org.id, slug: org.slug }
})
