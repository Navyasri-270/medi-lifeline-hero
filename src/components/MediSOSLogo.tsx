import { cn } from "@/lib/utils";

export function MediSOSLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="Smart MediSOS">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl bg-sos shadow-sos"
        aria-hidden="true"
      >
        <div className="relative h-4 w-4">
          <span className="absolute inset-0 rounded-sm bg-primary-foreground/90" />
          <span className="absolute left-1/2 top-0 h-full w-[5px] -translate-x-1/2 rounded-sm bg-primary" />
          <span className="absolute top-1/2 left-0 h-[5px] w-full -translate-y-1/2 rounded-sm bg-primary" />
        </div>
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg">Smart MediSOS</div>
        <div className="text-xs text-muted-foreground">Your Mobile Lifeline</div>
      </div>
    </div>
  );
}
