import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Slot de imagem oficial. Enquanto `src` não for passado, mostra um bloco
// com borda tracejada e o texto placeholder — nunca uma foto/logo real
// "puxada" de outro site. Assim que o arquivo oficial autorizado existir,
// basta passar `src` (ex.: de /public) que o placeholder some sozinho.
export function PlaceholderImage({
  label = "[INSERIR IMAGEM OFICIAL AQUI]",
  src,
  alt = "",
  className,
  aspect = "aspect-[4/5]",
}: {
  label?: string;
  src?: string;
  alt?: string;
  className?: string;
  aspect?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(aspect, "w-full rounded-2xl object-cover", className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        aspect,
        "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/60 px-6 text-center",
        className,
      )}
    >
      <ImageOff className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
