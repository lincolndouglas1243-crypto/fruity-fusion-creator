import { SectionReveal } from "./SectionReveal";

const offers = [
  { title: "Combo Casal", text: "2 açaís 500ml + 2 adicionais premium", price: "R$ 49,90" },
  { title: "Combo Família", text: "3 açaís 700ml + toppings liberados", price: "R$ 79,90" },
  { title: "Happy Hour Açaí", text: "20% OFF das 16h às 18h", price: "Hoje" },
];

export function PromotionsSection() {
  return (
    <SectionReveal className="brand-shell mt-20" >
      <div id="promocoes" className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Promoções que convertem</h2>
          <p className="mt-2 text-muted-foreground">Ofertas inteligentes para aumentar frequência e ticket médio.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {offers.map((offer, index) => (
            <article key={offer.title} className="glass-card relative overflow-hidden p-6">
              {index === 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                  Oferta do dia
                </span>
              )}
              <h3 className="text-2xl font-extrabold text-foreground">{offer.title}</h3>
              <p className="mt-2 text-muted-foreground">{offer.text}</p>
              <p className="mt-5 text-xl font-bold text-primary">{offer.price}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
