import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeAccentProvider } from "@/contexts/ThemeAccentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgencyProvider } from "@/contexts/AgencyContext";
import { ActiveBrandProvider } from "@/contexts/ActiveBrandContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AgencyProvider>
      <ActiveBrandProvider>{children}</ActiveBrandProvider>
    </AgencyProvider>
  </ProtectedRoute>
);
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Brand from "./pages/Brand";
import Settings from "./pages/Settings";
import Editor from "./pages/Editor";
import Agent from "./pages/Agent";
import Parrilla from "./pages/Parrilla";
import { ParrillaErrorBoundary } from "./components/ParrillaErrorBoundary";
import Channels from "./pages/Channels";
import Conversations from "./pages/Conversations";
import ChannelSelect from "./pages/ChannelSelect";
import BriefsModule from "./components/dashboard/BriefsModule";
import ParrillasHub from "./components/dashboard/ParrillasHub";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeAccentProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected — inside DashboardLayout (sidebar + topbar always visible) */}
              <Route element={<Protected><DashboardLayout /></Protected>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/brand/:id" element={<Brand />} />
                <Route path="/agente/nueva-marca" element={<Agent />} />
                <Route path="/briefs" element={<BriefsModule />} />
                <Route path="/parrillas" element={<ParrillasHub />} />
                <Route path="/parrilla/:id" element={<ParrillaErrorBoundary><Parrilla /></ParrillaErrorBoundary>} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/conversations" element={<Conversations />} />
                <Route path="/conversations/:id" element={<Conversations />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/channels/select" element={<ChannelSelect />} />
                <Route path="/editor/:id" element={<Editor />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeAccentProvider>
  </QueryClientProvider>
);

export default App;
