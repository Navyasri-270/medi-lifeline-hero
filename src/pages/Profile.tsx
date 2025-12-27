import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobilePage } from "@/components/MobileShell";
import { useToast } from "@/hooks/use-toast";
import { useMediSOS } from "@/state/MediSOSProvider";
import { useSeo } from "@/lib/seo";
import { Copy, Share2 } from "lucide-react";

function csvToArray(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Profile() {
  useSeo({
    title: "Medical Profile & QR – Smart MediSOS",
    description: "Manage medical profile and generate a scannable medical ID QR code.",
    canonicalPath: "/profile",
  });

  const { toast } = useToast();
  const { profile, setProfile, contacts } = useMediSOS();

  const [draft, setDraft] = useState({
    name: profile.name,
    phone: profile.phone,
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies.join(", "),
    medications: profile.medications.join(", "),
    chronicConditions: profile.chronicConditions.join(", "),
  });

  const qrPayload = useMemo(() => {
    return JSON.stringify(
      {
        profile: {
          name: draft.name,
          phone: draft.phone,
          blood_group: draft.bloodGroup,
          allergies: csvToArray(draft.allergies),
          medications: csvToArray(draft.medications),
          chronic_conditions: csvToArray(draft.chronicConditions),
        },
        emergency_contacts: contacts.map((c) => ({ name: c.name, phone: c.phone, default: !!c.isDefault })),
        generated_at: new Date().toISOString(),
      },
      null,
      0,
    );
  }, [contacts, draft]);

  const save = () => {
    setProfile({
      name: draft.name,
      phone: draft.phone,
      bloodGroup: draft.bloodGroup,
      allergies: csvToArray(draft.allergies),
      medications: csvToArray(draft.medications),
      chronicConditions: csvToArray(draft.chronicConditions),
    });
    toast({ title: "Saved", description: "Medical profile stored locally (demo)." });
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Smart MediSOS Medical ID", text: qrPayload });
      } else {
        await navigator.clipboard.writeText(qrPayload);
        toast({ title: "Copied", description: "QR payload copied to clipboard." });
      }
    } catch {
      toast({ title: "Share failed", description: "Could not share on this device." });
    }
  };

  return (
    <MobilePage title="Profile & QR">
      <section className="space-y-3">
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Medical info</CardTitle>
            <p className="text-sm text-muted-foreground">Comma-separate lists (e.g., penicillin, dust).</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bg">Blood group</Label>
                <Input id="bg" value={draft.bloodGroup} onChange={(e) => setDraft((d) => ({ ...d, bloodGroup: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="all">Allergies</Label>
                <Input id="all" value={draft.allergies} onChange={(e) => setDraft((d) => ({ ...d, allergies: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="med">Medications</Label>
              <Input id="med" value={draft.medications} onChange={(e) => setDraft((d) => ({ ...d, medications: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cc">Chronic conditions</Label>
              <Input id="cc" value={draft.chronicConditions} onChange={(e) => setDraft((d) => ({ ...d, chronicConditions: e.target.value }))} />
            </div>
            <Button variant="sos" size="xl" className="w-full" onClick={save}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Medical ID QR</CardTitle>
            <p className="text-sm text-muted-foreground">Emergency responders can scan to view your info.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid place-items-center rounded-2xl border bg-card p-4">
              <QRCodeCanvas value={qrPayload} size={220} includeMargin />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="xl"
                onClick={async () => {
                  await navigator.clipboard.writeText(qrPayload);
                  toast({ title: "Copied", description: "QR payload copied." });
                }}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" size="xl" onClick={share}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}
