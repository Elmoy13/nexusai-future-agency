import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import BriefsModule from "@/components/dashboard/BriefsModule";
type View = "overview" | "briefs" | "parrilla" | "community";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<View>("overview");

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {activeView === "overview" && <DashboardOverview />}
        {activeView === "briefs" && (
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-foreground">Briefs & Estrategia</h2>
            <p className="text-muted-foreground mt-2">Próximamente...</p>
          </div>
        )}
        {activeView === "parrilla" && (
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-foreground">Parrillas de Contenido</h2>
            <p className="text-muted-foreground mt-2">Próximamente...</p>
          </div>
        )}
        {activeView === "community" && (
          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-bold text-foreground">Community & Social</h2>
            <p className="text-muted-foreground mt-2">Próximamente...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
