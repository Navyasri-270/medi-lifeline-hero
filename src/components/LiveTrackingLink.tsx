import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, ExternalLink, Check } from "lucide-react";
import type { GeoPoint } from "@/state/medisos-types";

interface LiveTrackingLinkProps {
  location: GeoPoint | null;
  sosId?: string;
  userName?: string;
}

export function LiveTrackingLink({ location, sosId, userName }: LiveTrackingLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate a simulated tracking link using OpenStreetMap
  const trackingLink = location
    ? `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=17/${location.lat}/${location.lng}`
    : null;

  // Generate a shareable link with context
  const shareableLink = trackingLink
    ? `${trackingLink}&label=${encodeURIComponent(userName || "Emergency")}`
    : null;

  const copyLink = async () => {
    if (!shareableLink) return;
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share with emergency contacts" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually" });
    }
  };

  const shareLink = async () => {
    if (!shareableLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Emergency Location Tracking",
          text: `${userName || "Someone"} needs help! Track their location:`,
          url: shareableLink,
        });
        toast({ title: "Shared successfully" });
      } catch (err) {
        // User cancelled or share failed
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const openInMaps = () => {
    if (trackingLink) {
      window.open(trackingLink, "_blank");
    }
  };

  if (!location) {
    return (
      <Card className="shadow-elevated border-dashed">
        <CardContent className="py-4 text-center text-muted-foreground text-sm">
          Waiting for GPS location...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          Live Location Sharing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            readOnly
            value={shareableLink || ""}
            className="text-xs bg-muted"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={shareLink}>
            <Share2 className="h-4 w-4 mr-1" />
            Share Link
          </Button>
          <Button variant="outline" size="sm" onClick={openInMaps}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Maps
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {sosId && <span className="font-mono">SOS #{sosId.slice(0, 8)}</span>}
          {" • "}Last updated: {new Date().toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
