import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, Target, MessageSquare, Palette, Eye,
  Rocket, CalendarDays, FileText, CheckCircle2, Clock, Archive,
  Hexagon, Users
} from "lucide-react";
import { motion } from "framer-motion";

const identityCards = [
  {
    icon: Target,
    title: "Público Primario",
    content: "Ejecutivos C-Level en empresas de tecnología, 35-55 años. Orientados a innovación y eficiencia operativa.",
  },
  {
    icon: Users,
    title: "Público Secundario",
    content: "Gerentes de marketing digital en startups de alto crecimiento, orientados a performance.",
  },
  {
    icon: MessageSquare,
    title: "Tono de Comunicación",
    content: "Profesional pero accesible. Autoridad técnica con calidez humana. Evitar jerga excesiva.",
  },
  {
    icon: Eye,
    title: "Look & Feel",
    content: "Minimalista y tecnológico. Espacios amplios, tipografía geométrica, paleta reducida.",
  },
];

const palette = [
  "hsl(var(--primary))",
  "hsl(200 60% 30%)",
  "hsl(210 20% 90%)",
  "hsl(160 50% 45%)",
  "hsl(0 0% 12%)",
];

const campaigns = [
  { name: "Lanzamiento Drone X", status: "approved" as const, icon: Rocket, date: "Mar 2025" },
  { name: "Parrilla Mensual Mayo", status: "generating" as const, icon: CalendarDays, date: "May 2025" },
  { name: "Rebranding Website", status: "approved" as const, icon: FileText, date: "Ene 2025" },
  { name: "Campaña Black Friday '24", status: "archived" as const, icon: FileText, date: "Nov 2024" },
  { name: "Video Institucional Q3", status: "approved" as const, icon: Rocket, date: "Sep 2024" },
];

const statusConfig = {
  generating: { label: "Generando", color: "bg-primary/15 text-primary border-primary/30", icon: Clock },
  approved: { label: "Aprobado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  archived: { label: "Archivado", color: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30", icon: Archive },
};

interface Props {
  brandName: string;
  onBack: () => void;
}

const BrandHub = ({ brandName, onBack }: Props) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
            <Hexagon size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{brandName}</h1>
            <p className="text-sm text-muted-foreground">Brand Hub · 5 briefs · Estrategia completa</p>
          </div>
        </div>
        <Button className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm">
          <Plus size={16} /> Nueva Campaña / Brief
        </Button>
      </div>

      {/* Section A: Identity */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target size={14} className="text-primary/60" />
          Identidad Central — El Cerebro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {identityCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <Card className="bg-card/50 border-border/30 hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon size={15} className="text-primary" />
                      <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">{card.title}</h4>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed">{card.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Color palette */}
        <Card className="bg-card/50 border-border/30 mt-4">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={15} className="text-primary" />
              <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Paleta de Colores</h4>
            </div>
            <div className="flex gap-3">
              {palette.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-border/20 shadow-sm"
                    style={{ background: c }}
                  />
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {i === 0 ? "Primary" : i === 1 ? "Deep" : i === 2 ? "Light" : i === 3 ? "Accent" : "Dark"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section B: Campaign Timeline */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <CalendarDays size={14} className="text-primary/60" />
          Línea de Tiempo de Campañas
        </h2>
        <div className="space-y-2.5">
          {campaigns.map((camp, i) => {
            const CIcon = camp.icon;
            const st = statusConfig[camp.status];
            const SIcon = st.icon;
            return (
              <motion.div
                key={camp.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <Card className="bg-card/40 border-border/25 hover:border-primary/15 transition-all duration-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-secondary/40 flex items-center justify-center shrink-0">
                      <CIcon size={16} className="text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{camp.name}</h4>
                      <span className="text-[11px] text-muted-foreground">{camp.date}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-2 py-0 h-5 font-medium border ${st.color} hover:opacity-100 gap-1`}
                    >
                      <SIcon size={10} /> {st.label}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default BrandHub;
