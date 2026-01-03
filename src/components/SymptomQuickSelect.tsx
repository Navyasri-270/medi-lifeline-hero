import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Wind, 
  Droplets, 
  Brain, 
  Flame, 
  AlertTriangle,
  Check,
  X
} from "lucide-react";

export type QuickSymptom = {
  id: string;
  label: string;
  icon: React.ReactNode;
  severity: "critical" | "high" | "moderate";
};

const QUICK_SYMPTOMS: QuickSymptom[] = [
  { id: "chest_pain", label: "Chest Pain", icon: <Heart className="h-4 w-4" />, severity: "critical" },
  { id: "breathing", label: "Shortness of Breath", icon: <Wind className="h-4 w-4" />, severity: "critical" },
  { id: "bleeding", label: "Severe Bleeding", icon: <Droplets className="h-4 w-4" />, severity: "critical" },
  { id: "unconscious", label: "Unconsciousness", icon: <Brain className="h-4 w-4" />, severity: "critical" },
  { id: "burns", label: "Burns", icon: <Flame className="h-4 w-4" />, severity: "high" },
  { id: "trauma", label: "Accident / Trauma", icon: <AlertTriangle className="h-4 w-4" />, severity: "high" },
];

interface SymptomQuickSelectProps {
  onSymptomsChange: (symptoms: string[]) => void;
  selectedSymptoms?: string[];
  compact?: boolean;
}

export function SymptomQuickSelect({ 
  onSymptomsChange, 
  selectedSymptoms = [],
  compact = false 
}: SymptomQuickSelectProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedSymptoms));

  const toggleSymptom = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    onSymptomsChange(Array.from(newSelected));
  };

  const clearAll = () => {
    setSelected(new Set());
    onSymptomsChange([]);
  };

  const getSeverityColor = (severity: QuickSymptom["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-destructive/50 bg-destructive/5 hover:bg-destructive/10 data-[selected=true]:bg-destructive data-[selected=true]:text-destructive-foreground";
      case "high":
        return "border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white";
      case "moderate":
        return "border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/10 data-[selected=true]:bg-yellow-500 data-[selected=true]:text-white";
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {QUICK_SYMPTOMS.map((symptom) => (
          <Badge
            key={symptom.id}
            variant="outline"
            className={`cursor-pointer transition-all ${getSeverityColor(symptom.severity)} ${
              selected.has(symptom.id) ? "ring-2 ring-offset-1" : ""
            }`}
            data-selected={selected.has(symptom.id)}
            onClick={() => toggleSymptom(symptom.id)}
          >
            {symptom.icon}
            <span className="ml-1">{symptom.label}</span>
            {selected.has(symptom.id) && <Check className="h-3 w-3 ml-1" />}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Quick Symptom Selection
          </CardTitle>
          {selected.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear ({selected.size})
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Select symptoms to include in your emergency alert
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_SYMPTOMS.map((symptom) => (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              data-selected={selected.has(symptom.id)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${getSeverityColor(symptom.severity)}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/50">
                {symptom.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{symptom.label}</p>
                <p className="text-[10px] uppercase tracking-wide opacity-70">
                  {symptom.severity}
                </p>
              </div>
              {selected.has(symptom.id) && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-muted/50 border">
            <p className="text-xs font-medium mb-1">Selected symptoms:</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(selected).map((id) => {
                const symptom = QUICK_SYMPTOMS.find((s) => s.id === id);
                return symptom ? (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {symptom.label}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function getSymptomLabels(ids: string[]): string[] {
  return ids
    .map((id) => QUICK_SYMPTOMS.find((s) => s.id === id)?.label)
    .filter((label): label is string => !!label);
}
