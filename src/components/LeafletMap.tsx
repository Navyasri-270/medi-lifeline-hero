import type { GeoPoint } from "@/state/medisos-types";

/**
 * Simple iframe-based OpenStreetMap component.
 * No API keys, no TypeScript issues.
 */
export function LeafletMap({
  center,
  markers,
  heightClassName = "h-72",
}: {
  center: GeoPoint;
  markers: Array<{ id: string; point: GeoPoint; label: string; description?: string; action?: React.ReactNode }>;
  polyline?: GeoPoint[];
  heightClassName?: string;
}) {
  // Build OpenStreetMap embed URL
  const zoom = 14;
  const bbox = getBbox(center, zoom);
  const markerParam = markers
    .map((m) => `${m.point.lat},${m.point.lng}`)
    .join("|");
  
  // Use OpenStreetMap embed
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;

  return (
    <div className={heightClassName + " overflow-hidden rounded-2xl border bg-card shadow-elevated relative"}>
      <iframe
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
    </div>
  );
}

function getBbox(center: GeoPoint, zoom: number): string {
  // Approximate bounding box based on zoom level
  const offset = 0.02 * (16 - zoom + 1);
  const left = center.lng - offset;
  const bottom = center.lat - offset;
  const right = center.lng + offset;
  const top = center.lat + offset;
  return `${left},${bottom},${right},${top}`;
}
