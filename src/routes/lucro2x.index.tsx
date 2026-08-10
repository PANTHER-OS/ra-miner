import { createFileRoute } from "@tanstack/react-router";
import { Lucro2xPage } from "@/components/lucro2x/Lucro2xPage";
import { programInfo } from "@/lib/lucro2x/config";
import { BASE_URL } from "@/lib/site";

// Página de oferta de lançamento, isolada do resto do app (Atloura) — não
// usa o layout "_explorer" nem nenhum componente/estado dele. Rota:
// /lucro2x (o layout pai "lucro2x.tsx" só cuida dos scripts de
// rastreamento compartilhados com o checkout).
export const Route = createFileRoute("/lucro2x/")({
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
  }),
  component: Lucro2xPage,
});
