import { createFileRoute } from "@tanstack/react-router";
import acaiHero from "@/assets/acai-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Açaí Premium Delivery | Sabor Tropical" },
      {
        name: "description",
        content:
          "Açaí premium com frutas frescas, combos especiais e entrega rápida. Monte seu bowl e peça online.",
      },
      { property: "og:title", content: "Açaí Premium Delivery | Sabor Tropical" },
      {
        property: "og:description",
        content:
          "Bowl de açaí artesanal, ingredientes selecionados e experiência tropical irresistível.",
      },
      { name: "twitter:title", content: "Açaí Premium Delivery | Sabor Tropical" },
      {
        name: "twitter:description",
        content: "Peça agora seu açaí premium com entrega rápida.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const menu = [
    { name: "Bowl Clássico", desc: "Açaí + banana + granola", price: "R$ 21,90" },
    { name: "Power Protein", desc: "Açaí + whey + pasta de amendoim", price: "R$ 28,90" },
    { name: "Tropical Fresh", desc: "Açaí + morango + kiwi + mel", price: "R$ 26,90" },
  ];

  const benefits = [
    "Polpa de alta qualidade com cremosidade intensa",
    "Mais de 20 toppings para personalizar seu bowl",
    "Entrega expressa para chegar gelado e perfeito",
  ];

  return (
    <main className="pb-20">
      <section className="brand-shell pt-8 sm:pt-12">
        <header className="glass-card animate-fade-in p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg font-extrabold tracking-tight text-foreground">Sabor Tropical Açaí</p>
            <a href="#pedido" className="btn-hero">
              Pedir agora
            </a>
          </div>
        </header>
      </section>

      <section className="brand-shell mt-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 animate-fade-in">
          <span className="inline-flex rounded-full bg-secondary px-4 py-1 text-sm font-semibold text-secondary-foreground">
            O açaí mais pedido da região
          </span>
          <h1 className="text-balance text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            A energia do <span className="text-primary">açaí premium</span> em uma experiência irresistível.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Ingredientes frescos, montagem artesanal e entrega rápida para você vender mais e encantar no
            primeiro pedido.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#pedido" className="btn-hero">
              Quero vender mais hoje
            </a>
            <a href="#sabores" className="btn-soft">
              Ver sabores
            </a>
          </div>
        </div>

        <div className="glass-card shine-border hero-tilt animate-enter overflow-hidden p-3">
          <img
            src={acaiHero}
            alt="Bowl de açaí premium com morango, banana e granola"
            width={1920}
            height={1080}
            className="h-[420px] w-full rounded-2xl object-cover"
          />
        </div>
      </section>

      <section id="sabores" className="brand-shell mt-20">
        <div className="mb-8 space-y-2 text-center">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Combos campeões de venda</h2>
          <p className="text-muted-foreground">Cardápio estratégico para conversão alta no delivery e no balcão.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {menu.map((item) => (
            <article key={item.name} className="glass-card hover-scale p-6">
              <p className="text-sm font-semibold text-primary">Mais pedido</p>
              <h3 className="mt-2 text-2xl font-extrabold text-foreground">{item.name}</h3>
              <p className="mt-2 text-muted-foreground">{item.desc}</p>
              <p className="mt-6 text-xl font-bold text-foreground">{item.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="brand-shell mt-20 grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-7">
          <h2 className="text-3xl font-extrabold text-foreground">Por que esse layout vende</h2>
          <ul className="mt-5 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="rounded-xl bg-muted px-4 py-3 text-muted-foreground">
                {benefit}
              </li>
            ))}
          </ul>
        </article>
        <article className="glass-card p-7">
          <h2 className="text-3xl font-extrabold text-foreground">Prova social</h2>
          <p className="mt-5 rounded-xl bg-muted px-4 py-4 text-muted-foreground">
            “Em 3 semanas, nosso ticket médio subiu 34% depois que reformulamos a apresentação dos combos.”
          </p>
          <p className="mt-3 text-sm font-semibold text-foreground">— Paula, dona de loja de açaí</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-2xl font-extrabold text-secondary-foreground">+34%</p>
              <p className="text-xs text-secondary-foreground/80">Ticket médio</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-2xl font-extrabold text-secondary-foreground">4.9</p>
              <p className="text-xs text-secondary-foreground/80">Avaliação</p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-2xl font-extrabold text-secondary-foreground">18min</p>
              <p className="text-xs text-secondary-foreground/80">Entrega média</p>
            </div>
          </div>
        </article>
      </section>

      <section id="pedido" className="brand-shell mt-20">
        <div className="glass-card p-8 text-center sm:p-10">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Transforme seu açaí em uma máquina de pedidos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Página otimizada para conversão com visual premium, narrativa de venda e experiência mobile impecável.
          </p>
          <a href="https://wa.me/5500000000000" className="btn-hero mt-6" aria-label="Falar no WhatsApp para fazer pedido">
            Falar no WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
