import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SOSButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative grid place-items-center">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-full bg-sos blur-xl",
          "animate-pulse-glow",
        )}
        aria-hidden="true"
      />
      <Button
        type="button"
        variant="sos"
        size="xl"
        onClick={onClick}
        className={cn(
          "h-44 w-44 rounded-full",
          "text-lg font-semibold",
          "shadow-sos",
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:rounded-full before:bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.35),transparent_55%)]",
        )}
      >
        SOS
      </Button>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Tap for emergency assistance
      </p>
    </div>
  );
}
