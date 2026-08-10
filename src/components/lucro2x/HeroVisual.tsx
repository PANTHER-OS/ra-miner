import { motion } from "framer-motion";

// Peça gráfica gerada (SVG puro, sem imagem externa) que substitui a foto
// que ainda não existe: um mini "painel" com barras ascendentes + linha de
// tendência, narrando a mesma cadeia Receita → Patrimônio que reaparece
// mais abaixo na página — cada barra "revela" o nome da própria etapa ao
// crescer, em vez de ser só uma curva genérica. Abstrata, sem foto de
// pessoa nem logo de terceiros, e funciona em qualquer tema porque só usa
// as CSS vars do design system. A entrada acontece uma vez só; o brilho
// na última barra continua respirando bem devagar depois, pra não ficar
// "morta" no resto do tempo em que a pessoa olha pra página.
const EASE = [0.16, 1, 0.3, 1] as const;
const stages = [
  { value: 38, label: "Receita" },
  { value: 52, label: "Eficiência" },
  { value: 46, label: "Margem" },
  { value: 68, label: "Lucro" },
  { value: 60, label: "Alocação" },
  { value: 86, label: "Patrimônio" },
];

export function HeroVisual() {
  const innerW = 320; // largura ocupada pelas barras em si
  const hPad = 30; // margem de segurança nas duas pontas, só pro texto do rótulo nunca cortar
  const chartW = innerW + hPad * 2;
  const chartH = 196;
  const topMargin = 36; // espaço reservado acima da barra mais alta pro rótulo + linha
  const gap = 10;
  const barW = (innerW - gap * (stages.length - 1)) / stages.length;
  const max = Math.max(...stages.map((s) => s.value));

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

      <div className="relative flex h-full flex-col justify-center gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estrutura de crescimento
        </span>

        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="h-auto w-full"
          role="img"
          aria-label="Barras ascendentes narrando a cadeia de receita até patrimônio"
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
            <radialGradient id="l2x-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.88 0.17 85 / 0.5)" />
              <stop offset="100%" stopColor="oklch(0.88 0.17 85 / 0)" />
            </radialGradient>
          </defs>

          {stages.map((stage, i) => {
            const h = (stage.value / max) * (chartH - topMargin);
            const x = hPad + i * (barW + gap);
            const y = chartH - h;
            const isLast = i === stages.length - 1;
            const barDelay = 0.4 + i * 0.08;

            return (
              <g key={stage.label}>
                {/* Brilho contínuo atrás da última barra, só depois que a
                    entrada termina — a única animação em loop aqui. Fica
                    OFFSET pra trás/baixo da barra, nunca atrás do texto,
                    pra não lavar o contraste do rótulo. */}
                {isLast && (
                  <motion.circle
                    cx={x + barW / 2}
                    cy={y + h * 0.35}
                    r={20}
                    fill="url(#l2x-pulse)"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: [0, 0.7, 0.3], scale: [0.85, 1.1, 1] }}
                    transition={{
                      delay: barDelay + 0.9,
                      duration: 2.6,
                      repeat: Infinity,
                      repeatType: "mirror",
                      ease: "easeInOut",
                    }}
                  />
                )}

                <motion.rect
                  x={x}
                  width={barW}
                  rx={4}
                  fill="url(#l2x-bar)"
                  opacity={isLast ? 1 : 0.45 + i * 0.06}
                  initial={{ height: 0, y: chartH }}
                  animate={{ height: h, y }}
                  transition={{ duration: 0.7, delay: barDelay, ease: EASE }}
                />

                <motion.text
                  x={x + barW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isLast ? 700 : 500}
                  // Última barra: branco (não dourado) — dourado em cima do
                  // brilho dourado ficava ilegível. Assim fica de alto
                  // contraste tanto contra o fundo quanto contra o brilho.
                  fill={isLast ? "var(--foreground)" : "var(--muted-foreground)"}
                  initial={{ opacity: 0, y: y + 4 }}
                  animate={{ opacity: 1, y: y - 8 }}
                  transition={{ duration: 0.45, delay: barDelay + 0.55, ease: EASE }}
                >
                  {stage.label}
                </motion.text>
              </g>
            );
          })}

          <motion.polyline
            points={stages
              .map((stage, i) => {
                const h = (stage.value / max) * (chartH - topMargin);
                const x = hPad + i * (barW + gap) + barW / 2;
                const y = chartH - h - 14;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="url(#l2x-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 1, ease: "easeOut" }}
          />
        </svg>
      </div>
    </div>
  );
}
