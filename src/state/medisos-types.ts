export type Severity = "low" | "moderate" | "high" | "critical";

export type UrgencyLevel = "EMERGENCY" | "CONSULT_SOON" | "MONITOR";

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
  relationship?: string;
  isDefault?: boolean;
  notifySms?: boolean;
};

export type MedicalProfile = {
  name: string;
  phone: string;
  age?: number;
  bloodGroup: string;
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  avatarUrl?: string;
  avatarType?: "child" | "adult" | "senior";
  language?: "en" | "hi" | "te";
  workModeEnabled?: boolean;
  workModeStartHour?: number;
  workModeEndHour?: number;
};

export type Settings = {
  voiceSosEnabled: boolean;
  smsOnSos: boolean;
  smsFallback: boolean;
  fakeCall: boolean;
  language: "en" | "te" | "hi";
  workModeEnabled?: boolean;
  workModeStartHour?: number;
  workModeEndHour?: number;
};

export type SosLog = {
  id: string;
  name: string;
  timeISO: string;
  severity: Severity;
  location?: GeoPoint;
  contactsNotified?: string[];
  status?: "active" | "resolved" | "cancelled";
};

export type HealthReport = {
  id: string;
  name: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  reportType: "lab" | "prescription" | "scan" | "other";
  reportDate: string;
  notes?: string;
  isEmergencyAccessible?: boolean;
};

export type HospitalAvailability = {
  emergencyBeds: number;
  icuBeds: number;
  generalBeds: number;
  ambulancesAvailable: number;
  lastUpdated: string;
};

export type Hospital = {
  id: string;
  name: string;
  phone: string;
  type: "hospital" | "pharmacy" | "clinic";
  location: GeoPoint;
  address: string;
  availability?: HospitalAvailability;
  distance?: number;
  eta?: string;
};

export type SymptomAnalysisResult = {
  urgency: UrgencyLevel;
  assessment: string;
  follow_up_questions: string[];
  recommendations: string[];
  warning_signs: string[];
  disclaimer: string;
};
