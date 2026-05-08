import { describe, it, expect } from 'vitest'
import { detectSpike, extractKeywords, detectPatterns, estimateSalesVolume, groupByPeriod } from '../src/lib/analyzer.js'

function makeRecl(daysAgo, titulo = 'Teste', descricao = '') {
  return { data: new Date(Date.now() - daysAgo * 86_400_000).toISOString(), titulo, descricao }
}

describe('detectSpike', () => {
  it('detecta spike quando recente > base * threshold', () => {
    const recentes = Array.from({ length: 10 }, (_, i) => makeRecl(i))
    const antigas  = Array.from({ length: 2  }, (_, i) => makeRecl(6 + i))
    expect(detectSpike([...recentes, ...antigas])).toBe(true)
  })

  it('não detecta spike em crescimento normal', () => {
    const recls = Array.from({ length: 6 }, (_, i) => makeRecl(i * 2))
    expect(detectSpike(recls, { threshold: 3 })).toBe(false)
  })

  it('empresa sem histórico com qualquer reclamação é spike', () => {
    expect(detectSpike([makeRecl(1)])).toBe(true)
  })
})

describe('extractKeywords', () => {
  it('retorna as palavras mais frequentes', () => {
    const recls = [
      makeRecl(1, 'produto não chegou', 'produto errado entregue'),
      makeRecl(2, 'produto não chegou', 'produto diferente'),
      makeRecl(3, 'produto diferente',  'produto errado'),
    ]
    const kws = extractKeywords(recls, 5)
    expect(kws.length).toBeGreaterThan(0)
    expect(kws[0]).toHaveProperty('word')
    expect(kws[0]).toHaveProperty('count')
    expect(kws[0].word).toBe('produto')
  })

  it('filtra stopwords', () => {
    const recls = [makeRecl(1, 'o produto não chegou', 'de uma empresa')]
    const kws   = extractKeywords(recls)
    const words  = kws.map(k => k.word)
    expect(words).not.toContain('não')
    expect(words).not.toContain('uma')
  })
})

describe('detectPatterns', () => {
  it('detecta padrão "não recebeu"', () => {
    const recls = [
      makeRecl(1, 'não recebi meu produto'),
      makeRecl(2, 'produto não chegou'),
    ]
    const pats = detectPatterns(recls)
    expect(pats.find(p => p.id === 'nao_recebeu')).toBeDefined()
  })

  it('detecta padrão "fraude"', () => {
    const recls = [makeRecl(1, 'isso é uma fraude completa')]
    const pats  = detectPatterns(recls)
    expect(pats.find(p => p.id === 'fraude')).toBeDefined()
  })

  it('retorna vazio quando não há padrões', () => {
    const recls = [makeRecl(1, 'comprei e chegou rápido ótimo')]
    const pats  = detectPatterns(recls)
    expect(pats).toHaveLength(0)
  })
})

describe('estimateSalesVolume', () => {
  it('estima volume com base em taxa de reclamação de 2%', () => {
    const est = estimateSalesVolume(100)
    expect(est.mid).toBe(5000)  // 100 / 0.02
    expect(est.min).toBeLessThan(est.mid)
    expect(est.max).toBeGreaterThan(est.mid)
  })

  it('torna volume proporcional ao número de reclamações', () => {
    const a = estimateSalesVolume(100)
    const b = estimateSalesVolume(200)
    expect(b.mid).toBe(a.mid * 2)
  })
})

describe('groupByPeriod', () => {
  it('retorna N buckets para N dias', () => {
    const buckets = groupByPeriod([], 30)
    expect(buckets).toHaveLength(30)
  })

  it('distribui reclamações nos buckets corretos', () => {
    const recls   = [makeRecl(0), makeRecl(1), makeRecl(1)]
    const buckets = groupByPeriod(recls, 7)
    const total   = buckets.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(3)
  })
})
