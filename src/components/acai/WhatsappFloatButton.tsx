import { motion } from "framer-motion";
import { useCart } from "./cart-context";

export function WhatsappFloatButton() {
  const { itemCount } = useCart();

  return (
    <motion.a
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      whileHover={{ scale: 1.08 }}
      href="#carrinho"
      aria-label="Ir para carrinho"
      className="btn-hero fixed bottom-5 right-5 z-50 rounded-full px-5 py-3"
    >
      Carrinho {itemCount > 0 ? `(${itemCount})` : ""}
    </motion.a>
  );
}
