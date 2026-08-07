import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ExplorerPage } from "@/components/ExplorerPage";

// Layout sem caminho próprio (prefixo "_") — agrupa "/", "/pais/:cca2" e
// "/pais/:cca2/:cidade" (ver src/routes/_explorer/) sob UMA instância só de
// <ExplorerPage>. Sem isso, cada uma dessas três URLs teria seu próprio
// componente de página, e o mapa perderia zoom/posição toda vez que o
// usuário selecionasse outro país ou fechasse um painel — porque o React
// trataria isso como navegar pra uma página nova, não como mudar de estado
// dentro da mesma página. As rotas filhas não têm UI própria: só existem
// pra registrar a URL e gerar as meta tags certas por país/cidade (ver
// head() em cada uma).
export const Route = createFileRoute("/_explorer")({
  component: () => (
    <>
      <ExplorerPage />
      <Outlet />
    </>
  ),
});
