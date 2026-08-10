import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { trackEvent } from "@/lib/lucro2x/tracking";
import { cn } from "@/lib/utils";

const MotionLink = motion(Link);

// CTA único e reutilizado em toda a página — todo botão de "entrar" leva
// pra /lucro2x/checkout (rota interna, ver routes/lucro2x.checkout.tsx),
// dispara o mesmo evento de rastreamento, e tem a mesma micro-interação de
// hover/tap em todo lugar.
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
  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn(
        variant === "default" &&
          "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110",
        "h-auto rounded-full px-8 py-4 text-base font-semibold tracking-tight",
        className,
      )}
    >
      <MotionLink
        to="/lucro2x/checkout"
        onClick={() => trackEvent("InitiateCheckout", { content_name: location })}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {children}
        <ArrowRight className="h-4 w-4" />
      </MotionLink>
    </Button>
  );
}
