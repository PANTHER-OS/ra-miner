import type { SpecialDate } from "../types";

/** Verifica se `when` cai dentro da janela de alguma data especial cadastrada. */
export function matchSpecialDate(when: number, specialDates: SpecialDate[]): SpecialDate | undefined {
  const d = new Date(when);
  return specialDates.find((sd) => isWithinWindow(d, sd));
}

function isWithinWindow(d: Date, sd: SpecialDate): boolean {
  const year = d.getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const target = new Date(y, sd.month - 1, sd.day);
    const diffDays = Math.abs((d.getTime() - target.getTime()) / 86_400_000);
    if (diffDays <= sd.windowDays) return true;
  }
  return false;
}

const RELATIVE_DATE_TERMS = [
  "hoje",
  "amanhã",
  "amanha",
  "essa semana",
  "nesta semana",
  "hoje à noite",
  "hoje a noite",
  "agora",
  "neste momento",
];

const EXPLICIT_DATE_RE = /\b([0-3]?\d)[\/.\-]([01]?\d)(?:[\/.\-]\d{2,4})?\b/;

/** Sinal fraco: a mensagem menciona uma data concreta (relativa ou explícita)? */
export function mentionsConcreteDate(text: string): boolean {
  const lower = text.toLowerCase();
  if (RELATIVE_DATE_TERMS.some((t) => lower.includes(t))) return true;
  return EXPLICIT_DATE_RE.test(lower);
}
