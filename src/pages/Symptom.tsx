import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobilePage } from "@/components/MobileShell";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { speak, useMediSOS } from "@/state/MediSOSProvider";
import { useSeo } from "@/lib/seo";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { UrgencyIndicator } from "@/components/UrgencyIndicator";
import { supabase } from "@/integrations/supabase/client";
import type { SymptomAnalysisResult, UrgencyLevel } from "@/state/medisos-types";
import { 
  Mic, Send, Loader2, AlertTriangle, Clock, 
  CheckCircle, Phone, MapPin, Home, 
  Stethoscope, MessageCircle, ShieldAlert
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function Symptom() {
  useSeo({
    title: "AI Symptom Checker – MediSOS",
    description: "Professional AI-powered symptom analysis with medical guidance.",
    canonicalPath: "/symptom",
  });

  const nav = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const { settings, logSos, profile } = useMediSOS();
  const { session, isGuest } = useAuth();
  
  const [input, setInput] = useState("");
  const [painLevel, setPainLevel] = useState(5);
  const [duration, setDuration] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  const sr = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    lang: settings.language === "hi" ? "hi-IN" : settings.language === "te" ? "te-IN" : "en-IN",
    onFinal: (t) => setInput((prev) => (prev ? `${prev} ${t}` : t)),
  });

  const canMic = sr.supported;
  const promptSos = result?.urgency === "EMERGENCY";

  // Set age group from profile
  useEffect(() => {
    if (profile.age) {
      if (profile.age <= 2) setAgeGroup("infant");
      else if (profile.age <= 12) setAgeGroup("child");
      else if (profile.age <= 18) setAgeGroup("teen");
      else if (profile.age <= 59) setAgeGroup("adult");
      else setAgeGroup("senior");
    }
  }, [profile.age]);

  const analyzeSymptoms = async () => {
    if (!input.trim()) {
      toast({ 
        title: t("error"), 
        description: "Please describe what you're experiencing.",
        variant: "destructive"
      });
      return;
    }

    if (!session && !isGuest) {
      toast({
        title: "Authentication required",
        description: "Please log in to use the symptom checker.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const medicalHistory = [
        ...profile.allergies.map(a => `Allergy: ${a}`),
        ...profile.chronicConditions.map(c => `Condition: ${c}`),
        ...profile.medications.map(m => `Medication: ${m}`),
      ].join("; ");

      const { data, error } = await supabase.functions.invoke("symptom-checker", {
        body: {
          symptoms: `${input}. Pain level: ${painLevel}/10. Duration: ${duration || "not specified"}.`,
          age: profile.age || ageGroup,
          medicalHistory: medicalHistory || undefined,
          followUpAnswers: Object.keys(followUpAnswers).length > 0 ? followUpAnswers : undefined,
        },
      });

      if (error) throw error;

      const analysisResult = data as SymptomAnalysisResult;
      setResult(analysisResult);
      
      // Speak urgency level
      if (analysisResult.urgency === "EMERGENCY") {
        speak("Emergency detected. Immediate medical attention recommended.");
        toast({ 
          title: "Emergency - Seek Immediate Help",
          description: "Based on your symptoms, urgent medical care is recommended.",
          variant: "destructive"
        });
      } else if (analysisResult.urgency === "CONSULT_SOON") {
        speak("Consult a doctor soon.");
      } else {
        speak("Symptoms appear manageable. Monitor and rest.");
      }

      // Show follow-up questions if available
      if (analysisResult.follow_up_questions?.length > 0) {
        setShowFollowUp(true);
      }

    } catch (error) {
      console.error("Symptom analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze symptoms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationIcon = (rec: string) => {
    const lower = rec.toLowerCase();
    if (lower.includes("call") || lower.includes("ambulance") || lower.includes("911") || lower.includes("108")) {
      return <Phone className="h-4 w-4 text-red-500" />;
    }
    if (lower.includes("hospital") || lower.includes("emergency")) {
      return <MapPin className="h-4 w-4 text-orange-500" />;
    }
    if (lower.includes("home") || lower.includes("rest") || lower.includes("monitor")) {
      return <Home className="h-4 w-4 text-green-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-primary" />;
  };

  return (
    <MobilePage title={t("symptomChecker")}>
      <section className="space-y-4 pb-6">
        {/* Input Card */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {t("describeSymptoms")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe your symptoms in detail for accurate assessment
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I have a severe headache that started 2 hours ago, with nausea and sensitivity to light..."
              className="min-h-24 resize-none"
              disabled={isAnalyzing}
            />
            
            {/* Additional Context */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="How long?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_than_1_hour">&lt; 1 hour</SelectItem>
                    <SelectItem value="1_to_6_hours">1-6 hours</SelectItem>
                    <SelectItem value="6_to_24_hours">6-24 hours</SelectItem>
                    <SelectItem value="more_than_24_hours">&gt; 24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs">Age Group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infant">Infant (0-2)</SelectItem>
                    <SelectItem value="child">Child (3-12)</SelectItem>
                    <SelectItem value="teen">Teen (13-18)</SelectItem>
                    <SelectItem value="adult">Adult (19-59)</SelectItem>
                    <SelectItem value="senior">Senior (60+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pain Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pain Level</Label>
                <span className="text-sm font-medium">{painLevel}/10</span>
              </div>
              <Slider
                value={[painLevel]}
                onValueChange={([v]) => setPainLevel(v)}
                max={10}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>None</span>
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => (sr.listening ? sr.stop() : sr.start())}
                disabled={!canMic || isAnalyzing}
              >
                <Mic className={sr.listening ? "h-4 w-4 animate-pulse text-red-500" : "h-4 w-4"} />
                {sr.listening ? "Listening..." : "Voice Input"}
              </Button>
              <Button 
                variant="sos" 
                onClick={analyzeSymptoms}
                disabled={isAnalyzing || !input.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("analyzing")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("analyzeSymptoms")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className="shadow-elevated animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Assessment</CardTitle>
                <UrgencyIndicator urgency={result.urgency} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assessment */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{result.assessment}</p>
              </div>

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {t("recommendations")}
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm bg-background rounded-lg p-2 border">
                        {getRecommendationIcon(rec)}
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warning Signs */}
              {result.warning_signs?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    {t("warningSignsTitle")}
                  </h4>
                  <ul className="space-y-1 bg-orange-50 rounded-lg p-3">
                    {result.warning_signs.map((sign, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-orange-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Questions */}
              {showFollowUp && result.follow_up_questions?.length > 0 && (
                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {t("followUpQuestions")}
                  </h4>
                  {result.follow_up_questions.map((q, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-xs">{q}</Label>
                      <Input
                        placeholder="Your answer..."
                        value={followUpAnswers[`q${i}`] || ""}
                        onChange={(e) => setFollowUpAnswers(prev => ({
                          ...prev,
                          [`q${i}`]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={analyzeSymptoms}
                    disabled={isAnalyzing}
                  >
                    Re-analyze with answers
                  </Button>
                </div>
              )}

              {/* Disclaimer */}
              <div className="border-t pt-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{result.disclaimer || t("medicalDisclaimer")}</p>
                </div>
              </div>

              {/* Emergency SOS Trigger */}
              {promptSos && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="sos" size="xl" className="w-full">
                      <Phone className="h-4 w-4" />
                      Trigger Emergency SOS
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Trigger Emergency SOS?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Emergency severity detected. This will notify your emergency contacts and show nearby hospitals.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          logSos({ severity: "critical" });
                          nav("/sos");
                        }}
                      >
                        Confirm SOS
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => nav("/map")}>
            <MapPin className="h-4 w-4" />
            Find Hospital
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = "tel:108"}>
            <Phone className="h-4 w-4" />
            Call 108
          </Button>
        </div>
      </section>
    </MobilePage>
  );
}
