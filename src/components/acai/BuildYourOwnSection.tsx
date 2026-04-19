import { motion } from "framer-motion";
import { SectionReveal } from "./SectionReveal";

const sizes = [
  { name: "300ml", price: "R$ 19,90" },
  { name: "500ml", price: "R$ 26,90" },
  { name: "700ml", price: "R$ 34,90" },
];

const toppings = ["Morango", "Banana", "Kiwi", "Granola", "Leite condensado", "Nutella", "Paçoca", "Ovomaltine"];

export function BuildYourOwnSection() {
  return (
    <SectionReveal className="brand-shell mt-20" >
      <div id="monte" className="glass-card grid gap-8 p-7 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground">Monte seu Açaí</h2>
          <p className="mt-3 text-muted-foreground">Escolha tamanho, combine complementos e finalize em segundos.</p>
          <div className="mt-5 grid gap-3">
            {sizes.map((size) => (
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                key={size.name}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left"
              >
                <span className="font-bold text-foreground">{size.name}</span>
                <span className="text-sm font-semibold text-primary">{size.price}</span>
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Adicionais</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {toppings.map((topping) => (
              <motion.button
                key={topping}
                whileHover={{ y: -2 }}
                className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
              >
                {topping}
              </motion.button>
            ))}
          </div>
          <button className="btn-hero mt-7 w-full">Finalizar Pedido</button>
        </div>
      </div>
    </SectionReveal>
  );
}
