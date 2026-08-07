import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { BASE_URL } from "../lib/site";
import { getCountriesServerData } from "../lib/countries-server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Lista cada país (/pais/:cca2) além da home — é o que faz o Google
        // (e outros buscadores) descobrirem e indexarem as 249 páginas de
        // país mesmo sem nenhuma delas ter link direto na home (o mapa é só
        // SVG, não <a href>). As cidades (/pais/:cca2/:cidade) ficam de fora
        // por ora: são ~15x mais URLs e a maioria tem conteúdo quase idêntico
        // ao do país (mesmo texto de roteiro, ainda não tem dado próprio) —
        // melhor não diluir prioridade de rastreamento até essas páginas
        // terem conteúdo mais distinto.
        const countries = await getCountriesServerData();
        const countryUrls = countries
          .map(
            (c) => `  <url>
    <loc>${BASE_URL}/pais/${c.cca2.toLowerCase()}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${countryUrls}
</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
