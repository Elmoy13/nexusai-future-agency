import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Hexagon, Triangle, Diamond, Circle,
  CalendarDays, ChevronRight, BarChart3, Layers, Plus,
  Instagram, Linkedin, Clock, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ── TikTok Icon ── */
const TikTokIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface Parrilla {
  id: string;
  name: string;
  platforms: ("instagram" | "tiktok" | "linkedin")[];
  postsCount: number;
  status: "active" | "draft" | "completed";
  scheduledDate: string;
}

interface BrandNode {
  name: string;
  icon: React.ElementType;
  status: "healthy" | "needs-attention";
  parrillas: Parrilla[];
  accent: string;
}

const brands: BrandNode[] = [
  {
    name: "Aero Dynamics",
    icon: Hexagon,
    status: "healthy",
    accent: "hsl(var(--primary))",
    parrillas: [
      {
        id: "drone-x10",
        name: "Parrilla - Lanzamiento Drone X10",
        platforms: ["instagram", "tiktok", "linkedin"],
        postsCount: 9,
        status: "active",
        scheduledDate: "Jul 2025",
      },
      {
        id: "aero-mayo",
        name: "Parrilla - Parrilla Mensual Mayo",
        platforms: ["instagram", "linkedin"],
        postsCount: 6,
        status: "completed",
        scheduledDate: "May 2025",
      },
    ],
  },
  {
    name: "Freshly Brewed",
    icon: Triangle,
    status: "healthy",
    accent: "hsl(160 100% 45%)",
    parrillas: [
      {
        id: "freshly-summer",
        name: "Parrilla - Cold Brew Summer '25",
        platforms: ["instagram", "tiktok"],
        postsCount: 12,
        status: "draft",
        scheduledDate: "Jun 2025",
      },
    ],
  },
  {
    name: "UrbanPulse",
    icon: Diamond,
    status: "needs-attention",
    accent: "hsl(270 80% 60%)",
    parrillas: [
      {
        id: "urban-tiktok",
        name: "Parrilla - TikTok Sprint Julio",
        platforms: ["tiktok"],
        postsCount: 14,
        status: "active",
        scheduledDate: "Jul 2025",
      },
    ],
  },
  {
    name: "CloudNest",
    icon: Circle,
    status: "healthy",
    accent: "hsl(200 90% 55%)",
    parrillas: [],
  },
];

const statusConfig = {
  active: { label: "Activa", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  draft: { label: "Borrador", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
  completed: { label: "Completada", className: "bg-primary/15 text-primary border-primary/30" },
};

const PlatformIcon = ({ platform }: { platform: "instagram" | "tiktok" | "linkedin" }) => {
  if (platform === "instagram") return <Instagram size={12} />;
  if (platform === "tiktok") return <TikTokIcon size={12} />;
  return <Linkedin size={12} />;
};

const ParrillasHub = () => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Parrillas de Contenido
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y programa el contenido social de todos tus clientes.
          </p>
        </div>
        <Button
          onClick={() => navigate("/parrilla/nueva")}
          className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm"
        >
          <Sparkles size={16} /> Nueva Parrilla IA
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {brands.map((brand, i) => {
          const Icon = brand.icon;
          return (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <Card className="group bg-card/60 border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  {/* Brand Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                        <Icon size={22} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{brand.name}</h3>
                        <Badge
                          variant="secondary"
                          className={`mt-1 text-[10px] px-2 py-0 h-5 font-medium border ${
                            brand.status === "healthy"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/15"
                          }`}
                        >
                          {brand.status === "healthy" ? "Portafolio Saludable" : "Requiere Atención"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 size={13} />
                      <span className="text-xs font-semibold">{brand.parrillas.length} parrillas</span>
                    </div>
                  </div>

                  {/* Parrillas List */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers size={12} className="text-primary/60" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Parrillas de Contenido
                      </span>
                    </div>

                    {brand.parrillas.length === 0 && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground/50 bg-secondary/20 rounded-lg px-3 py-3 border border-border/20 border-dashed">
                        <CalendarDays size={14} className="shrink-0" />
                        <span className="text-xs">Sin parrillas activas</span>
                      </div>
                    )}

                    {brand.parrillas.map((parrilla) => {
                      const sc = statusConfig[parrilla.status];
                      return (
                        <div
                          key={parrilla.id}
                          className="flex items-center gap-2.5 bg-secondary/30 rounded-xl px-3 py-2.5 border border-border/20 group/row hover:border-primary/25 hover:bg-secondary/50 transition-all"
                        >
                          <CalendarDays size={14} className="text-primary/70 shrink-0" />
                          <span className="truncate text-sm text-foreground/80 flex-1 font-medium">
                            {parrilla.name}
                          </span>

                          {/* Platforms */}
                          <div className="flex items-center gap-1 shrink-0">
                            {parrilla.platforms.map((p) => (
                              <span key={p} className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary/60">
                                <PlatformIcon platform={p} />
                              </span>
                            ))}
                          </div>

                          {/* Status */}
                          <Badge variant="secondary" className={`text-[10px] px-2 py-0 h-5 border shrink-0 ${sc.className}`}>
                            {sc.label}
                          </Badge>

                          {/* Open CTA */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/parrilla/${parrilla.id}`)}
                            className="h-7 px-2.5 text-[11px] text-primary/70 hover:text-primary hover:bg-primary/10 gap-1 font-semibold shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                          >
                            Abrir Parrilla <ChevronRight size={12} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer CTA */}
                  <div className="flex items-center gap-2 pt-1">
                    {brand.parrillas.some((p) => p.id === "drone-x10") && (
                      <Button
                        onClick={() => navigate("/parrilla/drone-x10")}
                        className="flex-1 h-9 text-xs font-bold bg-gradient-to-r from-primary/80 to-cyan-500/80 hover:from-primary hover:to-cyan-500 text-primary-foreground gap-1.5 shadow-md shadow-primary/20"
                      >
                        <Sparkles size={13} />
                        Abrir Parrilla Completa →
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 gap-1.5"
                    >
                      <Plus size={13} /> Nueva Parrilla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ParrillasHub;
