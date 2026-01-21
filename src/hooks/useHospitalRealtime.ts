import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { haversineDistance } from "@/data/hospitals";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface HospitalAvailability {
  id: string;
  hospital_id: string;
  hospital_name: string;
  emergency_beds: number;
  icu_beds: number;
  general_beds: number;
  ambulances_available: number;
  is_accepting_emergency: boolean;
  latitude: number;
  longitude: number;
  phone: string | null;
  address: string | null;
  updated_at: string;
  // Computed fields
  distance?: number;
  eta?: string;
}

interface UseHospitalRealtimeOptions {
  userLat?: number;
  userLng?: number;
  maxDistance?: number;
  enabled?: boolean;
}

function calculateETA(distanceKm: number): string {
  const avgSpeedKmH = 30;
  const minutes = Math.round((distanceKm / avgSpeedKmH) * 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function useHospitalRealtime(options: UseHospitalRealtimeOptions = {}) {
  const { 
    userLat = 17.385044, 
    userLng = 78.486671, 
    maxDistance = 10,
    enabled = true 
  } = options;

  const [hospitals, setHospitals] = useState<HospitalAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial data
  const fetchHospitals = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hospital_availability')
        .select('*')
        .order('hospital_name');

      if (fetchError) throw fetchError;

      // Calculate distance and filter by max distance
      const hospitalsWithDistance = (data || [])
        .map(hospital => {
          const distance = haversineDistance(
            userLat, userLng,
            hospital.latitude, hospital.longitude
          );
          return {
            ...hospital,
            distance,
            eta: calculateETA(distance),
          };
        })
        .filter(h => h.distance <= maxDistance)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setHospitals(hospitalsWithDistance);
      setLastUpdate(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch hospitals";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng, maxDistance, enabled]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((
    payload: RealtimePostgresChangesPayload<HospitalAvailability>
  ) => {
    if (payload.eventType === 'UPDATE' && payload.new) {
      setHospitals(prev => {
        const updated = prev.map(hospital => {
          if (hospital.hospital_id === payload.new.hospital_id) {
            const distance = haversineDistance(
              userLat, userLng,
              payload.new.latitude, payload.new.longitude
            );
            return {
              ...payload.new,
              distance,
              eta: calculateETA(distance),
            };
          }
          return hospital;
        });
        return updated.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      });
      setLastUpdate(new Date());
    }
  }, [userLat, userLng]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled) return;

    fetchHospitals();

    const channel = supabase
      .channel('hospital-availability-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hospital_availability',
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, fetchHospitals, handleRealtimeUpdate]);

  // Refetch when user location changes significantly
  useEffect(() => {
    fetchHospitals();
  }, [userLat, userLng, maxDistance]);

  // Simulate availability changes (for demo purposes)
  const simulateUpdate = useCallback(async (hospitalId: string) => {
    const hospital = hospitals.find(h => h.hospital_id === hospitalId);
    if (!hospital) return;

    const { error } = await supabase
      .from('hospital_availability')
      .update({
        emergency_beds: Math.max(0, hospital.emergency_beds + (Math.random() > 0.5 ? 1 : -1)),
        icu_beds: Math.max(0, hospital.icu_beds + (Math.random() > 0.7 ? 1 : -1)),
        ambulances_available: Math.max(0, Math.min(6, hospital.ambulances_available + (Math.random() > 0.5 ? 1 : -1))),
      })
      .eq('hospital_id', hospitalId);

    if (error) {
      console.error('Failed to simulate update:', error);
    }
  }, [hospitals]);

  return {
    hospitals,
    loading,
    error,
    lastUpdate,
    refetch: fetchHospitals,
    simulateUpdate,
  };
}
