import { AyrshareClient } from '@tane/ayrshare'

let _client: AyrshareClient | null = null

export function ayrshare(): AyrshareClient {
  if (_client) return _client

  const config = useRuntimeConfig()
  if (!config.ayrshareApiKey) {
    throw new Error('AYRSHARE_API_KEY no configurada')
  }

  _client = new AyrshareClient({
    apiKey: config.ayrshareApiKey,
    privateKey: config.ayrsharePrivateKey,
    domain: config.ayrshareDomain,
  })

  return _client
}
