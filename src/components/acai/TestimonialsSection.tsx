import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionReveal } from "./SectionReveal";

const testimonials = [
  {
    name: "Camila Souza",
    text: "Sem dúvida o melhor açaí da cidade. Chega sempre cremoso e com muita qualidade.",
  },
  {
    name: "Rafael Lima",
    text: "Visual premium e sabor absurdo. Pedi uma vez e já virei cliente fiel.",
  },
  {
    name: "Juliana Rocha",
    text: "Entrega rápida, porções generosas e montagem impecável. Recomendo demais.",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState(testimonials);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  const loadFeedbacks = async () => {
    const response = await fetch("/api/feedback");
    if (!response.ok) return;
    const body = await response.json().catch(() => ({}));
    const mapped = (body.feedbacks ?? []).map((item: { customer_name: string; comment: string }) => ({
      name: item.customer_name,
      text: item.comment,
    }));
    if (mapped.length) setFeedbacks(mapped);
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % feedbacks.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, [feedbacks.length]);

  const submitFeedback = async () => {
    setMessage(null);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: name, comment, rating }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body?.error ?? "Não foi possível enviar feedback.");
      return;
    }
    setName("");
    setComment("");
    setRating(5);
    setMessage("Feedback enviado para aprovação.");
  };

  return (
    <SectionReveal className="brand-shell mt-20" >
      <div id="avaliacoes" className="glass-card p-7 sm:p-10">
        <h2 className="text-center text-3xl font-extrabold text-foreground sm:text-4xl">Clientes apaixonados</h2>
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <p className="text-xl text-foreground">“{feedbacks[index]?.text ?? testimonials[0].text}”</p>
              <p className="mt-4 text-sm font-bold text-primary">★ ★ ★ ★ ★</p>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">{feedbacks[index]?.name ?? testimonials[0].name}</p>
            </motion.article>
          </AnimatePresence>
        </div>

        <div className="mx-auto mt-6 grid max-w-3xl gap-2 rounded-2xl border border-border bg-card p-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Seu feedback" className="min-h-20 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} estrelas</option>)}
          </select>
          <button onClick={submitFeedback} className="btn-soft">Enviar feedback</button>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </div>
      </div>
    </SectionReveal>
  );
}
