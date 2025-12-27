import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MobilePage } from "@/components/MobileShell";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { Severity } from "@/state/medisos-types";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useSeo } from "@/lib/seo";
import { Mic, Send } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

function analyze(text: string): { severity: Severity; tips: string[] } {
  const t = text.toLowerCase();
  const critical = ["chest pain", "unconscious", "seizure", "stroke", "not breathing", "severe bleeding", "heart attack"];
  const moderate = ["fever", "vomit", "vomiting", "dizziness", "asthma", "breathless", "pain"];

  if (critical.some((k) => t.includes(k))) {
    return {
      severity: "critical",
      tips: ["Call emergency services now.", "Stay calm and stay with the patient.", "Share location with responders."],
    };
  }

  if (moderate.some((k) => t.includes(k))) {
    return {
      severity: "moderate",
      tips: ["Consider contacting a doctor.", "Monitor symptoms and hydrate.", "If symptoms worsen, trigger SOS."],
    };
  }

  return {
    severity: "low",
    tips: ["Rest and monitor symptoms.", "If symptoms persist, consult a doctor."],
  };
}

export default function Symptom() {
  useSeo({
    title: "AI Symptom Checker – Smart MediSOS",
    description: "Describe symptoms and get a quick severity estimate (demo keyword analysis).",
    canonicalPath: "/symptom",
  });

  const nav = useNavigate();
  const { toast } = useToast();
  const { settings, logSos } = useMediSOS();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ severity: Severity; tips: string[] } | null>(null);

  const sr = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    lang: settings.language === "hi" ? "hi-IN" : settings.language === "te" ? "te-IN" : "en-IN",
    onFinal: (t) => setInput((prev) => (prev ? `${prev} ${t}` : t)),
  });

  const canMic = sr.supported;

  const promptSos = useMemo(() => result?.severity === "critical", [result?.severity]);

  const submit = () => {
    if (!input.trim()) {
      toast({ title: "Add symptoms", description: "Please describe what the patient is feeling." });
      return;
    }
    const r = analyze(input);
    setResult(r);
    speak(`Severity: ${r.severity}`);
    if (r.severity === "critical") {
      toast({ title: "Critical severity", description: "We recommend triggering SOS now." });
    }
  };

  return (
    <MobilePage title="Symptom Checker">
      <section className="space-y-3">
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Describe symptoms</CardTitle>
            <p className="text-sm text-muted-foreground">Demo analysis (keyword-based). Add Lovable Cloud later for real AI.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms…"
              className="min-h-28"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="xl"
                onClick={() => (sr.listening ? sr.stop() : sr.start())}
                disabled={!canMic}
              >
                <Mic className="h-4 w-4" /> {sr.listening ? "Listening…" : "Mic"}
              </Button>
              <Button variant="sos" size="xl" onClick={submit}>
                <Send className="h-4 w-4" /> Analyze
              </Button>
            </div>
            {!canMic ? <p className="text-xs text-muted-foreground">Voice input not supported in this browser.</p> : null}
          </CardContent>
        </Card>

        {result ? (
          <Card className="shadow-elevated">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Result</CardTitle>
                <SeverityBadge severity={result.severity} />
              </div>
              <p className="text-sm text-muted-foreground">Suggested actions</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-inside list-disc space-y-1 text-sm">
                {result.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>

              {promptSos ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="sos" size="xl" className="mt-3 w-full">
                      Trigger SOS
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Trigger SOS now?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Critical severity detected. Start SOS and notify your contacts (demo)?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          logSos({ severity: "critical" });
                          nav("/sos");
                        }}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </section>
    </MobilePage>
  );
}
