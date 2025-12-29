import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { MediSOSProvider } from "@/state/MediSOSProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/i18n/I18nProvider";
import { BottomTabsNav } from "@/components/BottomTabsNav";
import { OfflineBanner } from "@/components/OfflineBanner";

import Home from "@/pages/Home";
import Symptom from "@/pages/Symptom";
import Profile from "@/pages/Profile";
import Contacts from "@/pages/Contacts";
import Dashboard from "@/pages/Dashboard";
import MapHospitals from "@/pages/MapHospitals";
import SosActive from "@/pages/SosActive";

const queryClient = new QueryClient();

function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <OfflineBanner />
      {children}
      <BottomTabsNav />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <I18nProvider>
        <AuthProvider>
          <MediSOSProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/home"
                  element={
                    <TabsLayout>
                      <Home />
                    </TabsLayout>
                  }
                />
                <Route
                  path="/symptom"
                  element={
                    <TabsLayout>
                      <Symptom />
                    </TabsLayout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <TabsLayout>
                      <Profile />
                    </TabsLayout>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <TabsLayout>
                      <Contacts />
                    </TabsLayout>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <TabsLayout>
                      <Dashboard />
                    </TabsLayout>
                  }
                />

                <Route path="/map" element={<MapHospitals />} />
                <Route path="/sos" element={<SosActive />} />
                <Route path="/start" element={<Navigate to="/home" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </MediSOSProvider>
        </AuthProvider>
      </I18nProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
