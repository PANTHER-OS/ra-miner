import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { checkout } from "@/lib/lucro2x/config";
import { trackEvent } from "@/lib/lucro2x/tracking";
import { cn } from "@/lib/utils";

// CTA único e reutilizado em toda a página — garante que todo botão de
// "entrar" aponta pro mesmo lugar (checkout.url em config.ts) e dispara o
// mesmo evento de rastreamento, então trocar o link do checkout é uma
// mudança de uma linha só, não uma caça a botão por botão.
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
      <a
        href={checkout.url}
        onClick={() => trackEvent("InitiateCheckout", { content_name: location })}
      >
        {children}
        <ArrowRight className="h-4 w-4" />
      </a>
    </Button>
  );
}
