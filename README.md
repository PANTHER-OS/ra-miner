# Atloura 🌍

Explorador interativo de países do mundo: mapa-múndi navegável, passaporte de viagem pessoal, carimbo verificado por GPS, roteiros de 24h por cidade, mini-phrasebook por idioma e um quiz de compatibilidade de destino.

**Produção:** https://ra-miner.vercel.app

## O que o app faz

- **Mapa-múndi interativo** — zoom, pan, busca com autocomplete, filtro por continente
- **Passaporte de viagem** — marque países como "visitei" ou "quero ir"; dados salvos localmente no seu aparelho
- **Carimbo verificado por GPS** — compara sua localização real com o polígono do país (100% no dispositivo, nada é enviado a servidor)
- **Roteiros de 24h** — sugestões curadas hora a hora para as principais cidades de cada país
- **Frases essenciais** — mini-phrasebook por idioma, com pronúncia e leitura em voz alta
- **Quiz de compatibilidade** — responde algumas perguntas e descobre os 3 destinos ideais pro seu perfil, com resultado compartilhável
- **Vitrine sensorial** — hora local, clima ao vivo e "palavra do dia" intraduzível de cada país

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + SSR)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- react-simple-maps + d3-geo (mapa e verificação geográfica)
- Dados de países via [mledoze/countries](https://github.com/mledoze/countries) e [country-json](https://github.com/samayo/country-json)

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Por padrão o build gera artefatos Cloudflare (via `nitro`). Para gerar o formato da Vercel:

```bash
NITRO_PRESET=vercel npm run build
```

## Deploy

O projeto está conectado à Vercel e faz redeploy automático a cada push na branch `main`. Variável de ambiente necessária no projeto Vercel:

| Variável | Valor |
|---|---|
| `NITRO_PRESET` | `vercel` |

---

_Importado de um projeto [Lovable](https://lovable.dev) e mantido neste repositório._
