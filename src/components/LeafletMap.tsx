import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, MapPin } from "lucide-react";
import type { GeoPoint } from "@/state/medisos-types";

export type MapMarkerIcon = "user" | "hospital" | "ambulance";

export interface MapMarker {
  id: string;
  point: GeoPoint;
  label: string;
  description?: string;
  icon?: MapMarkerIcon;
}

interface LeafletMapProps {
  center: GeoPoint;
  markers: MapMarker[];
  polyline?: GeoPoint[];
  heightClassName?: string;
  trackUser?: boolean;
  showFallback?: boolean;
}

/**
 * Reliable iframe-based OpenStreetMap component with fallback.
 */
export function LeafletMap({
  center,
  markers,
  heightClassName = "h-72",
  trackUser = false,
  showFallback = true,
}: LeafletMapProps) {
  const [mapCenter, setMapCenter] = useState(center);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const retryCount = useRef(0);

  // Update map center when center prop changes
  useEffect(() => {
    setMapCenter(center);
  }, [center.lat, center.lng]);

  // Real-time GPS tracking
  useEffect(() => {
    if (!trackUser || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setMapCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.log("GPS error:", err.message);
        // Don't set error state for GPS issues, just use fallback center
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackUser]);

  // Build OpenStreetMap embed URL
  const zoom = 14;
  const bbox = getBbox(mapCenter, zoom);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    retryCount.current = 0;
  };

  const handleIframeError = () => {
    setIsLoading(false);
    if (retryCount.current < 3) {
      retryCount.current += 1;
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = osmUrl;
        }
      }, 1000 * retryCount.current);
    } else {
      setHasError(true);
    }
  };

  const retryLoad = () => {
    setIsLoading(true);
    setHasError(false);
    retryCount.current = 0;
    if (iframeRef.current) {
      iframeRef.current.src = osmUrl;
    }
  };

  // Show fallback text view if map fails
  if (hasError && showFallback) {
    return (
      <Card className={`${heightClassName} overflow-hidden border-amber-500/30`}>
        <CardContent className="h-full flex flex-col items-center justify-center gap-4 p-4">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <div className="text-center">
            <p className="font-medium text-amber-700">Map unavailable</p>
            <p className="text-sm text-muted-foreground">Showing location details below</p>
          </div>
          <Button variant="outline" size="sm" onClick={retryLoad} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Map
          </Button>
          
          {/* Fallback location info */}
          <div className="w-full mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>Lat: {mapCenter.lat.toFixed(6)}, Lng: {mapCenter.lng.toFixed(6)}</span>
            </div>
            {markers.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <span className="text-base">{m.icon === "ambulance" ? "🚑" : m.icon === "hospital" ? "🏥" : "📍"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{m.label}</p>
                  {m.description && <p className="text-muted-foreground truncate">{m.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={heightClassName + " overflow-hidden rounded-2xl border bg-card shadow-elevated relative"}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading map...</span>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        key={`${mapCenter.lat.toFixed(4)}-${mapCenter.lng.toFixed(4)}`}
        title="Map"
        src={osmUrl}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      
      {/* Marker list overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
        {markers.slice(0, 5).map((m) => (
          <div
            key={m.id}
            className="bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full border shadow-sm pointer-events-auto flex items-center gap-1"
          >
            <span>{m.icon === "ambulance" ? "🚑" : m.icon === "hospital" ? "🏥" : "📍"}</span>
            <span className="truncate max-w-[100px]">{m.label}</span>
          </div>
        ))}
        {markers.length > 5 && (
          <div className="bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full border shadow-sm">
            +{markers.length - 5} more
          </div>
        )}
      </div>

      {/* Live tracking indicator */}
      {trackUser && (
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
          Live tracking
        </div>
      )}
    </div>
  );
}

function getBbox(center: GeoPoint, zoom: number): string {
  const offset = 0.02 * (16 - zoom + 1);
  const left = center.lng - offset;
  const bottom = center.lat - offset;
  const right = center.lng + offset;
  const top = center.lat + offset;
  return `${left},${bottom},${right},${top}`;
}
