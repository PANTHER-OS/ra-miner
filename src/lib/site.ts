// Domínio canônico de produção — usado em qualquer lugar que precise de uma
// URL ABSOLUTA (sitemap, og:image, og:url...). Uma URL relativa nesses
// lugares não funciona: o sitemap.xml deixa de ser válido (crawlers exigem
// <loc> absoluta) e a prévia de link no WhatsApp/Twitter/Instagram não acha
// a imagem.
export const BASE_URL = "https://ra-miner.vercel.app";
