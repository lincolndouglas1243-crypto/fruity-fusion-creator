import { motion, useScroll, useTransform } from "framer-motion";
import acaiHero from "@/assets/acai-banner.png";
import { useIsMobile } from "@/hooks/use-mobile";

export function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const isMobile = useIsMobile();

  return (
    <section id="topo" className="relative min-h-[88svh] overflow-hidden sm:min-h-screen">
      <motion.img
        src={acaiHero}
        alt="Banner promocional Açaí dos Amigos com destaque para delivery e montagem personalizada"
        width={1920}
        height={1080}
        style={{ y: isMobile ? 0 : y }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background/80" />
      <div className="relative brand-shell flex min-h-[88svh] items-end pt-24 pb-8 sm:min-h-screen sm:items-center sm:pt-28 sm:pb-14">
        <div className="max-w-3xl space-y-5 rounded-2xl border border-border/60 bg-background/90 p-5 shadow-[0_24px_60px_-24px_color-mix(in_oklab,var(--background)_85%,transparent)] sm:space-y-7 sm:bg-card/70 sm:p-8 sm:backdrop-blur-sm">
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
            className="text-balance text-2xl font-extrabold leading-tight text-foreground drop-shadow-[0_2px_10px_color-mix(in_oklab,var(--background)_70%,transparent)] sm:text-6xl"
          >
            O Açaí Mais Cremoso e Irresistível da Cidade
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-2xl text-base leading-relaxed text-foreground/95 sm:text-lg"
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
