import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCPF,
  formatPhone,
  isValidCPF,
  isValidEmail,
  isValidPhone,
} from "@/lib/lucro2x/validation";
import type { PixChargeResult } from "@/lib/lucro2x/payment/types";

type Status = "form" | "submitting" | "success" | "not_configured" | "error";

type FormState = { fullName: string; cpf: string; email: string; phone: string };

const initialForm: FormState = { fullName: "", cpf: "", email: "", phone: "" };

// No iOS, a barra de sugestão do teclado (QuickType) some por cima do
// campo se a página/modal não rolar o campo pra cima dela — o navegador
// só garante isso sozinho quando não há um scroll container aninhado
// (que é exatamente o caso aqui, dentro do modal). Rola manualmente
// depois que o teclado termina de abrir.
function scrollFieldIntoView(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);
}

function fieldErrors(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
    errors.fullName = "Digite nome e sobrenome.";
  }
  if (!isValidCPF(form.cpf)) errors.cpf = "CPF inválido.";
  if (!isValidEmail(form.email)) errors.email = "E-mail inválido.";
  if (!isValidPhone(form.phone)) errors.phone = "Telefone inválido.";
  return errors;
}

export function CheckoutForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [status, setStatus] = useState<Status>("form");
  const [charge, setCharge] = useState<PixChargeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const errors = fieldErrors(form);
  const isValid = Object.keys(errors).length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, cpf: true, email: true, phone: true });
    if (!isValid) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/lucro2x/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.status === 503 && data.error === "not_configured") {
        setStatus("not_configured");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setCharge(data.charge);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {status === "success" && charge ? (
        <Step key="success">
          <PixResult
            charge={charge}
            copied={copied}
            onCopy={() => copyCode(charge.copyPasteCode, setCopied)}
          />
        </Step>
      ) : status === "not_configured" ? (
        <Step key="not_configured">
          <StateCard
            icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.75} />}
            title="Pagamento ainda não está ativo"
            message="Essa etapa está pronta, mas o Pix ainda não foi conectado — assim que a chave for configurada, o pagamento libera automaticamente aqui, sem precisar mudar nada nessa tela."
          />
        </Step>
      ) : status === "error" ? (
        <Step key="error">
          <StateCard
            icon={<TriangleAlert className="h-5 w-5" strokeWidth={1.75} />}
            title="Não deu pra gerar o Pix agora"
            message="Algo falhou do nosso lado. Tenta de novo em alguns instantes."
            action={
              <Button variant="outline" onClick={() => setStatus("form")}>
                Tentar novamente
              </Button>
            }
          />
        </Step>
      ) : (
        <Step key="form">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Nome completo" error={touched.fullName ? errors.fullName : undefined}>
              <Input
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                onFocus={scrollFieldIntoView}
                placeholder="Seu nome completo"
              />
            </Field>

            <Field label="CPF" error={touched.cpf ? errors.cpf : undefined}>
              <Input
                inputMode="numeric"
                autoComplete="off"
                value={formatCPF(form.cpf)}
                onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, cpf: true }))}
                onFocus={scrollFieldIntoView}
                placeholder="000.000.000-00"
              />
            </Field>

            <Field label="E-mail" error={touched.email ? errors.email : undefined}>
              <Input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                onFocus={scrollFieldIntoView}
                placeholder="voce@email.com"
              />
            </Field>

            <Field label="Telefone / WhatsApp" error={touched.phone ? errors.phone : undefined}>
              <Input
                inputMode="numeric"
                autoComplete="tel"
                value={formatPhone(form.phone)}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                onFocus={scrollFieldIntoView}
                placeholder="(11) 91234-5678"
              />
            </Field>

            <Button
              type="submit"
              disabled={status === "submitting"}
              className="mt-2 h-auto w-full justify-center rounded-full bg-[image:var(--gradient-gold)] py-3.5 text-base font-semibold text-primary-foreground hover:brightness-110"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando Pix…
                </>
              ) : (
                "Gerar QR Code Pix"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Seus dados são usados só pra gerar essa cobrança — nada é compartilhado com terceiros
              além do processador de pagamento.
            </p>
          </form>
        </Step>
      )}
    </AnimatePresence>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StateCard({
  icon,
  title,
  message,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
        {icon}
      </span>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

async function copyCode(code: string, setCopied: (v: boolean) => void) {
  try {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    // clipboard indisponível (ex.: contexto não-seguro) — segue sem travar a UI
  }
}

function PixResult({
  charge,
  copied,
  onCopy,
}: {
  charge: PixChargeResult;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <motion.div
        className="rounded-2xl border border-border bg-white p-3"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={`data:image/png;base64,${charge.qrCodeBase64}`}
          alt="QR Code Pix"
          className="h-52 w-52"
        />
      </motion.div>

      <p className="max-w-xs text-sm text-muted-foreground">
        Escaneie o QR Code no app do seu banco, ou copie o código abaixo e cole na área "Pix Copia e
        Cola".
      </p>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <code className="flex-1 truncate text-left text-xs text-muted-foreground">
            {charge.copyPasteCode}
          </code>
          <Button type="button" size="sm" variant="secondary" onClick={onCopy} className="shrink-0">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        O pagamento é confirmado automaticamente assim que cair no banco — normalmente em segundos.
      </p>
    </div>
  );
}
