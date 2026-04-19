import { motion } from "framer-motion";

export function WhatsappFloatButton() {
  return (
    <motion.a
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      whileHover={{ scale: 1.08 }}
      href="https://wa.me/5500000000000"
      aria-label="Abrir WhatsApp para fazer pedido"
      className="btn-hero fixed bottom-5 right-5 z-50 rounded-full px-5 py-3"
    >
      WhatsApp
    </motion.a>
  );
}
