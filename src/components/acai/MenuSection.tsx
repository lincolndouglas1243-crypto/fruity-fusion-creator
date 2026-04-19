import { motion } from "framer-motion";
import acaiCup1 from "@/assets/acai-cup-1.jpg";
import acaiCup2 from "@/assets/acai-cup-2.jpg";
import acaiCup3 from "@/assets/acai-cup-3.jpg";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

const items = [
  {
    image: acaiCup1,
    title: "Açaí Supreme",
    description: "Açaí cremoso, morango, banana, leite condensado e granola premium.",
    price: 29.9,
    badge: "Mais vendido",
  },
  {
    image: acaiCup2,
    title: "Dark Berry",
    description: "Mix de frutas vermelhas, kiwi, crocante de chocolate e mel especial.",
    price: 31.9,
    badge: "Gourmet",
  },
  {
    image: acaiCup3,
    title: "Neon Tropical",
    description: "Camadas artesanais com toppings exclusivos e finalização cremosa.",
    price: 33.9,
    badge: "Oferta do dia",
  },
];

export function MenuSection() {
  const { addPresetItem } = useCart();

  return (
    <SectionReveal className="brand-shell mt-20">
      <div className="mb-8 text-center">
        <h2 id="cardapio" className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Cardápio Premium
        </h2>
        <p className="mt-2 text-muted-foreground">Produtos pensados para alto ticket e desejo imediato.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <motion.article
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.12, duration: 0.55 }}
            key={item.title}
            className="glass-card group overflow-hidden"
          >
            <div className="relative overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                width={1200}
                height={900}
                className="h-64 w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                {item.badge}
              </span>
            </div>
            <div className="space-y-3 p-5">
              <h3 className="text-2xl font-extrabold text-foreground">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xl font-extrabold text-foreground">{formatCurrency(item.price)}</p>
                <button onClick={() => addPresetItem({ name: item.title, price: item.price })} className="btn-soft px-4 py-2 text-xs">
                  Adicionar
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </SectionReveal>
  );
}
