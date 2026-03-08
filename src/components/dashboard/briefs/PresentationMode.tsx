import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Download, Share2,
  Hexagon, Target, Users, Palette, TrendingUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import slideDroneImg from "@/assets/slide-drone-x10.jpg";
import slidePersonaImg from "@/assets/slide-target-persona.jpg";
import slideMoodboardImg from "@/assets/slide-moodboard.jpg";

/* ── Slide components ── */

const SlideCover = () => (
  <div className="relative w-full h-full overflow-hidden bg-slate-950">
    <img src={slideDroneImg} alt="Drone X10" className="absolute inset-0 w-full h-full object-cover opacity-70" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
    <div className="absolute top-8 left-10 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
        <Hexagon size={20} className="text-cyan-400" />
      </div>
      <span className="text-sm font-bold text-white/60 tracking-[0.25em] uppercase">Aero Dynamics</span>
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-[2px] bg-cyan-400 rounded-full" />
        <span className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Pitch Deck · Q1 2025</span>
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.05] tracking-tight max-w-2xl">
        Campaña<br />Lanzamiento<br />
        <span className="text-cyan-400">Drone X10</span>
      </h1>
      <p className="text-white/40 text-sm mt-6 max-w-md">Estrategia integral de go-to-market para el segmento enterprise. Generado con IA Estratégica.</p>
    </div>
  </div>
);

const SlideAudience = () => (
  <div className="w-full h-full bg-white flex flex-col md:flex-row">
    {/* Left: persona visual */}
    <div className="w-full md:w-[42%] h-1/2 md:h-full relative bg-slate-50 flex items-center justify-center overflow-hidden">
      <img src={slidePersonaImg} alt="Target Persona" className="w-64 h-64 md:w-80 md:h-80 rounded-2xl object-cover shadow-2xl shadow-cyan-500/10" />
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-cyan-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Persona Primaria</span>
          </div>
          <p className="text-sm font-bold text-slate-800">Carlos Mendoza</p>
          <p className="text-xs text-slate-500">CTO · Enterprise Tech · 42 años</p>
        </div>
      </div>
    </div>

    {/* Right: pain points */}
    <div className="w-full md:w-[58%] h-1/2 md:h-full flex flex-col justify-center p-8 md:p-14">
      <div className="flex items-center gap-2 mb-2">
        <Users size={14} className="text-cyan-600" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Público Objetivo</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
        Dolores & Necesidades <span className="text-cyan-600">Identificados por IA</span>
      </h2>

      {[
        { label: "Eficiencia Operativa", desc: "Necesita reducir tiempos de inspección aérea en un 60% para mantener competitividad." },
        { label: "Integración Tecnológica", desc: "Busca soluciones que se integren con sus sistemas IoT existentes sin fricción." },
        { label: "ROI Demostrable", desc: "Requiere métricas claras antes de aprobar presupuesto. Ciclo de decisión: 45 días." },
        { label: "Escalabilidad", desc: "Opera en 3 países y necesita una solución que escale sin infraestructura adicional." },
      ].map((item, i) => (
        <div key={i} className="flex gap-4 mb-5 last:mb-0">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center mt-0.5">
            <TrendingUp size={14} className="text-cyan-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SlideArtDirection = () => {
  const colors = [
    { name: "Cyan Primary", hex: "#06B6D4" },
    { name: "Deep Navy", hex: "#0F172A" },
    { name: "Soft Slate", hex: "#E2E8F0" },
    { name: "Accent Teal", hex: "#14B8A6" },
    { name: "Pure White", hex: "#FFFFFF" },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col p-8 md:p-14">
      <div className="flex items-center gap-2 mb-2">
        <Palette size={14} className="text-cyan-600" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección de Arte</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">
        Moodboard & <span className="text-cyan-600">Identidad Visual</span>
      </h2>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        {/* Moodboard */}
        <div className="flex-1 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
          <img src={slideMoodboardImg} alt="Moodboard" className="w-full h-full object-cover" />
        </div>

        {/* Color + typography */}
        <div className="w-full md:w-64 flex flex-col gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Paleta Cromática</p>
            <div className="flex flex-col gap-2">
              {colors.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-100" style={{ background: c.hex }} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{c.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Tipografía</p>
            <div className="space-y-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-lg font-extrabold text-slate-800 leading-none">Inter Display</p>
                <p className="text-[10px] text-slate-400 mt-1">Headings · Bold 800</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-sm text-slate-600">Inter Regular</p>
                <p className="text-[10px] text-slate-400 mt-1">Body · Regular 400</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Slides array ── */
const slides = [
  { id: 1, component: SlideCover, label: "Portada" },
  { id: 2, component: SlideAudience, label: "Público Objetivo" },
  { id: 3, component: SlideArtDirection, label: "Dirección de Arte" },
];

/* ── Main Component ── */
interface Props {
  campaignTitle: string;
  onClose: () => void;
}

const PresentationMode = ({ campaignTitle, onClose }: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose]);

  const CurrentSlideComponent = slides[currentSlide].component;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0, scale: 0.92 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0, scale: 0.92 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2 h-9 px-4 text-sm">
          <ArrowLeft size={16} /> Volver
        </Button>
        <div className="flex items-center gap-3">
          <Hexagon size={16} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white/80 hidden md:inline">{campaignTitle} — Pitch Deck</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-white/5 gap-2 h-9 px-4 text-sm"
            onClick={() => toast({ title: "🔗 Link copiado", description: "Enlace de presentación copiado al portapapeles (Simulado)" })}
          >
            <Share2 size={14} /> Compartir
          </Button>
          <Button
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold gap-2 h-9 px-5 text-sm shadow-lg shadow-cyan-500/20"
            onClick={() => toast({ title: "📋 Exportando PDF", description: "Generando archivo de alta resolución… (Simulado)" })}
          >
            <Download size={14} /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-hidden">
        <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0"
            >
              <CurrentSlideComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex items-center justify-center gap-6 py-5 bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
        <button
          onClick={prev}
          disabled={currentSlide === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === currentSlide
                  ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === currentSlide ? "bg-cyan-400" : "bg-slate-600"}`} />
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={currentSlide === slides.length - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default PresentationMode;
