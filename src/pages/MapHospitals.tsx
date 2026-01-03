import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap } from "@/components/LeafletMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getHospitalsWithAvailability, haversineDistance } from "@/data/hospitals";
import type { GeoPoint, Hospital } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";
import { LocateFixed, PhoneCall, Ambulance, Clock, MapPin, Navigation, AlertCircle, Building2 } from "lucide-react";

const MAX_DISTANCE_KM = 10;

type AmbulanceMarker = {
  id: string;
  location: GeoPoint;
  status: "available" | "on_the_way" | "busy";
  eta: number; // minutes
};

// Generate mock ambulances near user location
function generateMockAmbulances(userLat: number, userLng: number): AmbulanceMarker[] {
  return [
    {
      id: "amb-1",
      location: { lat: userLat + 0.01, lng: userLng + 0.008 },
      status: "available",
      eta: 5,
    },
    {
      id: "amb-2",
      location: { lat: userLat - 0.008, lng: userLng + 0.012 },
      status: "on_the_way",
      eta: 8,
    },
    {
      id: "amb-3",
      location: { lat: userLat + 0.015, lng: userLng - 0.01 },
      status: "available",
      eta: 12,
    },
  ];
}

export default function MapHospitals() {
  useSeo({
    title: "Nearby Hospitals Map – Medi SOS",
    description: "Find nearby hospitals and ambulances within 10km using OpenStreetMap.",
    canonicalPath: "/map",
  });

  const nav = useNavigate();
  const { point, error: geoError } = useGeolocation();
  const [center, setCenter] = useState<GeoPoint>({ lat: 17.385044, lng: 78.486671 });
  const [ambulances, setAmbulances] = useState<AmbulanceMarker[]>([]);
  const [mapError, setMapError] = useState(false);

  const user = point ?? center;

  // Get hospitals within 10km using real calculation
  const nearbyHospitals = useMemo(() => {
    return getHospitalsWithAvailability(user.lat, user.lng, MAX_DISTANCE_KM);
  }, [user.lat, user.lng]);

  // Generate ambulances when user location is available
  useEffect(() => {
    if (point) {
      setAmbulances(generateMockAmbulances(point.lat, point.lng));
      setCenter(point);
    }
  }, [point]);

  // Simulate ambulance movement
  useEffect(() => {
    if (ambulances.length === 0) return;
    
    const interval = setInterval(() => {
      setAmbulances(prev => prev.map(amb => ({
        ...amb,
        location: {
          lat: amb.location.lat + (Math.random() - 0.5) * 0.002,
          lng: amb.location.lng + (Math.random() - 0.5) * 0.002,
        },
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [ambulances.length]);

  const getStatusColor = (status: AmbulanceMarker["status"]) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "on_the_way": return "bg-amber-500";
      case "busy": return "bg-red-500";
    }
  };

  const getStatusLabel = (status: AmbulanceMarker["status"]) => {
    switch (status) {
      case "available": return "Available";
      case "on_the_way": return "On the way";
      case "busy": return "Busy";
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (point) setCenter(point);
            }}
          >
            <LocateFixed className="h-4 w-4" /> My Location
          </Button>
          <Button
            variant="sos"
            className="w-full"
            onClick={() => {
              if (point) setCenter(point);
            }}
          >
            Find Nearest
          </Button>
        </div>

        <LeafletMap
          center={center}
          trackUser={true}
          markers={[
            { id: "me", point: user, label: "You", description: "Current position" },
            ...nearbyHospitals.slice(0, 8).map((h) => ({
              id: h.id,
              point: h.location,
              label: `🏥 ${h.name}`,
              description: `${(h.distance ?? 0).toFixed(1)} km`,
            })),
            ...ambulances.map((a) => ({
              id: a.id,
              point: a.location,
              label: `🚑 ${getStatusLabel(a.status)}`,
              description: `ETA: ${a.eta} min`,
            })),
          ]}
          heightClassName="h-[22rem]"
        />

        {/* Ambulances */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-primary" />
              Nearby Ambulances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ambulances.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Waiting for location...
              </p>
            ) : (
              ambulances.map((amb) => (
                <div key={amb.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(amb.status)} animate-pulse`} />
                    <div>
                      <div className="text-sm font-medium">Ambulance {amb.id.split("-")[1]}</div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {getStatusLabel(amb.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Clock className="h-3 w-3" />
                      {amb.eta} min
                    </div>
                    <p className="text-xs text-muted-foreground">ETA</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Hospitals within 10km - Scrollable List */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Hospitals within {MAX_DISTANCE_KM}km
              <Badge variant="outline" className="ml-auto">
                {nearbyHospitals.length} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {nearbyHospitals.length === 0 ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hospitals found within {MAX_DISTANCE_KM}km
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {geoError ? `Location error: ${geoError}` : "Waiting for location..."}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-2">
                  {nearbyHospitals.map((h, index) => (
                    <div 
                      key={h.id} 
                      className={`flex items-center justify-between gap-3 rounded-xl border bg-card p-3 ${
                        index === 0 ? "border-primary/50 bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                          <span className="text-sm font-semibold truncate">{h.name}</span>
                          {index === 0 && (
                            <Badge variant="default" className="text-[10px]">Nearest</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">{h.address}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {(h.distance ?? 0).toFixed(1)} km
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ETA: {h.eta}
                          </Badge>
                          {h.availability && (
                            <Badge 
                              variant={h.availability.emergencyBeds > 0 ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {h.availability.emergencyBeds > 0 
                                ? `${h.availability.emergencyBeds} ER beds` 
                                : "ER Full"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => (window.location.href = `tel:${h.phone}`)}
                          title="Call Hospital"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            const url = `https://www.openstreetmap.org/directions?from=${user.lat},${user.lng}&to=${h.location.lat},${h.location.lng}`;
                            window.open(url, "_blank");
                          }}
                          title="Get Directions"
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}
