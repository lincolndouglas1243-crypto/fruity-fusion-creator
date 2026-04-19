import { createFileRoute } from "@tanstack/react-router";
import { AboutContactSection } from "@/components/acai/AboutContactSection";
import { BuildYourOwnSection } from "@/components/acai/BuildYourOwnSection";
import { FinalCtaSection } from "@/components/acai/FinalCtaSection";
import { FooterSection } from "@/components/acai/FooterSection";
import { HeroSection } from "@/components/acai/HeroSection";
import { MenuSection } from "@/components/acai/MenuSection";
import { Navbar } from "@/components/acai/Navbar";
import { PromotionsSection } from "@/components/acai/PromotionsSection";
import { StatsStrip } from "@/components/acai/StatsStrip";
import { TestimonialsSection } from "@/components/acai/TestimonialsSection";
import { WhatsappFloatButton } from "@/components/acai/WhatsappFloatButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Açaí Prime Delivery | O Melhor Açaí da Cidade" },
      {
        name: "description",
        content:
          "Landing page premium para loja de açaí gourmet: cardápio, monte seu açaí, promoções, avaliações e pedido rápido no WhatsApp.",
      },
      { property: "og:title", content: "Açaí Prime Delivery | O Melhor Açaí da Cidade" },
      {
        property: "og:description",
        content: "Visual premium, animações avançadas e foco total em conversão para delivery de açaí.",
      },
      { name: "twitter:title", content: "Açaí Prime Delivery" },
      { name: "twitter:description", content: "Peça agora seu açaí gourmet com entrega rápida." },
    ],
    links: [{ rel: "canonical", href: "https://id-preview--b8983ab2-b687-4fcc-9e65-817d65e20c49.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="dark">
      <Navbar />
      <HeroSection />
      <StatsStrip />
      <MenuSection />
      <BuildYourOwnSection />
      <PromotionsSection />
      <TestimonialsSection />
      <AboutContactSection />
      <FinalCtaSection />
      <FooterSection />
      <WhatsappFloatButton />
    </div>
  );
}
