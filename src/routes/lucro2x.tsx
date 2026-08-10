import { createFileRoute, Outlet } from "@tanstack/react-router";
import { tracking } from "@/lib/lucro2x/config";

// Layout "pai" só pra permitir uma rota filha (/lucro2x/checkout) sem
// aninhar visualmente dentro da página de vendas — mesmo padrão que
// "_explorer.tsx" já usa no resto do app, mas aqui sem UI própria: só
// <Outlet/>. Ver src/routes/lucro2x.index.tsx (a página em si) e
// src/routes/lucro2x.checkout.tsx.
//
// Scripts de rastreamento (Meta Pixel / GA4) ficam aqui, no nível
// compartilhado, pra valer tanto na página de vendas quanto no checkout —
// só entram no HTML quando os IDs estiverem preenchidos em
// src/lib/lucro2x/config.ts.
export const Route = createFileRoute("/lucro2x")({
  head: () => ({
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
  component: () => <Outlet />,
});
