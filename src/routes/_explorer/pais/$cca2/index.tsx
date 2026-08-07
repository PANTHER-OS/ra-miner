import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCountriesServerData, getPtNameServer } from "@/lib/countries-server";
import { BASE_URL } from "@/lib/site";

// Só existe pra reivindicar a URL "/pais/:cca2" e gerar as meta tags
// específicas daquele país no SSR (título, descrição, og:image com a
// bandeira) — o conteúdo visual é todo do <ExplorerPage/> no layout pai
// (ver src/routes/_explorer.tsx), que lê o :cca2 via useParams e seleciona
// o país certo no mapa/painel.
export const Route = createFileRoute("/_explorer/pais/$cca2/")({
  loader: async ({ params }) => {
    const countries = await getCountriesServerData();
    const country = countries.find((c) => c.cca2.toLowerCase() === params.cca2.toLowerCase());
    if (!country) throw notFound();
    return { country };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { country } = loaderData;
    const name = getPtNameServer(country);
    const capital = country.capital?.[0];
    const title = `${name} — Mundo em Foco`;
    const description = `Descubra ${name}${capital ? `: capital ${capital}` : ""}${
      country.population ? `, ${(country.population / 1_000_000).toFixed(1).replace(/\.0$/, "")}M de habitantes` : ""
    }. Roteiro de 24h, principais atrações e curiosidades no Mundo em Foco.`;
    const url = `${BASE_URL}/pais/${country.cca2.toLowerCase()}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: country.flags.png },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: country.flags.png },
      ],
    };
  },
  notFoundComponent: () => (
    <p className="p-8 text-center text-sm text-muted-foreground">País não encontrado.</p>
  ),
  component: () => null,
});
