import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MobilePage } from "@/components/MobileShell";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSeo } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Trash2, Download, Eye, Calendar, Shield, AlertCircle } from "lucide-react";

type ReportType = "lab" | "prescription" | "scan" | "other";

type HealthReport = {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  report_type: string;
  report_date: string;
  is_emergency_accessible: boolean | null;
  notes: string | null;
  created_at: string;
};

export default function HealthReports() {
  useSeo({
    title: "Health Reports – MediSOS",
    description: "Upload and manage your medical documents securely.",
    canonicalPath: "/reports",
  });

  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<ReportType>("lab");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [isEmergencyAccessible, setIsEmergencyAccessible] = useState(true);
  const [notes, setNotes] = useState("");

  // Fetch reports on mount
  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("health_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload PDF or image files only",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Maximum file size is 10MB",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;
    
    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("health-reports")
        .upload(fileName, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("health-reports")
        .getPublicUrl(fileName);
      
      // Save report metadata to database
      const { error: dbError } = await supabase
        .from("health_reports")
        .insert({
          user_id: user.id,
          name: selectedFile.name,
          file_url: publicUrl,
          file_type: selectedFile.type,
          report_type: reportType,
          report_date: reportDate,
          is_emergency_accessible: isEmergencyAccessible,
          notes: notes || null,
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Report uploaded",
        description: "Your medical document has been saved securely.",
      });
      
      // Reset form and refresh list
      setSelectedFile(null);
      setNotes("");
      fetchReports();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload the report. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (report: HealthReport) => {
    if (!user) return;
    
    try {
      // Extract file path from URL
      const urlParts = report.file_url.split("/");
      const filePath = `${user.id}/${urlParts[urlParts.length - 1]}`;
      
      // Delete from storage
      await supabase.storage.from("health-reports").remove([filePath]);
      
      // Delete from database
      const { error } = await supabase
        .from("health_reports")
        .delete()
        .eq("id", report.id);
      
      if (error) throw error;
      
      toast({ title: "Report deleted" });
      fetchReports();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete the report.",
      });
    }
  };

  const getReportTypeLabel = (type: ReportType) => {
    switch (type) {
      case "lab": return "Lab Report";
      case "prescription": return "Prescription";
      case "scan": return "Scan/X-Ray";
      default: return "Other";
    }
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case "lab": return "🧪";
      case "prescription": return "💊";
      case "scan": return "🩻";
      default: return "📄";
    }
  };

  if (isGuest) {
    return (
      <MobilePage title="Health Reports">
        <Card className="shadow-elevated">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">Login Required</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Guest users cannot upload medical reports. Please sign in to access this feature.
              </p>
            </div>
            <Button variant="sos" onClick={() => window.location.href = "/auth"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </MobilePage>
    );
  }

  return (
    <MobilePage title="Health Reports">
      <section className="space-y-4">
        {/* Upload Card */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lab">🧪 Lab Report</SelectItem>
                  <SelectItem value="prescription">💊 Prescription</SelectItem>
                  <SelectItem value="scan">🩻 Scan / X-Ray</SelectItem>
                  <SelectItem value="other">📄 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Report Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Report Date</Label>
              <Input
                id="date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>

            {/* Emergency Access Toggle */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-accent">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Emergency Accessible</p>
                  <p className="text-xs text-muted-foreground">
                    Responders can view during SOS
                  </p>
                </div>
              </div>
              <Switch
                checked={isEmergencyAccessible}
                onCheckedChange={setIsEmergencyAccessible}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add notes about this report..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Upload Button */}
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Report"}
            </Button>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="shadow-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No reports uploaded yet</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-lg border bg-card flex items-start gap-3"
                >
                  <div className="text-2xl">
                    {getReportIcon(report.report_type as ReportType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{report.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {getReportTypeLabel(report.report_type as ReportType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.report_date).toLocaleDateString()}
                      </span>
                    </div>
                    {report.is_emergency_accessible && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-1">
                        <Shield className="h-3 w-3" />
                        Emergency accessible
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(report.file_url, "_blank")}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = report.file_url;
                        a.download = report.name;
                        a.click();
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(report)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </MobilePage>
  );
}
