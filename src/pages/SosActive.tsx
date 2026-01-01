import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap } from "@/components/LeafletMap";
import { HospitalAcknowledgment } from "@/components/HospitalAcknowledgment";
import { LiveTrackingLink } from "@/components/LiveTrackingLink";
import { SMSAlertSimulator } from "@/components/SMSAlertSimulator";
import { AmbulanceTracker } from "@/components/AmbulanceTracker";
import { getEmergencyLabel, type EmergencyType } from "@/components/EmergencyTypeSelector";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import type { GeoPoint } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";
import { PhoneCall, Send, X, AlertTriangle } from "lucide-react";

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
  const location = useLocation();
  const { toast } = useToast();
  const { contacts, hospitals, settings, profile } = useMediSOS();
  const { point } = useGeolocation();
  const [seconds, setSeconds] = useState(20);
  
  const emergencyType = (location.state?.emergencyType as EmergencyType) || "general";

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!settings.workModeEnabled) {
      navigator.vibrate?.([220, 120, 220]);
    }
  }, [settings.workModeEnabled]);

  const me = point ?? { lat: 17.385044, lng: 78.486671 };
  const polyline = useMemo(() => {
    const target = nearest(me, hospitals.map((h) => h.location));
    return [me, target];
  }, [hospitals, me]);

  const defaultContacts = useMemo(() => contacts.filter((c) => c.isDefault), [contacts]);

  const handleCallContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const notify = () => {
    toast({ title: "Notified (demo)", description: settings.smsOnSos ? "SMS queued" : "Push queued" });
    if (!settings.workModeEnabled) {
      speak("Emergency contacts notified.");
    }
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
        {/* Emergency Type Banner */}
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">{getEmergencyLabel(emergencyType)}</p>
              <p className="text-xs text-destructive/80">Emergency services alerted</p>
            </div>
            <div className="ml-auto text-2xl font-bold tabular-nums text-destructive">{seconds}s</div>
          </CardContent>
        </Card>

        {/* Ambulance Tracker */}
        <AmbulanceTracker isActive={true} />

        {/* Action Buttons */}
        <Card className="shadow-elevated">
          <CardContent className="py-3 grid grid-cols-3 gap-2">
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

        {/* Live Tracking Link */}
        <LiveTrackingLink location={point} userName={profile.name} />

        {/* Map */}
        <LeafletMap
          center={me}
          polyline={polyline}
          markers={[
            { id: "me", point: me, label: "Patient", description: "Live location" },
            ...hospitals.slice(0, 3).map((h) => ({ id: h.id, point: h.location, label: h.name, description: h.address })),
          ]}
          heightClassName="h-[16rem]"
          trackUser={true}
        />

        {/* SMS Alert Preview */}
        <SMSAlertSimulator
          contacts={contacts}
          location={point}
          emergencyType={emergencyType}
          userName={profile.name || "Guest"}
          onCallContact={handleCallContact}
        />

        <HospitalAcknowledgment hospitals={hospitals} />
      </section>
    </MobilePage>
  );
}