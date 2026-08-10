import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X, Zap } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";
import { guarantee, pricing, programInfo } from "@/lib/lucro2x/config";
import { formatBRL } from "@/lib/lucro2x/format";
import { useCheckoutModal } from "@/lib/lucro2x/checkout-modal-context";

const EASE = [0.16, 1, 0.3, 1] as const;

// Modal de checkout — usa os primitivos do Radix direto (não o wrapper
// components/ui/dialog.tsx) porque precisamos de `forceMount` +
// AnimatePresence pra controlar a animação de entrada/saída pelo
// framer-motion e não pelas classes CSS padrão do shadcn. Foco, ESC,
// clique fora e scroll-lock continuam de graça, vindo do Radix.
export function CheckoutModal() {
  const { isOpen, close } = useCheckoutModal();

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              />
            </DialogPrimitive.Overlay>

            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
              <DialogPrimitive.Content
                asChild
                forceMount
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <motion.div
                  className="surface-card relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 shadow-[var(--shadow-panel)] focus:outline-none sm:max-h-[85vh] sm:rounded-3xl sm:p-8"
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

                  <DialogPrimitive.Close className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </DialogPrimitive.Close>

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
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
                    Garantia incondicional de {guarantee.days} dias — {guarantee.rule}.
                  </p>
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
