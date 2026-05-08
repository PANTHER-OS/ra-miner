/**
 * Auto-scroll inteligente para paginar listagens do Reclame Aqui.
 * Para automaticamente quando não encontra novos cards ou atinge limite.
 */
import { debounce, sleep } from '../lib/utils.js'

const MAX_PAGES   = 5
const SCROLL_GAP  = 1200  // ms entre scrolls

export function setupInfiniteScroll(onNewPage) {
  let page    = 1
  let running = false

  const observer = new IntersectionObserver(
    debounce(async (entries) => {
      if (running || page >= MAX_PAGES) return
      const sentinel = entries.find(e => e.isIntersecting)
      if (!sentinel) return

      running = true
      page++
      await sleep(SCROLL_GAP)
      await onNewPage?.()
      running = false
    }, 300),
    { rootMargin: '0px 0px 300px 0px', threshold: 0.1 }
  )

  // Observa o elemento mais abaixo da página
  const attachSentinel = () => {
    const existing = document.querySelector('#ram-sentinel')
    if (existing) { observer.observe(existing); return }

    const el = document.createElement('div')
    el.id    = 'ram-sentinel'
    el.style.cssText = 'height:1px;width:100%;pointer-events:none'
    document.body.appendChild(el)
    observer.observe(el)
  }

  attachSentinel()

  // Reanexa quando o DOM muda (SPAs)
  const mutObs = new MutationObserver(debounce(attachSentinel, 500))
  mutObs.observe(document.body, { childList: true, subtree: false })

  return () => { observer.disconnect(); mutObs.disconnect() }
}
