import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeAccentProvider } from "@/contexts/ThemeAccentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgencyProvider } from "@/contexts/AgencyContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AgencyProvider>{children}</AgencyProvider>
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
import Channels from "./pages/Channels";
import Conversations from "./pages/Conversations";
import ChannelSelect from "./pages/ChannelSelect";
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

              {/* Protected */}
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/brand/:id" element={<Protected><Brand /></Protected>} />
              <Route path="/agente/nueva-marca" element={<Protected><Agent /></Protected>} />
              <Route path="/parrilla/:id" element={<Protected><Parrilla /></Protected>} />
              <Route path="/channels" element={<Protected><Channels /></Protected>} />
              <Route path="/conversations" element={<Protected><Conversations /></Protected>} />
              <Route path="/conversations/:id" element={<Protected><Conversations /></Protected>} />
              <Route path="/settings" element={<Protected><Settings /></Protected>} />
              <Route path="/settings/channels/select" element={<Protected><ChannelSelect /></Protected>} />
              <Route path="/editor/:id" element={<Protected><Editor /></Protected>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeAccentProvider>
  </QueryClientProvider>
);

export default App;
