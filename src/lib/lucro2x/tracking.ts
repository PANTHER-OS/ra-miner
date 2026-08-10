// Rastreamento de conversão da página /lucro2x — Meta Pixel + GA4.
//
// Os scripts só são injetados (ver head() em src/routes/lucro2x.tsx) quando
// `tracking.metaPixelId` / `tracking.googleAnalyticsId` estiverem
// preenchidos em src/lib/lucro2x/config.ts. Sem ID configurado, essas
// funções viram no-op — nunca inserimos um ID fictício só pra "parecer"
// que o rastreamento está ativo.

import { tracking } from "./config";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

type EventName = "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";

export function trackEvent(name: EventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (tracking.metaPixelId && window.fbq) {
    window.fbq("track", name, params);
  }

  if (tracking.googleAnalyticsId && window.gtag) {
    // Mapeia pros equivalentes de e-commerce do GA4.
    const gaEventMap: Record<EventName, string> = {
      PageView: "page_view",
      ViewContent: "view_item",
      InitiateCheckout: "begin_checkout",
      Purchase: "purchase",
    };
    window.gtag("event", gaEventMap[name], params);
  }
}
