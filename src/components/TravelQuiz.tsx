import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  X,
  ArrowLeft,
  Share2,
  Copy,
  RotateCcw,
  Sparkles,
  Check,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import {
  QUESTIONS,
  computeResults,
  buildShareText,
  type Answers,
  type QuizResult,
} from "@/lib/quiz";
import type { Country } from "@/lib/countries";
import { AnimatedCounter } from "./AnimatedCounter";

interface Props {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  onOpenCountry: (c: Country) => void;
}

type Phase = "quiz" | "calculating" | "results";

const CALC_MESSAGES = [
  "Cruzando suas respostas...",
  "Comparando com destinos do mundo todo...",
  "Lapidando o seu perfil...",
];

export function TravelQuiz({ open, onClose, countries, onOpenCountry }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>("quiz");
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [calcMsgIdx, setCalcMsgIdx] = useState(0);

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const progress = phase === "quiz" ? Math.round((step / total) * 100) : 100;

  const results: QuizResult[] = useMemo(
    () => (phase === "results" ? computeResults(answers, countries) : []),
    [phase, answers, countries],
  );
  // Ordem de revelação: 3º, 2º, 1º — suspense crescente até o melhor match.
  const podiumOrder = results.length === 3 ? [2, 1, 0] : results.map((_, i) => i);

  useEffect(() => {
    if (phase !== "calculating") return;
    const id = setInterval(() => {
      setCalcMsgIdx((i) => (i + 1) % CALC_MESSAGES.length);
    }, 550);
    const done = setTimeout(() => setPhase("results"), 1500);
    return () => {
      clearInterval(id);
      clearTimeout(done);
    };
  }, [phase]);

  useEffect(() => {
    if (!open) {
      // Reseta com um pequeno atraso pra não "piscar" o conteúdo durante o
      // fade de saída do modal.
      const t = setTimeout(() => {
        setStep(0);
        setAnswers({});
        setPhase("quiz");
        setPendingChoice(null);
        setCalcMsgIdx(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  function reset() {
    setStep(0);
    setDirection(1);
    setAnswers({});
    setPhase("quiz");
    setPendingChoice(null);
    setCalcMsgIdx(0);
  }

  function pick(idx: number) {
    if (pendingChoice !== null) return; // evita duplo toque durante a transição
    setPendingChoice(idx);
    const next = { ...answers, [q.id]: idx };
    setAnswers(next);
    setDirection(1);
    setTimeout(() => {
      if (step + 1 >= total) {
        setPhase("calculating");
      } else {
        setStep((s) => s + 1);
      }
      setPendingChoice(null);
    }, 380);
  }

  function back() {
    if (step === 0 || pendingChoice !== null) return;
    setDirection(-1);
    setStep((s) => s - 1);
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

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 36 : -36, filter: "blur(4px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -36 : 36, filter: "blur(4px)" }),
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            // max-h-[92dvh], não 92vh — no Safari do iPhone "vh" mede a
            // tela com a barra de endereço recolhida, não a altura
            // realmente visível; "dvh" acompanha o tamanho de verdade.
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            {/* Atmosfera de fundo — sutil, imersiva, não compete com o conteúdo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <motion.div
                className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-[0.14] blur-3xl"
                style={{ background: "radial-gradient(circle, oklch(0.82 0.14 78), transparent 70%)" }}
                animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full opacity-[0.12] blur-3xl"
                style={{ background: "radial-gradient(circle, oklch(0.55 0.14 240), transparent 70%)" }}
                animate={{ x: [0, -20, 0], y: [0, -14, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Top bar */}
            <div className="relative flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shadow-glow">
                  <Compass className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Compatibilidade
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phase === "quiz" ? step : phase}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-semibold text-foreground"
                    >
                      {phase === "results"
                        ? "Seus 3 destinos"
                        : phase === "calculating"
                          ? "Calculando..."
                          : `Pergunta ${step + 1} de ${total}`}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label="Fechar quiz"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progresso: barra + pontos por pergunta */}
            <div className="relative">
              <div className="h-1 w-full bg-border/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-amber-300"
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              {phase === "quiz" && (
                <div className="absolute inset-x-5 -bottom-1 flex justify-between">
                  {QUESTIONS.map((qq, i) => (
                    <span
                      key={qq.id}
                      className={`h-2 w-2 -translate-y-1/2 rounded-full border-2 border-surface transition-colors duration-300 ${
                        i <= step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto px-5 py-7">
              {phase === "quiz" && (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={q.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  >
                    <h2 className="mb-6 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                      {q.prompt}
                    </h2>
                    <div className="flex flex-col gap-2.5">
                      {q.choices.map((c, i) => {
                        const active = answers[q.id] === i;
                        const isPending = pendingChoice === i;
                        return (
                          <motion.button
                            key={i}
                            onClick={() => pick(i)}
                            disabled={pendingChoice !== null}
                            whileHover={pendingChoice === null ? { scale: 1.015 } : undefined}
                            whileTap={pendingChoice === null ? { scale: 0.985 } : undefined}
                            className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors duration-200 ${
                              isPending
                                ? "border-primary bg-primary/15 shadow-glow"
                                : active
                                  ? "border-primary bg-primary/10 shadow-glow"
                                  : "border-border bg-background/40 hover:border-primary/60 hover:bg-primary/5"
                            }`}
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-elevated text-xl">
                              {c.emoji}
                            </span>
                            <span className="flex-1 text-sm font-medium text-foreground">
                              {c.label}
                            </span>
                            <span className="grid h-5 w-5 shrink-0 place-items-center">
                              <AnimatePresence>
                                {isPending && (
                                  <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                    className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"
                                  >
                                    <Check className="h-3 w-3" strokeWidth={3} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {phase === "calculating" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[280px] flex-col items-center justify-center gap-5 text-center"
                >
                  <motion.span
                    className="grid h-16 w-16 place-items-center rounded-full border-2 border-primary/30 text-primary"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                  >
                    <Compass className="h-7 w-7" />
                  </motion.span>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={calcMsgIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      {CALC_MESSAGES[calcMsgIdx]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              )}

              {phase === "results" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
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
                    {results.map((r, i) => {
                      const revealIdx = podiumOrder.indexOf(i);
                      const isFirst = i === 0;
                      return (
                        <motion.button
                          key={r.profile.code}
                          onClick={() => openCountry(r.profile.code)}
                          initial={{ opacity: 0, y: 20, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: 0.15 + revealIdx * 0.22,
                            type: "spring",
                            stiffness: 260,
                            damping: 22,
                          }}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-colors duration-200 ${
                            isFirst
                              ? "border-primary/60 bg-primary/10 shadow-glow"
                              : "border-border bg-background/50 hover:border-primary/60 hover:bg-primary/5"
                          }`}
                        >
                          {isFirst && (
                            <motion.div
                              aria-hidden
                              className="pointer-events-none absolute inset-0"
                              style={{
                                background:
                                  "radial-gradient(ellipse 80% 60% at 0% 0%, oklch(0.82 0.14 78 / 0.14), transparent 70%)",
                              }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.15 + revealIdx * 0.22 + 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className="relative text-2xl">
                            {isFirst ? (
                              <Crown className="h-6 w-6 text-primary drop-shadow-[0_0_6px_oklch(0.82_0.14_78_/_0.6)]" />
                            ) : (
                              ["", "🥈", "🥉"][i]
                            )}
                          </span>
                          <img
                            src={`https://flagcdn.com/w80/${r.profile.code.toLowerCase()}.png`}
                            alt=""
                            className="relative mt-0.5 h-8 w-11 shrink-0 rounded object-cover ring-1 ring-border"
                            loading="lazy"
                          />
                          <div className="relative min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`truncate font-semibold text-foreground ${isFirst ? "text-lg" : "text-base"}`}
                              >
                                {r.profile.name}
                              </span>
                              <span
                                className={`flex shrink-0 items-baseline gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  isFirst
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/15 text-primary"
                                }`}
                              >
                                <AnimatedCounter value={r.matchPct} />%
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
                      );
                    })}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + 3 * 0.22 + 0.15, duration: 0.4 }}
                    className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground"
                  >
                    Cálculo por similaridade entre o seu perfil e destinos do
                    mundo todo, em até 11 dimensões (praia, montanha, cultura,
                    gastronomia, aventura, custo, clima, choque cultural e
                    mais). Toque num país para abrir o perfil, o roteiro de
                    24h e as frases locais.
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="relative flex items-center gap-2 border-t border-border/60 px-5 py-3">
              {phase === "quiz" && (
                <>
                  <button
                    onClick={back}
                    disabled={step === 0 || pendingChoice !== null}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition disabled:opacity-40 enabled:hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <div className="ml-auto text-[11px] text-muted-foreground">
                    Toque numa opção para avançar
                  </div>
                </>
              )}
              {phase === "calculating" && (
                <div className="mx-auto text-[11px] text-muted-foreground">
                  Só mais um instante...
                </div>
              )}
              {phase === "results" && (
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
