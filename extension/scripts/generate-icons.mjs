// Gera os ícones da extensão (16/32/48/128px) em PNG puro, sem depender de
// libs externas de imagem (o ambiente de build não tem ImageMagick/Sharp).
//
// Desenho: quadrado arredondado em gradiente esmeralda (cor "garimpo/premium",
// nada a ver com a marca do WhatsApp — evita qualquer confusão de que isso é
// um produto oficial) com uma gema/diamante branco no centro (representa
// "minerar achados raros") e um pingo dourado no canto (representa o radar /
// detecção em tempo real).
//
// Técnica: renderiza em supersampling 4x (formas com bordas duras) e faz
// downsample em blocos 4x4 pra suavizar (anti-aliasing pobre-mas-eficaz),
// depois comprime como PNG (zlib, embutido no Node) manualmente.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "icons");
mkdirSync(outDir, { recursive: true });

const SS = 4; // fator de supersampling

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function roundedRectMask(x, y, w, h, r, px, py) {
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r + 0.001 || (px >= x + r && px <= x + w - r) || (py >= y + r && py <= y + h - r);
}

function renderIcon(size) {
  const S = size * SS;
  const buf = new Float64Array(S * S * 4); // RGBA float 0..255 pre-render, supersampled

  const bgA = [16, 122, 87]; // emerald escuro
  const bgB = [6, 78, 59]; // emerald bem escuro (canto inferior direito)
  const gem = [246, 250, 248]; // quase branco
  const gemShade = [198, 214, 207]; // faceta sombreada da gema
  const gold = [212, 169, 74]; // dourado do "ping" de detecção

  const r = S * 0.22; // raio do cantos arredondados

  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const idx = (py * S + px) * 4;
      const inside = roundedRectMask(0, 0, S, S, r, px + 0.5, py + 0.5);
      if (!inside) {
        buf[idx + 3] = 0;
        continue;
      }
      const t = (px + py) / (2 * S);
      const [cr, cg, cb] = mixColor(bgA, bgB, t);
      buf[idx] = cr;
      buf[idx + 1] = cg;
      buf[idx + 2] = cb;
      buf[idx + 3] = 255;
    }
  }

  // Gema central: losango (diamante) com uma faceta inferior mais escura.
  const cx = S / 2;
  const cy = S / 2 + S * 0.02;
  const gw = S * 0.34; // meia-largura
  const gh = S * 0.4; // meia-altura
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const dx = Math.abs(px - cx) / gw;
      const dy = (py - cy) / gh;
      const dyAbs = Math.abs(dy);
      if (dx + dyAbs <= 1) {
        const idx = (py * S + px) * 4;
        const isLowerFacet = dy > 0.05 && dx < 1 - dy * 0.5;
        const color = isLowerFacet ? gemShade : gem;
        buf[idx] = color[0];
        buf[idx + 1] = color[1];
        buf[idx + 2] = color[2];
        buf[idx + 3] = 255;
      }
    }
  }
  // Linha central da gema (faceta) — um traço vertical sutil.
  for (let py = cy - gh * 0.55; py < cy + gh * 0.55; py++) {
    for (let px = cx - S * 0.01; px < cx + S * 0.01; px++) {
      const ix = Math.round(px);
      const iy = Math.round(py);
      if (ix < 0 || ix >= S || iy < 0 || iy >= S) continue;
      const dx = Math.abs(ix - cx) / gw;
      const dy = (iy - cy) / gh;
      if (dx + Math.abs(dy) <= 1) {
        const idx = (iy * S + ix) * 4;
        buf[idx] = gemShade[0];
        buf[idx + 1] = gemShade[1];
        buf[idx + 2] = gemShade[2];
      }
    }
  }

  // "Ping" de detecção: círculo dourado no canto superior direito + anel.
  const pcx = S * 0.78;
  const pcy = S * 0.24;
  const pr = S * 0.09;
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const dist = Math.hypot(px - pcx, py - pcy);
      const idx = (py * S + px) * 4;
      if (dist <= pr) {
        buf[idx] = gold[0];
        buf[idx + 1] = gold[1];
        buf[idx + 2] = gold[2];
        buf[idx + 3] = 255;
      } else if (dist <= pr * 1.9 && dist >= pr * 1.55) {
        // anel de radar, semi-transparente sobre o fundo já pintado
        const a = 0.55;
        buf[idx] = lerp(buf[idx], gold[0], a);
        buf[idx + 1] = lerp(buf[idx + 1], gold[1], a);
        buf[idx + 2] = lerp(buf[idx + 2], gold[2], a);
      }
    }
  }

  // Downsample SS x SS -> size x size (média dos blocos).
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r_ = 0,
        g_ = 0,
        b_ = 0,
        a_ = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const idx = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          r_ += buf[idx];
          g_ += buf[idx + 1];
          b_ += buf[idx + 2];
          a_ += buf[idx + 3];
        }
      }
      const n = SS * SS;
      const oIdx = (y * size + x) * 4;
      out[oIdx] = Math.round(r_ / n);
      out[oIdx + 1] = Math.round(g_ / n);
      out[oIdx + 2] = Math.round(b_ / n);
      out[oIdx + 3] = Math.round(a_ / n);
    }
  }
  return out;
}

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Raw scanlines com filtro 0 (none) prefixado em cada linha.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

for (const size of [16, 32, 48, 128]) {
  const rgba = renderIcon(size);
  const png = encodePNG(size, rgba);
  const path = join(outDir, `icon${size}.png`);
  writeFileSync(path, png);
  console.log(`✓ ${path} (${png.length} bytes)`);
}
