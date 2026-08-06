import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Crosshair, Loader2, MapPin, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import type { Country } from "@/lib/countries";
import { getPtName } from "@/lib/countries";
import { removeStamp, saveStamp, updateStampNote, usePassport } from "@/lib/passport";
import { geoErrorMessage, reverseCity, verifyPresence } from "@/lib/geoverify";
import { HoldToConfirm } from "./HoldToConfirm";


interface Props {
  country: Country;
}

export function StampPanel({ country }: Props) {
  const passport = usePassport();
  const stamp = passport.stamps?.[country.cca2];
  const declared = passport.visited.includes(country.cca2) && !stamp;

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(stamp?.note ?? "");
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    setNote(stamp?.note ?? "");
    setShowNote(false);
  }, [country.cca2, stamp?.at]);

  const handleStamp = async () => {
    setBusy(true);
    try {
      const result = await verifyPresence(country.ccn3);

      if (!result.ok) {
        if (result.reason === "accuracy") {
          toast.error("Sinal de GPS fraco", {
            description: `Precisão de ~${Math.round(result.fix.accuracy)} m. Vá para um lugar aberto e tente de novo.`,
          });
        } else if (result.reason === "outside") {
          toast.error("Você não está aqui agora", {
            description: `Seu GPS aponta para ${result.matchedName ?? "outro país"}. O carimbo só vale no local.`,
          });
        } else {
          toast.error("Não identifiquei o país da sua posição", {
            description: "Tente novamente em alguns instantes.",
          });
        }
        return;
      }

      const city = await reverseCity(result.fix.lat, result.fix.lng);
      saveStamp(country.cca2, {
        at: new Date().toISOString(),
        lat: Number(result.fix.lat.toFixed(4)),
        lng: Number(result.fix.lng.toFixed(4)),
        accuracy: Math.round(result.fix.accuracy),
        city,
      });
      toast.success(`${getPtName(country)} verificado ✓`, {
        description: city ? `Carimbo confirmado em ${city}.` : "Carimbo confirmado no local.",
      });
    } catch (err) {
      toast.error("Não deu para carimbar", { description: geoErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const saveNote = () => {
    updateStampNote(country.cca2, note.trim());
    setShowNote(false);
    toast("Anotação salva no diário");
  };

  return (
    <section className="mt-5">
      <header className="mb-3 flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Carimbo verificado
        </h3>
      </header>

      <AnimatePresence mode="wait">
        {stamp ? (
          <motion.div
            key="stamped"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative overflow-hidden rounded-2xl border border-primary/45 bg-primary/10 p-4"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border-2 border-dashed border-primary/30"
            />
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/60 bg-primary/20 text-primary shadow-glow">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Presença confirmada por GPS
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(stamp.at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  {stamp.city ? ` · ${stamp.city}` : ""} · ±{stamp.accuracy} m
                </p>
                {stamp.note && !showNote && (
                  <p className="mt-2 rounded-lg border border-border bg-surface/50 p-2 text-xs italic leading-relaxed text-foreground/85">
                    “{stamp.note}”
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showNote && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={240}
                    rows={3}
                    placeholder="O que marcou esse dia?"
                    className="mt-3 w-full resize-none rounded-xl border border-border bg-surface/60 p-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60"
                  />
                  <button
                    onClick={saveNote}
                    className="mt-2 w-full rounded-xl bg-primary py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Salvar anotação
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-3 space-y-2">
              <button
                onClick={() => setShowNote((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface/50 py-2 text-xs font-medium text-foreground/85 transition-colors hover:border-primary/50 hover:text-primary"
              >
                <NotebookPen className="h-3.5 w-3.5" />
                {stamp.note ? "Editar anotação" : "Adicionar anotação"}
              </button>

              <HoldToConfirm
                label="Segure para remover o carimbo"
                holdingLabel="Continue segurando para apagar…"
                doneLabel="Carimbo removido"
                onConfirm={() => {
                  removeStamp(country.cca2);
                  toast("Carimbo removido", {
                    description: `${getPtName(country)} continua marcado como visitado.`,
                  });
                }}
              />
              <p className="text-center text-[10px] leading-relaxed text-muted-foreground/80">
                Carimbo verificado é permanente até você segurar o botão — nada se apaga por um
                toque sem querer.
              </p>
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-surface/40 p-4"
          >
            <p className="text-sm leading-relaxed text-foreground/85">
              {declared ? (
                <>
                  Marcado como <span className="font-semibold text-foreground">declarado</span>.
                  Estando em {getPtName(country)}, carimbe pelo GPS para virar{" "}
                  <span className="font-semibold text-primary">verificado</span>.
                </>
              ) : (
                <>
                  O carimbo só é liberado quando o GPS confirma que você está mesmo em{" "}
                  {getPtName(country)}.
                </>
              )}
            </p>

            <button
              onClick={handleStamp}
              disabled={busy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Localizando você…
                </>
              ) : (
                <>
                  <Crosshair className="h-4 w-4" />
                  Carimbar aqui
                </>
              )}
            </button>

            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
              Sua localização é comparada com o mapa no próprio aparelho e nunca sai dele.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
