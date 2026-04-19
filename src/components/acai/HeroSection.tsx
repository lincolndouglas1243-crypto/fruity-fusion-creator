import { motion, useScroll, useTransform } from "framer-motion";
import acaiHero from "@/assets/acai-hero.jpg";

export function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);

  return (
    <section id="topo" className="relative min-h-screen overflow-hidden">
      <motion.img
        src={acaiHero}
        alt="Copo de açaí gourmet com frutas, granola e leite condensado"
        width={1920}
        height={1080}
        style={{ y }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-background/45 backdrop-blur-[2px]" />
      <div className="relative brand-shell flex min-h-screen items-center pt-28 pb-14">
        <div className="max-w-3xl space-y-7">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex rounded-full border border-border/80 bg-card/85 px-4 py-1 text-sm font-semibold text-foreground"
          >
            Delivery premium • Cremosidade real
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-balance text-4xl font-extrabold leading-tight text-foreground sm:text-6xl"
          >
            O Açaí Mais Cremoso e Irresistível da Cidade
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl text-lg text-foreground/90"
          >
            Sabor intenso, toppings selecionados e entrega ultra rápida para transformar vontade em pedido em segundos.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap gap-3"
          >
            <a href="#pedido" className="btn-hero relative overflow-hidden">
              <span className="absolute inset-0 -translate-x-full animate-[slide-in-right_2.8s_ease-in-out_infinite] bg-linear-to-r from-transparent via-background/20 to-transparent" />
              <span className="relative">Peça Agora</span>
            </a>
            <a href="#monte" className="btn-soft">
              Monte Seu Açaí
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
