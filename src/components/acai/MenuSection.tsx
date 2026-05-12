import { motion } from "framer-motion";
import acaiGarrafaFrutas from "@/assets/acai-garrafa-frutas.png";
import acaiGarrafaNutella from "@/assets/acai-garrafa-nutella.png";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

const items = [
  {
    image: acaiGarrafaFrutas,
    title: "Garrafa Banana • Morango • Maracujá",
    description: "Açaí de garrafa 300ml com combinação frutada e equilibrada para o dia a dia.",
    price: 13,
    badge: "Mais vendido",
  },
  {
    image: acaiGarrafaNutella,
    title: "Garrafa Nutella • Leite Ninho • Leite Condensado",
    description: "Açaí de garrafa 500ml com perfil cremoso e doce na medida certa.",
    price: 20,
    badge: "Gourmet",
  },
  {
    image: acaiGarrafaFrutas,
    title: "Oferta do Dia • Garrafa 500ml",
    description: "Paçoca, banana e morango em uma garrafa promocional com sabor intenso.",
    price: 20,
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
