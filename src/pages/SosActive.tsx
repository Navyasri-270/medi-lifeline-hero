import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap } from "@/components/LeafletMap";
import { HospitalAcknowledgment } from "@/components/HospitalAcknowledgment";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import type { GeoPoint } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";
import { PhoneCall, Send, X } from "lucide-react";

function nearest(from: GeoPoint, points: GeoPoint[]) {
  let best = points[0];
  let bestD = Infinity;
  for (const p of points) {
    const dx = from.lat - p.lat;
    const dy = from.lng - p.lng;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export default function SosActive() {
  useSeo({
    title: "SOS Active – Smart MediSOS",
    description: "Active SOS screen with live location, countdown timer, and actions.",
    canonicalPath: "/sos",
  });

  const nav = useNavigate();
  const { toast } = useToast();
  const { contacts, hospitals, settings } = useMediSOS();
  const { point } = useGeolocation();
  const [seconds, setSeconds] = useState(20);

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    navigator.vibrate?.([220, 120, 220]);
  }, []);

  const me = point ?? { lat: 17.385044, lng: 78.486671 };
  const polyline = useMemo(() => {
    const target = nearest(me, hospitals.map((h) => h.location));
    return [me, target];
  }, [hospitals, me]);

  const defaultContacts = useMemo(() => contacts.filter((c) => c.isDefault), [contacts]);

  const notify = () => {
    toast({ title: "Notified (demo)", description: settings.smsOnSos ? "SMS queued" : "Push queued" });
    speak("Emergency contacts notified.");
  };

  return (
    <MobilePage
      title="SOS Active"
      action={
        <Button variant="outline" onClick={() => nav("/home")}>
          Home
        </Button>
      }
    >
      <section className="space-y-3">
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Countdown</CardTitle>
              <div className="text-2xl font-semibold tabular-nums text-primary">{seconds}s</div>
            </div>
            <p className="text-sm text-muted-foreground">Demo: routing + notifications are placeholders.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "tel:108")}> 
              <PhoneCall className="h-4 w-4" /> 108
            </Button>
            <Button variant="secondary" onClick={notify}>
              <Send className="h-4 w-4" /> Notify
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast({ title: "SOS cancelled", description: "Returning to Home." });
                nav("/home");
              }}
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
          </CardContent>
        </Card>

        <LeafletMap
          center={me}
          polyline={polyline}
          markers={[
            { id: "me", point: me, label: "Patient", description: "Live location" },
            ...hospitals.slice(0, 3).map((h) => ({ id: h.id, point: h.location, label: h.name, description: h.address })),
          ]}
          heightClassName="h-[20rem]"
          trackUser={true}
        />

        <HospitalAcknowledgment hospitals={hospitals} />

        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contacts Notified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {defaultContacts.length ? (
              defaultContacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border bg-card p-3">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Queued</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No default contacts set.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}
