import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Plus, X, Globe, Volume2 } from "lucide-react";

export type VoiceLanguage = "en-IN" | "hi-IN" | "te-IN";

interface VoiceSOSSettingsProps {
  enabled: boolean;
  language: VoiceLanguage;
  customTriggers: string[];
  onEnabledChange: (enabled: boolean) => void;
  onLanguageChange: (lang: VoiceLanguage) => void;
  onTriggersChange: (triggers: string[]) => void;
}

const DEFAULT_TRIGGERS: Record<VoiceLanguage, string[]> = {
  "en-IN": ["help", "help me", "sos", "emergency", "urgent"],
  "hi-IN": ["madad", "bachao", "emergency", "help"],
  "te-IN": ["help", "sahayam", "emergency", "apattu"],
};

const LANGUAGE_OPTIONS = [
  { value: "en-IN", label: "English", flag: "🇮🇳" },
  { value: "hi-IN", label: "हिंदी (Hindi)", flag: "🇮🇳" },
  { value: "te-IN", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
];

export function VoiceSOSSettings({
  enabled,
  language,
  customTriggers,
  onEnabledChange,
  onLanguageChange,
  onTriggersChange,
}: VoiceSOSSettingsProps) {
  const [newTrigger, setNewTrigger] = useState("");

  const allTriggers = [...DEFAULT_TRIGGERS[language], ...customTriggers];

  const addTrigger = () => {
    const trimmed = newTrigger.trim().toLowerCase();
    if (trimmed && !allTriggers.includes(trimmed)) {
      onTriggersChange([...customTriggers, trimmed]);
      setNewTrigger("");
    }
  };

  const removeTrigger = (trigger: string) => {
    onTriggersChange(customTriggers.filter((t) => t !== trigger));
  };

  const testVoice = () => {
    if ("speechSynthesis" in window) {
      const msg = language === "hi-IN" 
        ? "वॉयस एक्टिवेशन टेस्ट" 
        : language === "te-IN"
        ? "వాయిస్ యాక్టివేషన్ టెస్ట్"
        : "Voice activation test successful";
      
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          Voice-Activated SOS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="voice-sos" className="text-sm font-medium">
              Enable Voice SOS
            </Label>
            <p className="text-xs text-muted-foreground">
              Trigger SOS using voice commands
            </p>
          </div>
          <Switch
            id="voice-sos"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        {enabled && (
          <>
            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Voice Language
              </Label>
              <Select value={language} onValueChange={(v) => onLanguageChange(v as VoiceLanguage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {opt.flag} {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Phrases */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Trigger Phrases</Label>
              <p className="text-xs text-muted-foreground">
                Say any of these words to trigger SOS
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {DEFAULT_TRIGGERS[language].map((trigger) => (
                  <Badge key={trigger} variant="secondary" className="text-xs">
                    "{trigger}"
                  </Badge>
                ))}
                {customTriggers.map((trigger) => (
                  <Badge 
                    key={trigger} 
                    variant="outline" 
                    className="text-xs flex items-center gap-1"
                  >
                    "{trigger}"
                    <button
                      onClick={() => removeTrigger(trigger)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add Custom Trigger */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add custom phrase..."
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTrigger()}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addTrigger}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Test Voice */}
            <Button variant="secondary" className="w-full" onClick={testVoice}>
              <Volume2 className="h-4 w-4 mr-2" />
              Test Voice Output
            </Button>

            {/* Background Mode Notice */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Background Support</p>
              <p>
                Voice detection works when the app is in the foreground. 
                For background detection, keep the app running and ensure 
                microphone permissions are granted.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
