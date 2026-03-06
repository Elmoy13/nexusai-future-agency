import { BrainCircuit, Layers, MessageSquareWarning, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type View = "overview" | "strategy" | "parrilla" | "inbox";

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "strategy", label: "Estrategia", icon: BrainCircuit },
  { id: "parrilla", label: "Parrilla", icon: Layers },
  { id: "inbox", label: "Inbox IA", icon: MessageSquareWarning },
];

const DashboardSidebar = ({ activeView, onViewChange }: Props) => {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 glass-strong border-r border-border/30 flex flex-col py-8 px-4 gap-2">
      <div className="flex items-center gap-2 px-3 mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-accent pulse-dot" />
        <span className="font-bold text-lg tracking-tight text-foreground">NexusAI</span>
        <span className="ml-auto text-[10px] font-mono text-cyan-glow bg-cyan-glow/10 px-2 py-0.5 rounded-full">v2.0</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeView === item.id
                ? "bg-primary/10 text-primary glow-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <item.icon size={18} className={cn(activeView === item.id && "icon-neon text-cyan-glow")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto glass rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">Motor Activo</p>
        <p className="text-sm font-mono text-cyan-glow">Llama 3.3 70B</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent pulse-dot" />
          <span className="text-[11px] text-emerald-accent">Online — 12ms latencia</span>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
