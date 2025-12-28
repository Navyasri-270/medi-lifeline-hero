import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type VoiceFeedbackProps = {
  listening: boolean;
  supported: boolean;
  lastTranscript: string;
  error?: string;
};

export function VoiceFeedback({ listening, supported, lastTranscript, error }: VoiceFeedbackProps) {
  if (!supported) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
        <MicOff className="h-4 w-4" />
        Voice recognition not supported on this device
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-all",
        listening
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full",
            listening ? "bg-primary/20" : "bg-muted"
          )}
        >
          <Mic
            className={cn(
              "h-5 w-5 transition-colors",
              listening ? "text-primary" : "text-muted-foreground"
            )}
          />
          {listening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <span className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                listening ? "text-primary" : "text-muted-foreground"
              )}
            >
              {listening ? "Listening for trigger words..." : "Voice SOS Idle"}
            </span>
            {listening && (
              <Volume2 className="h-4 w-4 text-primary animate-pulse" />
            )}
          </div>

          {lastTranscript && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Heard:</span>
              <span className="text-xs font-medium text-foreground bg-secondary/50 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                "{lastTranscript}"
              </span>
            </div>
          )}

          {error && (
            <div className="mt-1 text-xs text-destructive">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {listening && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Help", "Help me", "SOS", "Emergency", "Urgent"].map((word) => (
            <span
              key={word}
              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
