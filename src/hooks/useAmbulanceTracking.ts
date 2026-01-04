import { useState, useEffect, useCallback, useRef } from "react";
import type { GeoPoint } from "@/state/medisos-types";
import { haversineDistance } from "@/data/hospitals";

export type AmbulanceStatus = "dispatched" | "en_route" | "arriving" | "arrived";

export interface TrackedAmbulance {
  id: string;
  location: GeoPoint;
  status: AmbulanceStatus;
  eta: number; // minutes
  distance: number; // km
  driverName: string;
  vehicleNumber: string;
  phone: string;
  assignedAt: number;
}

// Generate mock ambulances near user location
function generateMockAmbulances(userLat: number, userLng: number): TrackedAmbulance[] {
  const drivers = [
    { name: "Raju Kumar", vehicle: "AP-31-TG-9234", phone: "9876543210" },
    { name: "Suresh Reddy", vehicle: "TS-08-AB-1234", phone: "9876543211" },
    { name: "Venkat Rao", vehicle: "AP-28-CD-5678", phone: "9876543212" },
    { name: "Krishna Murthy", vehicle: "TS-09-EF-9012", phone: "9876543213" },
  ];

  const offsets = [
    { lat: 0.015, lng: 0.012 },
    { lat: -0.018, lng: 0.008 },
    { lat: 0.022, lng: -0.015 },
    { lat: -0.01, lng: -0.02 },
  ];

  return offsets.map((offset, i) => {
    const driver = drivers[i];
    const location = {
      lat: userLat + offset.lat,
      lng: userLng + offset.lng,
    };
    const distance = haversineDistance(userLat, userLng, location.lat, location.lng);
    const eta = Math.round((distance / 30) * 60); // 30 km/h average

    return {
      id: `AMB-${100 + i}`,
      location,
      status: "dispatched" as AmbulanceStatus,
      eta,
      distance,
      driverName: driver.name,
      vehicleNumber: driver.vehicle,
      phone: driver.phone,
      assignedAt: Date.now(),
    };
  });
}

export function useAmbulanceTracking(userLocation: GeoPoint | null, isActive: boolean) {
  const [ambulances, setAmbulances] = useState<TrackedAmbulance[]>([]);
  const [assignedAmbulance, setAssignedAmbulance] = useState<TrackedAmbulance | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize ambulances when location is available and SOS is active
  useEffect(() => {
    if (!userLocation || !isActive) {
      setAmbulances([]);
      setAssignedAmbulance(null);
      return;
    }

    const initialAmbulances = generateMockAmbulances(userLocation.lat, userLocation.lng);
    setAmbulances(initialAmbulances);

    // Auto-assign the nearest ambulance
    const nearest = [...initialAmbulances].sort((a, b) => a.distance - b.distance)[0];
    if (nearest) {
      setAssignedAmbulance({
        ...nearest,
        status: "dispatched",
      });
    }
  }, [userLocation?.lat, userLocation?.lng, isActive]);

  // Simulate ambulance movement toward user
  useEffect(() => {
    if (!userLocation || !isActive || !assignedAmbulance) return;

    intervalRef.current = window.setInterval(() => {
      setAssignedAmbulance((prev) => {
        if (!prev || !userLocation) return prev;

        // Calculate direction toward user
        const dx = userLocation.lat - prev.location.lat;
        const dy = userLocation.lng - prev.location.lng;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move 0.001 degrees per update (~100m)
        const speed = 0.001;
        const moveRatio = Math.min(speed / distance, 1);

        const newLat = prev.location.lat + dx * moveRatio;
        const newLng = prev.location.lng + dy * moveRatio;

        const newDistance = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          newLat,
          newLng
        );

        // Calculate new ETA based on distance (30 km/h average)
        const newEta = Math.max(0, Math.round((newDistance / 30) * 60));

        // Determine status based on distance/ETA
        let newStatus: AmbulanceStatus = "en_route";
        if (newEta <= 1 || newDistance < 0.1) {
          newStatus = "arrived";
        } else if (newEta <= 3 || newDistance < 0.5) {
          newStatus = "arriving";
        } else if (prev.status === "dispatched" && Date.now() - prev.assignedAt > 5000) {
          newStatus = "en_route";
        } else if (prev.status === "dispatched") {
          newStatus = "dispatched";
        }

        return {
          ...prev,
          location: { lat: newLat, lng: newLng },
          distance: newDistance,
          eta: newEta,
          status: newStatus,
        };
      });

      // Also update other ambulances with slight random movement
      setAmbulances((prev) =>
        prev.map((amb) => {
          if (assignedAmbulance && amb.id === assignedAmbulance.id) {
            return amb; // Skip assigned one, it's tracked separately
          }
          return {
            ...amb,
            location: {
              lat: amb.location.lat + (Math.random() - 0.5) * 0.001,
              lng: amb.location.lng + (Math.random() - 0.5) * 0.001,
            },
          };
        })
      );
    }, 2000); // Update every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userLocation, isActive, assignedAmbulance?.id]);

  const reassignAmbulance = useCallback((ambulanceId: string) => {
    const amb = ambulances.find((a) => a.id === ambulanceId);
    if (amb && userLocation) {
      const distance = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        amb.location.lat,
        amb.location.lng
      );
      setAssignedAmbulance({
        ...amb,
        distance,
        eta: Math.round((distance / 30) * 60),
        status: "dispatched",
        assignedAt: Date.now(),
      });
    }
  }, [ambulances, userLocation]);

  return {
    ambulances,
    assignedAmbulance,
    reassignAmbulance,
    isTracking: isActive && !!assignedAmbulance,
  };
}
