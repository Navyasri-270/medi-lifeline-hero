import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap, type MapMarker } from "@/components/LeafletMap";
import { LiveAmbulanceTracker } from "@/components/LiveAmbulanceTracker";
import { HospitalList } from "@/components/HospitalList";
import { HospitalAcknowledgment } from "@/components/HospitalAcknowledgment";
import { LiveTrackingLink } from "@/components/LiveTrackingLink";
import { SMSAlertSimulator } from "@/components/SMSAlertSimulator";
import { RealTimeSMSStatus } from "@/components/RealTimeSMSStatus";
import { SymptomQuickSelect, getSymptomLabels } from "@/components/SymptomQuickSelect";
import { getEmergencyLabel, type EmergencyType } from "@/components/EmergencyTypeSelector";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { useToast } from "@/hooks/use-toast";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import { getHospitalsWithAvailability } from "@/data/hospitals";
import type { GeoPoint, Hospital } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";
import { 
  PhoneCall, 
  Send, 
  X, 
  AlertTriangle, 
  Share2, 
  Ambulance,
  Clock,
  MapPin
} from "lucide-react";

const MAX_DISTANCE_KM = 10;
const LOCATION_UPDATE_INTERVAL = 4000; // 4 seconds

export default function SosActive() {
  useSeo({
    title: "SOS Active – Medi SOS",
    description: "Active SOS screen with live location, ambulance tracking, and nearby hospitals.",
    canonicalPath: "/sos",
  });

  const nav = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { contacts, settings, profile, logSos } = useMediSOS();
  const { point, error: geoError } = useGeolocation();
  
  const [seconds, setSeconds] = useState(30);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [smsActive, setSmsActive] = useState(false);
  const [sosActive, setSosActive] = useState(true);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);

  const emergencyType = (location.state?.emergencyType as EmergencyType) || "general";

  // Ambulance tracking with live simulation
  const { 
    ambulances, 
    assignedAmbulance, 
    isTracking 
  } = useAmbulanceTracking(userLocation, sosActive);

  // Get nearby hospitals within 10km
  const nearbyHospitals = useMemo(() => {
    if (!userLocation) return [];
    return getHospitalsWithAvailability(userLocation.lat, userLocation.lng, MAX_DISTANCE_KM);
  }, [userLocation]);

  // Update user location with continuous tracking
  useEffect(() => {
    if (point) {
      setUserLocation(point);
    }
  }, [point]);

  // Countdown timer
  useEffect(() => {
    if (!sosActive) return;
    const t = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [sosActive]);

  // Vibration pattern on SOS activation
  useEffect(() => {
    if (sosActive && !settings.workModeEnabled) {
      navigator.vibrate?.([220, 120, 220, 120, 220]);
    }
  }, [sosActive, settings.workModeEnabled]);

  // Auto-notify on first render
  useEffect(() => {
    if (sosActive && contacts.length > 0) {
      setSmsActive(true);
    }
  }, []);

  const defaultLocation: GeoPoint = { lat: 17.385044, lng: 78.486671 };
  const currentLocation = userLocation ?? defaultLocation;

  const defaultContacts = useMemo(() => contacts.filter((c) => c.isDefault), [contacts]);

  const handleCallContact = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const notify = () => {
    setSmsActive(true);
    
    logSos({
      severity: "critical",
      location: userLocation ?? undefined,
      contactsNotified: getSymptomLabels(selectedSymptoms),
    });
    
    toast({ 
      title: "Emergency Alerts Sent", 
      description: `Notifying ${contacts.length} contacts with real-time tracking` 
    });
    
    if (!settings.workModeEnabled) {
      speak("Emergency contacts notified. Ambulance dispatched. Help is on the way.");
    }
  };

  const handleSymptomsChange = (symptoms: string[]) => {
    setSelectedSymptoms(symptoms);
  };

  const shareLocation = () => {
    const mapsLink = `https://www.openstreetmap.org/?mlat=${currentLocation.lat}&mlon=${currentLocation.lng}#map=17/${currentLocation.lat}/${currentLocation.lng}`;
    
    if (navigator.share) {
      navigator.share({
        title: "Emergency Location - Medi SOS",
        text: `🆘 EMERGENCY! ${profile.name || "User"} needs help!\n📍 Location: `,
        url: mapsLink,
      });
    } else {
      navigator.clipboard.writeText(mapsLink);
      toast({ title: "Location copied", description: "Share link copied to clipboard" });
    }
  };

  const cancelSOS = () => {
    setSosActive(false);
    toast({ title: "SOS cancelled", description: "Emergency alert has been cancelled." });
    nav("/home");
  };

  const handleAmbulanceArrival = () => {
    toast({ 
      title: "🚑 Ambulance Arrived!", 
      description: "Medical help has reached your location." 
    });
    if (!settings.workModeEnabled) {
      speak("Ambulance has arrived at your location.");
    }
  };

  // Prepare map markers
  const mapMarkers = useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [
      { 
        id: "user", 
        point: currentLocation, 
        label: "You", 
        description: "Current location",
        icon: "user"
      },
    ];

    // Add assigned ambulance
    if (assignedAmbulance) {
      markers.push({
        id: assignedAmbulance.id,
        point: assignedAmbulance.location,
        label: `🚑 ${assignedAmbulance.id}`,
        description: `ETA: ${assignedAmbulance.eta} min`,
        icon: "ambulance"
      });
    }

    // Add nearby hospitals (up to 8)
    nearbyHospitals.slice(0, 8).forEach((h) => {
      markers.push({
        id: h.id,
        point: h.location,
        label: h.name,
        description: `${h.distance?.toFixed(1)} km`,
        icon: "hospital"
      });
    });

    return markers;
  }, [currentLocation, assignedAmbulance, nearbyHospitals]);

  return (
    <MobilePage
      title="SOS Active"
      action={
        <Button variant="outline" onClick={() => nav("/home")}>
          Home
        </Button>
      }
    >
      <section className="space-y-3">
        {/* Emergency Status Banner */}
        <Card className="bg-destructive/10 border-destructive/50 shadow-lg">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-destructive text-lg">{getEmergencyLabel(emergencyType)}</p>
                <p className="text-sm text-destructive/80">Emergency services alerted</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums text-destructive">{seconds}s</div>
                <Badge variant="destructive" className="animate-pulse">ACTIVE</Badge>
              </div>
            </div>
            
            {/* GPS Status */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-destructive" />
              {geoError ? (
                <span className="text-amber-600">GPS Error: {geoError}</span>
              ) : userLocation ? (
                <span className="text-muted-foreground">
                  📍 {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </span>
              ) : (
                <span className="text-muted-foreground animate-pulse">Acquiring GPS...</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Symptom Selection */}
        <SymptomQuickSelect 
          onSymptomsChange={handleSymptomsChange}
          selectedSymptoms={selectedSymptoms}
        />

        {/* Live Ambulance Tracker */}
        <LiveAmbulanceTracker 
          ambulance={assignedAmbulance}
          onCall={handleCallContact}
          onArrival={handleAmbulanceArrival}
        />

        {/* Action Buttons */}
        <Card className="shadow-elevated">
          <CardContent className="py-3 grid grid-cols-4 gap-2">
            <Button 
              variant="destructive" 
              className="flex-col h-auto py-3 gap-1"
              onClick={() => (window.location.href = "tel:108")}
            > 
              <PhoneCall className="h-5 w-5" />
              <span className="text-xs">108</span>
            </Button>
            <Button 
              variant="secondary"
              className="flex-col h-auto py-3 gap-1" 
              onClick={notify}
            >
              <Send className="h-5 w-5" />
              <span className="text-xs">Notify</span>
            </Button>
            <Button 
              variant="outline"
              className="flex-col h-auto py-3 gap-1" 
              onClick={shareLocation}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-xs">Share</span>
            </Button>
            <Button
              variant="outline"
              className="flex-col h-auto py-3 gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={cancelSOS}
            >
              <X className="h-5 w-5" />
              <span className="text-xs">Cancel</span>
            </Button>
          </CardContent>
        </Card>

        {/* Real-Time SMS Status */}
        <RealTimeSMSStatus contacts={contacts} isActive={smsActive} />

        {/* Live Tracking Link */}
        <LiveTrackingLink location={userLocation} userName={profile.name} />

        {/* Map with ambulance and hospitals */}
        <LeafletMap
          center={currentLocation}
          markers={mapMarkers}
          heightClassName="h-[18rem]"
          trackUser={true}
          showFallback={true}
        />

        {/* Nearby Hospitals List (always visible) */}
        <HospitalList
          hospitals={nearbyHospitals}
          userLocation={userLocation}
          maxDisplay={12}
          compact={true}
        />

        {/* SMS Alert Preview */}
        <SMSAlertSimulator
          contacts={contacts}
          location={userLocation}
          emergencyType={emergencyType}
          userName={profile.name || "Guest"}
          onCallContact={handleCallContact}
        />

        <HospitalAcknowledgment hospitals={nearbyHospitals.slice(0, 3)} />
      </section>
    </MobilePage>
  );
}
