// Peça gráfica gerada (SVG puro, sem imagem externa) que substitui a foto
// que ainda não existe: um mini "painel" com barras ascendentes + linha de
// tendência, ecoando a cadeia Receita → Patrimônio que reaparece mais
// abaixo na página. Abstrata, sem foto de pessoa nem logo de terceiros, e
// funciona em qualquer tema porque só usa as CSS vars do design system.
const bars = [38, 52, 46, 68, 60, 86];

export function HeroVisual() {
  const chartW = 320;
  const chartH = 170;
  const gap = 10;
  const barW = (chartW - gap * (bars.length - 1)) / bars.length;
  const max = Math.max(...bars);

  return (
    <div className="surface-card relative aspect-square w-full overflow-hidden rounded-3xl p-7 shadow-[var(--shadow-panel)] sm:p-9">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="l2x-glow" cx="50%" cy="0%" r="75%">
            <stop offset="0%" stopColor="oklch(0.82 0.14 78 / 0.16)" />
            <stop offset="100%" stopColor="oklch(0.82 0.14 78 / 0)" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill="url(#l2x-glow)" />
        {[70, 130, 190].map((r) => (
          <circle
            key={r}
            cx="360"
            cy="20"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        <pattern id="l2x-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path
            d="M 28 0 L 0 0 0 28"
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
        <rect width="400" height="400" fill="url(#l2x-grid)" opacity="0.5" />
      </svg>

      <div className="relative flex h-full flex-col justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estrutura de crescimento
        </span>

        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="h-auto w-full"
          role="img"
          aria-label="Barras ascendentes representando crescimento estruturado"
        >
          <defs>
            <linearGradient id="l2x-bar" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.16 55 / 0.55)" />
              <stop offset="100%" stopColor="oklch(0.88 0.17 85)" />
            </linearGradient>
            <linearGradient id="l2x-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.16 55)" />
              <stop offset="100%" stopColor="oklch(0.88 0.17 85)" />
            </linearGradient>
          </defs>

          {bars.map((v, i) => {
            const h = (v / max) * (chartH - 14);
            const x = i * (barW + gap);
            const y = chartH - h;
            const isLast = i === bars.length - 1;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill="url(#l2x-bar)"
                opacity={isLast ? 1 : 0.45 + i * 0.06}
              />
            );
          })}

          <polyline
            points={bars
              .map((v, i) => {
                const h = (v / max) * (chartH - 14);
                const x = i * (barW + gap) + barW / 2;
                const y = chartH - h - 10;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="url(#l2x-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex items-baseline justify-between border-t border-border/70 pt-3.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Receita</span>
          <span className="h-px flex-1 border-t border-dashed border-border/70 mx-2" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Patrimônio
          </span>
        </div>
      </div>
    </div>
  );
}
