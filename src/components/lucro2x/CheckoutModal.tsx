import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X, Zap } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";
import { guarantee, pricing, programInfo } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { useCheckoutModal } from "@/lib/lucro2x/checkout-modal-context";

const EASE = [0.16, 1, 0.3, 1] as const;

// Trava o scroll do fundo enquanto o modal está aberto — `overflow:hidden`
// no body sozinho não segura o rubber-band/scroll do Safari no iOS quando
// o teclado abre. A técnica que funciona de verdade lá é tirar o body do
// fluxo de scroll (position: fixed), guardando a posição pra devolver
// exatamente onde estava ao fechar.
function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
      overflow: style.overflow,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

// Modal de checkout — usa os primitivos do Radix direto (não o wrapper
// components/ui/dialog.tsx) porque precisamos de `forceMount` +
// AnimatePresence pra controlar a animação de entrada/saída pelo
// framer-motion. Foco, ESC e clique fora continuam vindo do Radix; o
// scroll-lock do fundo é manual (ver useLockBodyScroll acima) porque o
// automático do Radix não é confiável no Safari/iOS.
//
// Estrutura importante: o X de fechar fica FORA da área que rola
// (overflow-y-auto é só na div de dentro) — antes ele tava dentro da
// área rolável e sumia de vista quando o campo de formulário focado
// puxava o scroll pra baixo, ficando impossível de tocar.
export function CheckoutModal() {
  const { isOpen, close } = useCheckoutModal();
  useLockBodyScroll(isOpen);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 flex items-end justify-center overscroll-contain bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <DialogPrimitive.Content asChild forceMount>
                  <motion.div
                    className="surface-card relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl shadow-[var(--shadow-panel)] focus:outline-none sm:max-h-[85dvh] sm:rounded-3xl"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.97 }}
                    transition={{ duration: 0.38, ease: EASE }}
                  >
                    <DialogPrimitive.Title className="sr-only">
                      Finalizar — {programInfo.name}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                      Formulário de pagamento via Pix
                    </DialogPrimitive.Description>

                    {/* Fixo em relação ao painel (não à área rolável) — sempre
                        visível e clicável, não importa o quanto a pessoa
                        role o formulário pra baixo. */}
                    <DialogPrimitive.Close className="absolute right-4 top-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-surface-elevated hover:text-foreground">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Fechar</span>
                    </DialogPrimitive.Close>

                    <div className="min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-8">
                      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {programInfo.name}
                      </p>
                      <div className="mt-2 flex flex-col items-center">
                        <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                          {formatBRL(pricing.fullPriceCents)}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 text-primary" strokeWidth={2} />À vista, via Pix
                        </span>
                      </div>

                      <div className="mt-7">
                        <CheckoutForm />
                      </div>

                      <p className="mx-auto mt-5 flex max-w-xs items-center gap-1.5 text-center text-xs text-muted-foreground">
                        <ShieldCheck
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          strokeWidth={1.75}
                        />
                        Garantia incondicional de {guarantee.days} dias — {guarantee.rule}.
                      </p>
                    </div>
                  </motion.div>
                </DialogPrimitive.Content>
              </motion.div>
            </DialogPrimitive.Overlay>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
