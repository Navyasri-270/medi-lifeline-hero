import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_CONTACTS, DEFAULT_PROFILE, DEFAULT_SETTINGS, SAMPLE_LOGS, SAMPLE_HOSPITALS } from "@/data/sample";
import { loadJson, saveJson, safeId } from "@/state/medisos-storage";
import type { EmergencyContact, Hospital, MedicalProfile, Settings, Severity, SosLog, GeoPoint } from "@/state/medisos-types";

type MediSOSState = {
  profile: MedicalProfile;
  contacts: EmergencyContact[];
  settings: Settings;
  hospitals: Hospital[];
  logs: SosLog[];
  setProfile: (next: MedicalProfile) => void;
  upsertContact: (contact: Omit<EmergencyContact, "id"> & { id?: string }) => void;
  deleteContact: (id: string) => void;
  setDefaultContact: (id: string) => void;
  setSettings: (next: Settings) => void;
  logSos: (args: { severity: Severity; location?: GeoPoint }) => SosLog;
};

const Ctx = createContext<MediSOSState | null>(null);

export function MediSOSProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<MedicalProfile>(() => loadJson("profile", DEFAULT_PROFILE));
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => loadJson("contacts", DEFAULT_CONTACTS));
  const [settings, setSettingsState] = useState<Settings>(() => loadJson("settings", DEFAULT_SETTINGS));
  const [logs, setLogs] = useState<SosLog[]>(() => loadJson("logs", SAMPLE_LOGS));

  const hospitals = SAMPLE_HOSPITALS;

  const setProfile = useCallback((next: MedicalProfile) => {
    setProfileState(next);
    saveJson("profile", next);
  }, []);

  const setSettings = useCallback((next: Settings) => {
    setSettingsState(next);
    saveJson("settings", next);
  }, []);

  const upsertContact = useCallback((contact: Omit<EmergencyContact, "id"> & { id?: string }) => {
    setContacts((prev) => {
      const id = contact.id ?? safeId("c");
      const next: EmergencyContact = { ...contact, id };
      const idx = prev.findIndex((c) => c.id === id);
      const updated = idx >= 0 ? prev.map((c) => (c.id === id ? next : c)) : [next, ...prev];
      saveJson("contacts", updated);
      return updated;
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (!updated.some((c) => c.isDefault) && updated[0]) updated[0] = { ...updated[0], isDefault: true };
      saveJson("contacts", updated);
      return updated;
    });
  }, []);

  const setDefaultContact = useCallback((id: string) => {
    setContacts((prev) => {
      const updated = prev.map((c) => ({ ...c, isDefault: c.id === id }));
      saveJson("contacts", updated);
      return updated;
    });
  }, []);

  const logSos = useCallback(
    ({ severity, location }: { severity: Severity; location?: GeoPoint }) => {
      const entry: SosLog = {
        id: safeId("log"),
        name: profile.name || "Guest",
        timeISO: new Date().toISOString(),
        severity,
        location,
      };
      setLogs((prev) => {
        const updated = [entry, ...prev];
        saveJson("logs", updated);
        return updated;
      });
      return entry;
    },
    [profile.name],
  );

  const value = useMemo<MediSOSState>(
    () => ({
      profile,
      contacts,
      settings,
      hospitals,
      logs,
      setProfile,
      upsertContact,
      deleteContact,
      setDefaultContact,
      setSettings,
      logSos,
    }),
    [profile, contacts, settings, hospitals, logs, setProfile, upsertContact, deleteContact, setDefaultContact, setSettings, logSos],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMediSOS() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMediSOS must be used within MediSOSProvider");
  return ctx;
}

export function severityLabel(s: Severity) {
  if (s === "low") return "Low";
  if (s === "moderate") return "Moderate";
  if (s === "high") return "High";
  return "Critical";
}

export function severityTone(s: Severity): "default" | "destructive" | "secondary" {
  if (s === "critical") return "destructive";
  if (s === "high") return "destructive";
  if (s === "moderate") return "secondary";
  return "default";
}

export function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}
