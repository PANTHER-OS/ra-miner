import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Check, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES } from "@/lib/i18n/locales";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Primeira seção de Configurações: idioma. O painel em si já nasce pronto
// pra crescer (mais seções depois — ver settingsMoreSoon) sem precisar
// refazer a estrutura, mesmo padrão visual do AccountPanel (bottom sheet
// no celular, modal centralizado no desktop) pra ficar consistente com o
// resto do app.
export function SettingsPanel({ open, onClose }: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-4"
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
            className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:max-h-[85vh] sm:rounded-3xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shadow-glow">
                  <Settings className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {t("settingsTitle")}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {t("settingsSubtitle")}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex items-center gap-2 px-0.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("settingsLanguageSection")}
                </h2>
              </div>
              <p className="mt-1.5 px-0.5 text-xs leading-relaxed text-muted-foreground/80">
                {t("settingsLanguageHint")}
              </p>

              <div className="mt-3.5 grid grid-cols-2 gap-1.5">
                {LOCALES.map((l) => {
                  const active = l.code === locale;
                  return (
                    <button
                      key={l.code}
                      onClick={() => setLocale(l.code)}
                      dir={l.rtl ? "rtl" : "ltr"}
                      aria-pressed={active}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/70 bg-background/40 text-foreground/85 hover:border-primary/30 hover:bg-surface/70"
                      }`}
                    >
                      <span className="text-base leading-none" aria-hidden="true">
                        {l.flag}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{l.nativeName}</span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-border/60 px-3.5 py-3 text-center text-[11px] text-muted-foreground/70">
                {t("settingsMoreSoon")}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
