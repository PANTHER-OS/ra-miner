/**
 * Gera ícones PNG para a extensão usando apenas Node.js built-in (zlib).
 * Execute: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// CRC32 para integridade dos chunks PNG
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type)
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([len, typeB, data, crcB])
}

function makePNG(size, drawFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0) // filter none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawFn(x, y, size)
      raw.push(r, g, b, a)
    }
  }

  const idat = deflateSync(Buffer.from(raw))
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function drawFlameIcon(x, y, size) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1

  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > r) return [0, 0, 0, 0] // fora do círculo = transparente

  // Gradiente de fogo: vermelho em baixo, laranja no meio, amarelo no topo
  const t = 1 - (y / size) // 0 = baixo, 1 = cima
  const edge = Math.max(0, 1 - (dist / r) ** 2)

  const red   = Math.round((200 + 55 * (1 - t)) * edge)
  const green = Math.round((60 + 140 * t) * edge)
  const blue  = Math.round(10 * edge)
  const alpha = Math.round(255 * Math.min(1, edge * 1.5))

  return [Math.min(255, red), Math.min(255, green), Math.min(255, blue), alpha]
}

const sizes = [16, 32, 48, 128]
const outDir = 'public/icons'
mkdirSync(outDir, { recursive: true })

for (const s of sizes) {
  const buf = makePNG(s, drawFlameIcon)
  writeFileSync(join(outDir, `icon-${s}.png`), buf)
  console.log(`✓ public/icons/icon-${s}.png`)
}

console.log('Ícones gerados com sucesso.')
