import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { SectionReveal } from "./SectionReveal";
import { formatCurrency, useCart } from "./cart-context";

const sizes = [
  { name: "300ml", price: 13 },
  { name: "500ml", price: 20 },
];

const toppings = ["Banana", "Morango", "Maracujá", "Nutella", "Leite Ninho", "Leite Condensado", "Paçoca"];
const TOPPING_PRICE = 2;

export function BuildYourOwnSection() {
  const { addCustomAcai } = useCart();
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedToppings, setSelectedToppings] = useState<string[]>(["Banana", "Morango"]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
          <h2 className="text-3xl font-extrabold text-foreground">Monte seu Açaí • Step by Step</h2>
          <p className="mt-3 text-muted-foreground">Fluxo guiado: tamanho → ingredientes → confirmação.</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((index) => {
              const isActive = step === index;
              const isPast = step > index;
              return (
                <button
                  key={index}
                  onClick={() => setStep(index as 1 | 2 | 3)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isPast
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {index === 1 ? "1. Tamanho" : index === 2 ? "2. Ingredientes" : "3. Revisão"}
                </button>
              );
            })}
          </div>

          {step === 1 && (
            <div className="mt-5 grid gap-3 animate-fade-in">
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
              <button onClick={() => setStep(2)} className="btn-hero mt-2 w-full">Avançar para ingredientes</button>
            </div>
          )}
        </div>
        <div>
          {step === 2 && (
            <div className="animate-fade-in">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ingredientes (+{formatCurrency(TOPPING_PRICE)})</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {toppings.map((topping) => {
                  const active = selectedToppings.includes(topping);
                  return (
                    <motion.button
                      key={topping}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
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
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => setStep(1)} className="btn-soft w-full">Voltar</button>
                <button onClick={() => setStep(3)} className="btn-hero w-full">Revisar pedido</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Revisão final</p>
              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-sm text-muted-foreground">Tamanho</p>
                <p className="font-bold text-foreground">{selectedSize.name}</p>
                <p className="mt-3 text-sm text-muted-foreground">Ingredientes</p>
                <p className="font-bold text-foreground">
                  {selectedToppings.length ? selectedToppings.join(", ") : "Sem ingredientes extras"}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => setStep(2)} className="btn-soft w-full">Editar</button>
                <button
                  onClick={() => addCustomAcai({ size: selectedSize.name, toppings: selectedToppings, price: totalPrice })}
                  className="btn-hero w-full"
                >
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total do seu açaí</p>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalPrice)}</p>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
