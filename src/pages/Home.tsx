import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MobilePage } from "@/components/MobileShell";
import { SOSButton } from "@/components/SOSButton";
import { VoiceFeedback } from "@/components/VoiceFeedback";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useVoiceSosTrigger } from "@/hooks/useVoiceSosTrigger";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import { useSeo } from "@/lib/seo";
import { Navigation, PhoneCall, Siren } from "lucide-react";

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

  const [handsFreeStarted, setHandsFreeStarted] = useState(false);

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

  const defaultContactNames = useMemo(
    () => contacts.filter((c) => c.isDefault).map((c) => c.name).join(", ") || "No default contacts",
    [contacts],
  );

  const notifyContacts = () => {
    toast({
      title: "Contacts notified (demo)",
      description: settings.smsOnSos ? `SMS: ${defaultContactNames}` : `Push: ${defaultContactNames}`,
    });
    navigator.vibrate?.([120, 80, 120]);
  };

  const call108 = () => {
    window.location.href = "tel:108";
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
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{profile.name || "Guest"}</CardTitle>
            <p className="text-sm text-muted-foreground">Default contacts: {defaultContactNames}</p>
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
              <div className="mx-auto">
                <SOSButton onClick={() => {}} />
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Trigger SOS?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to send an emergency alert? This demo will open the SOS Active screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    logSos({ severity: "critical", location: point ?? undefined });
                    notifyContacts();
                    speak("SOS triggered. Help is on the way.");
                    nav("/sos");
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              Notify Contacts
            </Button>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Location: {point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "Waiting for GPS…"}
        </p>
      </section>
    </MobilePage>
  );
}
