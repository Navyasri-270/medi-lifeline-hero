import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/I18nProvider";
import { Briefcase, Volume2, VolumeX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  startHour?: number;
  endHour?: number;
  onScheduleChange?: (start: number, end: number) => void;
  className?: string;
}

export function WorkModeToggle({ 
  enabled, 
  onToggle, 
  startHour = 9, 
  endHour = 17,
  className 
}: WorkModeToggleProps) {
  const { t } = useI18n();
  
  const isWithinSchedule = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= startHour && hour < endHour;
  };

  const autoActive = enabled && isWithinSchedule();

  return (
    <Card className={cn("shadow-elevated", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-full p-2 transition-colors",
              autoActive ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
            )}>
              {autoActive ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {t("workMode")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {autoActive ? t("workModeActive") : t("workModeDesc")}
              </p>
            </div>
          </div>
          <Switch 
            checked={enabled} 
            onCheckedChange={onToggle}
            aria-label={t("workMode")}
          />
        </div>
        
        {enabled && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Active {startHour}:00 - {endHour}:00 (auto-scheduled)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
