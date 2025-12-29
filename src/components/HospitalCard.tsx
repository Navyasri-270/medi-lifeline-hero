import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Hospital } from "@/state/medisos-types";
import { 
  Phone, 
  Navigation, 
  Bed, 
  Activity, 
  Ambulance,
  Clock,
  MapPin
} from "lucide-react";

interface HospitalCardProps {
  hospital: Hospital;
  className?: string;
}

export function HospitalCard({ hospital, className }: HospitalCardProps) {
  const { availability } = hospital;
  
  const hasEmergencyBeds = availability && availability.emergencyBeds > 0;
  const hasICUBeds = availability && availability.icuBeds > 0;
  
  const handleCall = () => {
    window.location.href = `tel:${hospital.phone}`;
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.location.lat},${hospital.location.lng}`;
    window.open(url, "_blank");
  };

  return (
    <Card className={cn(
      "shadow-elevated transition-all hover:shadow-lg",
      hasEmergencyBeds && "ring-2 ring-green-500/50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{hospital.name}</h3>
              {hasEmergencyBeds && (
                <Badge variant="default" className="bg-green-500 text-xs shrink-0">
                  Available
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{hospital.address}</span>
            </div>
            
            {hospital.distance && (
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-primary" />
                  {hospital.distance.toFixed(1)} km
                </span>
                {hospital.eta && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-primary" />
                    {hospital.eta}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {availability && (
          <div className="grid grid-cols-4 gap-2 my-3 text-center">
            <div className={cn(
              "rounded-lg p-2",
              availability.emergencyBeds > 0 ? "bg-green-50" : "bg-red-50"
            )}>
              <Activity className={cn(
                "h-4 w-4 mx-auto mb-1",
                availability.emergencyBeds > 0 ? "text-green-600" : "text-red-500"
              )} />
              <p className="text-xs font-medium">{availability.emergencyBeds}</p>
              <p className="text-[10px] text-muted-foreground">Emergency</p>
            </div>
            
            <div className={cn(
              "rounded-lg p-2",
              availability.icuBeds > 0 ? "bg-green-50" : "bg-red-50"
            )}>
              <Bed className={cn(
                "h-4 w-4 mx-auto mb-1",
                availability.icuBeds > 0 ? "text-green-600" : "text-red-500"
              )} />
              <p className="text-xs font-medium">{availability.icuBeds}</p>
              <p className="text-[10px] text-muted-foreground">ICU</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-2">
              <Bed className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-medium">{availability.generalBeds}</p>
              <p className="text-[10px] text-muted-foreground">General</p>
            </div>
            
            <div className={cn(
              "rounded-lg p-2",
              availability.ambulancesAvailable > 0 ? "bg-green-50" : "bg-orange-50"
            )}>
              <Ambulance className={cn(
                "h-4 w-4 mx-auto mb-1",
                availability.ambulancesAvailable > 0 ? "text-green-600" : "text-orange-500"
              )} />
              <p className="text-xs font-medium">{availability.ambulancesAvailable}</p>
              <p className="text-[10px] text-muted-foreground">Ambulance</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="sos"
            size="sm"
            className="w-full"
            onClick={handleCall}
          >
            <Phone className="h-4 w-4 mr-1" />
            Call Now
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleNavigate}
          >
            <Navigation className="h-4 w-4 mr-1" />
            Navigate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
