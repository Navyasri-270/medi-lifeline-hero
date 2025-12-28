import { useEffect, useRef, useState } from "react";
import type { GeoPoint } from "@/state/medisos-types";

/**
 * Simple iframe-based OpenStreetMap component with real-time tracking.
 * No API keys, no TypeScript issues.
 */
export function LeafletMap({
  center,
  markers,
  heightClassName = "h-72",
  trackUser = false,
}: {
  center: GeoPoint;
  markers: Array<{ id: string; point: GeoPoint; label: string; description?: string; action?: React.ReactNode }>;
  polyline?: GeoPoint[];
  heightClassName?: string;
  trackUser?: boolean;
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update map center when center prop changes or when tracking
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
      (err) => console.log("GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackUser]);

  // Build OpenStreetMap embed URL
  const zoom = 14;
  const bbox = getBbox(mapCenter, zoom);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`;

  return (
    <div className={heightClassName + " overflow-hidden rounded-2xl border bg-card shadow-elevated relative"}>
      <iframe
        ref={iframeRef}
        key={`${mapCenter.lat.toFixed(4)}-${mapCenter.lng.toFixed(4)}`}
        title="Map"
        src={osmUrl}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {/* Marker list overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
        {markers.slice(0, 4).map((m) => (
          <div
            key={m.id}
            className="bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full border shadow-sm pointer-events-auto"
          >
            📍 {m.label}
          </div>
        ))}
      </div>
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
