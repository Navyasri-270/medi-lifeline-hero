import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, PhoneCall, Navigation, Clock, AlertCircle } from "lucide-react";
import type { Hospital, GeoPoint } from "@/state/medisos-types";

interface HospitalListProps {
  hospitals: Hospital[];
  userLocation: GeoPoint | null;
  maxDisplay?: number;
  compact?: boolean;
}

export function HospitalList({ 
  hospitals, 
  userLocation, 
  maxDisplay = 12,
  compact = false 
}: HospitalListProps) {
  const displayHospitals = hospitals.slice(0, maxDisplay);

  if (hospitals.length === 0) {
    return (
      <Card className="shadow-elevated">
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hospitals found within 10km
            </p>
            <p className="text-xs text-muted-foreground">
              {!userLocation ? "Waiting for GPS location..." : "Try expanding search radius"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Nearby Hospitals
          <Badge variant="outline" className="ml-auto text-xs">
            {hospitals.length} within 10km
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={compact ? "h-[280px]" : "h-[400px]"}>
          <div className="p-3 space-y-2">
            {displayHospitals.map((hospital, index) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                rank={index + 1}
                isNearest={index === 0}
                userLocation={userLocation}
                compact={compact}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface HospitalCardProps {
  hospital: Hospital;
  rank: number;
  isNearest: boolean;
  userLocation: GeoPoint | null;
  compact?: boolean;
}

function HospitalCard({ hospital, rank, isNearest, userLocation, compact }: HospitalCardProps) {
  const openDirections = () => {
    if (userLocation) {
      const url = `https://www.openstreetmap.org/directions?from=${userLocation.lat},${userLocation.lng}&to=${hospital.location.lat},${hospital.location.lng}`;
      window.open(url, "_blank");
    } else {
      const url = `https://www.openstreetmap.org/?mlat=${hospital.location.lat}&mlon=${hospital.location.lng}#map=16/${hospital.location.lat}/${hospital.location.lng}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border bg-card p-3 transition-colors ${
        isNearest ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/30"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground w-5">#{rank}</span>
          <span className={`font-semibold truncate ${compact ? "text-sm" : "text-base"}`}>
            {hospital.name}
          </span>
          {isNearest && (
            <Badge variant="default" className="text-[10px] shrink-0">
              Nearest
            </Badge>
          )}
        </div>
        
        {!compact && (
          <p className="text-xs text-muted-foreground truncate ml-7 mt-0.5">
            {hospital.address}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-2 ml-7 flex-wrap">
          <Badge variant="secondary" className="text-xs gap-1">
            <Navigation className="h-3 w-3" />
            {(hospital.distance ?? 0).toFixed(1)} km
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            {hospital.eta || "N/A"}
          </Badge>
          {hospital.availability && (
            <Badge
              variant={hospital.availability.emergencyBeds > 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {hospital.availability.emergencyBeds > 0
                ? `${hospital.availability.emergencyBeds} ER beds`
                : "ER Full"}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = `tel:${hospital.phone}`)}
          title="Call Hospital"
          className="h-8 w-8 p-0"
        >
          <PhoneCall className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={openDirections}
          title="Get Directions"
          className="h-8 w-8 p-0"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
