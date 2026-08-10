// Peça gráfica gerada (SVG puro, sem imagem externa) que substitui a foto
// que ainda não existe. Ecoa a cadeia Receita → Patrimônio que reaparece
// mais abaixo na página — abstrata, sem foto de pessoa nem logo de
// terceiros, e funciona em qualquer tema porque só usa as CSS vars do
// design system.
export function HeroVisual() {
  return (
    <div className="surface-card relative aspect-square w-full overflow-hidden rounded-3xl shadow-[var(--shadow-panel)]">
      <svg
        viewBox="0 0 400 400"
        className="h-full w-full"
        role="img"
        aria-label="Estrutura de crescimento"
      >
        <defs>
          <linearGradient id="l2x-line" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.72 0.16 55)" />
            <stop offset="100%" stopColor="oklch(0.88 0.17 85)" />
          </linearGradient>
          <radialGradient id="l2x-glow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.82 0.14 78 / 0.22)" />
            <stop offset="100%" stopColor="oklch(0.82 0.14 78 / 0)" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="200" r="180" fill="url(#l2x-glow)" />

        {[70, 110, 150].map((r) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}

        {/* Linha ascendente — a mesma leitura de "estrutura crescendo" da seção de mecanismo */}
        <polyline
          points="70,290 140,255 190,270 240,190 300,205 340,120"
          fill="none"
          stroke="url(#l2x-line)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[
          [70, 290],
          [140, 255],
          [190, 270],
          [240, 190],
          [300, 205],
          [340, 120],
        ].map(([cx, cy], i, arr) => (
          <circle
            key={cx}
            cx={cx}
            cy={cy}
            r={i === arr.length - 1 ? 6 : 3.5}
            fill={i === arr.length - 1 ? "oklch(0.88 0.17 85)" : "var(--surface-elevated)"}
            stroke="oklch(0.82 0.14 78)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}
