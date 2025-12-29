import { useMemo, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobilePage } from "@/components/MobileShell";
import { useToast } from "@/hooks/use-toast";
import { useMediSOS } from "@/state/MediSOSProvider";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { AvatarSelector } from "@/components/AvatarSelector";
import { WorkModeToggle } from "@/components/WorkModeToggle";
import { 
  Copy, Share2, Globe, LogOut, Save, Check,
  Droplets, Pill, Heart, AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MedicalProfile } from "@/state/medisos-types";

function csvToArray(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Profile() {
  useSeo({
    title: "Medical Profile – MediSOS",
    description: "Manage your medical profile, avatar, and emergency medical information.",
    canonicalPath: "/profile",
  });

  const { toast } = useToast();
  const { profile, setProfile, contacts, settings, setSettings } = useMediSOS();
  const { user, isGuest, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  
  const [isSaved, setIsSaved] = useState(false);

  const [draft, setDraft] = useState({
    name: profile.name,
    phone: profile.phone,
    age: profile.age?.toString() || "",
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies.join(", "),
    medications: profile.medications.join(", "),
    chronicConditions: profile.chronicConditions.join(", "),
    avatarUrl: profile.avatarUrl || "",
    avatarType: profile.avatarType || "adult" as const,
  });

  // Sync profile from Supabase if logged in
  useEffect(() => {
    if (user && !isGuest) {
      loadProfileFromSupabase();
    }
  }, [user, isGuest]);

  const loadProfileFromSupabase = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        const loadedProfile: Partial<MedicalProfile> = {
          name: data.name || "",
          phone: data.phone || "",
          age: data.age || undefined,
          bloodGroup: data.blood_group || "",
          allergies: data.allergies || [],
          medications: data.medications || [],
          chronicConditions: data.chronic_conditions || [],
          avatarUrl: data.avatar_url || "",
          avatarType: (data.avatar_type as "child" | "adult" | "senior") || "adult",
          language: (data.language as "en" | "hi" | "te") || "en",
          workModeEnabled: data.work_mode_enabled || false,
          workModeStartHour: data.work_mode_start_hour || 9,
          workModeEndHour: data.work_mode_end_hour || 17,
        };
        
        setDraft({
          name: loadedProfile.name || "",
          phone: loadedProfile.phone || "",
          age: loadedProfile.age?.toString() || "",
          bloodGroup: loadedProfile.bloodGroup || "",
          allergies: loadedProfile.allergies?.join(", ") || "",
          medications: loadedProfile.medications?.join(", ") || "",
          chronicConditions: loadedProfile.chronicConditions?.join(", ") || "",
          avatarUrl: loadedProfile.avatarUrl || "",
          avatarType: loadedProfile.avatarType || "adult",
        });
        
        if (loadedProfile.language) {
          setLanguage(loadedProfile.language);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const qrPayload = useMemo(() => {
    return JSON.stringify(
      {
        profile: {
          name: draft.name,
          phone: draft.phone,
          blood_group: draft.bloodGroup,
          allergies: csvToArray(draft.allergies),
          medications: csvToArray(draft.medications),
          chronic_conditions: csvToArray(draft.chronicConditions),
        },
        emergency_contacts: contacts.map((c) => ({ 
          name: c.name, 
          phone: c.phone, 
          default: !!c.isDefault 
        })),
        generated_at: new Date().toISOString(),
      },
      null,
      0,
    );
  }, [contacts, draft]);

  const save = async () => {
    const updatedProfile: MedicalProfile = {
      name: draft.name,
      phone: draft.phone,
      age: draft.age ? parseInt(draft.age) : undefined,
      bloodGroup: draft.bloodGroup,
      allergies: csvToArray(draft.allergies),
      medications: csvToArray(draft.medications),
      chronicConditions: csvToArray(draft.chronicConditions),
      avatarUrl: draft.avatarUrl,
      avatarType: draft.avatarType,
      language: language as "en" | "hi" | "te",
      workModeEnabled: settings.workModeEnabled,
      workModeStartHour: settings.workModeStartHour,
      workModeEndHour: settings.workModeEndHour,
    };
    
    setProfile(updatedProfile);

    // Save to Supabase if logged in
    if (user && !isGuest) {
      try {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            name: draft.name,
            phone: draft.phone,
            age: draft.age ? parseInt(draft.age) : null,
            blood_group: draft.bloodGroup,
            allergies: csvToArray(draft.allergies),
            medications: csvToArray(draft.medications),
            chronic_conditions: csvToArray(draft.chronicConditions),
            avatar_url: draft.avatarUrl,
            avatar_type: draft.avatarType,
            language: language,
            work_mode_enabled: settings.workModeEnabled,
            work_mode_start_hour: settings.workModeStartHour,
            work_mode_end_hour: settings.workModeEndHour,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      } catch (error) {
        console.error("Error saving to Supabase:", error);
      }
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    toast({ title: t("success"), description: "Medical profile saved." });
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "MediSOS Medical ID", text: qrPayload });
      } else {
        await navigator.clipboard.writeText(qrPayload);
        toast({ title: "Copied", description: "QR payload copied to clipboard." });
      }
    } catch {
      toast({ title: "Share failed", description: "Could not share on this device." });
    }
  };

  const handleAvatarChange = (url: string, type: "child" | "adult" | "senior") => {
    setDraft(d => ({ ...d, avatarUrl: url, avatarType: type }));
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: t("logout"), description: "You have been logged out." });
  };

  return (
    <MobilePage title={t("medicalProfile")}>
      <section className="space-y-4 pb-6">
        {/* Avatar Section */}
        <Card className="shadow-elevated">
          <CardContent className="py-6">
            <AvatarSelector
              avatarUrl={draft.avatarUrl}
              avatarType={draft.avatarType}
              name={draft.name}
              age={draft.age ? parseInt(draft.age) : undefined}
              onAvatarChange={handleAvatarChange}
            />
            
            {isGuest && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  {t("guestModeDesc")}. Sign up to sync your profile across devices.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("personalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">{t("name")}</Label>
                <Input 
                  id="name" 
                  value={draft.name} 
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input 
                  id="phone" 
                  value={draft.phone} 
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="age">{t("age")}</Label>
                <Input 
                  id="age" 
                  type="number"
                  value={draft.age} 
                  onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))} 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bg" className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  {t("bloodGroup")}
                </Label>
                <Select 
                  value={draft.bloodGroup} 
                  onValueChange={(v) => setDraft(d => ({ ...d, bloodGroup: v }))}
                >
                  <SelectTrigger id="bg">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Info */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-4 w-4 text-destructive" />
              Medical Information
            </CardTitle>
            <p className="text-sm text-muted-foreground">Comma-separate multiple items</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="all" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                {t("allergies")}
              </Label>
              <Input 
                id="all" 
                placeholder="e.g., Penicillin, Peanuts"
                value={draft.allergies} 
                onChange={(e) => setDraft((d) => ({ ...d, allergies: e.target.value }))} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="med" className="flex items-center gap-1">
                <Pill className="h-3 w-3 text-blue-500" />
                {t("medications")}
              </Label>
              <Input 
                id="med" 
                placeholder="e.g., Metformin 500mg, Aspirin"
                value={draft.medications} 
                onChange={(e) => setDraft((d) => ({ ...d, medications: e.target.value }))} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cc">{t("chronicConditions")}</Label>
              <Input 
                id="cc" 
                placeholder="e.g., Diabetes, Hypertension"
                value={draft.chronicConditions} 
                onChange={(e) => setDraft((d) => ({ ...d, chronicConditions: e.target.value }))} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Mode */}
        <WorkModeToggle
          enabled={settings.workModeEnabled || false}
          onToggle={(enabled) => setSettings({ ...settings, workModeEnabled: enabled })}
          startHour={settings.workModeStartHour || 9}
          endHour={settings.workModeEndHour || 17}
        />

        {/* Language Selection */}
        <Card className="shadow-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label>{t("language")}</Label>
              </div>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "hi" | "te")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("english")}</SelectItem>
                  <SelectItem value="hi">{t("hindi")}</SelectItem>
                  <SelectItem value="te">{t("telugu")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          variant="sos" 
          size="xl" 
          className="w-full" 
          onClick={save}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("save")} Profile
            </>
          )}
        </Button>

        {/* Medical ID QR */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Medical ID QR</CardTitle>
            <p className="text-sm text-muted-foreground">
              Emergency responders can scan to view your info
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid place-items-center rounded-2xl border bg-white p-4">
              <QRCodeCanvas value={qrPayload} size={180} includeMargin />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(qrPayload);
                  toast({ title: "Copied", description: "QR payload copied." });
                }}
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" onClick={share}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        {(user || isGuest) && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        )}
      </section>
    </MobilePage>
  );
}
