/**
 * Motor de auto-update da extensão.
 *
 * Fluxo:
 *  1. Background checa update_check_url a cada 6 h (alarme)
 *  2. Se versão remota > local → salva info em storage + dispara notificação Chrome
 *  3. UIs (popup / sidepanel / dashboard) lêem o storage e exibem banner
 *  4. Clique em "Atualizar" → baixa o ZIP → exibe guia de 3 passos
 *
 * version.json hospedado pelo usuário:
 * {
 *   "version":     "1.2.0",
 *   "releaseDate": "2026-05-10",
 *   "notes":       "- Correção X\n- Novo recurso Y",
 *   "downloadUrl": "https://github.com/.../ra-miner-dist.zip",
 *   "changelogUrl":"https://github.com/.../releases"
 * }
 */
import { getConfig } from './storage.js'

const STORAGE_KEY = 'update_available'

export async function checkForUpdate() {
  const url = await getConfig('update_check_url', '')
  if (!url) return null

  try {
    const res = await fetch(url, {
      cache:   'no-cache',
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const remote = await res.json()
    if (!remote?.version) return null

    const current = chrome.runtime.getManifest().version

    if (!_isNewer(remote.version, current)) {
      // Já estamos atualizados — limpa aviso pendente se houver
      await chrome.storage.local.remove(STORAGE_KEY)
      return null
    }

    const info = {
      version:     remote.version,
      releaseDate: remote.releaseDate  || '',
      notes:       remote.notes        || '',
      downloadUrl: remote.downloadUrl  || '',
      changelogUrl:remote.changelogUrl || '',
      checkedAt:   Date.now(),
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: info })
    return info
  } catch {
    return null
  }
}

export async function getUpdateInfo() {
  const { [STORAGE_KEY]: info } = await chrome.storage.local.get(STORAGE_KEY)
  return info || null
}

export async function dismissUpdate() {
  await chrome.storage.local.remove(STORAGE_KEY)
}

export async function downloadUpdate(downloadUrl) {
  if (!downloadUrl) return { ok: false, error: 'Sem URL de download configurada' }
  try {
    await chrome.downloads.download({
      url:            downloadUrl,
      filename:       'ra-miner-update.zip',
      conflictAction: 'overwrite',
      saveAs:         false,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// Comparação semver simples: "1.2.0" > "1.1.5"
function _isNewer(remote, current) {
  const r = String(remote).split('.').map(Number)
  const c = String(current).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true
    if ((r[i] || 0) < (c[i] || 0)) return false
  }
  return false
}
