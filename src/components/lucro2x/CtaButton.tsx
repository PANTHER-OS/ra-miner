import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCheckoutModal } from "@/lib/lucro2x/checkout-modal-context";
import { trackEvent } from "@/lib/lucro2x/tracking";
import { cn } from "@/lib/utils";

const MotionButton = motion.create(Button);

// CTA único e reutilizado em toda a página — todo botão de "entrar" abre
// o modal de checkout (ver CheckoutModal.tsx), dispara o mesmo evento de
// rastreamento, e tem a mesma micro-interação de hover/tap em todo lugar.
export function CtaButton({
  children,
  location,
  size = "lg",
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  /** de onde o clique veio, pra diferenciar CTAs no rastreamento (ex.: "hero", "oferta") */
  location: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const { open } = useCheckoutModal();

  return (
    <MotionButton
      type="button"
      size={size}
      variant={variant}
      onClick={() => {
        trackEvent("InitiateCheckout", { content_name: location });
        open();
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        variant === "default" &&
          "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110",
        "h-auto rounded-full px-8 py-4 text-base font-semibold tracking-tight",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </MotionButton>
  );
}
