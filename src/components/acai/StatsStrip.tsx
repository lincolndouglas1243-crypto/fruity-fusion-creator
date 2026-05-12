import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

function Counter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.8, ease: "easeOut" });
    return () => controls.stop();
  }, [count, inView, value]);

  return (
    <p ref={ref} className="text-3xl font-extrabold text-foreground">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </p>
  );
}

export function StatsStrip() {
  return (
    <section className="brand-shell -mt-10 relative z-20">
      <div className="glass-card grid gap-4 p-6 text-center md:grid-cols-3">
        <div>
          <Counter value={800} suffix="+" />
          <p className="text-sm text-muted-foreground">Pedidos entregues</p>
        </div>
        <div>
          <Counter value={4.9} suffix="★" decimals={1} />
          <p className="text-sm text-muted-foreground">Média de avaliação</p>
        </div>
        <div>
          <Counter value={18} suffix="min" />
          <p className="text-sm text-muted-foreground">Entrega média</p>
        </div>
      </div>
    </section>
  );
}
