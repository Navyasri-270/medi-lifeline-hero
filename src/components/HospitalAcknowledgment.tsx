import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, AlertTriangle, Ambulance } from "lucide-react";
import type { Hospital } from "@/state/medisos-types";

type AckStatus = "pending" | "acknowledged" | "dispatching" | "en_route";

type HospitalAck = {
  hospital: Hospital;
  status: AckStatus;
  eta?: number; // minutes
  updatedAt: Date;
};

const statusConfig: Record<AckStatus, { label: string; icon: typeof Check; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-muted-foreground" },
  acknowledged: { label: "Received", icon: Check, color: "text-primary" },
  dispatching: { label: "Dispatching", icon: AlertTriangle, color: "text-amber-500" },
  en_route: { label: "En Route", icon: Ambulance, color: "text-green-600" },
};

export function HospitalAcknowledgment({ hospitals }: { hospitals: Hospital[] }) {
  const [acks, setAcks] = useState<HospitalAck[]>(() =>
    hospitals.slice(0, 3).map((h) => ({
      hospital: h,
      status: "pending",
      updatedAt: new Date(),
    }))
  );

  // Simulate hospital responses
  useEffect(() => {
    const timers: number[] = [];

    acks.forEach((ack, i) => {
      // First hospital acknowledges quickly
      timers.push(
        window.setTimeout(() => {
          setAcks((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, status: "acknowledged", updatedAt: new Date() } : a
            )
          );
        }, 2000 + i * 1500)
      );

      // First hospital starts dispatching
      if (i === 0) {
        timers.push(
          window.setTimeout(() => {
            setAcks((prev) =>
              prev.map((a, idx) =>
                idx === 0 ? { ...a, status: "dispatching", updatedAt: new Date() } : a
              )
            );
          }, 5000)
        );

        // First hospital en route
        timers.push(
          window.setTimeout(() => {
            setAcks((prev) =>
              prev.map((a, idx) =>
                idx === 0 ? { ...a, status: "en_route", eta: 8, updatedAt: new Date() } : a
              )
            );
          }, 8000)
        );
      }
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Ambulance className="h-5 w-5 text-primary" />
          Hospital Response
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {acks.map((ack) => {
          const config = statusConfig[ack.status];
          const Icon = config.icon;

          return (
            <div
              key={ack.hospital.id}
              className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{ack.hospital.name}</div>
                <div className="text-xs text-muted-foreground">{ack.hospital.address}</div>
              </div>
              <div className="flex items-center gap-2">
                {ack.eta && (
                  <Badge variant="secondary" className="text-xs">
                    ETA {ack.eta} min
                  </Badge>
                )}
                <div className={`flex items-center gap-1.5 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{config.label}</span>
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground text-center pt-1">
          Demo: Status updates are simulated
        </p>
      </CardContent>
    </Card>
  );
}
