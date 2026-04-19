import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionReveal } from "./SectionReveal";

const testimonials = [
  {
    name: "Camila Souza",
    text: "Sem dúvida o melhor açaí da cidade. Chega sempre cremoso e com muita qualidade.",
  },
  {
    name: "Rafael Lima",
    text: "Visual premium e sabor absurdo. Pedi uma vez e já virei cliente fiel.",
  },
  {
    name: "Juliana Rocha",
    text: "Entrega rápida, porções generosas e montagem impecável. Recomendo demais.",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <SectionReveal className="brand-shell mt-20" >
      <div id="avaliacoes" className="glass-card p-7 sm:p-10">
        <h2 className="text-center text-3xl font-extrabold text-foreground sm:text-4xl">Clientes apaixonados</h2>
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <p className="text-xl text-foreground">“{testimonials[index].text}”</p>
              <p className="mt-4 text-sm font-bold text-primary">★ ★ ★ ★ ★</p>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{testimonials[index].name}</p>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </SectionReveal>
  );
}
