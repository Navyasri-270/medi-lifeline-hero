import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Ambulance, HeartPulse, Brain, AlertTriangle, Flame, Car } from "lucide-react";

export type EmergencyType = 
  | "general"
  | "accident"
  | "heart_attack"
  | "stroke"
  | "breathing"
  | "burn";

interface EmergencyTypeOption {
  type: EmergencyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const emergencyTypes: EmergencyTypeOption[] = [
  { type: "general", label: "General Emergency", icon: AlertTriangle, color: "bg-destructive" },
  { type: "accident", label: "Accident", icon: Car, color: "bg-orange-500" },
  { type: "heart_attack", label: "Heart Attack", icon: HeartPulse, color: "bg-red-600" },
  { type: "stroke", label: "Stroke", icon: Brain, color: "bg-purple-600" },
  { type: "breathing", label: "Breathing Issue", icon: Ambulance, color: "bg-blue-600" },
  { type: "burn", label: "Burn/Fire", icon: Flame, color: "bg-amber-600" },
];

interface EmergencyTypeSelectorProps {
  selected: EmergencyType;
  onSelect: (type: EmergencyType) => void;
}

export function EmergencyTypeSelector({ selected, onSelect }: EmergencyTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {emergencyTypes.map(({ type, label, icon: Icon, color }) => (
        <Button
          key={type}
          variant={selected === type ? "default" : "outline"}
          className={cn(
            "flex h-auto flex-col items-center gap-2 py-3 transition-all",
            selected === type && color
          )}
          onClick={() => onSelect(type)}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}

export function getEmergencyLabel(type: EmergencyType): string {
  return emergencyTypes.find((e) => e.type === type)?.label || "Emergency";
}
