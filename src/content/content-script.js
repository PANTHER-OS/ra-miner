/**
 * Entry point do content script — detecta o tipo de página RA
 * e ativa o scraper e overlay adequados.
 */
import { scrapeEmpresaPage }   from './scraper-empresa.js'
import { scrapeBuscaPage }     from './scraper-busca.js'
import { scrapeRankingPage }   from './scraper-ranking.js'
import { injectOverlays }      from './overlay-injector.js'
import { setupInfiniteScroll } from './infinite-scroll.js'
import { slugFromUrl }         from '../lib/utils.js'

const path = location.pathname
console.log('[RA Miner] content script carregado:', path)

async function init() {
  if (_isEmpresaPage(path)) {
    console.log('[RA Miner] página de empresa detectada, iniciando scrape')
    await scrapeEmpresaPage()
    injectOverlays()
  } else if (_isBuscaPage(path)) {
    await scrapeBuscaPage()
    injectOverlays()
    setupInfiniteScroll(scrapeBuscaPage)
  } else if (_isRankingPage(path)) {
    await scrapeRankingPage()
    injectOverlays()
  }

  // Escuta pedidos do side panel / popup
  chrome.runtime.onMessage.addListener((msg, _, respond) => {
    if (msg.type === 'GET_CURRENT_SLUG') {
      respond({ ok: true, data: { slug: slugFromUrl(location.href) } })
    }
    return false
  })
}

function _isEmpresaPage(p)  {
  // matches both /empresa/slug/ (new) and /slug/ (legacy)
  return (/^\/empresa\/[a-z0-9_-]+\/?$/i.test(p) ||
          (/^\/[a-z0-9_-]+\/?$/i.test(p) && !_isBuscaPage(p) && !_isRankingPage(p)))
}
function _isBuscaPage(p)    { return p.startsWith('/busca') }
function _isRankingPage(p)  { return p.startsWith('/ranking') || p.startsWith('/empresas') }

init().catch(console.error)
