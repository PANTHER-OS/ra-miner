import { useEffect, useState } from "react";
import { offerWindow } from "@/lib/lucro2x/config";

function getRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// Contador regressivo real, ligado a `offerWindow.deadlineISO` (ver
// config.ts). Se o prazo não estiver definido — ou já tiver passado — o
// componente não renderiza nada. Isso é proposital: a página nunca deve
// simular um prazo que não existe de verdade.
export function Countdown() {
  const deadline = offerWindow.deadlineISO;
  const [remaining, setRemaining] = useState(() => (deadline ? getRemaining(deadline) : null));

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setRemaining(getRemaining(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline || !remaining) return null;

  const units: [number, string][] = [
    [remaining.days, "dias"],
    [remaining.hours, "horas"],
    [remaining.minutes, "min"],
    [remaining.seconds, "seg"],
  ];

  return (
    <div className="flex items-center gap-2" role="timer" aria-live="polite">
      {units.map(([value, label]) => (
        <div
          key={label}
          className="flex min-w-14 flex-col items-center rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5"
        >
          <span className="font-display text-lg font-semibold tabular-nums text-primary">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
