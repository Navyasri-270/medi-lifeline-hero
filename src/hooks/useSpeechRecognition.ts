import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechState = {
  supported: boolean;
  listening: boolean;
  lastTranscript: string;
  error?: string;
};

export function useSpeechRecognition({
  continuous,
  interimResults,
  lang,
  onFinal,
}: {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onFinal?: (text: string) => void;
}) {
  const Recognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;

  const supported = !!Recognition;
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const restartGuard = useRef(false);
  const onFinalRef = useRef(onFinal);

  // Keep onFinal ref updated
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const start = useCallback(() => {
    if (!supported || !Recognition) return;

    // Create new instance if needed
    if (!recRef.current) {
      const rec = new Recognition();
      rec.continuous = continuous;
      rec.interimResults = interimResults;
      rec.lang = lang;

      rec.onstart = () => {
        setError(undefined);
        setListening(true);
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = (res[0]?.transcript ?? "").trim();
          if (res.isFinal) finalText += (finalText ? " " : "") + text;
          else interim += (interim ? " " : "") + text;
        }
        const combined = (finalText || interim).trim();
        if (combined) setLastTranscript(combined);
        if (finalText && onFinalRef.current) onFinalRef.current(finalText.trim());
      };

      rec.onerror = (e: any) => {
        setError(e?.error || "Speech error");
      };

      rec.onend = () => {
        setListening(false);
        if (continuous && restartGuard.current) {
          try {
            rec.start();
            setListening(true);
          } catch {
            // ignore
          }
        }
      };

      recRef.current = rec;
    }

    restartGuard.current = true;
    try {
      recRef.current?.start();
    } catch {
      // Some browsers throw if start() called twice.
    }
  }, [Recognition, continuous, interimResults, lang, supported]);

  const stop = useCallback(() => {
    restartGuard.current = false;
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      restartGuard.current = false;
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
      recRef.current = null;
    };
  }, []);

  return { supported, listening, lastTranscript, error, start, stop };
}
