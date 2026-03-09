import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Hexagon, Triangle, Diamond, Circle, Rocket, CalendarDays,
  FileText, ChevronRight, BarChart3, Layers
} from "lucide-react";
import { motion } from "framer-motion";

interface Brand {
  name: string;
  icon: React.ElementType;
  status: "healthy" | "needs-attention";
  campaigns: { emoji: React.ElementType; name: string }[];
  totalBriefs: number;
  accent: string;
}

const brands: Brand[] = [
  {
    name: "Aero Dynamics",
    icon: Hexagon,
    status: "healthy",
    campaigns: [
      { emoji: Rocket, name: "Lanzamiento Drone X" },
      { emoji: CalendarDays, name: "Parrilla Mensual Mayo" },
    ],
    totalBriefs: 7,
    accent: "hsl(var(--primary))",
  },
  {
    name: "Freshly Brewed",
    icon: Triangle,
    status: "healthy",
    campaigns: [
      { emoji: Rocket, name: "Cold Brew Summer '25" },
      { emoji: FileText, name: "Rebranding Orgánico" },
    ],
    totalBriefs: 5,
    accent: "hsl(160 100% 45%)",
  },
  {
    name: "UrbanPulse",
    icon: Diamond,
    status: "needs-attention",
    campaigns: [
      { emoji: Rocket, name: "Drop Streetwear Q3" },
      { emoji: CalendarDays, name: "TikTok Sprint Julio" },
      { emoji: FileText, name: "Manifiesto Gen-Z" },
    ],
    totalBriefs: 12,
    accent: "hsl(270 80% 60%)",
  },
  {
    name: "CloudNest",
    icon: Circle,
    status: "healthy",
    campaigns: [
      { emoji: Rocket, name: "Launch PLG Motion" },
    ],
    totalBriefs: 3,
    accent: "hsl(200 90% 55%)",
  },
];

interface Props {
  onOpenBrand: (brandName: string) => void;
  onNewBrand: () => void;
}

const BrandPortfolioDirectory = ({ onOpenBrand, onNewBrand }: Props) => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Estrategia y Briefs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona el cerebro y la identidad de todos tus clientes.
          </p>
        </div>
        <Button
          onClick={onNewBrand}
          className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm"
        >
          <Sparkles size={16} /> Entrenar Nueva Marca
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
                  {/* Brand header */}
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
                      <span className="text-xs font-semibold">{brand.totalBriefs} briefs</span>
                    </div>
                  </div>

                  {/* Campaigns */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers size={12} className="text-primary/60" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Campañas Activas
                      </span>
                    </div>
                    {brand.campaigns.map((c) => {
                      const CIcon = c.emoji;
                      return (
                        <div
                          key={c.name}
                          className="flex items-center gap-2.5 text-sm text-foreground/80 bg-secondary/30 rounded-lg px-3 py-2 border border-border/20"
                        >
                          <CIcon size={14} className="text-primary/70 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => onOpenBrand(brand.name)}
                    variant="ghost"
                    className="w-full h-10 text-xs text-primary/80 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 gap-1.5 font-semibold"
                  >
                    Abrir Portafolio Completo <ChevronRight size={14} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default BrandPortfolioDirectory;
