import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoPoint } from "@/state/medisos-types";

export function useGeolocation({ enableHighAccuracy = true }: { enableHighAccuracy?: boolean } = {}) {
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const isSupported = useMemo(() => typeof navigator !== "undefined" && "geolocation" in navigator, []);

  useEffect(() => {
    if (!isSupported) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        setError(err.message || "Location unavailable");
      },
      { enableHighAccuracy, maximumAge: 2000, timeout: 10000 },
    );

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [enableHighAccuracy, isSupported]);

  return { isSupported, point, error };
}
