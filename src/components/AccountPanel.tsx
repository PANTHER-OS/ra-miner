import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, LogOut, Cloud, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { signInWithEmail, signOutAccount, type AuthUser } from "@/lib/passport";

interface Props {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
}

// Conta é 100% opcional — sem ela o app funciona igual, só localStorage
// (ver comentário no topo de lib/passport.ts). Login por link mágico (só
// e-mail, sem senha) porque é a forma mais simples de não ter que lidar
// com "esqueci minha senha" num app pequeno como este.
export function AccountPanel({ open, onClose, user }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    const { error } = await signInWithEmail(email.trim());
    setSending(false);
    if (error) {
      toast.error("Não deu pra enviar o link", { description: error });
      return;
    }
    setSent(true);
  }

  function handleClose() {
    // Reseta o formulário com atraso pra não piscar durante o fade de saída.
    setTimeout(() => {
      setSent(false);
      setEmail("");
    }, 300);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary shadow-glow">
                  <Cloud className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Conta
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {user ? "Sincronizado" : "Fazer login"}
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Seu passaporte está salvo na nuvem — abra de qualquer aparelho.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await signOutAccount();
                      toast("Você saiu da conta", {
                        description: "Seu passaporte continua salvo neste aparelho.",
                      });
                      handleClose();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface/50 py-2.5 text-xs font-semibold text-foreground/85 transition hover:border-destructive/50 hover:text-destructive"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da conta
                  </button>
                </div>
              ) : sent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
                    <Send className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-foreground">Link enviado!</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Abra seu e-mail e toque no link pra entrar — não precisa de senha nenhuma.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex flex-col gap-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Faça login pra salvar seu passaporte na nuvem e acessar de qualquer
                    aparelho. Sem senha — só um link no seu e-mail.
                  </p>
                  <label className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Enviar link de login
                  </button>
                  <p className="text-[10px] leading-relaxed text-muted-foreground/70">
                    Sem login, seu passaporte continua salvo só neste aparelho — normal.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
