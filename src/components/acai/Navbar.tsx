import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import acaiLogo from "@/assets/acai-logo.jpeg";

const links = [
  { href: "#cardapio", label: "Cardápio" },
  { href: "#monte", label: "Monte o Seu" },
  { href: "#promocoes", label: "Promoções" },
  { href: "#acompanhar", label: "Acompanhar" },
  { href: "#avaliacoes", label: "Avaliações" },
  { href: "#contato", label: "Contato" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="brand-shell pt-4">
        <nav
          className={`rounded-2xl border px-5 py-3 transition-all duration-300 ${
            scrolled
              ? "border-border/80 bg-background/80 shadow-[var(--shadow-soft)] backdrop-blur-xl"
              : "border-border/50 bg-background/60 backdrop-blur-md"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <a href="#topo" className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              <img src={acaiLogo} alt="Logo Açaí dos Amigos" className="h-10 w-10 rounded-md object-cover" />
              Açaí dos Amigos
            </a>
            <div className="hidden items-center gap-5 md:flex">
              {links.map((link) => (
                <a key={link.href} href={link.href} className="story-link text-sm font-semibold text-foreground">
                  {link.label}
                </a>
              ))}
            </div>
            <a href="#pedido" className="btn-hero">
              Pedir
            </a>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
