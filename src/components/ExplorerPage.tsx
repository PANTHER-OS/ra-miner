import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { motion } from "framer-motion";
import { Globe2, Compass, User, Cloud } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";

import { fetchCountries, getPtName } from "@/lib/countries";
import type { Country } from "@/lib/countries";
import { WorldMap } from "@/components/WorldMap";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, type ViewMode } from "@/components/FilterBar";
import { CountryPanel } from "@/components/CountryPanel";
import { CityPanel } from "@/components/CityPanel";
import { MapSkeleton } from "@/components/CountrySkeleton";
import { TravelQuiz } from "@/components/TravelQuiz";
import { CompareTray } from "@/components/CompareTray";
import { CompareView } from "@/components/CompareView";
import { WishlistPanel } from "@/components/WishlistPanel";
import { AccountPanel } from "@/components/AccountPanel";
import { PassportStats } from "@/components/PassportStats";
import { usePassport, useAuthUser } from "@/lib/passport";
import type { PassportStatus } from "@/lib/passport";
import { findCityBySlug, slugifyCityName, type CityEntry, type CityWithCountry } from "@/lib/cities";

const MAX_COMPARE = 3;

// Página inteira do explorador — mora aqui (não direto numa rota) porque é
// compartilhada por TRÊS URLs diferentes ("/", "/pais/:cca2",
// "/pais/:cca2/:cidade"), todas nested sob o layout sem caminho próprio
// `_explorer` (ver src/routes/_explorer.tsx). Isso é o que permite trocar
// de país/cidade SEM remontar o mapa inteiro — se cada URL tivesse seu
// próprio componente de página, o WorldMap perderia zoom/posição toda vez
// que o usuário fechasse um painel ou clicasse noutro marcador, porque o
// React trataria como uma página totalmente nova.
export function ExplorerPage() {
  const { data: countries, isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
  });

  const navigate = useNavigate();
  // `strict: false` lê os params de QUALQUER rota da árvore atual — não
  // precisa saber se estamos em "/", "/pais/:cca2" ou "/pais/:cca2/:cidade".
  const params = useParams({ strict: false }) as { cca2?: string; cidade?: string };

  const [selected, setSelected] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityEntry | null>(null);
  const [focusCity, setFocusCity] = useState<{ lat: number; lng: number; nonce: number } | null>(
    null,
  );
  const [region, setRegion] = useState("all");
  const [view, setView] = useState<ViewMode>("all");
  const [quizOpen, setQuizOpen] = useState(false);
  const [compareList, setCompareList] = useState<Country[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const passport = usePassport();
  const authUser = useAuthUser();

  const verifiedSet = useMemo(
    () => new Set(Object.keys(passport.stamps ?? {})),
    [passport],
  );

  const statusMap = useMemo(() => {

    const m = new Map<string, PassportStatus>();
    for (const code of passport.visited) m.set(code, "visited");
    for (const code of passport.wishlist) if (!m.has(code)) m.set(code, "wishlist");
    return m;
  }, [passport]);

  // ---------- URL <-> estado ----------
  // Duas direções, cada uma só reage quando a OUTRA não foi a causa —
  // evita loop infinito entre "cliquei um país -> muda a URL" e
  // "a URL mudou -> seleciona o país".
  const syncingFromUrl = useRef(false);
  // Fica true depois que o efeito "URL -> estado" roda pela 1ª vez (assim
  // que `countries` carrega). Sem isso, entrar direto em /pais/de teria uma
  // corrida: no primeiro render `selected` ainda é null (o efeito URL->estado
  // só consegue rodar depois que `countries` chega, de forma assíncrona),
  // mas o efeito estado->URL abaixo já rodaria nesse mesmo primeiro render
  // vendo `selected === null` e mandaria de volta pra "/" — apagando o país
  // da URL antes mesmo dele ter a chance de ser aplicado.
  const hydratedFromUrl = useRef(false);

  // URL -> estado: entrar direto em /pais/de (link, busca do Google,
  // botão voltar/avançar) seleciona o país (e cidade, se houver) certo.
  useEffect(() => {
    if (!countries) return;
    const cca2 = params.cca2?.toUpperCase();
    if (!cca2) {
      if (selected) {
        syncingFromUrl.current = true;
        setSelected(null);
        setSelectedCity(null);
      }
      hydratedFromUrl.current = true;
      return;
    }
    if (selected?.cca2 !== cca2) {
      const country = countries.find((c) => c.cca2 === cca2);
      if (country) {
        syncingFromUrl.current = true;
        setSelected(country);
      }
    }
    if (params.cidade) {
      if (selectedCity?.name && slugifyCityName(selectedCity.name) === params.cidade) {
        hydratedFromUrl.current = true;
        return;
      }
      const city = findCityBySlug(cca2, params.cidade);
      if (city) {
        syncingFromUrl.current = true;
        setSelectedCity(city);
        setFocusCity({ lat: city.lat, lng: city.lng, nonce: Date.now() });
      }
    } else if (selectedCity) {
      syncingFromUrl.current = true;
      setSelectedCity(null);
    }
    hydratedFromUrl.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.cca2, params.cidade, countries]);

  // Estado -> URL: qualquer seleção feita na UI (busca, clique no mapa,
  // fechar painel...) atualiza o endereço pra refletir onde o usuário
  // está — o link fica sempre certo pra compartilhar ou recarregar.
  // `replace` (não `push`): navegar o mapa não deveria empilhar uma
  // entrada de histórico por clique, senão o botão "voltar" vira uma
  // lista de todo país que se passou o mouse por cima.
  useEffect(() => {
    if (syncingFromUrl.current) {
      syncingFromUrl.current = false;
      return;
    }
    // Ainda não tentamos ler a URL nem uma vez (ver comentário no ref acima)
    // — não faça nada até lá, ou uma /pais/:cca2 carregada direto seria
    // revertida pra "/" antes do país ser selecionado.
    if (!hydratedFromUrl.current) return;
    if (!selected) {
      if (params.cca2) navigate({ to: "/", replace: true });
      return;
    }
    const cca2 = selected.cca2.toLowerCase();
    if (selectedCity) {
      const slug = slugifyCityName(selectedCity.name);
      if (params.cca2?.toLowerCase() !== cca2 || params.cidade !== slug) {
        navigate({ to: "/pais/$cca2/$cidade", params: { cca2, cidade: slug }, replace: true });
      }
    } else if (params.cca2?.toLowerCase() !== cca2 || params.cidade) {
      navigate({ to: "/pais/$cca2", params: { cca2 }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, selectedCity]);

  // Referência estável: evita que o mapa (memoizado) perca o memo e
  // reconstrua tudo sempre que a Home re-renderiza por um motivo que não
  // tem nada a ver com o mapa (abrir o quiz, trocar filtro, etc.).
  const handleSelectCountry = useCallback((c: Country | null) => setSelected(c), []);
  const handleClosePanel = useCallback(() => setSelected(null), []);

  // Cidade escolhida dentro do painel do país ("Principais cidades") — o
  // país já está selecionado nesse fluxo, então só focamos a cidade.
  const handleSelectCity = useCallback((city: CityEntry) => {
    setSelectedCity(city);
    setFocusCity({ lat: city.lat, lng: city.lng, nonce: Date.now() });
  }, []);

  // Cidade escolhida direto no mapa — agora os marcadores aparecem sozinhos
  // conforme o zoom, então a cidade pode ser de um país diferente do que
  // estava selecionado (ou nenhum). Resolve o país certo pelo código.
  const handleSelectCityFromMap = useCallback(
    (city: CityWithCountry) => {
      const country = countries?.find((c) => c.cca2 === city.cca2) ?? null;
      if (country) setSelected(country);
      setSelectedCity(city);
      setFocusCity({ lat: city.lat, lng: city.lng, nonce: Date.now() });
    },
    [countries],
  );

  // Cidade escolhida na busca — pode vir sem o país ainda selecionado.
  const handlePickCity = useCallback((city: CityWithCountry, country: Country) => {
    setSelected(country);
    setSelectedCity(city);
    setFocusCity({ lat: city.lat, lng: city.lng, nonce: Date.now() });
  }, []);

  const handleCloseCityPanel = useCallback(() => setSelectedCity(null), []);

  // Marca/desmarca um país pra comparação lado a lado (botão de balança no
  // CountryPanel) — até 3 por vez, o suficiente pra caber numa tela sem
  // virar planilha, e já dá pra decidir entre as opções que sobraram.
  const toggleCompare = useCallback((c: Country) => {
    setCompareList((prev) => {
      if (prev.some((p) => p.cca2 === c.cca2)) return prev.filter((p) => p.cca2 !== c.cca2);
      if (prev.length >= MAX_COMPARE) {
        toast(`Só dá pra comparar até ${MAX_COMPARE} países por vez`, {
          description: "Remova um da lista pra adicionar outro.",
        });
        return prev;
      }
      return [...prev, c];
    });
  }, []);
  const removeFromCompare = useCallback((cca2: string) => {
    setCompareList((prev) => prev.filter((p) => p.cca2 !== cca2));
  }, []);
  // Ver o perfil completo a partir da comparação: fecha a comparação e abre
  // o painel do país, com o mesmo pequeno atraso usado no quiz — evita as
  // duas transições (fechar modal, abrir painel) brigando na mesma animação.
  const openCountryFromCompare = useCallback((c: Country) => {
    setCompareOpen(false);
    setTimeout(() => setSelected(c), 250);
  }, []);

  return (
    <div className="min-h-screen">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.23 0.025 260)",
            color: "oklch(0.96 0.01 90)",
            border: "1px solid oklch(0.3 0.02 260 / 0.6)",
          },
        }}
      />

      {/* Header */}
      <header className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-6 sm:px-8 sm:pt-8 lg:pt-10">
        <div className="flex items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface/70 text-primary shadow-glow">
              <Globe2 className="h-5 w-5 animate-pulse-glow" />
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Explorador global
              </div>
              <h1 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
                Atl<span className="gold-text">oura</span>
              </h1>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAccountOpen(true)}
              title={authUser ? authUser.email ?? "Conta" : "Fazer login"}
              className={`grid h-8 w-8 place-items-center rounded-full border transition sm:h-9 sm:w-9 ${
                authUser
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border bg-surface/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {authUser ? <Cloud className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setQuizOpen(true)}
              className="group flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 sm:px-3.5 sm:py-2"
            >
              <Compass className="h-3.5 w-3.5 transition group-hover:rotate-12" />
              <span className="hidden xs:inline">Quiz</span>
              <span className="xs:hidden">Quiz</span>
              <span className="hidden sm:inline">de compatibilidade</span>
            </button>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              {countries ? (
                <>
                  <span className="font-semibold text-foreground">{countries.length}</span>{" "}
                  países
                </>
              ) : (
                "carregando..."
              )}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="max-w-xl"
        >
          <SearchBar
            countries={countries ?? []}
            onPick={handleSelectCountry}
            onPickCity={handlePickCity}
          />
        </motion.div>

        <FilterBar
          region={region}
          onRegion={setRegion}
          view={view}
          onView={setView}
        />
      </header>

      {/* Main */}
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        {countries && (
          <PassportStats countries={countries} onOpenWishlist={() => setWishlistOpen(true)} />
        )}

        {isLoading || !countries ? (
          <MapSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            // z-index acima do backdrop do painel de país (z-40) e abaixo dos
            // próprios painéis (z-50 / z-[55]): o mapa continua vivo e
            // clicável — inclusive os marcadores de cidade — mesmo com o
            // painel lateral aberto, em vez de ficar bloqueado atrás do véu.
            className="relative z-[45]"
          >
            <WorldMap
              countries={countries}
              selectedCode={selected?.cca2 ?? null}
              onSelect={handleSelectCountry}
              onSelectCity={handleSelectCityFromMap}
              focusCity={focusCity}
              filterRegion={region}
              statusMap={statusMap}
              verifiedSet={verifiedSet}
              viewMode={view}

            />
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground/70">
          Dados abertos de países · seu passaporte fica salvo só neste aparelho
        </p>
      </main>

      <CountryPanel
        country={selectedCity ? null : selected}
        onClose={handleClosePanel}
        onOpenCity={handleSelectCity}
        compareList={compareList}
        onToggleCompare={toggleCompare}
      />

      <CityPanel city={selectedCity} country={selected} onClose={handleCloseCityPanel} />

      <TravelQuiz
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        countries={countries ?? []}
        onOpenCountry={handleSelectCountry}
      />

      <CompareTray
        countries={compareList}
        onOpen={() => setCompareOpen(true)}
        onRemove={removeFromCompare}
        onClear={() => setCompareList([])}
      />
      <CompareView
        open={compareOpen}
        countries={compareList}
        onClose={() => setCompareOpen(false)}
        onRemove={removeFromCompare}
        onOpenCountry={openCountryFromCompare}
      />

      <WishlistPanel
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        countries={countries ?? []}
        onOpenCountry={handleSelectCountry}
      />

      <AccountPanel
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={authUser}
      />
    </div>
  );
}
