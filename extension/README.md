# Garimpo — radar de lançamentos & promoções especiais (WhatsApp + Biblioteca de Anúncios)

Extensão de navegador (Manifest V3) que minera duas fontes em busca de duas
coisas, e só delas:

- **Lançamentos** — produto/serviço/turma novo saindo.
- **Promoções especiais de dia único** — Black Friday, aniversário da marca,
  condição exclusiva por tempo limitado.

Fontes:

1. **Seus grupos de WhatsApp** — monitora os grupos que você escolher (ou
   todos), lendo as mensagens que já chegam pra você.
2. **Biblioteca de Anúncios (Facebook/Instagram)** — enquanto você navega
   em `facebook.com/ads/library` do seu jeito normal (busca, filtro,
   scroll), a extensão marca **direto em cima dos anúncios na própria
   página** os que batem com as suas palavras-chave — borda verde, selo
   e, quando o anúncio expõe um link de grupo (`chat.whatsapp.com`,
   `wa.me`), um botão "Entrar no grupo". Não abre popup nem lista em
   lugar nenhum — a marcação acontece ali, na Biblioteca, e some se você
   recarregar a página.

Promoção genérica que se repete toda semana/todo mês é filtrada de propósito
— o motor de regras aprende o "molde" das mensagens de cada grupo (e aplica
as mesmas palavras-chave nos anúncios) pra suprimir o que reconhece como
rotina.

## ⚠️ Leia antes de instalar

- Só enxerga grupos **que você já participa**. Não existe (e esta extensão
  não tenta simular) acesso a grupos de terceiros nem burla de autenticação —
  é uma ferramenta pessoal de filtro sobre o que já chega pra você.
- Depende do WhatsApp Web estar **aberto numa aba do navegador**. Não há API
  oficial pra minerar mensagens de grupo em segundo plano sem isso.
- O modo "tempo real" (que enxerga todos os grupos da watchlist ao mesmo
  tempo) usa uma técnica de acesso à estrutura interna, não-documentada, do
  WhatsApp Web — a mesma usada por projetos abertos como WPPConnect/WA-JS.
  O WhatsApp pode mudar isso em qualquer atualização deles. Quando isso
  acontece, a extensão cai automaticamente pro **modo DOM**, que só
  enxerga o grupo aberto na tela naquele momento, mas nunca quebra de vez.
  O status atual aparece no topo do popup e das configurações.

## Instalação (modo desenvolvedor)

```bash
cd extension
npm install
npm run build
```

Isso gera `extension/dist/`. No Chrome/Edge:

1. `chrome://extensions`
2. Ative "Modo do desenvolvedor"
3. "Carregar sem compactação" → selecione `extension/dist`

## Configuração da IA (opcional, mas recomendada)

O motor de regras local já funciona sozinho. Pra revisão por IA das
mensagens ambíguas (a parte que faz o "garimpo" ser realmente preciso),
falta configurar a secret do lado do servidor — a extensão nunca embute a
chave da Anthropic no código do cliente (código de extensão é público):

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref bxlemuyjwvofcshsfoeo
```

(ou pelo Dashboard do Supabase → Project Settings → Edge Functions → Secrets)

A Edge Function já está publicada em `whatsapp-classify`
(`supabase/functions/whatsapp-classify/index.ts`, na raiz do repo) — ela é
stateless, não grava nenhuma mensagem em banco, só repassa pra IA e devolve
o veredito. Sem a secret configurada, o Garimpo continua funcionando 100%
com o motor de regras local (nas Configurações dá pra desligar a IA a
qualquer momento).

## Como usar

**WhatsApp:**
1. Abra `web.whatsapp.com` numa aba e mantenha logado.
2. Clique no ícone da extensão → engrenagem → **Configurações**.
3. Em **Grupos monitorados**, marque os grupos que quer garimpar (ou ligue
   "monitorar todos automaticamente").

**Biblioteca de Anúncios:**
1. Navegue normalmente em `facebook.com/ads/library` (com filtro de país
   e palavra-chave do seu nicho, por exemplo).
2. Role os resultados como sempre fez — a extensão vai marcando os cards
   relevantes com borda verde e selo conforme eles aparecem na tela.
3. Um painel pequeno no canto inferior direito mostra quantos achados tem
   na tela e tem um botão "só relevantes" que esconde o resto.
4. Quando o anúncio expõe o link do grupo, aparece um botão verde
   "Entrar no grupo" direto no card — sem precisar abrir mais nada.

Essa parte não usa IA nem passa pelo popup — é decisão instantânea,
100% local, baseada só nas palavras-chave e na sensibilidade que você
configurar.

**WhatsApp:** ajuste palavras-chave, datas especiais do seu nicho e
sensibilidade nas Configurações (vale pras duas fontes). Achados dos
grupos aparecem no popup, com badge de contagem no ícone da extensão e
notificação do sistema pros de maior confiança.

Tudo fica salvo só localmente no seu navegador (`chrome.storage.local`) —
nada é sincronizado pra fora.

## Estrutura

```
extension/
  manifest.json
  src/
    inject/wa-bridge.ts            # MAIN world — hook na Store interna do WhatsApp Web
    content/content-script.ts      # isolated world — ponte + fallback DOM (WhatsApp)
    content/ads-content-script.ts  # varredura da Biblioteca de Anúncios
    background/service-worker.ts   # regras, fila de IA, achados, badge, notificação
    lib/                            # rules-engine, ads-rules, storage, dates, template, classifier-client
    popup/, options/                # UI
supabase/functions/whatsapp-classify/  # proxy stateless pra Anthropic (usado pelas duas fontes)
```

## Build

- `npm run build` — build de produção (`extension/dist`)
- `npm run dev` — esbuild em watch mode
- `npm run typecheck` — só checagem de tipos
- `npm run icons` — regera os ícones (script puro em Node, sem libs de imagem)
