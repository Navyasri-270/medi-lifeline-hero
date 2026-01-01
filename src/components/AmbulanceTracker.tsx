import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Ambulance, Clock, MapPin, Phone } from "lucide-react";
import { Button } from "./ui/button";

interface AmbulanceTrackerProps {
  isActive: boolean;
  onArrival?: () => void;
}

export function AmbulanceTracker({ isActive, onArrival }: AmbulanceTrackerProps) {
  const [eta, setEta] = useState(12); // minutes
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"dispatched" | "en_route" | "arriving" | "arrived">("dispatched");

  useEffect(() => {
    if (!isActive) return;

    // Simulate ambulance progress
    const interval = setInterval(() => {
      setEta((prev) => {
        if (prev <= 1) {
          setStatus("arrived");
          onArrival?.();
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });

      setProgress((prev) => {
        const newProgress = Math.min(100, prev + 8);
        if (newProgress >= 90) setStatus("arriving");
        else if (newProgress >= 20) setStatus("en_route");
        return newProgress;
      });
    }, 5000); // Update every 5 seconds for demo

    return () => clearInterval(interval);
  }, [isActive, onArrival]);

  const statusColors = {
    dispatched: "bg-yellow-500",
    en_route: "bg-blue-500",
    arriving: "bg-green-500",
    arrived: "bg-green-600",
  };

  const statusLabels = {
    dispatched: "Ambulance Dispatched",
    en_route: "En Route to Location",
    arriving: "Almost There",
    arrived: "Ambulance Arrived",
  };

  return (
    <Card className="shadow-elevated overflow-hidden">
      <div className={`h-1 ${statusColors[status]} transition-colors`} />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Ambulance className="h-6 w-6 text-primary" />
              </div>
              {status !== "arrived" && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold">{statusLabels[status]}</p>
              <p className="text-xs text-muted-foreground">
                Unit: AMB-{Math.floor(Math.random() * 900) + 100}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold tabular-nums">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {eta} min
            </div>
            <p className="text-xs text-muted-foreground">ETA</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">2.4 km away</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href="tel:108">
              <Phone className="h-4 w-4 mr-1" />
              Call 108
            </a>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Real-time tracking • Driver: Raju K. • Contact: 108
        </p>
      </CardContent>
    </Card>
  );
}
