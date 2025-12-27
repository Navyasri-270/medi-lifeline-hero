import "leaflet/dist/leaflet.css";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { GeoPoint } from "@/state/medisos-types";
import { useEffect } from "react";

// Fix Leaflet default icon paths in bundlers.
const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function LeafletMap({
  center,
  markers,
  polyline,
  heightClassName = "h-72",
}: {
  center: GeoPoint;
  markers: Array<{ id: string; point: GeoPoint; label: string; description?: string; action?: React.ReactNode }>;
  polyline?: GeoPoint[];
  heightClassName?: string;
}) {
  useEffect(() => {
    (L as any).Marker.prototype.options.icon = defaultIcon;
  }, []);

  return (
    <div className={heightClassName + " overflow-hidden rounded-2xl border bg-card shadow-elevated"}>
      <MapContainer
        {...({
          center: [center.lat, center.lng],
          zoom: 14,
          scrollWheelZoom: false,
          style: { height: "100%", width: "100%" },
        } as any)}
      >
        <TileLayer
          {...({
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          } as any)}
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.point.lat, m.point.lng]}>
            <Popup>
              <div className="space-y-2">
                <div className="font-medium">{m.label}</div>
                {m.description ? <div className="text-sm opacity-80">{m.description}</div> : null}
                {m.action ? <div>{m.action}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
        {polyline && polyline.length > 1 ? (
          <Polyline positions={polyline.map((p) => [p.lat, p.lng]) as any} pathOptions={{ color: "#ff3b30", weight: 4 }} />
        ) : null}
      </MapContainer>
    </div>
  );
}
