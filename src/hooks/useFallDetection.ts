import { useCallback, useEffect, useRef, useState } from "react";

export type FallDetectionState = {
  isSupported: boolean;
  isEnabled: boolean;
  fallDetected: boolean;
  countdown: number;
  enable: () => void;
  disable: () => void;
  cancelAlert: () => void;
  simulateFall: () => void;
};

const COUNTDOWN_SECONDS = 10;

export function useFallDetection(onTriggerSOS: () => void): FallDetectionState {
  const [isEnabled, setIsEnabled] = useState(false);
  const [fallDetected, setFallDetected] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastAcceleration = useRef<number>(0);
  
  // Check if DeviceMotion is supported
  const isSupported = typeof window !== "undefined" && "DeviceMotionEvent" in window;

  const clearCountdownTimer = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setFallDetected(true);
    setCountdown(COUNTDOWN_SECONDS);
    
    clearCountdownTimer();
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdownTimer();
          onTriggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdownTimer, onTriggerSOS]);

  const cancelAlert = useCallback(() => {
    clearCountdownTimer();
    setFallDetected(false);
    setCountdown(COUNTDOWN_SECONDS);
  }, [clearCountdownTimer]);

  const simulateFall = useCallback(() => {
    if (isEnabled && !fallDetected) {
      startCountdown();
    }
  }, [isEnabled, fallDetected, startCountdown]);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
    cancelAlert();
  }, [cancelAlert]);

  // Device motion event handler
  useEffect(() => {
    if (!isEnabled || !isSupported) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      
      if (!accelerationIncludingGravity) return;
      
      const { x, y, z } = accelerationIncludingGravity;
      if (x === null || y === null || z === null) return;
      
      // Calculate total acceleration magnitude
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      
      // Detect sudden change (fall pattern):
      // 1. High acceleration followed by very low (free fall)
      // 2. Or sudden impact (very high acceleration)
      const previousAccel = lastAcceleration.current;
      lastAcceleration.current = acceleration;
      
      // Free fall detection: acceleration drops significantly
      const isFreefall = previousAccel > 9 && acceleration < 3;
      
      // Impact detection: sudden high acceleration
      const isImpact = acceleration > 25;
      
      if ((isFreefall || isImpact) && !fallDetected) {
        startCountdown();
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [isEnabled, isSupported, fallDetected, startCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdownTimer();
    };
  }, [clearCountdownTimer]);

  return {
    isSupported,
    isEnabled,
    fallDetected,
    countdown,
    enable,
    disable,
    cancelAlert,
    simulateFall,
  };
}
