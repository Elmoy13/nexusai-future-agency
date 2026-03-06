import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import OverviewModule from "@/components/dashboard/OverviewModule";
import StrategyModule from "@/components/dashboard/StrategyModule";
import ParrillaModule from "@/components/dashboard/ParrillaModule";
import InboxModule from "@/components/dashboard/InboxModule";

type View = "overview" | "strategy" | "parrilla" | "inbox";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<View>("overview");
  const [posts, setPosts] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-emerald-accent/5 blur-[120px] animate-float-slower" />
      </div>

      <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 relative z-10 p-8 overflow-y-auto">
        {activeView === "overview" && <OverviewModule />}
        {activeView === "strategy" && <StrategyModule onPostsGenerated={setPosts} />}
        {activeView === "parrilla" && <ParrillaModule posts={posts} />}
        {activeView === "inbox" && <InboxModule />}
      </main>
    </div>
  );
};

export default Dashboard;
