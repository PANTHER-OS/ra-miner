import { programInfo } from "@/lib/lucro2x/config";

export function Footer() {
  return (
    <footer className="border-t border-border/60 px-5 py-10 pb-24 sm:px-8 sm:pb-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <p className="text-sm font-medium text-foreground/80">{programInfo.name}</p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Esta página apresenta uma oferta de lançamento associada à transmissão do dia 11 de
          agosto. Condições, preço, prazos e política de garantia podem ser ajustados até a
          confirmação final da oferta.
        </p>
      </div>
    </footer>
  );
}
