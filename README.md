# RA Miner — Caçador de Ofertas Escaladas

Extensão Chrome (Manifest V3) que minera o Reclame Aqui para identificar ofertas escaladas — empresas com crescimento acelerado de reclamações, indicando alto volume de vendas.

**Tese operacional:** Velocidade de reclamação > volume absoluto. Uma empresa com 50 reclamações nos últimos 7 dias é mais "quente" que uma com 2.000 reclamações em 3 anos.

---

## Instalação

### Pré-requisitos
- Node.js 18+
- npm 9+

### 1. Instalar dependências e gerar ícones

```bash
npm install
node scripts/generate-icons.mjs
```

### 2. Build

```bash
npm run build
```

A extensão compilada estará em `dist/`.

### 3. Carregar no Chrome

1. Acesse `chrome://extensions`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `dist/`

### Desenvolvimento com hot reload

```bash
npm run dev
```

---

## Uso

### Coleta automática
Navegue por qualquer página do `reclameaqui.com.br`. A extensão coleta dados automaticamente e exibe badges nas listagens.

### Popup
Clique no ícone da extensão para ver o **Top 10 mais quentes** do momento.

### Painel lateral
Abra qualquer página de empresa no RA e clique no ícone — o painel lateral abre com análise completa: Heat Score, sparkline histórico, padrões de reclamação, keywords e estimativa de vendas.

### Dashboard
Clique em **Dashboard ↗** no popup para abrir o painel completo com:
- **Radar** — tabela ranqueada por Heat Score
- **Trending** — empresas que explodiram recentemente
- **Nichos** — mapa de calor por categoria
- **Watchlist** — empresas que você monitora
- **Comparador** — gráfico radar comparando até 5 empresas
- **Histórico** — evolução temporal de Heat Score e velocity

---

## Algoritmo Heat Score

| Componente    | Peso | O que mede |
|---------------|------|-----------|
| Velocity      | 35%  | Reclamações/dia nos últimos 7 dias |
| Acceleration  | 30%  | (velocity 7d) ÷ (velocity 7 dias anteriores) |
| Recency       | 20%  | % das reclamações nos últimos 30d sobre o total |
| Freshness     | 10%  | Empresas novas pesam mais (decaimento exponencial) |
| Engagement    | 5%   | Média de curtidas+comentários por reclamação |

**Saída:** Heat Score 0–100

| Score | Tag         |
|-------|-------------|
| ≥ 85  | ⚡ EXPLODINDO |
| ≥ 65  | 🔥 ESCALANDO  |
| ≥ 45  | 📈 AQUECENDO  |
| ≥ 25  | ➡️ MORNO      |
| < 25  | 📉 ESFRIANDO  |

---

## Stack

- **Manifest V3** — service worker, não background page
- **Vanilla JS + Web Components** — sem framework, popup leve
- **Dexie.js** — IndexedDB wrapper
- **Chart.js** — gráficos
- **Vite + @crxjs/vite-plugin** — build e HMR
- **Vitest** — testes unitários
- **100% local** — nenhum servidor externo necessário

---

## Testes

```bash
npm test
```

---

## Permissões usadas

| Permissão       | Motivo |
|-----------------|--------|
| `storage`       | Persistência via IndexedDB |
| `alarms`        | Coleta agendada da watchlist |
| `notifications` | Alertas de spike |
| `sidePanel`     | Painel lateral de análise |
| `scripting`     | Injeção de badges nas páginas |
| `tabs`          | Abrir dashboard em nova aba |
| `host_permissions: reclameaqui.com.br` | Scraping das páginas |

---

## Integração Panther OS (opcional)

Configure o endpoint em **Configurações → Panther OS**. A extensão envia um POST JSON com as principais ofertas escaladas a cada sincronização manual ou automática.
