import { useState } from "react";
import PresentationMode from "./PresentationMode";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Plus, Target, MessageSquare, Palette, Eye,
  Hexagon, Users, FileDown, Pencil, ImagePlus, Play,
  ChevronDown, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import slideDroneImg from "@/assets/slide-drone-x10.jpg";
import slideAeroImg from "@/assets/slide-aero-pro.jpg";
import slideStrategyImg from "@/assets/slide-strategy-2024.jpg";
import slideRrssImg from "@/assets/slide-rrss-mayo.jpg";

/* ── Identity cards ── */
const identityCards = [
  { icon: Target, title: "Público Primario", content: "Ejecutivos C-Level en empresas de tecnología, 35-55 años. Orientados a innovación y eficiencia operativa." },
  { icon: Users, title: "Público Secundario", content: "Gerentes de marketing digital en startups de alto crecimiento, orientados a performance." },
  { icon: MessageSquare, title: "Tono de Comunicación", content: "Profesional pero accesible. Autoridad técnica con calidez humana. Evitar jerga excesiva." },
  { icon: Eye, title: "Look & Feel", content: "Minimalista y tecnológico. Espacios amplios, tipografía geométrica, paleta reducida." },
];

const palette = [
  "hsl(var(--primary))",
  "hsl(200 60% 30%)",
  "hsl(210 20% 90%)",
  "hsl(160 50% 45%)",
  "hsl(0 0% 12%)",
];

/* ── Status system ── */
type SlideStatus = "approved" | "in-progress" | "sent" | "draft";

const statusConfig: Record<SlideStatus, { label: string; dot: string; bg: string }> = {
  approved:      { label: "Approved",       dot: "bg-emerald-500", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  "in-progress": { label: "In Progress",    dot: "bg-amber-500",   bg: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  sent:          { label: "Sent to Client", dot: "bg-sky-500",     bg: "bg-sky-500/10 text-sky-600 border-sky-500/25" },
  draft:         { label: "Draft",          dot: "bg-muted-foreground", bg: "bg-muted/60 text-muted-foreground border-border/40" },
};

const allStatuses: SlideStatus[] = ["approved", "in-progress", "sent", "draft"];

/* ── Slide data ── */
interface SlideCard {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  status: SlideStatus;
}

const initialSlides: SlideCard[] = [
  { id: "1", title: "Lanzamiento Drone X10", subtitle: "Campaña de producto · Q1 2025", image: slideDroneImg, status: "approved" },
  { id: "2", title: "Campaña 'Aero Pro' Verano", subtitle: "Brand awareness · Summer '25", image: slideAeroImg, status: "in-progress" },
  { id: "3", title: "Estrategia Anual 2024", subtitle: "Planificación estratégica · FY24", image: slideStrategyImg, status: "sent" },
  { id: "4", title: "Brief de RRSS Mayo", subtitle: "Social media · Mayo 2025", image: slideRrssImg, status: "draft" },
];

/* ── Component ── */
interface Props {
  brandName: string;
  onBack: () => void;
}

const BrandHub = ({ brandName, onBack }: Props) => {
  const [slides, setSlides] = useState(initialSlides);
  const [presentingSlide, setPresentingSlide] = useState<SlideCard | null>(null);

  const updateStatus = (id: string, status: SlideStatus) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleExportAll = () => {
    toast({
      title: "📋 Exportando a PDF",
      description: "Generando archivo PDF de alta resolución... (Simulado para Demo)",
    });
  };

  const handleExportSingle = (title: string) => {
    toast({
      title: "📋 Exportando Brief",
      description: `Generando PDF de "${title}"... (Simulado para Demo)`,
    });
  };

  if (presentingSlide) {
    return (
      <AnimatePresence>
        <PresentationMode
          campaignTitle={presentingSlide.title}
          onClose={() => setPresentingSlide(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
            <Hexagon size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{brandName}</h1>
            <p className="text-sm text-muted-foreground">Brand Hub · {slides.length} briefs · Estrategia completa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportAll}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 gap-2 h-11 px-5 font-semibold"
          >
            <FileDown size={16} /> Exportar Todo a PDF
          </Button>
          <Button className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm">
            <Plus size={16} /> Nueva Campaña
          </Button>
        </div>
      </div>

      {/* ── Section A: Identity ── */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target size={14} className="text-primary/60" />
          Identidad Central — El Cerebro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {identityCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}>
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
                  <div className="w-10 h-10 rounded-full border-2 border-border/20 shadow-sm" style={{ background: c }} />
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {["Primary", "Deep", "Light", "Accent", "Dark"][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section B: Slide Preview Grid ── */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
          <Play size={14} className="text-primary/60" />
          Mesa de Presentaciones de Brief
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {slides.map((slide, i) => {
            const st = statusConfig[slide.status];
            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
              >
                <Card className="group bg-card/60 border-border/30 hover:border-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                  {/* Slide preview image */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Keynote-style overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Brand watermark */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <Hexagon size={14} className="text-white/90" />
                      </div>
                      <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase">Aero Dynamics</span>
                    </div>

                    {/* Hover action buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleExportSingle(slide.title)}
                        className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors"
                        title="Exportar PDF"
                      >
                        <FileDown size={14} className="text-white/80" />
                      </button>
                    </div>

                    {/* Bottom overlay with title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-base leading-tight">{slide.title}</h3>
                      <p className="text-white/60 text-xs mt-0.5">{slide.subtitle}</p>
                    </div>
                  </div>

                  {/* Card footer with status + actions */}
                  <CardContent className="p-4 flex items-center justify-between">
                    {/* Status dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${st.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                          {st.label}
                          <ChevronDown size={12} className="opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[160px]">
                        {allStatuses.map((s) => {
                          const sc = statusConfig[s];
                          return (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateStatus(slide.id, s)}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                              {sc.label}
                              {slide.status === s && <Check size={12} className="ml-auto text-primary" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Action icons */}
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="Editar texto">
                        <Pencil size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="Cambiar imagen">
                        <ImagePlus size={14} />
                      </button>
                      <button
                        onClick={() => setPresentingSlide(slide)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Ver presentación"
                      >
                        <Play size={14} />
                      </button>
                    </div>
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
