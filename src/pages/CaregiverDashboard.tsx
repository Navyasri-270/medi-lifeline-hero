import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobilePage } from "@/components/MobileShell";
import { LeafletMap, type MapMarker } from "@/components/LeafletMap";
import { HospitalList } from "@/components/HospitalList";
import { useMediSOS } from "@/state/MediSOSProvider";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAmbulanceTracking } from "@/hooks/useAmbulanceTracking";
import { getHospitalsWithAvailability } from "@/data/hospitals";
import { useSeo } from "@/lib/seo";
import { 
  MapPin, 
  AlertTriangle, 
  User, 
  Heart, 
  Pill, 
  Activity, 
  Clock,
  Phone,
  Shield,
  Eye,
  Ambulance
} from "lucide-react";
import type { SosLog } from "@/state/medisos-types";

export default function CaregiverDashboard() {
  useSeo({
    title: "Caregiver Dashboard – Medi SOS",
    description: "Monitor your family member's location, health profile, and emergency status.",
    canonicalPath: "/caregiver",
  });

  const { profile, contacts, logs } = useMediSOS();
  const { point } = useGeolocation();
  const [activeLog, setActiveLog] = useState<SosLog | null>(null);

  // Find active SOS
  useEffect(() => {
    const active = logs.find((log) => log.status === "active");
    setActiveLog(active || null);
  }, [logs]);

  const userLocation = point ?? { lat: 17.385044, lng: 78.486671 };

  // Ambulance tracking (only when SOS is active)
  const { assignedAmbulance, ambulances } = useAmbulanceTracking(
    activeLog ? userLocation : null,
    !!activeLog
  );

  // Nearby hospitals
  const nearbyHospitals = useMemo(() => {
    return getHospitalsWithAvailability(userLocation.lat, userLocation.lng, 10);
  }, [userLocation.lat, userLocation.lng]);

  // Map markers
  const mapMarkers = useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [
      { 
        id: "user", 
        point: userLocation, 
        label: profile.name || "User",
        description: "Current location",
        icon: "user"
      }
    ];

    if (assignedAmbulance) {
      markers.push({
        id: assignedAmbulance.id,
        point: assignedAmbulance.location,
        label: `🚑 ${assignedAmbulance.id}`,
        description: `ETA: ${assignedAmbulance.eta} min`,
        icon: "ambulance"
      });
    }

    nearbyHospitals.slice(0, 3).forEach((h) => {
      markers.push({
        id: h.id,
        point: h.location,
        label: h.name,
        description: `${h.distance?.toFixed(1)} km`,
        icon: "hospital"
      });
    });

    return markers;
  }, [userLocation, assignedAmbulance, nearbyHospitals, profile.name]);

  return (
    <MobilePage 
      title="Caregiver Dashboard" 
      action={
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          Back
        </Button>
      }
    >
      <section className="space-y-4">
        {/* Read-only indicator */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Read-only access • Monitoring mode</span>
        </div>

        {/* SOS Status Card */}
        <Card className={`shadow-elevated ${activeLog ? "border-destructive bg-destructive/5" : "border-green-500/30 bg-green-500/5"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className={`h-4 w-4 ${activeLog ? "text-destructive" : "text-green-600"}`} />
              Emergency Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${activeLog ? "bg-destructive animate-pulse" : "bg-green-500"}`} />
                <div>
                  <p className="font-semibold">{activeLog ? "SOS ACTIVE" : "All Clear"}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeLog 
                      ? `Triggered ${new Date(activeLog.timeISO).toLocaleString()}`
                      : "No active emergencies"
                    }
                  </p>
                </div>
              </div>
              {activeLog && (
                <Badge variant="destructive" className="animate-pulse">
                  {activeLog.severity.toUpperCase()}
                </Badge>
              )}
            </div>

            {activeLog?.contactsNotified && activeLog.contactsNotified.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium mb-1">Selected Symptoms:</p>
                <div className="flex flex-wrap gap-1">
                  {activeLog.contactsNotified.map((symptom, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ambulance Tracking (only when SOS active) */}
        {activeLog && assignedAmbulance && (
          <Card className="shadow-elevated border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ambulance className="h-4 w-4 text-primary" />
                Assigned Ambulance
                <Badge variant="secondary" className="ml-auto text-xs">
                  {assignedAmbulance.status.replace("_", " ")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{assignedAmbulance.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Driver: {assignedAmbulance.driverName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignedAmbulance.vehicleNumber}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    <Clock className="h-4 w-4" />
                    {assignedAmbulance.eta} min
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {assignedAmbulance.distance.toFixed(1)} km away
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Location */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Live Location
              <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LeafletMap
              center={userLocation}
              markers={mapMarkers}
              heightClassName="h-48"
              trackUser={true}
              showFallback={true}
            />
            <div className="p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                📍 Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Hospitals (when SOS active) */}
        {activeLog && (
          <HospitalList
            hospitals={nearbyHospitals}
            userLocation={point}
            maxDisplay={5}
            compact={true}
          />
        )}

        {/* Medical Profile */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Medical Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{profile.name || "Not set"}</p>
                <p className="text-sm text-muted-foreground">{profile.phone || "No phone"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Heart className="h-3 w-3" />
                  Blood Group
                </div>
                <p className="font-semibold text-destructive">{profile.bloodGroup || "Not set"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Activity className="h-3 w-3" />
                  Age
                </div>
                <p className="font-semibold">{profile.age ? `${profile.age} years` : "Not set"}</p>
              </div>
            </div>

            {/* Allergies */}
            {profile.allergies && profile.allergies.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Allergies
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.allergies.map((allergy, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {profile.medications && profile.medications.length > 0 && (
              <div className="rounded-lg bg-blue-500/5 border border-blue-500/30 p-3">
                <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <Pill className="h-3 w-3" />
                  Current Medications
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.medications.map((med, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Chronic Conditions */}
            {profile.chronicConditions && profile.chronicConditions.length > 0 && (
              <div className="rounded-lg bg-orange-500/5 border border-orange-500/30 p-3">
                <p className="text-xs font-medium text-orange-700 mb-2 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Chronic Conditions
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.chronicConditions.map((condition, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-orange-500/50">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No emergency contacts configured
              </p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship || "Contact"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.isDefault && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.location.href = `tel:${contact.phone}`}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent SOS Logs */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent alerts
              </p>
            ) : (
              logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{log.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timeISO).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.status === "active" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {log.status || "resolved"}
                    </Badge>
                    <Badge 
                      variant={log.severity === "critical" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {log.severity}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}
