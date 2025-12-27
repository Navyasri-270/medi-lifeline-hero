export type Severity = "low" | "moderate" | "high" | "critical";

export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
};

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  isDefault?: boolean;
};

export type MedicalProfile = {
  name: string;
  phone: string;
  bloodGroup: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
};

export type Settings = {
  voiceSosEnabled: boolean;
  smsOnSos: boolean;
  smsFallback: boolean;
  fakeCall: boolean;
  language: "en" | "te" | "hi";
};

export type SosLog = {
  id: string;
  name: string;
  timeISO: string;
  severity: Severity;
  location?: GeoPoint;
};

export type Hospital = {
  id: string;
  name: string;
  phone: string;
  type: "hospital" | "pharmacy";
  location: GeoPoint;
  address: string;
};
