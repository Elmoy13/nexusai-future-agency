import { useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown, LogOut, Settings, Building2, Tag,
  Hexagon, ClipboardList, CalendarRange,
  MessageCircle, Plug, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PRODUCT } from "@/config/product";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveBrand } from "@/contexts/ActiveBrandContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  { id: "brands",        label: "Marcas",           icon: Hexagon,       href: "/dashboard" },
  { id: "briefs",        label: "Briefs",           icon: ClipboardList, href: "/briefs" },
  { id: "parrillas",     label: "Parrillas",        icon: CalendarRange, href: "/parrillas" },
  { id: "conversations", label: "Conversaciones",   icon: MessageCircle, href: "/conversations" },
  { id: "channels",      label: "Canales",          icon: Plug,          href: "/channels" },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, memberships, currentAgencyId, setCurrentAgencyId, signOut } = useAuth();
  const { brand: activeBrand, brands, setBrand } = useActiveBrand();
  const [collapsed, setCollapsed] = useState(false);

  const currentAgency = useMemo(
    () => memberships.find((m) => m.agency_id === currentAgencyId)?.agency,
    [memberships, currentAgencyId],
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  /** Which sidebar item is active based on the current path */
  const activeId = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/conversations")) return "conversations";
    if (p.startsWith("/channels")) return "channels";
    if (p.startsWith("/parrillas") || p.startsWith("/parrilla")) return "parrillas";
    if (p.startsWith("/briefs")) return "briefs";
    // /dashboard, /brand/:id, etc.
    return "brands";
  }, [location.pathname]);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* ═══ Sidebar ═══ */}
      <aside
        className={cn(
          "shrink-0 h-screen sticky top-0 glass-strong border-r border-border/30 flex flex-col py-6 transition-all duration-300 z-20",
          collapsed ? "w-[72px] px-2" : "w-64 px-4",
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-2 mb-8", collapsed ? "justify-center px-0" : "px-3")}>
          <span className="w-2.5 h-2.5 rounded-full bg-accent pulse-dot shrink-0" />
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-foreground">{PRODUCT.name}</span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="self-end -mr-1 mb-4 w-7 h-7 rounded-full bg-secondary/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-none cursor-pointer",
                  collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary/10 text-primary glow-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 bg-transparent",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className={cn("shrink-0", isActive && "icon-neon text-primary")} />
                {!collapsed && item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto space-y-3">
          <button
            onClick={() => navigate("/settings")}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-none cursor-pointer w-full",
              collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
              location.pathname.startsWith("/settings")
                ? "bg-primary/10 text-primary glow-border"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 bg-transparent",
            )}
            title={collapsed ? "Configuración" : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && "Configuración"}
          </button>

          <div className={cn("glass rounded-xl flex items-center gap-3", collapsed ? "p-2 justify-center" : "p-4")}>
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
              {initialsOf(user?.email || "U")}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.email || "Usuario"}
                </p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors duration-200 bg-transparent border-none cursor-pointer mt-0.5"
                >
                  <LogOut size={11} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═══ Main column ═══ */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="shrink-0 z-30 glass-strong border-b border-border/30">
          <div className="px-6 h-16 flex items-center gap-4">
            {memberships.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/40 text-sm text-foreground transition">
                  <Building2 size={14} className="text-primary" />
                  <span className="font-medium truncate max-w-[180px]">{currentAgency?.name ?? "Selecciona agencia"}</span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                  <DropdownMenuLabel>Tus agencias</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {memberships.map((m) => (
                    <DropdownMenuItem
                      key={m.agency_id}
                      onClick={() => setCurrentAgencyId(m.agency_id)}
                      className={m.agency_id === currentAgencyId ? "bg-primary/10 text-primary" : ""}
                    >
                      <Building2 size={14} className="mr-2 opacity-70" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.agency.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Brand selector */}
            {brands.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/40 text-sm text-foreground transition">
                  <Tag size={14} className="text-primary" />
                  <span className="font-medium truncate max-w-[180px]">{activeBrand?.name ?? "Selecciona marca"}</span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                  <DropdownMenuLabel>Marcas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {brands.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => setBrand(b.id)}
                      className={b.id === activeBrand?.id ? "bg-primary/10 text-primary" : ""}
                    >
                      <Tag size={14} className="mr-2 opacity-70" />
                      <span className="text-sm font-medium">{b.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-secondary/40 hover:bg-secondary/70 border border-border/40 transition">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                      {initialsOf(profile?.full_name || user?.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium text-foreground">{profile?.full_name || "Sin nombre"}</p>
                    <p className="text-[11px] text-muted-foreground font-normal truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings size={14} className="mr-2" /> Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut size={14} className="mr-2" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
