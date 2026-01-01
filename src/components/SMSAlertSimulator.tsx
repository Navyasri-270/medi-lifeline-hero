import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Phone, Check, Clock } from "lucide-react";
import type { GeoPoint, EmergencyContact } from "@/state/medisos-types";
import type { EmergencyType } from "./EmergencyTypeSelector";
import { getEmergencyLabel } from "./EmergencyTypeSelector";

interface SMSAlertSimulatorProps {
  contacts: EmergencyContact[];
  location: GeoPoint | null;
  emergencyType: EmergencyType;
  userName: string;
  onCallContact: (phone: string) => void;
}

export function SMSAlertSimulator({
  contacts,
  location,
  emergencyType,
  userName,
  onCallContact,
}: SMSAlertSimulatorProps) {
  const mapsLink = useMemo(() => {
    if (!location) return null;
    return `https://maps.google.com/maps?q=${location.lat},${location.lng}`;
  }, [location]);

  const smsMessage = useMemo(() => {
    const timestamp = new Date().toLocaleString();
    const locationText = mapsLink || "Location unavailable";
    
    return `🆘 EMERGENCY ALERT - ${getEmergencyLabel(emergencyType).toUpperCase()}

${userName} needs immediate help!

📍 Location: ${locationText}

⏰ Time: ${timestamp}

Please respond immediately or call emergency services (108).

- MediSOS Emergency System`;
  }, [userName, emergencyType, mapsLink]);

  // Sort contacts by priority (default contacts first)
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [contacts]);

  const primaryContact = sortedContacts.find((c) => c.isDefault);

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          SMS Alert Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SMS Preview */}
        <div className="rounded-lg bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
          {smsMessage}
        </div>

        {/* Contact Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Sending to {sortedContacts.length} contact(s):
          </p>
          
          {sortedContacts.map((contact, index) => (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-lg border bg-card p-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {contact.isDefault ? (
                  <Badge variant="default" className="text-xs">
                    Primary
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Queued
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onCallContact(contact.phone)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Auto-call Primary Contact */}
        {primaryContact && (
          <Button
            variant="sos"
            className="w-full"
            onClick={() => onCallContact(primaryContact.phone)}
          >
            <Phone className="h-4 w-4 mr-2" />
            Auto-Call Primary: {primaryContact.name}
          </Button>
        )}

        {contacts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No emergency contacts configured
          </p>
        )}
      </CardContent>
    </Card>
  );
}
