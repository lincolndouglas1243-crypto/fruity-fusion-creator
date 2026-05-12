import { SectionReveal } from "./SectionReveal";

export function AboutContactSection() {
  return (
    <SectionReveal className="brand-shell mt-20" >
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-7">
          <h2 className="text-3xl font-extrabold text-foreground">Sobre a loja</h2>
          <p className="mt-4 text-muted-foreground">
            Somos especialistas em açaí gourmet, com seleção rigorosa de ingredientes, padrão premium e operação focada em experiência.
          </p>
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Entrega rápida • Área de atendimento:</p>
            <p className="mt-1 text-sm text-muted-foreground">Bairro Democrata e região • 11h às 23h</p>
          </div>
        </article>

        <article id="contato" className="glass-card p-7">
          <h2 className="text-3xl font-extrabold text-foreground">Localização</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Mapa da loja de açaí"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-41.989%2C-18.888%2C-41.929%2C-18.848&layer=mapnik&marker=-18.8685%2C-41.9590"
              className="h-64 w-full"
              loading="lazy"
            />
          </div>
          <a href="#pedido" className="btn-soft mt-5 w-full">
            Ver rota e pedir agora
          </a>
        </article>
      </div>
    </SectionReveal>
  );
}
