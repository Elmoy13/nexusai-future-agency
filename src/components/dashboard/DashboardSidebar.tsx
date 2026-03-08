import { LayoutDashboard, ClipboardList, CalendarRange, MessageSquare, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

type View = "overview" | "briefs" | "parrilla" | "community";

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { id: View; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Vista General", icon: LayoutDashboard },
  { id: "briefs", label: "Briefs & Estrategia", icon: ClipboardList },
  { id: "parrilla", label: "Parrillas de Contenido", icon: CalendarRange },
  { id: "community", label: "Community & Social", icon: MessageSquare },
];

const DashboardSidebar = ({ activeView, onViewChange }: Props) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "shrink-0 h-screen sticky top-0 glass-strong border-r border-border/30 flex flex-col py-6 transition-all duration-300",
        collapsed ? "w-[72px] px-2" : "w-64 px-4"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2 mb-8", collapsed ? "justify-center px-0" : "px-3")}>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-accent pulse-dot shrink-0" />
        {!collapsed && (
          <>
            <span className="font-bold text-lg tracking-tight text-foreground">NexusAI</span>
            <span className="ml-auto text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">PRO</span>
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="self-end -mr-1 mb-4 w-7 h-7 rounded-full bg-secondary/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-none cursor-pointer",
              collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
              activeView === item.id
                ? "bg-primary/10 text-primary glow-border"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 bg-transparent"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} className={cn("shrink-0", activeView === item.id && "icon-neon text-primary")} />
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      {/* User profile & logout */}
      <div className={cn("mt-auto glass rounded-xl flex items-center gap-3", collapsed ? "p-2 justify-center" : "p-4")}>
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <User size={16} className="text-primary" />
        </div>
        {!collapsed && (
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
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;
