import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MediSOSLogo } from "@/components/MediSOSLogo";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Shield, Heart, MapPin, Phone } from "lucide-react";

const Index = () => {
  useSeo({
    title: "MediSOS – Emergency Medical Assistance",
    description:
      "MediSOS is a real-time emergency medical assistance app with one-tap SOS, live location tracking, and instant hospital access.",
    canonicalPath: "/",
  });

  const navigate = useNavigate();
  const { user, isGuest, loading } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && (user || isGuest)) {
      navigate("/home");
    }
  }, [user, isGuest, loading, navigate]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-ambient flex items-center justify-center">
        <div className="animate-pulse">
          <MediSOSLogo className="scale-110" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-ambient">
      <section className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 py-12">
        {/* Logo and branding */}
        <div className="text-center space-y-4">
          <MediSOSLogo className="scale-125 mx-auto" />
          <h1 className="font-display text-3xl text-foreground">Your Mobile Lifeline</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Emergency medical assistance at your fingertips. One tap to save lives.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card border shadow-sm">
            <div className="p-2 rounded-full bg-primary/10">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium">One-Tap SOS</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card border shadow-sm">
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium">Live Tracking</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card border shadow-sm">
            <div className="p-2 rounded-full bg-primary/10">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium">Medical Profile</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-card border shadow-sm">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium">Secure Data</span>
          </div>
        </div>

        {/* Auth buttons */}
        <div className="w-full space-y-3 mt-4">
          <Button 
            variant="sos" 
            size="xl" 
            className="w-full"
            onClick={() => navigate("/auth?tab=signup")}
          >
            Register
          </Button>
          <Button 
            variant="outline" 
            size="xl" 
            className="w-full"
            onClick={() => navigate("/auth?tab=login")}
          >
            Sign In
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </section>
    </main>
  );
};

export default Index;
