import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getCurrentFix, geoErrorMessage } from "@/lib/geoverify";

// Tela única de "pedido de permissão", mostrada na primeira visita — a
// localização é a ÚNICA permissão que o app usa em algum lugar (carimbo de
// viagem verificado por GPS, em StampPanel), então não faz sentido pedir
// depois, sem contexto, bem no meio de uma ação. Pedimos uma vez, de forma
// explicada e bonita, e nunca mais mostramos essa tela — nem quando a
// pessoa fecha o navegador, reinicia o aparelho, etc. (ver SEEN_KEY).
//
// Importante sobre "nunca mais pedir": depois que a pessoa toca em
// "Permitir" e aceita o prompt nativo do navegador, é o PRÓPRIO NAVEGADOR
// (não este app) que guarda essa decisão por site, permanentemente, nesse
// aparelho — é assim que toda permissão de site funciona; nenhum site
// consegue conceder permissão sozinho, nem pular o prompt nativo. Na
// prática já é o que o usuário quer: a próxima vez que o app pedir GPS
// (ao carimbar um país), o navegador libera na hora, sem perguntar de
// novo — só voltaria a perguntar se a própria pessoa resetar as
// permissões do site nas configurações do navegador.
const SEEN_KEY = "mef:permission-onboarding-seen-v1";

export function PermissionOnboarding() {
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    if (window.localStorage.getItem(SEEN_KEY)) return;
    // Pequeno atraso pra essa tela não brigar com a animação de entrada
    // do mapa — a pessoa vê o app carregando antes de qualquer pedido.
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  async function handleAllow() {
    setRequesting(true);
    try {
      await getCurrentFix();
      toast.success("Localização liberada", {
        description: "O navegador já guardou isso pra sempre neste aparelho — não vamos pedir de novo.",
      });
    } catch (err) {
      toast(geoErrorMessage(err), {
        description: "Sem problema — o resto do app funciona normal. Dá pra ativar depois, na hora de carimbar uma visita.",
      });
    } finally {
      setRequesting(false);
      dismiss();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Permissão de localização"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-7 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
                <MapPin className="h-6 w-6" />
              </span>
              <h2 className="text-lg font-semibold text-foreground">Antes de explorar</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pra confirmar um{" "}
                <strong className="font-semibold text-foreground">
                  carimbo de viagem por GPS
                </strong>{" "}
                quando você visita um país de verdade, o app precisa da sua
                localização — só nesse momento, nunca em segundo plano, e nada
                sai do seu aparelho.
              </p>
            </div>
            <div className="flex flex-col gap-2 px-5 pb-5 pt-4">
              <button
                onClick={handleAllow}
                disabled={requesting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {requesting ? "Só um instante..." : "Permitir localização"}
              </button>
              <button
                onClick={dismiss}
                className="rounded-xl py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Agora não, decido depois
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
