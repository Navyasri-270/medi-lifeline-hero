import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SR = typeof window extends any ? any : never;

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
  const Recognition: SR | undefined =
    typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

  const supported = !!Recognition;
  const recRef = useRef<any | null>(null);
  const [listening, setListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const restartGuard = useRef(false);

  const setup = useCallback(() => {
    if (!supported) return null;
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
      if (finalText && onFinal) onFinal(finalText.trim());
    };

    rec.onerror = (e: any) => {
      setError(e?.error || "Speech error");
    };

    rec.onend = () => {
      setListening(false);
      if (continuous && restartGuard.current) {
        // Allow a controlled restart loop to keep hands-free mode alive.
        try {
          rec.start();
          setListening(true);
        } catch {
          // ignore
        }
      }
    };

    return rec;
  }, [Recognition, continuous, interimResults, lang, onFinal, supported]);

  const start = useCallback(() => {
    if (!supported) return;
    if (!recRef.current) recRef.current = setup();
    restartGuard.current = true;
    try {
      recRef.current?.start();
    } catch {
      // Some browsers throw if start() called twice.
    }
  }, [setup, supported]);

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
      try {
        restartGuard.current = false;
        recRef.current?.stop();
      } catch {
        // ignore
      }
      recRef.current = null;
    };
  }, []);

  const state: SpeechState = useMemo(
    () => ({ supported, listening, lastTranscript, error }),
    [supported, listening, lastTranscript, error],
  );

  return { ...state, start, stop };
}
