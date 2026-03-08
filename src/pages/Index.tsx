import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustedBy from "@/components/TrustedBy";
import OnboardingChat from "@/components/OnboardingChat";
import BentoFeatures from "@/components/BentoFeatures";
import ROIMetrics from "@/components/ROIMetrics";
import AppMockup from "@/components/AppMockup";
import EarlyAccessModal from "@/components/EarlyAccessModal";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar onOpenModal={openModal} />
      <HeroSection onOpenModal={openModal} />
      <EarlyAccessModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <TrustedBy />
      <OnboardingChat />
      <BentoFeatures />
      <ROIMetrics />
      <AppMockup />

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-accent pulse-dot" />
            <span className="font-bold tracking-tight">NexusAI</span>
          </div>
          <p className="text-sm text-muted-foreground/50">
            © 2026 NexusAI. Todos los sistemas operativos.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
