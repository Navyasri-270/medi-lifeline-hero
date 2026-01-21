import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNotifications, type Notification, type NotificationType } from "@/hooks/useNotifications";
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Vibrate,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Ambulance,
  Phone,
  Building2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  sos_triggered: <AlertTriangle className="h-4 w-4 text-destructive" />,
  ambulance_dispatched: <Ambulance className="h-4 w-4 text-blue-500" />,
  ambulance_arriving: <Ambulance className="h-4 w-4 text-amber-500" />,
  ambulance_arrived: <CheckCircle className="h-4 w-4 text-green-500" />,
  contact_notified: <Phone className="h-4 w-4 text-primary" />,
  hospital_update: <Building2 className="h-4 w-4 text-purple-500" />,
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  return (
    <div
      className={`p-3 border-b last:border-b-0 transition-colors ${
        notification.read ? "bg-background" : "bg-primary/5"
      }`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {NOTIFICATION_ICONS[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{notification.title}</p>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    permission,
    soundEnabled,
    vibrationEnabled,
    setSoundEnabled,
    setVibrationEnabled,
    requestPermission,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      // User denied, could show a message
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Emergency alerts and status updates
          </SheetDescription>
        </SheetHeader>

        {/* Settings */}
        <div className="p-4 border-b space-y-3 bg-muted/30">
          {permission !== "granted" && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleRequestPermission}
            >
              <BellOff className="h-4 w-4" />
              Enable Push Notifications
            </Button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="sound-toggle" className="text-sm">
                Sound Alerts
              </Label>
            </div>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="h-4 w-4 text-primary" />
              <Label htmlFor="vibration-toggle" className="text-sm">
                Vibration
              </Label>
            </div>
            <Switch
              id="vibration-toggle"
              checked={vibrationEnabled}
              onCheckedChange={setVibrationEnabled}
            />
          </div>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between p-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={markAllAsRead}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={clearAll}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}

        {/* Notification list */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">
                You'll see alerts here during emergencies
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Compact badge for header
export function NotificationBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className="h-5 min-w-5 p-0 flex items-center justify-center text-xs"
    >
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}
