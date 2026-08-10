import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Toda seção que usa esse wrapper ganha a mesma entrada suave ao rolar —
// "once: true" pra não reanimar toda vez que a pessoa rola pra cima e
// desce de novo (mais fluido, menos repetitivo).
export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      className={cn("py-10 sm:py-14", className)}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={cn("mx-auto w-full max-w-4xl px-5 sm:px-8", containerClassName)}>
        {children}
      </div>
    </motion.section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}
