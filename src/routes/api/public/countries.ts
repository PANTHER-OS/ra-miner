import { createFileRoute } from "@tanstack/react-router";
import { getCountriesServerData } from "@/lib/countries-server";

export const Route = createFileRoute("/api/public/countries")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await getCountriesServerData();
          return new Response(JSON.stringify(data), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
