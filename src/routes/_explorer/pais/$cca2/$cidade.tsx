import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCountriesServerData, getPtNameServer } from "@/lib/countries-server";
import { findCityBySlug } from "@/lib/cities";
import { BASE_URL } from "@/lib/site";

// Igual à rota de país (ver ../index.tsx), mas reivindica
// "/pais/:cca2/:cidade" e gera meta tags específicas da cidade — a bandeira
// do país segue servindo de og:image (cidade não tem foto própria no
// dataset, e a bandeira já garante um cartão de compartilhamento reconhecível).
export const Route = createFileRoute("/_explorer/pais/$cca2/$cidade")({
  loader: async ({ params }) => {
    const countries = await getCountriesServerData();
    const country = countries.find((c) => c.cca2.toLowerCase() === params.cca2.toLowerCase());
    if (!country) throw notFound();
    const city = findCityBySlug(country.cca2, params.cidade);
    if (!city) throw notFound();
    return { country, city };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { country, city } = loaderData;
    const countryName = getPtNameServer(country);
    const title = `${city.name}, ${countryName} — Mundo em Foco`;
    const description = city.landmark
      ? `Conheça ${city.name}, marco natural em ${countryName}. Roteiro, atrações e curiosidades no Mundo em Foco.`
      : `Conheça ${city.name}, em ${countryName}${
          city.pop ? ` — ${(city.pop / 1_000_000 >= 1 ? `${(city.pop / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : `${Math.round(city.pop / 1000)} mil`)} habitantes` : ""
        }. Roteiro, atrações e curiosidades no Mundo em Foco.`;
    const url = `${BASE_URL}/pais/${country.cca2.toLowerCase()}/${params.cidade}`;
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
    <p className="p-8 text-center text-sm text-muted-foreground">Cidade não encontrada.</p>
  ),
  component: () => null,
});
