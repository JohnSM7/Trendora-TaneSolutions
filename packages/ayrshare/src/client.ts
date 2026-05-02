/**
 * Cliente de Ayrshare Business API.
 *
 * Docs: https://www.ayrshare.com/docs
 *
 * Multi-tenant: cada cliente final tiene un Profile Key. Para llamar a la API
 * en su nombre, pasamos `Profile-Key: ...` como header además del Bearer global.
 */

const API_BASE = 'https://api.ayrshare.com/api'

export interface AyrshareConfig {
  apiKey: string
  privateKey?: string // necesario solo para generateJWT
  domain?: string
}

export interface CreateProfileResponse {
  profileId: string
  profileKey: string
  title: string
  refId?: string
}

export interface GenerateJwtResponse {
  status: 'success' | 'error'
  title?: string
  token?: string
  url?: string
  expiresIn?: string
  emailSent?: boolean
}

export interface PostInput {
  post: string
  platforms: Array<
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'twitter'
    | 'tiktok'
    | 'youtube'
    | 'pinterest'
    | 'threads'
    | 'bluesky'
    | 'gmb'
    | 'reddit'
    | 'telegram'
  >
  mediaUrls?: string[]
  scheduleDate?: string // ISO 8601
  hashtags?: string[]
  /** Opciones específicas por plataforma. Ver docs Ayrshare. */
  instagramOptions?: Record<string, unknown>
  twitterOptions?: Record<string, unknown>
  linkedInOptions?: Record<string, unknown>
  facebookOptions?: Record<string, unknown>
  tiktokOptions?: Record<string, unknown>
}

export interface PostResponse {
  status: 'success' | 'error'
  errors?: Array<{ platform: string; message: string; code?: number }>
  postIds?: Array<{ status: string; id: string; postUrl?: string; platform: string }>
  refId?: string
}

export class AyrshareClient {
  private apiKey: string
  private privateKey?: string
  private domain?: string

  constructor(config: AyrshareConfig) {
    this.apiKey = config.apiKey
    this.privateKey = config.privateKey
    this.domain = config.domain
  }

  // -- Helpers ----------------------------------------------------------------

  private async request<T>(
    path: string,
    init: RequestInit & { profileKey?: string } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${this.apiKey}`)
    headers.set('Content-Type', 'application/json')
    if (init.profileKey) headers.set('Profile-Key', init.profileKey)

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new AyrshareError(
        `Ayrshare ${init.method ?? 'GET'} ${path} failed: ${res.status}`,
        res.status,
        body,
      )
    }

    return (await res.json()) as T
  }

  // -- Profiles (multi-tenant) ------------------------------------------------

  /**
   * Crea un User Profile bajo el Primary. Devuelve el `profileKey` que se
   * persiste por organización. Ese key se usa en headers para todas las
   * llamadas posteriores en nombre de ese cliente.
   */
  async createProfile(input: {
    title: string
    tags?: string[]
    disableSocial?: PostInput['platforms']
    hideTopHeader?: boolean
    topHeader?: string
  }): Promise<CreateProfileResponse> {
    return this.request<CreateProfileResponse>('/profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async deleteProfile(profileKey: string): Promise<{ status: string }> {
    return this.request('/profiles', {
      method: 'DELETE',
      profileKey,
    })
  }

  /**
   * Genera una URL JWT (válida 30 min) que envía al usuario al flujo OAuth
   * white-label de Ayrshare. Tras conectar redes, recibimos webhook.
   */
  async generateJwt(input: {
    profileKey: string
    expiresIn?: string // por defecto 30m, máx 24h
    redirect?: string
    logout?: boolean
  }): Promise<GenerateJwtResponse> {
    if (!this.privateKey) {
      throw new Error('AYRSHARE_PRIVATE_KEY no configurada — necesaria para generateJwt')
    }
    if (!this.domain) {
      throw new Error('AYRSHARE_DOMAIN no configurada')
    }

    return this.request<GenerateJwtResponse>('/profiles/generateJWT', {
      method: 'POST',
      body: JSON.stringify({
        domain: this.domain,
        privateKey: this.privateKey,
        profileKey: input.profileKey,
        expiresIn: input.expiresIn,
        redirect: input.redirect,
        logout: input.logout,
      }),
    })
  }

  // -- Posting ----------------------------------------------------------------
  //
  // `profileKey` es null/undefined en plan Free → publica con la cuenta primaria.
  // En plan Business → se pasa el profileKey de la organización para multi-tenant.

  async post(profileKey: string | null | undefined, input: PostInput): Promise<PostResponse> {
    const body: Record<string, unknown> = {
      post: input.post,
      platforms: input.platforms,
    }
    if (input.mediaUrls?.length) body.mediaUrls = input.mediaUrls
    if (input.scheduleDate) body.scheduleDate = input.scheduleDate
    if (input.hashtags?.length) body.hashtags = input.hashtags
    if (input.instagramOptions) body.instagramOptions = input.instagramOptions
    if (input.twitterOptions) body.twitterOptions = input.twitterOptions
    if (input.linkedInOptions) body.linkedInOptions = input.linkedInOptions
    if (input.facebookOptions) body.facebookOptions = input.facebookOptions
    if (input.tiktokOptions) body.tiktokOptions = input.tiktokOptions

    return this.request<PostResponse>('/post', {
      method: 'POST',
      profileKey: profileKey ?? undefined,
      body: JSON.stringify(body),
    })
  }

  async deletePost(
    profileKey: string | null | undefined,
    postId: string,
  ): Promise<{ status: string; deleted?: unknown }> {
    return this.request('/delete', {
      method: 'DELETE',
      profileKey: profileKey ?? undefined,
      body: JSON.stringify({ id: postId }),
    })
  }

  // -- Analytics --------------------------------------------------------------

  async analyticsForPost(
    profileKey: string | null | undefined,
    args: { id: string; platforms?: PostInput['platforms'] },
  ): Promise<unknown> {
    return this.request('/analytics/post', {
      method: 'POST',
      profileKey: profileKey ?? undefined,
      body: JSON.stringify(args),
    })
  }

  async listSocialAccounts(profileKey: string | null | undefined): Promise<unknown> {
    return this.request('/user', {
      method: 'GET',
      profileKey: profileKey ?? undefined,
    })
  }
}

export class AyrshareError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message)
    this.name = 'AyrshareError'
  }
}
