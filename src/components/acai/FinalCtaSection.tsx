import { motion } from "framer-motion";

export function FinalCtaSection() {
  return (
    <section id="pedido" className="brand-shell mt-20">
      <div className="glass-card p-8 text-center sm:p-12">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Seu próximo pedido de açaí começa agora.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Clique no WhatsApp e receba um atendimento rápido para montar o combo perfeito.
        </p>
        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          href="https://wa.me/5500000000000"
          aria-label="Fazer pedido no WhatsApp"
          className="btn-hero mt-6"
        >
          Pedir no WhatsApp
        </motion.a>
      </div>
    </section>
  );
}
