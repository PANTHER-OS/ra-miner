import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.2, 0.8, 0.2, 1],
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, rounded]);

  return (
    <motion.span
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {new Intl.NumberFormat("pt-BR").format(display)}
    </motion.span>
  );
}
