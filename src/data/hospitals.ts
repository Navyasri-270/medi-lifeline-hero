import type { Hospital, HospitalAvailability } from "@/state/medisos-types";

// Generate realistic hospital availability data
function generateAvailability(): HospitalAvailability {
  return {
    emergencyBeds: Math.floor(Math.random() * 8) + 1,
    icuBeds: Math.floor(Math.random() * 5) + 1,
    generalBeds: Math.floor(Math.random() * 30) + 10,
    ambulancesAvailable: Math.floor(Math.random() * 4) + 1,
    lastUpdated: new Date().toISOString(),
  };
}

// Calculate ETA based on distance
function calculateETA(distanceKm: number): string {
  const avgSpeedKmH = 30; // Urban average
  const minutes = Math.round((distanceKm / avgSpeedKmH) * 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Extended Hyderabad-area hospitals - 15 hospitals for better 10km coverage
export const HOSPITALS_DATA: Omit<Hospital, "distance" | "eta" | "availability">[] = [
  {
    id: "h1",
    name: "Apollo Emergency Hospital",
    phone: "+914027231234",
    type: "hospital",
    location: { lat: 17.4156, lng: 78.4347 },
    address: "Jubilee Hills, Hyderabad",
  },
  {
    id: "h2",
    name: "KIMS Hospital",
    phone: "+914023221111",
    type: "hospital",
    location: { lat: 17.3982, lng: 78.5214 },
    address: "Secunderabad",
  },
  {
    id: "h3",
    name: "Care Hospital Banjara Hills",
    phone: "+914030418888",
    type: "hospital",
    location: { lat: 17.4139, lng: 78.4397 },
    address: "Banjara Hills, Hyderabad",
  },
  {
    id: "h4",
    name: "Yashoda Hospital Somajiguda",
    phone: "+914027812345",
    type: "hospital",
    location: { lat: 17.4346, lng: 78.4982 },
    address: "Somajiguda, Hyderabad",
  },
  {
    id: "h5",
    name: "Continental Hospital",
    phone: "+914067000000",
    type: "hospital",
    location: { lat: 17.4285, lng: 78.3914 },
    address: "Gachibowli, Hyderabad",
  },
  {
    id: "h6",
    name: "NIMS Hospital",
    phone: "+914023489012",
    type: "hospital",
    location: { lat: 17.4231, lng: 78.5423 },
    address: "Punjagutta, Hyderabad",
  },
  {
    id: "h7",
    name: "Osmania General Hospital",
    phone: "+914024655555",
    type: "hospital",
    location: { lat: 17.3898, lng: 78.4827 },
    address: "Afzalgunj, Hyderabad",
  },
  {
    id: "h8",
    name: "Gandhi Hospital",
    phone: "+914027505566",
    type: "hospital",
    location: { lat: 17.3945, lng: 78.5012 },
    address: "Musheerabad, Hyderabad",
  },
  {
    id: "h9",
    name: "Sunshine Hospital",
    phone: "+914023456789",
    type: "hospital",
    location: { lat: 17.4456, lng: 78.3891 },
    address: "Gachibowli, Hyderabad",
  },
  {
    id: "h10",
    name: "MaxCure Hospital",
    phone: "+914066200200",
    type: "hospital",
    location: { lat: 17.4512, lng: 78.3834 },
    address: "Madhapur, Hyderabad",
  },
  {
    id: "h11",
    name: "Medicover Hospital",
    phone: "+914068885588",
    type: "hospital",
    location: { lat: 17.4389, lng: 78.4123 },
    address: "Hitech City, Hyderabad",
  },
  {
    id: "h12",
    name: "AIG Hospitals",
    phone: "+914066667777",
    type: "hospital",
    location: { lat: 17.4234, lng: 78.3678 },
    address: "Gachibowli, Hyderabad",
  },
  {
    id: "h13",
    name: "Yashoda Hospital Malakpet",
    phone: "+914024567890",
    type: "hospital",
    location: { lat: 17.3756, lng: 78.5089 },
    address: "Malakpet, Hyderabad",
  },
  {
    id: "h14",
    name: "Care Hospital Hitech City",
    phone: "+914044556677",
    type: "hospital",
    location: { lat: 17.4456, lng: 78.3789 },
    address: "Hitech City, Hyderabad",
  },
  {
    id: "h15",
    name: "Rainbow Children's Hospital",
    phone: "+914023445566",
    type: "hospital",
    location: { lat: 17.4312, lng: 78.4567 },
    address: "Banjara Hills, Hyderabad",
  },
];

// Calculate distance between two points in km using Haversine formula
export function haversineDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get hospitals with real-time availability and distance calculations
// Filters to only show hospitals within maxDistance km
export function getHospitalsWithAvailability(
  userLat: number = 17.385044, 
  userLng: number = 78.486671,
  maxDistance: number = 10 // Default 10km radius
): Hospital[] {
  return HOSPITALS_DATA
    .map(hospital => {
      const distance = haversineDistance(
        userLat, userLng,
        hospital.location.lat, hospital.location.lng
      );
      
      return {
        ...hospital,
        availability: generateAvailability(),
        distance,
        eta: calculateETA(distance),
      };
    })
    .filter(hospital => (hospital.distance || 0) <= maxDistance)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

// Simulate real-time availability updates (for polling)
export function simulateAvailabilityUpdate(hospitals: Hospital[]): Hospital[] {
  return hospitals.map(h => ({
    ...h,
    availability: {
      ...h.availability!,
      emergencyBeds: Math.max(0, (h.availability?.emergencyBeds || 0) + (Math.random() > 0.5 ? 1 : -1)),
      icuBeds: Math.max(0, (h.availability?.icuBeds || 0) + (Math.random() > 0.7 ? 1 : -1)),
      ambulancesAvailable: Math.max(0, Math.min(5, (h.availability?.ambulancesAvailable || 0) + (Math.random() > 0.5 ? 1 : -1))),
      lastUpdated: new Date().toISOString(),
    },
  }));
}

// Get all hospitals regardless of distance (for map view)
export function getAllHospitals(
  userLat: number = 17.385044, 
  userLng: number = 78.486671
): Hospital[] {
  return HOSPITALS_DATA
    .map(hospital => {
      const distance = haversineDistance(
        userLat, userLng,
        hospital.location.lat, hospital.location.lng
      );
      
      return {
        ...hospital,
        availability: generateAvailability(),
        distance,
        eta: calculateETA(distance),
      };
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
