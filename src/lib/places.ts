// Lugares povoados (cidades e vilas com mais de ~15 mil habitantes) por país
// — GeoNames (CC BY 4.0) com os nomes em português do Natural Earth quando
// existem; pré-processado em public/places/{cca2}.json (um arquivo por país,
// baixado só quando alguém abre o card de um estado/província dele). Cada
// lugar: [nome, lat, lng, população, capital] onde capital é 2 = capital do
// país, 1 = sede de estado/província, 0 = outros.
export interface Place {
  name: string;
  lat: number;
  lng: number;
  pop: number;
  capital: 0 | 1 | 2;
}

type Raw = [string, number, number, number, 0 | 1 | 2][];
const cache = new Map<string, Promise<Place[]>>();

export function getPlacesForCountry(cca2: string): Promise<Place[]> {
  const key = cca2.toLowerCase();
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/places/${key}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Raw>) : []))
      .then((raw) => raw.map(([name, lat, lng, pop, capital]) => ({ name, lat, lng, pop, capital })))
      .catch(() => {
        cache.delete(key); // tenta de novo na próxima abertura
        return [] as Place[];
      });
    cache.set(key, p);
  }
  return p;
}
