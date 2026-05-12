import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

type CourierStatus = "idle" | "starting" | "sharing" | "error";

export const Route = createFileRoute("/entrega/$courierCode")({
  head: () => ({
    meta: [
      { title: "Rastreamento do Motoboy | Açaí Prime" },
      { name: "description", content: "Compartilhe sua localização em tempo real para atualizar o painel admin e o rastreio do cliente." },
    ],
  }),
  component: CourierSharePage,
});

function CourierSharePage() {
  const { courierCode } = Route.useParams();
  const [status, setStatus] = useState<CourierStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  const shortCode = useMemo(() => courierCode.trim().toUpperCase(), [courierCode]);

  const stopSharing = () => {
    if (watchRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setStatus("idle");
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Seu celular não suporta geolocalização neste navegador.");
      return;
    }

    stopSharing();
    setStatus("starting");
    setMessage("Solicitando permissão de localização...");

    watchRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          const heading = position.coords.heading !== null ? Number(position.coords.heading.toFixed(2)) : null;

          const response = await fetch(`/api/courier/${shortCode}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng, heading }),
          });

          if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            setStatus("error");
            setMessage(result?.error ?? "Falha ao enviar localização.");
            return;
          }

          setStatus("sharing");
          setMessage("Localização compartilhada com sucesso em tempo real.");
          setLastSentAt(new Date().toLocaleTimeString("pt-BR"));
        } catch {
          setStatus("error");
          setMessage("Não foi possível enviar localização agora. Verifique sua internet e tente novamente.");
        }
      },
      () => {
        setStatus("error");
        setMessage("Permita o GPS para iniciar o compartilhamento da rota.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  };

  useEffect(() => {
    return () => stopSharing();
  }, []);

  return (
    <main className="brand-shell py-24">
      <section className="glass-card mx-auto max-w-2xl p-7">
        <h1 className="text-4xl font-extrabold text-foreground">Compartilhar localização do motoboy</h1>
        <p className="mt-2 text-muted-foreground">
          Código da entrega: <span className="font-bold text-foreground">{shortCode}</span>
        </p>

        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          Deixe esta tela aberta durante a corrida para atualizar automaticamente o painel admin e o rastreio premium do cliente.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={startSharing} className="btn-hero" disabled={status === "starting"}>
            {status === "starting" ? "Iniciando..." : "Ativar localização ao vivo"}
          </button>
          <button onClick={stopSharing} className="btn-soft">
            Parar compartilhamento
          </button>
        </div>

        {message && <p className="mt-4 text-sm font-medium text-foreground">{message}</p>}
        {lastSentAt && <p className="mt-2 text-xs text-muted-foreground">Última atualização enviada às {lastSentAt}.</p>}
      </section>
    </main>
  );
}
