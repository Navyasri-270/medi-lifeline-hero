import type { EmergencyContact, Hospital, MedicalProfile, Settings, SosLog } from "@/state/medisos-types";

export const DEFAULT_PROFILE: MedicalProfile = {
  name: "Navya Sri",
  phone: "+91 9876543210",
  bloodGroup: "B+",
  allergies: ["penicillin"],
  medications: ["DrugA"],
  chronicConditions: [],
};

export const DEFAULT_CONTACTS: EmergencyContact[] = [
  { id: "c_mom", name: "Mom", phone: "+91 9999999999", isDefault: true },
  { id: "c_friend", name: "Friend", phone: "+91 8888888888" },
];

export const DEFAULT_SETTINGS: Settings = {
  voiceSosEnabled: true,
  smsOnSos: true,
  smsFallback: true,
  fakeCall: false,
  language: "en",
};

export const SAMPLE_HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "City Care Hospital",
    phone: "+91 9000000001",
    type: "hospital",
    address: "Main Road, Near Bus Stand",
    location: { lat: 17.385044, lng: 78.486671 },
  },
  {
    id: "h2",
    name: "Apollo Pharmacy",
    phone: "+91 9000000002",
    type: "pharmacy",
    address: "Market Street, Hyderabad",
    location: { lat: 17.393, lng: 78.474 },
  },
  {
    id: "h3",
    name: "Emergency Trauma Center",
    phone: "+91 9000000003",
    type: "hospital",
    address: "Ring Road, Hyderabad",
    location: { lat: 17.37, lng: 78.49 },
  },
];

export const SAMPLE_LOGS: SosLog[] = [
  {
    id: "log_1",
    name: "Navya Sri",
    timeISO: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    severity: "critical",
    location: { lat: 17.385, lng: 78.486 },
  },
  {
    id: "log_2",
    name: "Navya Sri",
    timeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    severity: "moderate",
    location: { lat: 17.39, lng: 78.48 },
  },
];
