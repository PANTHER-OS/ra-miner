import { createFileRoute } from "@tanstack/react-router";
import { Lucro2xPage } from "@/components/lucro2x/Lucro2xPage";
import { programInfo, tracking } from "@/lib/lucro2x/config";
import { BASE_URL } from "@/lib/site";

// Página de oferta de lançamento, isolada do resto do app (Atloura) — não
// usa o layout "_explorer" nem nenhum componente/estado dele. Rota fixa:
// /lucro2x. Scripts de rastreamento (Meta Pixel / GA4) só entram no HTML
// quando os IDs correspondentes estiverem preenchidos em
// src/lib/lucro2x/config.ts — sem ID, a página sobe sem nenhum script de
// terceiro.
export const Route = createFileRoute("/lucro2x")({
  head: () => ({
    meta: [
      { title: `${programInfo.name} — Condição de lançamento` },
      {
        name: "description",
        content:
          "Oferta exclusiva de lançamento para quem acompanhou a transmissão. Vagas e condição especial por tempo limitado.",
      },
      // Página de funil de tráfego direcionado (link do grupo), não uma
      // página de conteúdo do site — não deve ser indexada nem aparecer em
      // busca antes da hora.
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: programInfo.name },
      {
        property: "og:description",
        content: "Oferta exclusiva de lançamento — condição especial por tempo limitado.",
      },
      { property: "og:type", content: "website" },
      // Imagem própria da oferta (gerada especificamente pra essa página) —
      // sem isso, o link no WhatsApp/Instagram herdava a prévia do Atloura.
      { property: "og:image", content: `${BASE_URL}/lucro2x/og.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: programInfo.name },
      { name: "twitter:image", content: `${BASE_URL}/lucro2x/og.jpg` },
    ],
    scripts: [
      ...(tracking.googleAnalyticsId
        ? [
            {
              src: `https://www.googletagmanager.com/gtag/js?id=${tracking.googleAnalyticsId}`,
              async: true,
            },
            {
              children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${tracking.googleAnalyticsId}');`,
            },
          ]
        : []),
      ...(tracking.metaPixelId
        ? [
            {
              children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${tracking.metaPixelId}');fbq('track','PageView');`,
            },
          ]
        : []),
    ],
  }),
  component: Lucro2xPage,
});
