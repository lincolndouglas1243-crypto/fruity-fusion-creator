import { motion } from "framer-motion";
import { useCart } from "./cart-context";

export function FinalCtaSection() {
  const { checkoutUrl, itemCount } = useCart();

  return (
    <section id="pedido" className="brand-shell mt-20">
      <div className="glass-card p-8 text-center sm:p-12">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          Seu próximo pedido de açaí começa agora.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Clique no WhatsApp e envie automaticamente seu carrinho com tamanho, adicionais e valor total.
        </p>
        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Fazer pedido no WhatsApp"
          className="btn-hero mt-6"
        >
          {itemCount > 0 ? `Finalizar ${itemCount} item(ns) no WhatsApp` : "Pedir no WhatsApp"}
        </motion.a>
      </div>
    </section>
  );
}
