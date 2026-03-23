import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import BriefsModule from "@/components/dashboard/BriefsModule";
import ParrillasHub from "@/components/dashboard/ParrillasHub";
import CommunityHub from "@/components/dashboard/CommunityHub";

type View = "overview" | "briefs" | "parrilla" | "community";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<View>("overview");

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {activeView === "overview" && <DashboardOverview />}
        {activeView === "briefs" && <BriefsModule />}
        {activeView === "parrilla" && <ParrillasHub />}
        {activeView === "community" && (
          <div className="p-8 md:p-12 max-w-6xl">
            <CommunityHub />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
