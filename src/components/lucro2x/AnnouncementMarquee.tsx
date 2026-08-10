import { motion } from "framer-motion";

const REPEATS = 8;

// Faixa corrida no topo do topo da página — fundo branco sólido, texto
// preto, andando pra direita infinitamente (duas cópias idênticas do
// conteúdo lado a lado; quando a animação volta de -50% pra 0% o corte é
// invisível porque as duas metades são iguais). Substitui o badge
// "acesso antecipado" que ficava dentro do hero.
export function AnnouncementMarquee() {
  return (
    <div className="w-full overflow-hidden bg-white py-2.5" aria-hidden={false}>
      <motion.div
        className="flex w-max items-center whitespace-nowrap"
        animate={{ x: ["-50%", "0%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {Array.from({ length: REPEATS }).map((_, i) => (
              <span key={i} className="flex items-center">
                <span className="mx-5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-black sm:text-base">
                  Pré-venda antecipada
                </span>
                <span className="text-black/30" aria-hidden>
                  ●
                </span>
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
