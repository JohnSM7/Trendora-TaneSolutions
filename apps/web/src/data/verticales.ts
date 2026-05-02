/**
 * Datos de verticales para landings programmatic SEO.
 *
 * Se importa desde `src/pages/verticales/[vertical].astro` tanto en
 * `getStaticPaths()` como en el componente. En Astro 5, `getStaticPaths`
 * está aislado del resto del frontmatter, así que las constantes deben
 * vivir en módulo separado.
 */

export interface Vertical {
  slug: string
  nombre: string
  pluralLargo: string
  hookH1: string
  ejemplos: string[]
  problemas: string[]
  beneficios: string[]
}

export const VERTICALES: Vertical[] = [
  {
    slug: 'restaurantes',
    nombre: 'Restaurantes',
    pluralLargo: 'restaurantes y bares',
    hookH1: 'Automatiza Instagram y TikTok de tu restaurante con IA',
    ejemplos: [
      'Posts diarios del menú con foto generada',
      'Reels de tus platos estrella semanalmente',
      'Promociones de mediodía y cena automáticas',
      'Mensaje de cumpleaños del local',
    ],
    problemas: [
      'No tienes tiempo entre servicios para publicar',
      'Las fotos del móvil no quedan profesionales',
      'Pierdes clientes que buscan en Instagram antes de venir',
      'Pagas a un freelance pero falta consistencia',
    ],
    beneficios: [
      'Una hora al mes para tener todo el contenido publicado',
      'Imágenes generadas con tu estética de marca',
      'Aparición constante en el feed de tu zona',
      '3-5x más reservas desde redes (caso real)',
    ],
  },
  {
    slug: 'cafeterias',
    nombre: 'Cafeterías',
    pluralLargo: 'cafeterías de especialidad',
    hookH1: 'Llena tu cafetería con contenido social automático',
    ejemplos: [
      'Latte art destacado del día',
      'Nuevo grano de café del mes',
      'Brunch de fin de semana',
      'Eventos de catas y workshops',
    ],
    problemas: [
      'El equipo está dedicado a barra, no a marketing',
      'Compites con cadenas con presupuesto enorme',
      'Quieres aparecer en "cafeterías cerca de mí"',
      'No sabes qué publicar cada día',
    ],
    beneficios: [
      'Contenido editorial de calidad sin contratar fotógrafo',
      'Optimización para búsqueda local',
      'Más Reels = más alcance entre 18-35 años',
      'Posicionamiento como cafetería de especialidad',
    ],
  },
  {
    slug: 'gimnasios',
    nombre: 'Gimnasios',
    pluralLargo: 'gimnasios y boutique fitness',
    hookH1: 'Atrae socios con contenido fitness automatizado',
    ejemplos: [
      'Ejercicio de la semana',
      'Testimonios de transformación',
      'Horarios de clases y novedades',
      'Tips nutrición de tu equipo',
    ],
    problemas: [
      'Los entrenadores no son creadores de contenido',
      'TikTok exige constancia diaria',
      'Pierdes socios potenciales por mala presencia online',
      'Las plantillas genéricas no reflejan tu marca',
    ],
    beneficios: [
      'Reels diarios sin grabar nada nuevo',
      'Brand kit con tu paleta y tipografías',
      'Captación de leads desde redes',
      'Retención mejor con contenido constante para socios',
    ],
  },
  {
    slug: 'clinicas-dentales',
    nombre: 'Clínicas dentales',
    pluralLargo: 'clínicas dentales y centros de salud',
    hookH1: 'Marketing dental que cumple con la normativa',
    ejemplos: [
      'Post educativo sobre limpieza dental',
      'Antes/después con permiso explícito',
      'Equipo de la clínica',
      'Tip semanal sobre salud oral',
    ],
    problemas: [
      'No puedes publicar lo que sea — hay normativa sanitaria',
      'Faltan ideas para no repetir',
      'La IA genérica no entiende tu sector',
      'Necesitas captar pacientes nuevos cada mes',
    ],
    beneficios: [
      'Brand kit con frases prohibidas (cumplimiento)',
      'Plantillas educativas validadas',
      'Captación de pacientes desde Instagram local',
      'Imagen de marca profesional y cercana',
    ],
  },
  {
    slug: 'peluquerias',
    nombre: 'Peluquerías',
    pluralLargo: 'peluquerías y barbershops',
    hookH1: 'Llena tu agenda con redes sociales automáticas',
    ejemplos: [
      'Look de la semana',
      'Reel time-lapse de un cambio de imagen',
      'Disponibilidad de huecos esta semana',
      'Productos que recomiendas',
    ],
    problemas: [
      'No tienes tiempo entre clientes',
      'Los reels llevan horas editar',
      'Compites con peluquerías que sí publican',
      'Pierdes citas porque no apareces',
    ],
    beneficios: [
      'Contenido visual al nivel de una marca grande',
      'Reels editados automáticamente',
      'Sistema de reservas integrado en bio',
      'Más visibilidad local',
    ],
  },
  {
    slug: 'tiendas-fisicas',
    nombre: 'Tiendas físicas',
    pluralLargo: 'tiendas y comercios físicos',
    hookH1: 'Más visitas a tu tienda gracias a redes sociales con IA',
    ejemplos: [
      'Producto del día con fondo profesional',
      'Stories diarias de novedades',
      'Eventos en la tienda',
      'Looks completos / outfit of the day',
    ],
    problemas: [
      'Tu producto compite online con Amazon',
      'No tienes equipo de marketing',
      'Las fotos en la tienda no se ven bien',
      'Necesitas tráfico físico, no solo online',
    ],
    beneficios: [
      'Imagen de catálogo sin sesión de fotos',
      'Llamadas a la acción "ven a la tienda"',
      'Hashtags geográficos optimizados',
      'Coherencia visual con tu identidad',
    ],
  },
  {
    slug: 'bares',
    nombre: 'Bares',
    pluralLargo: 'bares de tapas, vinotecas y coctelerías',
    hookH1: 'Tu bar siempre lleno con redes sociales en piloto automático',
    ejemplos: [
      'Tapa del día con foto profesional',
      'Cóctel de la semana',
      'Eventos: música en directo, catas',
      'Reels de ambiente nocturno',
    ],
    problemas: [
      'Estás abierto cuando todos publican',
      'Las fotos con flash quedan mal',
      'Pierdes clientela joven que busca por TikTok',
      'No puedes pagar a una agencia',
    ],
    beneficios: [
      'Contenido programado para los días de menos público',
      'IA genera imágenes de ambiente sin fotos reales',
      'Reels que captan público de 20-35',
      'Reputación de marca cuidada',
    ],
  },
  {
    slug: 'saas-b2b',
    nombre: 'SaaS B2B',
    pluralLargo: 'startups SaaS B2B',
    hookH1: 'LinkedIn y Twitter on autopilot para founders',
    ejemplos: [
      'Repurposing de blog post a 5 piezas',
      'Hilo de Twitter desde demo grabada',
      'Carrusel LinkedIn semanal',
      'Newsletter cross-posted',
    ],
    problemas: [
      'Eres founder, no creador de contenido',
      'Linkedin pide consistencia diaria',
      'Tu blog no se aprovecha en redes',
      'Cada herramienta hace media cosa',
    ],
    beneficios: [
      'Repurposing automático multi-canal',
      'Voz de marca consistente con la del producto',
      'Métricas reales de impacto en pipeline',
      'Una sola tool para todo',
    ],
  },
]
