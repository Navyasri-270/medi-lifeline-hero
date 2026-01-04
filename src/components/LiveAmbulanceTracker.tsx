import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ambulance, Clock, MapPin, Phone, Navigation, User } from "lucide-react";
import type { TrackedAmbulance, AmbulanceStatus } from "@/hooks/useAmbulanceTracking";

interface LiveAmbulanceTrackerProps {
  ambulance: TrackedAmbulance | null;
  onCall?: (phone: string) => void;
  onArrival?: () => void;
}

const statusConfig: Record<AmbulanceStatus, { color: string; label: string; bgColor: string }> = {
  dispatched: { color: "bg-amber-500", label: "Dispatched", bgColor: "bg-amber-500/10" },
  en_route: { color: "bg-blue-500", label: "En Route", bgColor: "bg-blue-500/10" },
  arriving: { color: "bg-green-500", label: "Almost There!", bgColor: "bg-green-500/10" },
  arrived: { color: "bg-green-600", label: "Arrived", bgColor: "bg-green-600/10" },
};

export function LiveAmbulanceTracker({ ambulance, onCall, onArrival }: LiveAmbulanceTrackerProps) {
  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);

  useEffect(() => {
    if (ambulance?.status === "arrived" && !hasNotifiedArrival) {
      setHasNotifiedArrival(true);
      onArrival?.();
    }
  }, [ambulance?.status, hasNotifiedArrival, onArrival]);

  if (!ambulance) {
    return (
      <Card className="shadow-elevated animate-pulse">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Ambulance className="h-6 w-6" />
            <p>Locating nearest ambulance...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[ambulance.status];
  const progress = Math.max(0, Math.min(100, 100 - (ambulance.eta / 15) * 100));

  return (
    <Card className={`shadow-elevated overflow-hidden border-2 ${ambulance.status === "arriving" || ambulance.status === "arrived" ? "border-green-500" : "border-primary/30"}`}>
      {/* Status bar */}
      <div className={`h-1.5 ${config.color} transition-colors duration-300`} />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="relative">
            <div className={`h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <Ambulance className="h-5 w-5 text-primary" />
            </div>
            {ambulance.status !== "arrived" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${config.color}`} />
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{ambulance.id}</span>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {ambulance.vehicleNumber}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold tabular-nums text-primary">
              {ambulance.status === "arrived" ? (
                <span className="text-green-600">Here!</span>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  {ambulance.eta}
                  <span className="text-sm font-normal text-muted-foreground">min</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">ETA</p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Distance: {ambulance.distance.toFixed(1)} km</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>

        {/* Driver info */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{ambulance.driverName}</p>
            <p className="text-xs text-muted-foreground">EMT Driver</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCall?.(ambulance.phone)}
            className="gap-1"
          >
            <Phone className="h-3 w-3" />
            Call
          </Button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-2.5 text-sm">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{ambulance.distance.toFixed(2)} km away</span>
          </div>
          <Button variant="secondary" size="sm" className="w-full gap-1" asChild>
            <a href="tel:108">
              <Phone className="h-4 w-4" />
              Call 108
            </a>
          </Button>
        </div>

        {/* Coordinates */}
        <p className="text-xs text-center text-muted-foreground">
          📍 Ambulance at: {ambulance.location.lat.toFixed(5)}, {ambulance.location.lng.toFixed(5)}
        </p>
      </CardContent>
    </Card>
  );
}
