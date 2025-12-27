import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobilePage } from "@/components/MobileShell";
import { useToast } from "@/hooks/use-toast";
import { useMediSOS } from "@/state/MediSOSProvider";
import { safeId } from "@/state/medisos-storage";
import type { EmergencyContact } from "@/state/medisos-types";
import { useSeo } from "@/lib/seo";

export default function Contacts() {
  useSeo({
    title: "Emergency Contacts – Smart MediSOS",
    description: "Add, edit, and set default emergency contacts. Demo data stored locally.",
    canonicalPath: "/contacts",
  });

  const { toast } = useToast();
  const { contacts, upsertContact, deleteContact, setDefaultContact, settings, setSettings } = useMediSOS();

  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "" });

  const startAdd = () => {
    setEditing({ id: safeId("c"), name: "", phone: "" });
    setDraft({ name: "", phone: "" });
  };

  const startEdit = (c: EmergencyContact) => {
    setEditing(c);
    setDraft({ name: c.name, phone: c.phone });
  };

  const save = () => {
    if (!editing) return;
    if (!draft.name.trim() || !draft.phone.trim()) {
      toast({ title: "Missing details", description: "Please enter name and phone." });
      return;
    }
    upsertContact({ id: editing.id, name: draft.name.trim(), phone: draft.phone.trim(), isDefault: editing.isDefault });
    toast({ title: "Saved", description: "Contact updated." });
    setEditing(null);
  };

  const defaultId = useMemo(() => contacts.find((c) => c.isDefault)?.id, [contacts]);

  return (
    <MobilePage title="Contacts">
      <section className="space-y-3">
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-accent p-3">
              <div>
                <div className="text-sm font-medium">SMS notification on SOS</div>
                <div className="text-xs text-muted-foreground">Placeholder for Twilio integration</div>
              </div>
              <Switch
                checked={settings.smsOnSos}
                onCheckedChange={(v) => setSettings({ ...settings, smsOnSos: !!v })}
                aria-label="SMS notification on SOS"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Emergency contacts</CardTitle>
              <Button variant="sos" onClick={startAdd}>
                Add
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Tap one contact as default.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-2xl border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={c.id === defaultId ? "sos" : "outline"} onClick={() => setDefaultContact(c.id)}>
                      Default
                    </Button>
                    <Button variant="secondary" onClick={() => startEdit(c)}>
                      Edit
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      deleteContact(c.id);
                      toast({ title: "Deleted", description: "Contact removed." });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts yet.</p> : null}
          </CardContent>
        </Card>

        {editing ? (
          <Card className="shadow-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{editing.name ? "Edit" : "Add"} contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cn">Name</Label>
                <Input id="cn" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cp">Phone</Label>
                <Input id="cp" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="sos" size="xl" onClick={save}>
                  Save
                </Button>
                <Button variant="outline" size="xl" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </MobilePage>
  );
}
