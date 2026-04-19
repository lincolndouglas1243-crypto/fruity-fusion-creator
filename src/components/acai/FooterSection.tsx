export function FooterSection() {
  return (
    <footer className="brand-shell mt-16 pb-10">
      <div className="glass-card p-6">
        <div className="grid gap-5 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <p className="text-base font-bold text-foreground">Açaí Prime</p>
            <p className="mt-2">Marca gourmet com foco em qualidade, velocidade e experiência premium.</p>
          </div>
          <div>
            <p className="font-bold text-foreground">Contato</p>
            <p className="mt-2">(11) 99999-9999</p>
            <p>contato@acaiprime.com</p>
          </div>
          <div>
            <p className="font-bold text-foreground">Horários</p>
            <p className="mt-2">Seg a Dom • 11h às 23h</p>
            <p>Entrega expressa todos os dias</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
