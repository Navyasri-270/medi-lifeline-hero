import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap, type MapMarker } from "@/components/LeafletMap";
import { HospitalList } from "@/components/HospitalList";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { getHospitalsWithAvailability } from "@/data/hospitals";
import type { GeoPoint } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";
import { 
  LocateFixed, 
  Ambulance, 
  Clock, 
  AlertCircle,
  MapPin
} from "lucide-react";

const MAX_DISTANCE_KM = 10;

export default function MapHospitals() {
  useSeo({
    title: "Nearby Hospitals Map – Medi SOS",
    description: "Find nearby hospitals and ambulances within 10km using OpenStreetMap.",
    canonicalPath: "/map",
  });

  const nav = useNavigate();
  const { point, error: geoError } = useGeolocation();
  const [center, setCenter] = useState<GeoPoint>({ lat: 17.385044, lng: 78.486671 });

  const user = point ?? center;

  // Get hospitals within 10km
  const nearbyHospitals = useMemo(() => {
    return getHospitalsWithAvailability(user.lat, user.lng, MAX_DISTANCE_KM);
  }, [user.lat, user.lng]);

  // Ambulance tracking (not active on map page, just for display)
  const { ambulances } = useAmbulanceTracking(point, !!point);

  // Update center when GPS is available
  useEffect(() => {
    if (point) {
      setCenter(point);
    }
  }, [point]);

  // Prepare map markers
  const mapMarkers = useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [
      { 
        id: "me", 
        point: user, 
        label: "You", 
        description: "Current position",
        icon: "user"
      },
    ];

    // Add hospitals (up to 10)
    nearbyHospitals.slice(0, 10).forEach((h) => {
      markers.push({
        id: h.id,
        point: h.location,
        label: h.name,
        description: `${(h.distance ?? 0).toFixed(1)} km`,
        icon: "hospital"
      });
    });

    // Add ambulances
    ambulances.slice(0, 3).forEach((a) => {
      markers.push({
        id: a.id,
        point: a.location,
        label: `Ambulance ${a.id.split("-")[1]}`,
        description: `ETA: ${a.eta} min`,
        icon: "ambulance"
      });
    });

    return markers;
  }, [user, nearbyHospitals, ambulances]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "on_the_way": return "bg-amber-500";
      case "dispatched": return "bg-blue-500";
      default: return "bg-red-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "on_the_way": return "On the way";
      case "dispatched": return "Dispatched";
      case "en_route": return "En Route";
      default: return "Busy";
    }
  };

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
        {/* GPS Status */}
        {geoError && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="py-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">GPS Error: {geoError}</span>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 gap-2"
            onClick={() => {
              if (point) setCenter(point);
            }}
          >
            <LocateFixed className="h-4 w-4" /> My Location
          </Button>
          <Button
            variant="sos"
            className="flex-1 gap-2"
            onClick={() => nav("/sos")}
          >
            <MapPin className="h-4 w-4" /> Start SOS
          </Button>
        </div>

        {/* Map */}
        <LeafletMap
          center={center}
          trackUser={true}
          markers={mapMarkers}
          heightClassName="h-[24rem]"
          showFallback={true}
        />

        {/* Ambulances */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-primary" />
              Nearby Ambulances
              <Badge variant="outline" className="ml-auto text-xs">
                {ambulances.length} available
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ambulances.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {point ? "Locating nearby ambulances..." : "Waiting for GPS location..."}
              </div>
            ) : (
              ambulances.map((amb) => (
                <div 
                  key={amb.id} 
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(amb.status)}`} />
                      <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor(amb.status)} animate-ping opacity-50`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Ambulance {amb.id.split("-")[1]}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getStatusLabel(amb.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {amb.distance.toFixed(1)} km away
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-semibold">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {amb.eta} min
                    </div>
                    <p className="text-xs text-muted-foreground">ETA</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Hospitals List (always visible as fallback) */}
        <HospitalList
          hospitals={nearbyHospitals}
          userLocation={point}
          maxDisplay={15}
          compact={false}
        />
      </section>
    </MobilePage>
  );
}
