import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const DEFAULT_TRIGGERS = ["help", "help me", "sos", "emergency", "urgent"]; 

export function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function useVoiceSosTrigger({
  enabled,
  onTrigger,
  language = "en-IN",
  triggers = DEFAULT_TRIGGERS,
}: {
  enabled: boolean;
  onTrigger: (phrase: string) => void;
  language?: string;
  triggers?: string[];
}) {
  const [armedSince, setArmedSince] = useState<number | null>(null);
  const lastFireRef = useRef<number>(0);

  const triggerSet = useMemo(() => new Set(triggers.map((t) => normalize(t))), [triggers]);

  const onFinal = useCallback(
    (text: string) => {
      const n = normalize(text);
      const now = Date.now();
      if (now - lastFireRef.current < 5000) return; // debounce
      for (const phrase of triggerSet) {
        if (phrase && n.includes(phrase)) {
          lastFireRef.current = now;
          onTrigger(text);
          return;
        }
      }
    },
    [onTrigger, triggerSet],
  );

  const sr = useSpeechRecognition({ continuous: true, interimResults: true, lang: language, onFinal });

  useEffect(() => {
    if (!enabled) {
      sr.stop();
      setArmedSince(null);
      return;
    }
    // Important: microphone access still requires a user gesture in browsers.
    sr.start();
    setArmedSince(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    supported: sr.supported,
    listening: sr.listening,
    lastTranscript: sr.lastTranscript,
    error: sr.error,
    armedSince,
    start: sr.start,
    stop: sr.stop,
  };
}
