import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Eye, Clock, Send, Loader2 } from "lucide-react";
import type { EmergencyContact } from "@/state/medisos-types";

type MessageStatus = "queued" | "sending" | "sent" | "delivered" | "read";

interface ContactStatus {
  contact: EmergencyContact;
  status: MessageStatus;
  timestamp: Date;
}

interface RealTimeSMSStatusProps {
  contacts: EmergencyContact[];
  isActive: boolean;
}

const statusConfig: Record<MessageStatus, { label: string; icon: React.ReactNode; color: string }> = {
  queued: { label: "Queued", icon: <Clock className="h-3 w-3" />, color: "bg-muted text-muted-foreground" },
  sending: { label: "Sending...", icon: <Loader2 className="h-3 w-3 animate-spin" />, color: "bg-yellow-500/20 text-yellow-700" },
  sent: { label: "Sent", icon: <Check className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-700" },
  delivered: { label: "Delivered", icon: <CheckCheck className="h-3 w-3" />, color: "bg-green-500/20 text-green-700" },
  read: { label: "Read", icon: <Eye className="h-3 w-3" />, color: "bg-primary/20 text-primary" },
};

export function RealTimeSMSStatus({ contacts, isActive }: RealTimeSMSStatusProps) {
  const [contactStatuses, setContactStatuses] = useState<ContactStatus[]>([]);

  // Initialize statuses when contacts change
  useEffect(() => {
    if (!isActive || contacts.length === 0) return;
    
    setContactStatuses(
      contacts.map((contact) => ({
        contact,
        status: "queued" as MessageStatus,
        timestamp: new Date(),
      }))
    );
  }, [contacts, isActive]);

  // Simulate real-time status progression
  useEffect(() => {
    if (!isActive || contactStatuses.length === 0) return;

    const progressStatus = (currentStatus: MessageStatus): MessageStatus => {
      const progression: MessageStatus[] = ["queued", "sending", "sent", "delivered", "read"];
      const currentIndex = progression.indexOf(currentStatus);
      if (currentIndex < progression.length - 1) {
        return progression[currentIndex + 1];
      }
      return currentStatus;
    };

    const intervals: NodeJS.Timeout[] = [];

    contactStatuses.forEach((cs, index) => {
      // Stagger updates for each contact
      const baseDelay = index * 800;
      
      // Progress through statuses
      const statusDelays = [500, 1500, 3000, 5000]; // queued->sending, sending->sent, sent->delivered, delivered->read
      
      statusDelays.forEach((delay, statusIndex) => {
        const timeout = setTimeout(() => {
          setContactStatuses((prev) =>
            prev.map((item, i) => {
              if (i === index && statusIndex < 4) {
                const newStatus = progressStatus(item.status);
                return { ...item, status: newStatus, timestamp: new Date() };
              }
              return item;
            })
          );
        }, baseDelay + delay);
        
        intervals.push(timeout);
      });
    });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [isActive, contactStatuses.length]);

  if (!isActive || contacts.length === 0) return null;

  return (
    <Card className="shadow-elevated border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Real-Time SMS Delivery
          <span className="ml-auto text-xs text-muted-foreground">Live</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contactStatuses.map(({ contact, status, timestamp }) => {
          const config = statusConfig[status];
          return (
            <div
              key={contact.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <Badge className={`${config.color} gap-1 text-xs`}>
                  {config.icon}
                  {config.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}

        {/* Timeline indicator */}
        <div className="mt-4 flex justify-center gap-2">
          {["Queued", "Sent", "Delivered", "Read"].map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-muted" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-green-500" : "bg-primary"}`} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
              {i < 3 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
