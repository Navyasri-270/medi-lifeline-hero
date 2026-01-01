import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMediSOS } from "@/state/MediSOSProvider";
import { safeId } from "@/state/medisos-storage";
import type { EmergencyContact } from "@/state/medisos-types";
import { Phone, Star, Trash2, Edit2, Plus, GripVertical } from "lucide-react";

const relationships = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Friend",
  "Doctor",
  "Caregiver",
  "Other",
];

export function ContactPriority() {
  const { toast } = useToast();
  const { contacts, upsertContact, deleteContact, setDefaultContact } = useMediSOS();
  
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [draft, setDraft] = useState({ name: "", phone: "", relationship: "" });

  // Sort by priority (default first, then by name)
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [contacts]);

  const startAdd = () => {
    setEditing({ id: safeId("c"), name: "", phone: "", relationship: "" });
    setDraft({ name: "", phone: "", relationship: "" });
  };

  const startEdit = (c: EmergencyContact) => {
    setEditing(c);
    setDraft({ name: c.name, phone: c.phone, relationship: c.relationship || "" });
  };

  const save = () => {
    if (!editing) return;
    if (!draft.name.trim() || !draft.phone.trim()) {
      toast({ title: "Missing details", description: "Please enter name and phone." });
      return;
    }
    
    upsertContact({
      id: editing.id,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      relationship: draft.relationship,
      isDefault: editing.isDefault,
      notifySms: true,
    });
    
    toast({ title: "Saved", description: "Contact updated." });
    setEditing(null);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Emergency Contacts</CardTitle>
            <Button variant="sos" size="sm" onClick={startAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Priority order: Primary contact is called first during emergencies
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedContacts.map((contact, index) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{contact.name}</span>
                  {contact.isDefault && (
                    <Badge variant="default" className="shrink-0">
                      <Star className="h-3 w-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{contact.phone}</span>
                  {contact.relationship && (
                    <>
                      <span>•</span>
                      <span>{contact.relationship}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!contact.isDefault && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setDefaultContact(contact.id);
                      toast({ title: "Primary contact set" });
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCall(contact.phone)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEdit(contact)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    deleteContact(contact.id);
                    toast({ title: "Deleted" });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <p className="text-center py-6 text-muted-foreground">
              No emergency contacts yet. Add one to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      {editing && (
        <Card className="shadow-elevated border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {editing.name ? "Edit Contact" : "Add Contact"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Contact name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={draft.relationship}
                onValueChange={(v) => setDraft((d) => ({ ...d, relationship: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="sos" onClick={save}>
                Save Contact
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
