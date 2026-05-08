import { describe, it, expect, vi } from 'vitest'
import { slugFromUrl, extractNextData, sanitizeText } from '../src/lib/utils.js'
import { classifyNiche } from '../src/lib/niche-classifier.js'

describe('slugFromUrl', () => {
  it('extrai slug de URL de empresa', () => {
    expect(slugFromUrl('https://www.reclameaqui.com.br/lojas-americanas/')).toBe('lojas-americanas')
  })

  it('extrai slug sem barra final', () => {
    expect(slugFromUrl('https://www.reclameaqui.com.br/magazine-luiza')).toBe('magazine-luiza')
  })

  it('retorna string vazia para URL inválida', () => {
    expect(slugFromUrl('nao-e-uma-url')).toBe('')
  })

  it('retorna string vazia para URL sem path', () => {
    expect(slugFromUrl('https://www.reclameaqui.com.br/')).toBe('')
  })
})

describe('sanitizeText', () => {
  it('remove tags HTML', () => {
    expect(sanitizeText('<b>Texto</b> com <a href="#">link</a>')).toBe('Texto  com  link')
  })

  it('colapsa espaços múltiplos', () => {
    expect(sanitizeText('Texto   com  espaços')).toBe('Texto com espaços')
  })

  it('retorna string vazia para null/undefined', () => {
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
  })
})

describe('classifyNiche', () => {
  it('classifica produto de emagrecimento', () => {
    const empresa   = { nome: 'Slim Fast Brasil', segmento: 'saúde' }
    const recls     = [{ titulo: 'produto de emagrecimento não funciona', descricao: 'comprei cápsulas para emagrecer' }]
    expect(classifyNiche(empresa, recls)).toBe('emagrecimento')
  })

  it('classifica infoproduto/curso', () => {
    const empresa = { nome: 'Aprenda Rápido', segmento: 'educação' }
    const recls   = [{ titulo: 'acesso ao curso negado', descricao: 'paguei pelo ebook mas não recebi' }]
    expect(classifyNiche(empresa, recls)).toBe('infoprodutos')
  })

  it('classifica aposta', () => {
    const empresa = { nome: 'BetFast', segmento: 'entretenimento' }
    const recls   = [{ titulo: 'saque negado na bet', descricao: 'minha conta foi suspensa sem motivo' }]
    expect(classifyNiche(empresa, recls)).toBe('apostas')
  })

  it('retorna outros quando não identificado', () => {
    const empresa = { nome: 'Empresa Genérica', segmento: '' }
    const recls   = [{ titulo: 'problema genérico', descricao: 'não gostei' }]
    expect(classifyNiche(empresa, recls)).toBe('outros')
  })
})
