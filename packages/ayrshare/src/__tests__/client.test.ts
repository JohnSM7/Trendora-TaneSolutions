import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AyrshareClient, AyrshareError } from '../client'

const FAKE_KEY = 'test_api_key'
const FAKE_PRIVATE = '-----BEGIN RSA PRIVATE KEY-----\nABC\n-----END RSA PRIVATE KEY-----'

describe('AyrshareClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('createProfile envía POST a /profiles con Bearer', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ profileId: 'p1', profileKey: 'k1', title: 'Test' }), {
        status: 200,
      }),
    )

    const client = new AyrshareClient({ apiKey: FAKE_KEY })
    const result = await client.createProfile({ title: 'Test' })

    expect(result.profileKey).toBe('k1')
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0]!
    expect(url).toContain('/profiles')
    expect((init as RequestInit)?.method).toBe('POST')
    const headers = new Headers((init as RequestInit)?.headers)
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_KEY}`)
  })

  it('post añade Profile-Key header', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'success', postIds: [] }), { status: 200 }),
    )

    const client = new AyrshareClient({ apiKey: FAKE_KEY })
    await client.post('PROFILE_KEY_123', {
      post: 'Hola mundo',
      platforms: ['instagram', 'twitter'],
    })

    const [, init] = fetchSpy.mock.calls[0]!
    const headers = new Headers((init as RequestInit)?.headers)
    expect(headers.get('Profile-Key')).toBe('PROFILE_KEY_123')
  })

  it('lanza AyrshareError con status code en respuesta no-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Bad Request', { status: 400 }),
    )

    const client = new AyrshareClient({ apiKey: FAKE_KEY })
    await expect(client.createProfile({ title: 'X' })).rejects.toBeInstanceOf(AyrshareError)
  })

  it('generateJwt requiere privateKey y domain', async () => {
    const client = new AyrshareClient({ apiKey: FAKE_KEY })
    await expect(client.generateJwt({ profileKey: 'k1' })).rejects.toThrow(/AYRSHARE_PRIVATE_KEY/)
  })

  it('generateJwt envía privateKey y domain en body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'success', url: 'https://...', expiresIn: '30m' }), {
        status: 200,
      }),
    )

    const client = new AyrshareClient({
      apiKey: FAKE_KEY,
      privateKey: FAKE_PRIVATE,
      domain: 'tane-social',
    })
    const result = await client.generateJwt({ profileKey: 'k1' })

    expect(result.status).toBe('success')
    const [, init] = fetchSpy.mock.calls[0]!
    const body = JSON.parse((init as RequestInit)?.body as string)
    expect(body.privateKey).toBe(FAKE_PRIVATE)
    expect(body.domain).toBe('tane-social')
    expect(body.profileKey).toBe('k1')
  })

  it('post incluye solo opciones específicas si están definidas', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'success' }), { status: 200 }),
    )

    const client = new AyrshareClient({ apiKey: FAKE_KEY })
    await client.post('K', {
      post: 'X',
      platforms: ['instagram'],
      instagramOptions: { reels: true },
    })

    const [, init] = fetchSpy.mock.calls[0]!
    const body = JSON.parse((init as RequestInit)?.body as string)
    expect(body.instagramOptions).toEqual({ reels: true })
    expect(body.twitterOptions).toBeUndefined()
  })
})
