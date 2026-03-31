import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeAccentProvider } from "@/contexts/ThemeAccentContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Editor from "./pages/Editor";
import Agent from "./pages/Agent";
import Parrilla from "./pages/Parrilla";
import Community from "./pages/Community";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeAccentProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agente/nueva-marca" element={<Agent />} />
            <Route path="/parrilla/:id" element={<Parrilla />} />
            <Route path="/community/:id" element={<Community />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/editor/:id" element={<Editor />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeAccentProvider>
  </QueryClientProvider>
);

export default App;
