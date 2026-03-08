import { LayoutDashboard, FileText, Layers, Radio, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type View = "overview" | "strategy" | "parrilla" | "inbox";

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "strategy", label: "Generador de Briefs", icon: FileText },
  { id: "parrilla", label: "Revisión de Parrillas", icon: Layers },
  { id: "inbox", label: "Comunidad & Crisis", icon: Radio },
];

const DashboardSidebar = ({ activeView, onViewChange }: Props) => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 glass-strong border-r border-border/30 flex flex-col py-8 px-4 gap-2">
      <div className="flex items-center gap-2 px-3 mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-accent pulse-dot" />
        <span className="font-bold text-lg tracking-tight text-foreground">NexusAI</span>
        <span className="ml-auto text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">v2.0</span>
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
            <item.icon size={18} className={cn(activeView === item.id && "icon-neon text-primary")} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User profile & logout */}
      <div className="mt-auto glass rounded-xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <User size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Admin Nexus</p>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors duration-200 bg-transparent border-none cursor-pointer mt-0.5"
          >
            <LogOut size={11} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
