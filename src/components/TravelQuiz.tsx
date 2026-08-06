import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, X, ArrowLeft, ArrowRight, Share2, Copy, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  QUESTIONS,
  computeResults,
  buildShareText,
  type Answers,
  type QuizResult,
} from "@/lib/quiz";
import type { Country } from "@/lib/countries";

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  onOpenCountry: (c: Country) => void;
}

export function TravelQuiz({ open, onClose, countries, onOpenCountry }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const progress = finished ? 100 : Math.round((step / total) * 100);

  const results: QuizResult[] = useMemo(
    () => (finished ? computeResults(answers) : []),
    [finished, answers],
  );

  function reset() {
    setStep(0);
    setAnswers({});
    setFinished(false);
  }

  function pick(idx: number) {
    const next = { ...answers, [q.id]: idx };
    setAnswers(next);
    if (step + 1 >= total) {
      setFinished(true);
    } else {
      setStep(step + 1);
    }
  }

  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  async function share() {
    const text = buildShareText(results);
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const full = `${text}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mundo em Foco", text: full });
        return;
      } catch {
        /* fallthrough */
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Resultado copiado!");
    } catch {
      toast.error("Não consegui copiar 😥");
    }
  }

  function openCountry(code: string) {
    const c = countries.find((x) => x.cca2 === code);
    if (c) {
      onClose();
      setTimeout(() => onOpenCountry(c), 250);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Compass className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Compatibilidade
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {finished ? "Seus 3 destinos" : `Pergunta ${step + 1} de ${total}`}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                aria-label="Fechar quiz"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="h-1 w-full bg-border/50">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-amber-300"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {!finished ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h2 className="mb-5 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                      {q.prompt}
                    </h2>
                    <div className="flex flex-col gap-2.5">
                      {q.choices.map((c, i) => {
                        const active = answers[q.id] === i;
                        return (
                          <button
                            key={i}
                            onClick={() => pick(i)}
                            className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                              active
                                ? "border-primary bg-primary/10 shadow-glow"
                                : "border-border bg-background/40 hover:border-primary/60 hover:bg-primary/5"
                            }`}
                          >
                            <span className="text-2xl">{c.emoji}</span>
                            <span className="flex-1 text-sm font-medium text-foreground">
                              {c.label}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mb-4 flex items-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                      Match do seu perfil
                    </span>
                  </div>
                  <h2 className="mb-5 text-2xl font-semibold text-foreground">
                    Seus 3 destinos ideais
                  </h2>

                  <div className="flex flex-col gap-3">
                    {results.map((r, i) => (
                      <motion.button
                        key={r.profile.code}
                        onClick={() => openCountry(r.profile.code)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="group flex items-start gap-3 rounded-2xl border border-border bg-background/50 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
                      >
                        <span className="text-2xl">
                          {["🥇", "🥈", "🥉"][i]}
                        </span>
                        <img
                          src={`https://flagcdn.com/w80/${r.profile.code.toLowerCase()}.png`}
                          alt=""
                          className="mt-0.5 h-8 w-11 rounded object-cover ring-1 ring-border"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-base font-semibold text-foreground">
                              {r.profile.name}
                            </span>
                            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              {r.matchPct}% match
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-snug text-muted-foreground">
                            {r.profile.tagline}
                          </p>
                          <span className="mt-1 inline-block text-[11px] text-primary/80 opacity-0 transition group-hover:opacity-100">
                            Ver perfil completo →
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground">
                    Cálculo baseado em 8 dimensões (praia, montanha, cultura,
                    gastronomia, aventura, custo, clima e choque cultural). Toque
                    num país para abrir o perfil, o roteiro de 24h e as frases
                    locais.
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-border/60 px-5 py-3">
              {!finished ? (
                <>
                  <button
                    onClick={back}
                    disabled={step === 0}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition disabled:opacity-40 enabled:hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <div className="ml-auto text-[11px] text-muted-foreground">
                    Toque numa opção para avançar
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Refazer
                  </button>
                  <button
                    onClick={share}
                    className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
                  >
                    {typeof navigator !== "undefined" && "share" in navigator ? (
                      <Share2 className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Compartilhar
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
