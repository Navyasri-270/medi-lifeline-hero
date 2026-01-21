import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEmergencyRecording } from "@/hooks/useEmergencyRecording";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Square, 
  Pause, 
  Play, 
  Save, 
  Trash2,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface EmergencyRecorderProps {
  sosLogId?: string;
  autoStart?: boolean;
  maxDuration?: number; // in seconds
  onRecordingSaved?: (recordingUrl: string) => void;
}

const MAX_RECORDING_DURATION = 300; // 5 minutes max

export function EmergencyRecorder({
  sosLogId,
  autoStart = false,
  maxDuration = MAX_RECORDING_DURATION,
  onRecordingSaved,
}: EmergencyRecorderProps) {
  const { toast } = useToast();
  const {
    isRecording,
    isPaused,
    duration,
    formattedDuration,
    audioBlob,
    error,
    isSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    saveRecording,
    discardRecording,
  } = useEmergencyRecording(sosLogId);

  // Auto-start recording if enabled
  useEffect(() => {
    if (autoStart && isSupported && !isRecording && !audioBlob) {
      startRecording();
    }
  }, [autoStart, isSupported]);

  // Auto-stop when max duration reached
  useEffect(() => {
    if (isRecording && duration >= maxDuration) {
      stopRecording();
      toast({
        title: "Recording limit reached",
        description: `Maximum recording duration of ${Math.floor(maxDuration / 60)} minutes reached.`,
      });
    }
  }, [duration, maxDuration, isRecording, stopRecording, toast]);

  const handleSave = async () => {
    const recording = await saveRecording();
    if (recording) {
      toast({
        title: "Recording saved",
        description: "Emergency audio has been saved for responders.",
      });
      onRecordingSaved?.(recording.recording_url);
    } else {
      toast({
        title: "Save failed",
        description: error || "Could not save recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDiscard = () => {
    discardRecording();
    toast({
      title: "Recording discarded",
      description: "Audio recording has been deleted.",
    });
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Audio recording not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = (duration / maxDuration) * 100;

  return (
    <Card className="shadow-elevated border-primary/20">
      <CardHeader className="py-3 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          Emergency Audio Recording
          {isRecording && (
            <Badge variant="destructive" className="ml-auto animate-pulse">
              <span className="mr-1">●</span> REC
            </Badge>
          )}
          {audioBlob && !isRecording && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Duration and progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-mono font-bold text-lg">{formattedDuration}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>{Math.floor(maxDuration / 60)}:00 max</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              className="flex-1 gap-2"
              variant="default"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                onClick={isPaused ? resumeRecording : pauseRecording}
                variant="secondary"
                className="flex-1 gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1 gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button
                onClick={handleSave}
                variant="default"
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={handleDiscard}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Discard
              </Button>
            </>
          )}
        </div>

        {/* Audio preview */}
        {audioBlob && !isRecording && (
          <div className="pt-2">
            <audio 
              controls 
              className="w-full h-10" 
              src={URL.createObjectURL(audioBlob)}
            />
          </div>
        )}

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center">
          {isRecording
            ? isPaused
              ? "Recording paused. Tap Resume to continue."
              : "Recording in progress. Capture important details for responders."
            : audioBlob
            ? "Review your recording before saving."
            : "Record emergency details for first responders."}
        </p>
      </CardContent>
    </Card>
  );
}
