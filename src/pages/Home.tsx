import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MobilePage } from "@/components/MobileShell";
import { SOSButton } from "@/components/SOSButton";
import { VoiceFeedback } from "@/components/VoiceFeedback";
import { EmergencyTypeSelector, type EmergencyType, getEmergencyLabel } from "@/components/EmergencyTypeSelector";
import { WorkModeToggle } from "@/components/WorkModeToggle";
import { FallDetectionAlert } from "@/components/FallDetectionAlert";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useVoiceSosTrigger } from "@/hooks/useVoiceSosTrigger";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useFallDetection } from "@/hooks/useFallDetection";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import { useSeo } from "@/lib/seo";
import { Navigation, PhoneCall, Siren, WifiOff, MessageSquare, Activity, FileText, Stethoscope, MapPin, Users } from "lucide-react";

export default function Home() {
  useSeo({
    title: "Emergency SOS – Smart MediSOS",
    description: "Trigger an emergency SOS, call 108, notify contacts, or find a nearby hospital.",
    canonicalPath: "/home",
  });

  const nav = useNavigate();
  const { toast } = useToast();
  const { settings, setSettings, contacts, logSos, profile } = useMediSOS();
  const { point } = useGeolocation();
  const { isOnline } = useNetworkStatus();

  const [handsFreeStarted, setHandsFreeStarted] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>("general");
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Fall detection integration
  const fallDetection = useFallDetection(() => {
    logSos({ 
      severity: "critical", 
      location: point ?? undefined,
      contactsNotified: defaultContacts.map(c => c.name),
    });
    notifyContacts();
    speak("Fall detected. Emergency SOS triggered.");
    nav("/sos", { state: { emergencyType: "fall" } });
  });

  const voice = useVoiceSosTrigger({
    enabled: settings.voiceSosEnabled && handsFreeStarted,
    onTrigger: (phrase) => {
      toast({ title: "Voice trigger detected", description: `Heard: "${phrase}"` });
      speak("Emergency detected. Starting SOS.");
      logSos({ severity: "critical", location: point ?? undefined });
      nav("/sos");
    },
    language: settings.language === "hi" ? "hi-IN" : settings.language === "te" ? "te-IN" : "en-IN",
  });

  const defaultContacts = useMemo(
    () => contacts.filter((c) => c.isDefault),
    [contacts]
  );

  const defaultContactNames = useMemo(
    () => defaultContacts.map((c) => c.name).join(", ") || "No default contacts",
    [defaultContacts],
  );

  const primaryContact = defaultContacts[0];

  // Generate OpenStreetMap link for SMS
  const mapsLink = useMemo(() => {
    if (!point) return null;
    return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=17/${point.lat}/${point.lng}`;
  }, [point]);

  const notifyContacts = () => {
    const message = `🆘 EMERGENCY: ${profile.name || "User"} needs help!\n📍 ${mapsLink || "Location pending"}\n⏰ ${new Date().toLocaleTimeString()}`;
    
    toast({
      title: isOnline ? "SMS Alert Sent (Demo)" : "Offline SMS Queued",
      description: `To: ${defaultContactNames}`,
    });
    
    // Vibrate pattern for work mode vs normal
    if (settings.workModeEnabled) {
      navigator.vibrate?.([100]);
    } else {
      navigator.vibrate?.([200, 100, 200, 100, 200]);
    }
  };

  const autoCallPrimary = () => {
    if (primaryContact) {
      window.location.href = `tel:${primaryContact.phone}`;
    } else {
      window.location.href = "tel:108";
    }
  };

  const call108 = () => {
    window.location.href = "tel:108";
  };

  const triggerSOS = () => {
    logSos({ 
      severity: "critical", 
      location: point ?? undefined,
      contactsNotified: defaultContacts.map(c => c.name),
    });
    notifyContacts();
    speak(settings.workModeEnabled ? "" : "SOS triggered. Help is on the way.");
    
    // Auto-call primary contact after short delay
    setTimeout(() => {
      if (primaryContact && !settings.workModeEnabled) {
        toast({ 
          title: "Calling Primary Contact", 
          description: primaryContact.name 
        });
      }
    }, 1500);
    
    nav("/sos", { state: { emergencyType } });
  };

  return (
    <MobilePage
      title="Emergency SOS"
      action={
        <Button
          variant="soft"
          size="icon"
          onClick={() => nav("/profile")}
          aria-label="Open profile"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      }
    >
      <section className="space-y-4">
        {/* Offline Indicator */}
        {!isOnline && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="py-3 flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-700">Offline Mode</p>
                <p className="text-xs text-amber-600">SMS fallback will be used for alerts</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fall Detection Alert */}
        <FallDetectionAlert
          open={fallDetection.fallDetected}
          countdown={fallDetection.countdown}
          onCancel={fallDetection.cancelAlert}
        />

        {/* Fall Detection Toggle */}
        <Card className="shadow-elevated border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fall Detection</p>
                  <p className="text-xs text-muted-foreground">
                    {fallDetection.isSupported ? "Monitors for sudden falls" : "Simulated sensor mode"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={fallDetection.isEnabled}
                  onCheckedChange={(v) => v ? fallDetection.enable() : fallDetection.disable()}
                  aria-label="Enable fall detection"
                />
              </div>
            </div>
            {fallDetection.isEnabled && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={fallDetection.simulateFall}
              >
                🧪 Simulate Fall (Demo)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Work Mode Toggle */}
        <WorkModeToggle 
          enabled={settings.workModeEnabled || false}
          onToggle={(enabled) => setSettings({ ...settings, workModeEnabled: enabled })}
          startHour={settings.workModeStartHour}
          endHour={settings.workModeEndHour}
        />

        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{profile.name || "Guest"}</CardTitle>
            <p className="text-sm text-muted-foreground">Primary: {primaryContact?.name || "None set"}</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-accent p-3">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">
                  Hands‑free Voice SOS
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap Start, then say trigger words
                </p>
              </div>
              <Switch
                checked={settings.voiceSosEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, voiceSosEnabled: !!v })}
                aria-label="Enable voice SOS"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setHandsFreeStarted(true);
                  toast({ title: "Hands‑free started", description: "Say: Help / SOS / Emergency" });
                }}
                disabled={!settings.voiceSosEnabled || (voice.supported && voice.listening)}
              >
                Start listening
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setHandsFreeStarted(false);
                  voice.stop();
                }}
              >
                Stop
              </Button>
            </div>

            {/* Voice SOS Visual Feedback */}
            <VoiceFeedback
              listening={voice.listening}
              supported={voice.supported}
              lastTranscript={voice.lastTranscript}
              error={voice.error}
            />
          </CardContent>
        </Card>

        <div className="py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <div className="mx-auto" onClick={() => setShowTypeSelector(true)}>
                <SOSButton onClick={() => {}} />
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Select Emergency Type</AlertDialogTitle>
                <AlertDialogDescription>
                  Choose the type of emergency for faster response
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <EmergencyTypeSelector
                selected={emergencyType}
                onSelect={setEmergencyType}
              />

              <p className="text-xs text-center text-muted-foreground mt-2">
                Selected: {getEmergencyLabel(emergencyType)}
              </p>

              <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                <AlertDialogAction
                  onClick={triggerSOS}
                  className="w-full bg-destructive hover:bg-destructive/90"
                >
                  Confirm SOS
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => nav("/profile")}>
            <CardContent className="py-3 text-center">
              <Navigation className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-medium">Profile</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => nav("/contacts")}>
            <CardContent className="py-3 text-center">
              <MessageSquare className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-medium">Contacts</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => nav("/symptom")}>
            <CardContent className="py-3 text-center">
              <Stethoscope className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-medium">Symptoms</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => nav("/health-reports")}>
            <CardContent className="py-3 text-center">
              <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-medium">Reports</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => nav("/map")}>
            <CardContent className="py-3 text-center">
              <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-medium">Map</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => nav("/caregiver")}>
            <CardContent className="py-3 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-medium">Caregiver</p>
            </CardContent>
          </Card>
        </div>

        <section className="grid grid-cols-1 gap-3">
          <Button variant="secondary" size="xl" onClick={() => nav("/map")}> 
            <Siren className="h-4 w-4" /> Find Hospital
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="xl" onClick={call108}>
              <PhoneCall className="h-4 w-4" /> Call 108
            </Button>
            <Button variant="soft" size="xl" onClick={notifyContacts}>
              <MessageSquare className="h-4 w-4" /> Alert Contacts
            </Button>
          </div>
          {primaryContact && (
            <Button 
              variant="sos" 
              size="xl" 
              onClick={autoCallPrimary}
              className="animate-pulse"
            >
              <PhoneCall className="h-4 w-4" /> Call {primaryContact.name}
            </Button>
          )}
        </section>

        <p className="text-xs text-muted-foreground text-center">
          📍 {point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "Waiting for GPS…"}
          {mapsLink && (
            <a 
              href={mapsLink} 
              target="_blank" 
              rel="noopener" 
              className="ml-2 text-primary underline"
            >
              View on Maps
            </a>
          )}
        </p>
      </section>
    </MobilePage>
  );
}
