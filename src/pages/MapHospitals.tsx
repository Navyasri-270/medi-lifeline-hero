import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap } from "@/components/LeafletMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useMediSOS } from "@/state/MediSOSProvider";
import type { GeoPoint } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";
import { LocateFixed, PhoneCall } from "lucide-react";

function dist(a: GeoPoint, b: GeoPoint) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function MapHospitals() {
  useSeo({
    title: "Nearby Hospitals Map – Smart MediSOS",
    description: "Find nearby hospitals and pharmacies (OpenStreetMap demo).",
    canonicalPath: "/map",
  });

  const nav = useNavigate();
  const { hospitals } = useMediSOS();
  const { point } = useGeolocation();
  const [center, setCenter] = useState<GeoPoint>({ lat: 17.385044, lng: 78.486671 });

  const user = point ?? center;

  const sorted = useMemo(() => {
    return [...hospitals].sort((x, y) => dist(user, x.location) - dist(user, y.location));
  }, [hospitals, user]);

  return (
    <MobilePage
      title="Hospitals Map"
      action={
        <Button variant="outline" onClick={() => nav(-1)}>
          Back
        </Button>
      }
    >
      <section className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (point) setCenter(point);
            }}
          >
            <LocateFixed className="h-4 w-4" /> Show My Location
          </Button>
          <Button
            variant="sos"
            className="w-full"
            onClick={() => {
              // Demo: just re-renders markers
              setCenter(user);
            }}
          >
            Find Nearest
          </Button>
        </div>

        <LeafletMap
          center={center}
          markers={[
            { id: "me", point: user, label: "You", description: "Current position" },
            ...sorted.slice(0, 6).map((h) => ({
              id: h.id,
              point: h.location,
              label: h.name,
              description: h.address,
              action: (
                <Button variant="secondary" onClick={() => (window.location.href = `tel:${h.phone}`)}>
                  <PhoneCall className="h-4 w-4" /> Call Now
                </Button>
              ),
            })),
          ]}
          heightClassName="h-[22rem]"
        />

        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Nearest responders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sorted.slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
                <div>
                  <div className="text-sm font-semibold">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.address}</div>
                </div>
                <Button variant="outline" onClick={() => (window.location.href = `tel:${h.phone}`)}>
                  Call
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}
