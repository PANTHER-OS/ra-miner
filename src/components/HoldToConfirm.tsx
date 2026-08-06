import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2 } from "lucide-react";

interface Props {
  onConfirm: () => void;
  /** Tempo de pressão em ms */
  duration?: number;
  label?: string;
  holdingLabel?: string;
  doneLabel?: string;
  className?: string;
}

/**
 * Botão "segure para confirmar" — evita exclusões acidentais com um toque.
 * Anel de progresso + haptic feedback + estado de conclusão.
 */
export function HoldToConfirm({
  onConfirm,
  duration = 1400,
  label = "Segure para remover",
  holdingLabel = "Continue segurando…",
  doneLabel = "Removido",
  className = "",
}: Props) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const firedRef = useRef(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHolding(false);
    if (!firedRef.current) setProgress(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current;
    const p = Math.min(elapsed / duration, 1);
    setProgress(p);
    if (p >= 1) {
      if (!firedRef.current) {
        firedRef.current = true;
        setDone(true);
        setHolding(false);
        navigator.vibrate?.([12, 40, 24]);
        onConfirm();
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, onConfirm]);

  const start = () => {
    if (done || firedRef.current) return;
    navigator.vibrate?.(8);
    startRef.current = performance.now();
    setHolding(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const pct = Math.round(progress * 100);

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) start();
      }}
      onKeyUp={stop}
      onContextMenu={(e) => e.preventDefault()}
      disabled={done}
      aria-label={label}
      className={`group relative flex w-full select-none items-center justify-center gap-2 overflow-hidden rounded-xl border py-2.5 text-xs font-semibold transition-colors touch-none ${
        done
          ? "border-primary/50 bg-primary/15 text-primary"
          : holding
            ? "border-destructive/70 bg-destructive/10 text-destructive"
            : "border-border bg-surface/50 text-muted-foreground hover:border-destructive/50 hover:text-destructive"
      } ${className}`}
    >
      {/* Preenchimento de progresso */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-destructive/20 transition-none"
        style={{ width: `${done ? 100 : pct}%` }}
      />

      <span className="relative flex items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span
              key="done"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Check className="h-3.5 w-3.5" />
              {doneLabel}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {holding ? holdingLabel : label}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* Anel de progresso */}
      {!done && (
        <span
          aria-hidden
          className="relative ml-1 grid h-4 w-4 place-items-center"
          style={{ opacity: holding ? 1 : 0.35 }}
        >
          <svg viewBox="0 0 32 32" className="h-4 w-4 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              strokeWidth="5"
              className="stroke-current opacity-25"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-current"
              strokeDasharray={2 * Math.PI * 13}
              strokeDashoffset={2 * Math.PI * 13 * (1 - progress)}
            />
          </svg>
        </span>
      )}
    </button>
  );
}
