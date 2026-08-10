import { createContext, useCallback, useContext, useMemo, useState } from "react";

type CheckoutModalState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CheckoutModalContext = createContext<CheckoutModalState | null>(null);

// Estado do modal de checkout, compartilhado por todo botão de CTA da
// página (hero, oferta, CTA final, barra fixa mobile…) — um Provider só,
// lá no topo de <Lucro2xPage>, então qualquer CtaButton em qualquer seção
// abre o MESMO modal.
export function CheckoutModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <CheckoutModalContext.Provider value={value}>{children}</CheckoutModalContext.Provider>;
}

export function useCheckoutModal() {
  const ctx = useContext(CheckoutModalContext);
  if (!ctx) {
    throw new Error("useCheckoutModal precisa estar dentro de <CheckoutModalProvider>");
  }
  return ctx;
}
