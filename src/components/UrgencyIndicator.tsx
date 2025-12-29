import { cn } from "@/lib/utils";
import type { UrgencyLevel } from "@/state/medisos-types";
import { AlertTriangle, Clock, Heart } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

interface UrgencyIndicatorProps {
  urgency: UrgencyLevel;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const urgencyConfig = {
  EMERGENCY: {
    bg: "bg-red-500/10",
    border: "border-red-500",
    text: "text-red-600",
    icon: AlertTriangle,
    pulse: true,
  },
  CONSULT_SOON: {
    bg: "bg-orange-500/10",
    border: "border-orange-500",
    text: "text-orange-600",
    icon: Clock,
    pulse: false,
  },
  MONITOR: {
    bg: "bg-green-500/10",
    border: "border-green-500",
    text: "text-green-600",
    icon: Heart,
    pulse: false,
  },
};

const sizeConfig = {
  sm: { container: "px-2 py-1", icon: "h-3 w-3", text: "text-xs" },
  md: { container: "px-3 py-1.5", icon: "h-4 w-4", text: "text-sm" },
  lg: { container: "px-4 py-2", icon: "h-5 w-5", text: "text-base" },
};

export function UrgencyIndicator({ 
  urgency, 
  showLabel = true, 
  size = "md",
  className 
}: UrgencyIndicatorProps) {
  const { t } = useI18n();
  const config = urgencyConfig[urgency];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const labels = {
    EMERGENCY: t("urgencyEmergency"),
    CONSULT_SOON: t("urgencyConsult"),
    MONITOR: t("urgencyMonitor"),
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 font-medium",
        config.bg,
        config.border,
        config.text,
        sizes.container,
        config.pulse && "animate-pulse",
        className
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span className={sizes.text}>{labels[urgency]}</span>}
    </div>
  );
}
