#!/usr/bin/env node
// Gera src/data/quiz-auto-profiles.json: cca2 -> scores parciais do quiz de
// compatibilidade, pros países que NÃO têm perfil escrito à mão em
// src/lib/quiz.ts (ver PROFILES lá) — hoje só 55 dos 249 países.
//
// Por que não escrever à mão os outros ~194: os 55 perfis curados têm nota
// subjetiva em 11 dimensões (comida, cultura, aventura...) baseada em
// conhecimento real de destino turístico — inventar isso pros outros 194
// seria, na prática, chutar fatos sobre lugares que ninguém aqui verificou
// (ex: "nota de comida 8" pro Turcomenistão não tem nenhuma base).
//
// Em vez disso, esse script calcula só as dimensões que dá pra derivar de
// dado geográfico JÁ verificado (mledoze/countries: latlng, landlocked,
// population, area, languages) — sem inventar nada:
//   - beach: 0 se landlocked (fato, não chute); senão cresce com o quanto o
//     país é tropical (mais perto do equador).
//   - warm: direto da latitude (mais perto do equador = mais quente).
//   - urban: densidade populacional (população/área) em escala log.
//   - easy: idioma oficial compartilhado com o Brasil (português/espanhol
//     pesam mais que inglês) menos a distância até o Brasil.
//   - exotic: puramente a distância até o Brasil — quanto mais longe,
//     mais raro de um brasileiro conhecer alguém que já foi.
//
// As outras 6 dimensões (mountain, culture, food, adventure, chill, budget)
// ficam DE FORA do objeto de cada país — computeResults() já trata
// dimensão ausente como neutra (nem ajuda nem atrapalha o match), então é
// mais honesto deixar de fora do que inventar um número.
//
// Rodar: node scripts/gen-quiz-profiles.mjs
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MLEDOZE_URL = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
// mledoze não tem população — mesma fonte já usada em countries-server.ts.
// Sem isso, "urban" (que depende de população/área) ficava travado no mesmo
// valor pra todo mundo, porque c.population vinha sempre undefined.
const POP_URL =
  "https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json";
const outPath = join(__dirname, "..", "src", "data", "quiz-auto-profiles.json");

function norm(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// cca2 dos 55 países já curados à mão em src/lib/quiz.ts — não gerar (nem
// sobrescrever) esses aqui.
const CURATED = new Set([
  "BR", "AR", "CL", "PE", "CO", "UY", "MX", "US", "CA", "CR", "CU",
  "PT", "ES", "IT", "FR", "GR", "GB", "DE", "NL", "CH", "AT", "IS",
  "NO", "SE", "IE", "CZ", "HU", "HR", "TR",
  "JP", "KR", "CN", "TH", "VN", "ID", "PH", "SG", "MY", "IN", "NP", "AE", "JO", "IL",
  "MA", "EG", "ZA", "KE", "TZ",
  "AU", "NZ", "FJ", "MV", "DO", "PA", "EC",
]);

const BRAZIL = [-14.235, -51.9253]; // centroide aproximado do Brasil

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function main() {
  const [countries, pops] = await Promise.all([
    fetch(MLEDOZE_URL).then((r) => r.json()),
    fetch(POP_URL).then((r) => r.json()),
  ]);
  const popMap = new Map();
  for (const p of pops) {
    if (p.population != null) popMap.set(norm(p.country), p.population);
  }

  const result = {};
  let generated = 0;
  const skippedNoCoord = [];

  for (const c of countries) {
    const cca2 = c.cca2;
    if (!cca2 || CURATED.has(cca2)) continue;
    if (!c.latlng || c.latlng.length !== 2) {
      skippedNoCoord.push(cca2);
      continue;
    }

    const population = popMap.get(norm(c.name.common)) ?? popMap.get(norm(c.name.official)) ?? 0;

    const [lat] = c.latlng;
    const warm = clamp(Math.round(10 - Math.abs(lat) / 6), 0, 10);
    const beach = c.landlocked ? 0 : clamp(Math.round(3 + warm * 0.7), 0, 10);

    const density = c.area && c.area > 0 ? population / c.area : 0;
    const urban = clamp(Math.round(2 + 2 * Math.log10(density + 1)), 0, 10);

    const langs = Object.values(c.languages ?? {});
    const langBonus = langs.includes("Portuguese") ? 5 : langs.includes("Spanish") ? 3 : langs.includes("English") ? 1 : 0;
    const distKm = haversineKm(BRAZIL, c.latlng);
    // Mais suave que uma penalidade linear direta: destinos curados à mão
    // bem distantes (Japão, Tailândia...) também não chegam a "easy" baixo
    // assim — usar raiz quadrada em vez de distância linear evita que todo
    // país fora das Américas afunde pra 0-1 só por estar longe.
    const distPenalty = clamp(Math.round(Math.sqrt(distKm / 400)), 0, 5);
    const easy = clamp(5 + langBonus - distPenalty, 0, 10);

    const exotic = clamp(Math.round(distKm / 2200), 0, 10);

    result[cca2] = { beach, warm, urban, easy, exotic };
    generated++;
  }

  writeFileSync(outPath, JSON.stringify(result, null, 0));
  console.log(`gerado: ${generated} países -> ${outPath}`);
  console.log(`  sem coordenada (não gerados): ${skippedNoCoord.length}${skippedNoCoord.length ? " -> " + skippedNoCoord.join(", ") : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
