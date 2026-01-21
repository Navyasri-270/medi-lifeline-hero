import { useState, useEffect, useCallback, useRef } from "react";

export type NotificationType = 
  | "sos_triggered" 
  | "ambulance_dispatched" 
  | "ambulance_arriving" 
  | "ambulance_arrived" 
  | "contact_notified"
  | "hospital_update";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationSound {
  type: NotificationType;
  frequency: number;
  duration: number;
  pattern: number[];
}

// Sound configurations for different notification types
const NOTIFICATION_SOUNDS: Record<NotificationType, NotificationSound> = {
  sos_triggered: {
    type: "sos_triggered",
    frequency: 880,
    duration: 200,
    pattern: [200, 100, 200, 100, 200],
  },
  ambulance_dispatched: {
    type: "ambulance_dispatched",
    frequency: 660,
    duration: 300,
    pattern: [300, 150, 300],
  },
  ambulance_arriving: {
    type: "ambulance_arriving",
    frequency: 587,
    duration: 250,
    pattern: [250, 100, 250, 100],
  },
  ambulance_arrived: {
    type: "ambulance_arrived",
    frequency: 523,
    duration: 400,
    pattern: [400, 200, 400, 200, 400],
  },
  contact_notified: {
    type: "contact_notified",
    frequency: 440,
    duration: 150,
    pattern: [150, 75],
  },
  hospital_update: {
    type: "hospital_update",
    frequency: 392,
    duration: 100,
    pattern: [100, 50, 100],
  },
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context lazily (requires user interaction)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      return false;
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Play sound alert
  const playSound = useCallback((type: NotificationType) => {
    if (!soundEnabled) return;

    try {
      const audioContext = getAudioContext();
      const config = NOTIFICATION_SOUNDS[type];
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      let time = audioContext.currentTime;
      
      config.pattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          // Play tone
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = config.frequency;
          oscillator.type = type === "sos_triggered" ? "square" : "sine";
          
          // Fade in/out for smoother sound
          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.3, time + 0.01);
          gainNode.gain.linearRampToValueAtTime(0, time + duration / 1000);
          
          oscillator.start(time);
          oscillator.stop(time + duration / 1000);
        }
        time += duration / 1000;
      });
    } catch (err) {
      console.warn("Failed to play notification sound:", err);
    }
  }, [soundEnabled, getAudioContext]);

  // Trigger vibration
  const vibrate = useCallback((pattern: number[]) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (err) {
      console.warn("Vibration not supported:", err);
    }
  }, [vibrationEnabled]);

  // Show system notification
  const showSystemNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permission !== "granted") return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: `medi-sos-${Date.now()}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (err) {
      console.error("Failed to show notification:", err);
    }
  }, [permission]);

  // Main notification function
  const notify = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    options?: {
      showSystem?: boolean;
      playSound?: boolean;
      vibrate?: boolean;
    }
  ) => {
    const { 
      showSystem = true, 
      playSound: shouldPlaySound = true,
      vibrate: shouldVibrate = true 
    } = options || {};

    // Add to notifications list
    const notification: Notification = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      body,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50

    // Play sound
    if (shouldPlaySound) {
      playSound(type);
    }

    // Vibrate
    if (shouldVibrate) {
      vibrate(NOTIFICATION_SOUNDS[type].pattern);
    }

    // Show system notification
    if (showSystem && permission === "granted") {
      showSystemNotification(title, body);
    }

    return notification;
  }, [playSound, vibrate, showSystemNotification, permission]);

  // Convenience methods for specific notification types
  const notifySosTrigger = useCallback(() => {
    return notify(
      "sos_triggered",
      "🆘 SOS Activated!",
      "Emergency services are being notified. Help is on the way.",
      { playSound: true, vibrate: true, showSystem: true }
    );
  }, [notify]);

  const notifyAmbulanceDispatched = useCallback((ambulanceId: string, eta: number) => {
    return notify(
      "ambulance_dispatched",
      "🚑 Ambulance Dispatched",
      `${ambulanceId} is on the way. ETA: ${eta} minutes`,
      { playSound: true, vibrate: true, showSystem: true }
    );
  }, [notify]);

  const notifyAmbulanceArriving = useCallback((ambulanceId: string, eta: number) => {
    return notify(
      "ambulance_arriving",
      "🚑 Ambulance Nearby",
      `${ambulanceId} is ${eta} minute(s) away`,
      { playSound: true, vibrate: true, showSystem: true }
    );
  }, [notify]);

  const notifyAmbulanceArrived = useCallback((ambulanceId: string) => {
    return notify(
      "ambulance_arrived",
      "✅ Ambulance Arrived!",
      `${ambulanceId} has reached your location`,
      { playSound: true, vibrate: true, showSystem: true }
    );
  }, [notify]);

  const notifyContactNotified = useCallback((contactName: string) => {
    return notify(
      "contact_notified",
      "📱 Contact Alerted",
      `${contactName} has been notified of your emergency`,
      { playSound: true, vibrate: false, showSystem: false }
    );
  }, [notify]);

  const notifyHospitalUpdate = useCallback((hospitalName: string, message: string) => {
    return notify(
      "hospital_update",
      `🏥 ${hospitalName}`,
      message,
      { playSound: true, vibrate: false, showSystem: false }
    );
  }, [notify]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    permission,
    soundEnabled,
    vibrationEnabled,
    setSoundEnabled,
    setVibrationEnabled,
    requestPermission,
    notify,
    notifySosTrigger,
    notifyAmbulanceDispatched,
    notifyAmbulanceArriving,
    notifyAmbulanceArrived,
    notifyContactNotified,
    notifyHospitalUpdate,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
