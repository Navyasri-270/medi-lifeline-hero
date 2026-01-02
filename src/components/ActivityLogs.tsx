import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMediSOS } from "@/state/MediSOSProvider";
import { SeverityBadge } from "./SeverityBadge";
import { MapPin, Clock, Phone, Download, ExternalLink } from "lucide-react";

export function ActivityLogs() {
  const { logs } = useMediSOS();

  const sortedLogs = useMemo(() => {
    return [...logs].sort(
      (a, b) => new Date(b.timeISO).getTime() - new Date(a.timeISO).getTime()
    );
  }, [logs]);

  const exportLogs = () => {
    const data = sortedLogs.map((log) => ({
      id: log.id,
      time: log.timeISO,
      severity: log.severity,
      status: log.status || "resolved",
      location: log.location
        ? `${log.location.lat.toFixed(6)}, ${log.location.lng.toFixed(6)}`
        : "N/A",
      contacts: log.contactsNotified?.join(", ") || "None",
    }));

    const csv = [
      "ID,Time,Severity,Status,Location,Contacts Notified",
      ...data.map((d) => `${d.id},${d.time},${d.severity},${d.status},"${d.location}","${d.contacts}"`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medisos-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`, "_blank");
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">SOS Activity Logs</CardTitle>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {logs.length} emergency event(s) recorded
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No SOS events recorded yet</p>
            <p className="text-xs mt-1">Events will appear here after triggering SOS</p>
          </div>
        ) : (
          sortedLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.name || "SOS Event"}</span>
                    <SeverityBadge severity={log.severity} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.timeISO).toLocaleString()}</span>
                  </div>
                </div>
                
                <Badge
                  variant={
                    log.status === "active"
                      ? "destructive"
                      : log.status === "cancelled"
                      ? "secondary"
                      : "default"
                  }
                >
                  {log.status || "resolved"}
                </Badge>
              </div>

              {log.location && (
                <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs">
                      {log.location.lat.toFixed(6)}, {log.location.lng.toFixed(6)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openInMaps(log.location!.lat, log.location!.lng)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {log.contactsNotified && log.contactsNotified.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>Notified: {log.contactsNotified.join(", ")}</span>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
