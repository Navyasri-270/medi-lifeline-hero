import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MediSOSLogo } from "@/components/MediSOSLogo";
import { useSeo } from "@/lib/seo";

const Index = () => {
  useSeo({
    title: "Smart MediSOS – Your Mobile Lifeline",
    description:
      "Smart MediSOS is a mobile-first emergency SOS app with voice activation, contact alerts, and AI symptom severity checks.",
    canonicalPath: "/",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => navigate("/home"), 2000);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <main className="min-h-dvh bg-ambient">
      <section className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <MediSOSLogo className="scale-110" />
        <div className="space-y-2">
          <h1 className="font-display text-3xl">Your Mobile Lifeline</h1>
          <p className="text-sm text-muted-foreground">
            One-tap SOS, hands-free voice trigger, and smart symptom checks — optimized for mobile.
          </p>
        </div>
        <div className="h-12 w-full rounded-2xl border bg-card shadow-elevated" aria-hidden="true" />
      </section>
    </main>
  );
};

export default Index;
