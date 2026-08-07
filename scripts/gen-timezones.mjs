#!/usr/bin/env node
// Gera src/data/timezones.json: cca2 -> fuso IANA (ex: "Europe/Berlin").
//
// mledoze/countries removeu o campo `timezones` da base (confirmado: os 250
// países vêm sem esse campo hoje — não é um país isolado, é a base inteira).
//
// Fonte: GeoNames marca cada capital nacional com feature code PPLC
// ("capital of a political entity") e já traz, pré-calculada, a zona IANA
// certa daquela coordenada exata — a mesma fonte e metodologia já usada
// nesta base pra gerar src/data/cities.json. Isso evita o erro clássico de
// "pegar a primeira linha" de uma tabela de fusos por país, que dá resultado
// ERRADO pra vários países grandes:
//   - Brasil: 1ª linha da tabela IANA é America/Noronha (uma ilha) — não
//     America/Sao_Paulo (onde fica Brasília)
//   - Rússia: 1ª linha é Europe/Kaliningrad (um enclave) — não Europe/Moscow
//   - Austrália: 1ª linha é Australia/Lord_Howe (uma ilha) — não
//     Australia/Sydney (perto de Canberra)
//
// Países sem capital no dump de GeoNames (alguns poucos territórios muito
// pequenos) caem num fallback: acha, na tabela oficial da IANA
// (zone1970.tab), o fuso cujo ponto principal fica mais perto do centroide
// do país (mledoze `latlng`).
//
// Rodar: node scripts/gen-timezones.mjs
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MLEDOZE_URL = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
const ZONE1970_URL = "https://raw.githubusercontent.com/eggert/tz/main/zone1970.tab";
// cities15000: inclui todas as capitais nacionais (feature code PPLC),
// mesmo capitais pequenas — GeoNames sempre marca a capital independente
// do corte de população do arquivo.
const GEONAMES_ZIP_URL = "https://download.geonames.org/export/dump/cities15000.zip";

const outPath = join(__dirname, "..", "src", "data", "timezones.json");

function parseCoord(coord) {
  // ISO 6709 sign-degrees-minutes(-seconds): ±DDMM±DDDMM ou ±DDMMSS±DDDMMSS
  const isLong = coord.length === 15;
  const latLen = isLong ? 7 : 5;
  const latStr = coord.slice(0, latLen);
  const lngStr = coord.slice(latLen);
  function toDecimal(str, degLen) {
    const s = str[0] === "-" ? -1 : 1;
    const body = str.slice(1);
    const deg = parseInt(body.slice(0, degLen), 10);
    const min = parseInt(body.slice(degLen, degLen + 2), 10) || 0;
    const sec = parseInt(body.slice(degLen + 2, degLen + 4), 10) || 0;
    return s * (deg + min / 60 + sec / 3600);
  }
  return [toDecimal(latStr, 2), toDecimal(lngStr, 3)];
}

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function fetchGeonamesCities() {
  // Node não tem unzip nativo pronto pra stream — usa o comando `unzip` do
  // sistema num arquivo temporário, mesma abordagem simples usada no resto
  // do pipeline de dados deste projeto.
  const { execSync } = await import("child_process");
  const { mkdtempSync, writeFileSync: writeBin, readFileSync } = await import("fs");
  const { tmpdir } = await import("os");
  const tmp = mkdtempSync(join(tmpdir(), "geonames-"));
  const zipPath = join(tmp, "cities15000.zip");
  const res = await fetch(GEONAMES_ZIP_URL);
  const buf = Buffer.from(await res.arrayBuffer());
  writeBin(zipPath, buf);
  execSync(`unzip -o -q "${zipPath}" -d "${tmp}"`);
  return readFileSync(join(tmp, "cities15000.txt"), "utf8");
}

async function main() {
  const [countries, zoneText, geonames] = await Promise.all([
    fetch(MLEDOZE_URL).then((r) => r.json()),
    fetch(ZONE1970_URL).then((r) => r.text()),
    fetchGeonamesCities(),
  ]);

  // cca2 -> fuso IANA, direto da capital (PPLC)
  const byCapital = new Map();
  for (const line of geonames.split("\n")) {
    if (!line) continue;
    const cols = line.split("\t");
    if (cols[7] !== "PPLC") continue;
    const cc = cols[8];
    const tz = cols[17];
    if (cc && tz) byCapital.set(cc, tz);
  }

  // Fallback pra países sem capital no dump: fuso mais próximo do centroide
  // do país, usando a tabela oficial da IANA.
  const zonesByCountry = new Map();
  for (const line of zoneText.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [codesRaw, coordRaw, zone] = line.split("\t");
    if (!codesRaw || !coordRaw || !zone) continue;
    const [lat, lng] = parseCoord(coordRaw);
    for (const code of codesRaw.split(",")) {
      if (!zonesByCountry.has(code)) zonesByCountry.set(code, []);
      zonesByCountry.get(code).push({ zone, lat, lng });
    }
  }

  const result = {};
  let fromCapital = 0;
  let fromFallback = 0;
  const missing = [];

  for (const c of countries) {
    const cca2 = c.cca2;
    if (!cca2) continue;

    if (byCapital.has(cca2)) {
      result[cca2] = byCapital.get(cca2);
      fromCapital++;
      continue;
    }

    const zones = zonesByCountry.get(cca2);
    if (zones && zones.length > 0) {
      if (zones.length === 1 || !c.latlng) {
        result[cca2] = zones[0].zone;
      } else {
        let best = zones[0];
        let bestDist = Infinity;
        for (const z of zones) {
          const d = haversine(c.latlng, [z.lat, z.lng]);
          if (d < bestDist) {
            bestDist = d;
            best = z;
          }
        }
        result[cca2] = best.zone;
      }
      fromFallback++;
    } else {
      missing.push(cca2);
    }
  }

  writeFileSync(outPath, JSON.stringify(result, null, 0));
  console.log(`gerado: ${Object.keys(result).length} países -> ${outPath}`);
  console.log(`  direto da capital (GeoNames PPLC): ${fromCapital}`);
  console.log(`  fallback (mais próximo do centroide): ${fromFallback}`);
  console.log(`  sem nenhuma fonte (não geradas): ${missing.length}${missing.length ? " -> " + missing.join(", ") : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
