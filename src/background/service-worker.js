/**
 * Service Worker principal — orquestra coleta, alarmes e roteamento de mensagens.
 */
import { setupAlarms, handleAlarm } from './alarms.js'
import { routeMessage } from './message-router.js'

// Instala alarmes ao instalar/ativar a extensão
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install' || reason === 'update') {
    await setupAlarms()
    await _openDashboardOnInstall()
  }
})

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarms()
})

// Alarmes periódicos (watchlist sync, coleta agendada)
chrome.alarms.onAlarm.addListener(handleAlarm)

// Roteamento de mensagens
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  routeMessage(msg, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ ok: false, error: err.message }))
  return true  // resposta assíncrona
})

// Abre side panel quando usuário clica no ícone
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

async function _openDashboardOnInstall() {
  const url = chrome.runtime.getURL('src/dashboard/dashboard.html')
  await chrome.tabs.create({ url })
}
