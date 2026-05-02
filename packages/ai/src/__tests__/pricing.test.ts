import { describe, it, expect } from 'vitest'
import { calculateTextCost, costToCredits, MODEL_PRICING, IMAGE_PRICING_USD } from '../pricing'

describe('calculateTextCost', () => {
  it('calcula coste de Claude Sonnet sin caché', () => {
    const cost = calculateTextCost('claude-3-5-sonnet-latest', 1000, 500)
    // 1000 in × $3/M + 500 out × $15/M = $0.003 + $0.0075 = $0.0105
    expect(cost).toBeCloseTo(0.0105, 6)
  })

  it('calcula coste de Claude Sonnet con prompt cacheado', () => {
    const cost = calculateTextCost('claude-3-5-sonnet-latest', 5000, 500, 4000)
    // fresh: 1000 × $3/M = $0.003
    // cached: 4000 × $0.30/M = $0.0012
    // out: 500 × $15/M = $0.0075
    // total = $0.0117
    expect(cost).toBeCloseTo(0.0117, 6)
  })

  it('Sonnet es más caro que Haiku', () => {
    const sonnet = calculateTextCost('claude-3-5-sonnet-latest', 1000, 500)
    const haiku = calculateTextCost('claude-3-5-haiku-latest', 1000, 500)
    expect(sonnet).toBeGreaterThan(haiku)
  })

  it('usar caché reduce el coste cuando el prompt es grande', () => {
    const noCache = calculateTextCost('claude-3-5-sonnet-latest', 5000, 500)
    const withCache = calculateTextCost('claude-3-5-sonnet-latest', 5000, 500, 4500)
    expect(withCache).toBeLessThan(noCache)
  })
})

describe('costToCredits', () => {
  it('redondea hacia arriba con mínimo 1', () => {
    expect(costToCredits(0)).toBeGreaterThanOrEqual(1)
    expect(costToCredits(0.001)).toBe(1)
    expect(costToCredits(0.003)).toBe(1)
    expect(costToCredits(0.012)).toBe(4)
  })

  it('escala lineal con el coste', () => {
    expect(costToCredits(0.03)).toBeGreaterThan(costToCredits(0.01))
  })

  it('mantiene margen sobre el coste real (cliente paga más que costamos)', () => {
    // 1 crédito vendido a ~$0.012, coste ~$0.003 → margen 4x
    const credits = costToCredits(0.003)
    const customerPaid = credits * 0.012
    expect(customerPaid).toBeGreaterThan(0.003)
  })
})

describe('Pricing tables', () => {
  it('todos los modelos de texto tienen entradas válidas', () => {
    for (const [, p] of Object.entries(MODEL_PRICING)) {
      expect(p.input).toBeGreaterThan(0)
      expect(p.output).toBeGreaterThan(0)
      expect(p.cachedInput).toBeLessThanOrEqual(p.input)
    }
  })

  it('todos los modelos de imagen tienen precio definido', () => {
    for (const [, price] of Object.entries(IMAGE_PRICING_USD)) {
      expect(price).toBeGreaterThan(0)
    }
  })
})
