import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Severity } from "@/state/medisos-types";

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const tone =
    severity === "critical" || severity === "high"
      ? "bg-destructive text-destructive-foreground"
      : severity === "moderate"
        ? "bg-secondary text-secondary-foreground"
        : "bg-accent text-accent-foreground";

  return <Badge className={cn("capitalize", tone, className)}>{severity}</Badge>;
}
