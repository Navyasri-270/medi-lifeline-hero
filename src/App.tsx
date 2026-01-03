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
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Symptom from "@/pages/Symptom";
import Profile from "@/pages/Profile";
import Contacts from "@/pages/Contacts";
import Dashboard from "@/pages/Dashboard";
import MapHospitals from "@/pages/MapHospitals";
import SosActive from "@/pages/SosActive";
import HealthReports from "@/pages/HealthReports";
import CaregiverDashboard from "@/pages/CaregiverDashboard";

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
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <TabsLayout>
                        <Home />
                      </TabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/symptom"
                  element={
                    <ProtectedRoute>
                      <TabsLayout>
                        <Symptom />
                      </TabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <TabsLayout>
                        <Profile />
                      </TabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <ProtectedRoute>
                      <TabsLayout>
                        <Contacts />
                      </TabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <TabsLayout>
                        <Dashboard />
                      </TabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/health-reports"
                  element={
                    <ProtectedRoute>
                      <TabsLayout>
                        <HealthReports />
                      </TabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <MapHospitals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sos"
                  element={
                    <ProtectedRoute>
                      <SosActive />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caregiver"
                  element={
                    <ProtectedRoute>
                      <CaregiverDashboard />
                    </ProtectedRoute>
                  }
                />
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
