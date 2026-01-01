import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GeoPoint, Hospital } from "@/state/medisos-types";
import { haversineDistance } from "@/data/hospitals";
import { Phone, Navigation, Ambulance as AmbulanceIcon, Building2 } from "lucide-react";

type Ambulance = {
  id: string;
  lat: number;
  lng: number;
  status: "available" | "on_way" | "busy";
  eta?: number; // minutes
};

type Props = {
  userLocation: GeoPoint | null;
  hospitals: Hospital[];
  maxDistanceKm?: number;
  heightClassName?: string;
  showAmbulances?: boolean;
};

// Generate mock ambulances near user location
function generateMockAmbulances(userLat: number, userLng: number): Ambulance[] {
  return [
    {
      id: "amb-1",
      lat: userLat + 0.008,
      lng: userLng - 0.006,
      status: "available",
      eta: 4,
    },
    {
      id: "amb-2",
      lat: userLat - 0.012,
      lng: userLng + 0.009,
      status: "on_way",
      eta: 7,
    },
    {
      id: "amb-3",
      lat: userLat + 0.015,
      lng: userLng + 0.012,
      status: "available",
      eta: 10,
    },
  ];
}

export function EnhancedMap({
  userLocation,
  hospitals,
  maxDistanceKm = 10,
  heightClassName = "h-80",
  showAmbulances = true,
}: Props) {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Filter hospitals within max distance
  const nearbyHospitals = useMemo(() => {
    if (!userLocation) return [];
    
    return hospitals
      .filter((h) => {
        const distance = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          h.location.lat,
          h.location.lng
        );
        return distance <= maxDistanceKm;
      })
      .sort((a, b) => {
        const distA = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          a.location.lat,
          a.location.lng
        );
        const distB = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          b.location.lat,
          b.location.lng
        );
        return distA - distB;
      });
  }, [hospitals, userLocation, maxDistanceKm]);

  // Generate ambulances when user location is available
  useEffect(() => {
    if (userLocation && showAmbulances) {
      setAmbulances(generateMockAmbulances(userLocation.lat, userLocation.lng));
      
      // Simulate ambulance movement
      const interval = setInterval(() => {
        setAmbulances((prev) =>
          prev.map((amb) => ({
            ...amb,
            lat: amb.lat + (Math.random() - 0.5) * 0.002,
            lng: amb.lng + (Math.random() - 0.5) * 0.002,
          }))
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [userLocation, showAmbulances]);

  const mapCenter = userLocation || { lat: 17.385, lng: 78.4867 };
  const zoom = 14;
  
  // Build OpenStreetMap embed URL
  const offset = 0.03;
  const bbox = `${mapCenter.lng - offset},${mapCenter.lat - offset},${mapCenter.lng + offset},${mapCenter.lat + offset}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`;

  return (
    <div className={`${heightClassName} relative overflow-hidden rounded-2xl border bg-card shadow-elevated`}>
      {/* Map iframe */}
      <iframe
        title="Map"
        src={osmUrl}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Live tracking indicator */}
      {userLocation && (
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
          Live
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-xs px-3 py-2 rounded-lg border shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-blue-500" />
          <span>Hospitals ({nearbyHospitals.length})</span>
        </div>
        {showAmbulances && (
          <div className="flex items-center gap-2">
            <AmbulanceIcon className="h-3 w-3 text-green-500" />
            <span>Ambulances ({ambulances.filter(a => a.status === "available").length} avail)</span>
          </div>
        )}
      </div>

      {/* Markers overlay */}
      <div className="absolute bottom-2 left-2 right-2 max-h-32 overflow-y-auto space-y-1">
        {/* Ambulances */}
        {showAmbulances && ambulances.slice(0, 2).map((amb) => (
          <div
            key={amb.id}
            className={`bg-background/95 backdrop-blur-sm text-xs px-3 py-2 rounded-lg border shadow-sm flex items-center justify-between gap-2 ${
              selectedMarker === amb.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedMarker(amb.id)}
          >
            <div className="flex items-center gap-2">
              <AmbulanceIcon className={`h-4 w-4 ${
                amb.status === "available" ? "text-green-500" : "text-amber-500"
              }`} />
              <div>
                <span className="font-medium">Ambulance</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                  amb.status === "available" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {amb.status === "available" ? "Available" : "On Route"}
                </span>
              </div>
            </div>
            <span className="text-muted-foreground">ETA: {amb.eta} min</span>
          </div>
        ))}

        {/* Nearest Hospital */}
        {nearbyHospitals[0] && (
          <div
            className={`bg-background/95 backdrop-blur-sm text-xs px-3 py-2 rounded-lg border shadow-sm flex items-center justify-between gap-2 ${
              selectedMarker === nearbyHospitals[0].id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedMarker(nearbyHospitals[0].id)}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <div>
                <span className="font-medium truncate max-w-[120px] inline-block align-bottom">
                  {nearbyHospitals[0].name}
                </span>
                <span className="text-muted-foreground ml-2">
                  {nearbyHospitals[0].distance?.toFixed(1)} km
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${nearbyHospitals[0].phone}`;
                }}
              >
                <Phone className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${nearbyHospitals[0].location.lat},${nearbyHospitals[0].location.lng}`,
                    "_blank"
                  );
                }}
              >
                <Navigation className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* No location fallback */}
      {!userLocation && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-muted-foreground">Waiting for GPS location...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please enable location access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
