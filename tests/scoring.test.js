import { describe, it, expect } from 'vitest'
import { calcHeatScore, getHeatTag, calcVelocity, calcAcceleration } from '../src/lib/scoring.js'

function makeReclamacao(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 86_400_000)
  return { data: d.toISOString(), titulo: 'Teste', curtidas: 0, comentarios: 0 }
}

describe('calcHeatScore', () => {
  it('retorna 0 para empresa sem reclamações', () => {
    expect(calcHeatScore({ total_reclamacoes: 0 }, [])).toBe(0)
  })

  it('score maior para empresa com muitas reclamações recentes', () => {
    const empresa   = { total_reclamacoes: 30, primeiro_visto: Date.now() - 5 * 86_400_000 }
    const recentes  = Array.from({ length: 28 }, (_, i) => makeReclamacao(i))
    const antigas   = Array.from({ length: 2  }, (_, i) => makeReclamacao(60 + i))
    const scoreAlto = calcHeatScore(empresa, recentes)
    const scoreBaixo = calcHeatScore({ total_reclamacoes: 100 }, antigas)
    expect(scoreAlto).toBeGreaterThan(scoreBaixo)
  })

  it('retorna valor entre 0 e 100', () => {
    const empresa = { total_reclamacoes: 1000 }
    const recls   = Array.from({ length: 200 }, (_, i) => makeReclamacao(i % 14))
    const score   = calcHeatScore(empresa, recls)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('empresa nova (freshness) recebe boost', () => {
    const recls = Array.from({ length: 10 }, (_, i) => makeReclamacao(i))
    const nova  = calcHeatScore({ total_reclamacoes: 10, primeiro_visto: Date.now() - 3  * 86_400_000 }, recls)
    const velha = calcHeatScore({ total_reclamacoes: 10, primeiro_visto: Date.now() - 365 * 86_400_000 }, recls)
    expect(nova).toBeGreaterThan(velha)
  })
})

describe('getHeatTag', () => {
  it('score ≥ 85 → EXPLODINDO', () => {
    expect(getHeatTag(90).tag).toBe('EXPLODINDO')
  })
  it('score ≥ 65 → ESCALANDO', () => {
    expect(getHeatTag(70).tag).toBe('ESCALANDO')
  })
  it('score ≥ 45 → AQUECENDO', () => {
    expect(getHeatTag(50).tag).toBe('AQUECENDO')
  })
  it('score ≥ 25 → MORNO', () => {
    expect(getHeatTag(30).tag).toBe('MORNO')
  })
  it('score < 25 → ESFRIANDO', () => {
    expect(getHeatTag(10).tag).toBe('ESFRIANDO')
  })
})

describe('calcVelocity', () => {
  it('conta reclamações nos últimos N dias e divide por N', () => {
    const recls = Array.from({ length: 7 }, (_, i) => makeReclamacao(i))
    expect(calcVelocity(recls, 7)).toBeCloseTo(1, 1)
  })

  it('ignora reclamações fora da janela', () => {
    const recls = [makeReclamacao(8), makeReclamacao(9), makeReclamacao(1)]
    expect(calcVelocity(recls, 7)).toBeCloseTo(1 / 7, 5)
  })
})

describe('calcAcceleration', () => {
  it('retorna MAX quando empresa tinha zero antes', () => {
    const recls = Array.from({ length: 5 }, (_, i) => makeReclamacao(i))
    const accel = calcAcceleration(recls)
    expect(accel).toBeGreaterThan(1)
  })

  it('retorna ~1 quando crescimento é estável', () => {
    const recls = Array.from({ length: 14 }, (_, i) => makeReclamacao(i))
    const accel = calcAcceleration(recls)
    expect(accel).toBeCloseTo(1, 0)
  })
})
