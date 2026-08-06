# Mundo em Foco — Plano de Construção

Explorador interativo de países com mapa-múndi SVG navegável, painel de detalhes rico, contador de interesse persistido e visual premium dark. Sugestão de nome mantida: **Mundo em Foco** (combina bem com o conceito de "focar" em cada país no mapa).

## Escopo funcional

**Tela principal (`/`)**
- Header minimalista com logo "Mundo em Foco", busca com autocomplete (fuse.js), filtros de continente (chips) e ordenação (população / interesse).
- Faixa "Top 5 em Alta" — cards horizontais com bandeira, nome e contador de interesse (dados do banco), animação de entrada escalonada.
- Mapa-múndi SVG (world-atlas TopoJSON via `react-simple-maps`) ocupando o palco principal, dark mode, países em tom neutro, hover com glow na cor de destaque, clique seleciona.
- Zoom/pan suaves (roda + pinça no mobile), botões +/− e "resetar visão".
- Ao clicar num país: animação Framer Motion que centraliza/zooma no país e abre painel lateral (desktop) ou bottom sheet (mobile) com os detalhes.

**Painel de detalhes**
- Bandeira grande, nome oficial e comum, capital, idiomas, moeda (símbolo + nome), continente/região, sub-região.
- População formatada (pt-BR) com animação de counter.
- Botão "Tenho interesse nesse país" — incrementa contador no banco, 1 voto por país por dispositivo (localStorage), animação do número subindo (`framer-motion`).
- Bloco "Curiosidades" (3–6 bullets) — curadoria manual para ~40 países populares + fallback genérico bem redigido usando região/capital/idioma.
- Posição no ranking global de interesse ("#3 de 195").
- Botão fechar com animação reversa.

**Estados**
- Skeletons durante fetch da REST Countries e do contador.
- Toast (sonner) para confirmar voto ou avisar "você já votou nesse país".

## Stack e integrações

- Front: TanStack Start (já configurado), Tailwind v4, shadcn, framer-motion, react-simple-maps, fuse.js, sonner.
- Dados de países: REST Countries v3.1 (`https://restcountries.com/v3.1/all?fields=...`) — cache em TanStack Query com `staleTime` alto.
- Backend: **Lovable Cloud** (Supabase) — tabela `country_interest(country_code text primary key, count int)` com RPC `increment_interest(code)` para incremento atômico. RLS permitindo SELECT anon e EXECUTE da função para anon.
- Bloqueio de voto duplo: `localStorage["mef_votes"] = { BR: true, ... }` verificado no cliente antes de chamar a RPC.

## Design system

- Paleta dark: base `oklch(0.14 0.02 260)` (quase preto azulado), superfícies elevadas, destaque âmbar/dourado quente `oklch(0.78 0.15 75)` para hover/seleção (evita o clichê roxo).
- Tipografia: display serif elegante (Fraunces) + sans geométrica (Space Grotesk) via `<link>` no `__root`.
- Tokens em `src/styles.css`: cores, gradientes, sombras "glow", radius, transições.
- Microinterações: hover-lift nos cards, glow pulsante no país selecionado, transição de bandeira com blur→sharp, counter animado.

## Arquitetura de arquivos

```text
src/
  routes/
    __root.tsx              (fontes, meta pt-BR, providers)
    index.tsx               (mapa + painel + top 5)
    api/public/
      countries.ts          (proxy/cache opcional — não crítico)
  components/
    WorldMap.tsx
    CountryPanel.tsx
    TopInterest.tsx
    SearchBar.tsx
    FilterBar.tsx
    InterestButton.tsx
    AnimatedCounter.tsx
    CountrySkeleton.tsx
  lib/
    countries.ts            (fetch + normalização REST Countries)
    curiosities.ts          (curadoria manual + fallback)
    interest.functions.ts   (server fns: getInterestCounts, incrementInterest)
    localVotes.ts           (helpers localStorage)
  styles.css                (design system dark premium)
```

Migração SQL cria tabela + grants + RLS + RPC `increment_interest`.

## Ordem de execução

1. Ativar Lovable Cloud e rodar migração (`country_interest` + RPC + grants + RLS).
2. Design system em `styles.css` + fontes no `__root` + metadata pt-BR.
3. Instalar deps: `react-simple-maps`, `d3-geo`, `framer-motion`, `fuse.js`, `sonner`, `@types/react-simple-maps`.
4. `lib/countries.ts` (REST Countries) e `lib/curiosities.ts` (curadoria ~40 países).
5. Server functions de interesse + middleware de auth já existente ignorada (endpoints públicos).
6. Componentes: `WorldMap`, `SearchBar`, `FilterBar`, `TopInterest`, `CountryPanel`, `InterestButton`, `AnimatedCounter`.
7. Montar `routes/index.tsx` orquestrando tudo com TanStack Query.
8. Ajustes responsivos (bottom sheet mobile, gestos de pinça).
9. Sitemap/robots e verificação visual via Playwright headless.

## Suposições (avise se quiser mudar)

- Idioma da UI: **português (BR)**.
- Sem autenticação — voto anônimo com localStorage é suficiente.
- Curadoria de curiosidades em português, escrita por mim para ~40 países mais relevantes; demais recebem fallback contextual.
- Contador começa em 0 para todos os países (sem seed artificial).
