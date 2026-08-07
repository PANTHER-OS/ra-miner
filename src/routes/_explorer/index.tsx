import { createFileRoute } from "@tanstack/react-router";

// Visão do mundo, sem país selecionado — o conteúdo em si é o componente
// pai <ExplorerPage/> (ver src/routes/_explorer.tsx); esta rota só existe
// pra reivindicar a URL "/".
export const Route = createFileRoute("/_explorer/")({
  component: () => null,
});
