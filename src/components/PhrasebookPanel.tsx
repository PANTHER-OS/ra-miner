import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Volume2, Copy, Check, Info, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { Country } from "@/lib/countries";
import {
  activeCategories,
  CATEGORY_META,
  getPhrasebook,
  type PhraseCategory,
} from "@/lib/phrases";

export function PhrasebookPanel({ country }: { country: Country }) {
  const pb = useMemo(() => getPhrasebook(country), [country]);
  const cats = useMemo(() => activeCategories(pb), [pb]);
  const [active, setActive] = useState<PhraseCategory>(cats[0] ?? "saudacoes");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const phrases = pb.phrases[active] ?? [];

  const canSpeak =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = (text: string) => {
    if (!canSpeak) {
      toast("Áudio indisponível", { description: "Seu navegador não suporta síntese de voz." });
      return;
    }
    // Remove parenthesized romanization for cleaner TTS.
    const clean = text.replace(/\([^)]*\)/g, "").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = pb.bcp47;
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400);
    } catch {
      toast("Não deu pra copiar", { description: "Tente selecionar o texto manualmente." });
    }
  };

  return (
    <section className="mt-5">
      <header className="mb-3 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Aprenda uma frase
        </h3>
      </header>

      <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-primary/90">
          <Info className="h-3 w-3" />
          {pb.langName}
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] normal-case tracking-normal text-primary">
            {pb.bcp47}
          </span>
          {pb.fallback && (
            <span className="ml-auto rounded-full bg-muted/40 px-2 py-0.5 text-[9px] normal-case tracking-normal text-muted-foreground">
              inglês de apoio
            </span>
          )}
        </div>
        {pb.note && (
          <p className="mt-1 text-xs leading-relaxed text-foreground/85">{pb.note}</p>
        )}
      </div>

      {/* Category chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map((c) => {
          const meta = CATEGORY_META[c];
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                isActive
                  ? "border-primary/60 bg-primary/15 text-primary shadow-glow"
                  : "border-border bg-surface/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span className="text-sm leading-none">{meta.emoji}</span>
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Phrase list */}
      <AnimatePresence mode="wait">
        <motion.ul
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-2"
        >
          {phrases.map((p, i) => {
            const key = `${active}-${i}`;
            const copied = copiedKey === key;
            return (
              <motion.li
                key={key}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 + i * 0.04, duration: 0.35 }}
                className="rounded-xl border border-border bg-surface/40 p-3"
              >
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {p.pt}
                </div>
                <div className="mt-1 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-snug text-foreground">
                      {p.local}
                    </div>
                    <div className="mt-0.5 text-xs italic text-primary/90">
                      /{p.pron}/
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => speak(p.local)}
                      aria-label={`Ouvir "${p.pt}" em ${pb.langName}`}
                      disabled={!canSpeak}
                      className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => copy(p.local, key)}
                      aria-label="Copiar frase"
                      className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface/70 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                {p.tip && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/5 p-2 text-[11px] leading-relaxed text-foreground/85">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>
                      <span className="font-semibold text-primary">Dica: </span>
                      {p.tip}
                    </span>
                  </div>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}
