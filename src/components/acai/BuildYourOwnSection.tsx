import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

const sizes = [
  { name: "300ml", price: 19.9 },
  { name: "500ml", price: 26.9 },
  { name: "700ml", price: 34.9 },
];

const toppings = ["Morango", "Banana", "Kiwi", "Granola", "Leite condensado", "Nutella", "Paçoca", "Ovomaltine"];
const TOPPING_PRICE = 3;

export function BuildYourOwnSection() {
  const { addCustomAcai } = useCart();
  const [selectedSize, setSelectedSize] = useState(sizes[1]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>(["Granola", "Leite condensado"]);

  const totalPrice = useMemo(
    () => selectedSize.price + selectedToppings.length * TOPPING_PRICE,
    [selectedSize.price, selectedToppings],
  );

  const toggleTopping = (topping: string) => {
    setSelectedToppings((current) =>
      current.includes(topping) ? current.filter((item) => item !== topping) : [...current, topping],
    );
  };

  return (
    <SectionReveal className="brand-shell mt-20">
      <div id="monte" className="glass-card grid gap-8 p-7 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground">Monte seu Açaí</h2>
          <p className="mt-3 text-muted-foreground">Escolha tamanho, combine complementos e adicione no carrinho.</p>
          <div className="mt-5 grid gap-3">
            {sizes.map((size) => {
              const active = selectedSize.name === size.name;
              return (
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSize(size)}
                  key={size.name}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    active ? "border-primary bg-primary/20" : "border-border bg-card"
                  }`}
                >
                  <span className="font-bold text-foreground">{size.name}</span>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(size.price)}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Adicionais (+{formatCurrency(TOPPING_PRICE)})</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {toppings.map((topping) => {
              const active = selectedToppings.includes(topping);
              return (
                <motion.button
                  key={topping}
                  whileHover={{ y: -2 }}
                  onClick={() => toggleTopping(topping)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground"
                  }`}
                >
                  {topping}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total do seu açaí</p>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalPrice)}</p>
          </div>
          <button
            onClick={() => addCustomAcai({ size: selectedSize.name, toppings: selectedToppings, price: totalPrice })}
            className="btn-hero mt-5 w-full"
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </SectionReveal>
  );
}
