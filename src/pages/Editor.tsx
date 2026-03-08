import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, FileDown, Check, Loader2,
  LayoutTemplate, Type, Image, Hexagon, Sparkles,
  Plus, ChevronLeft, ChevronRight, Cloud, Palette,
  Play, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { initialCampaigns } from "@/components/dashboard/briefs/campaignData";
import type { Campaign, SlideData } from "@/components/dashboard/briefs/campaignData";

/* ── Toolbar items ── */
const tools = [
  { icon: LayoutTemplate, label: "Plantillas" },
  { icon: Type, label: "Texto" },
  { icon: Image, label: "Imágenes" },
  { icon: Palette, label: "Brand Hub" },
];

/* ── Editable text on canvas ── */
const EditableText = ({
  value, onChange, className, tag: Tag = "h1",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  tag?: "h1" | "p" | "span";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  const commit = () => {
    setEditing(false);
    if (ref.current) onChange(ref.current.innerText);
  };

  return (
    <div
      ref={ref}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={() => setEditing(true)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
      className={`
        relative cursor-pointer transition-all duration-150 outline-none rounded-md
        ${editing
          ? "ring-2 ring-cyan-400/60 bg-white/10 px-2 py-1"
          : "hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/40 hover:bg-white/5 px-2 py-1"
        }
        ${className ?? ""}
      `}
    >
      {value}
    </div>
  );
};

/* ── Slide Canvas Renderer ── */
const SlideCanvas = ({
  slide, onUpdate,
}: {
  slide: SlideData;
  onUpdate: (patch: Partial<SlideData>) => void;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const recalc = useCallback(() => {
    if (!wrapperRef.current) return;
    const parent = wrapperRef.current.parentElement;
    if (!parent) return;
    const sx = parent.clientWidth / 1920;
    const sy = parent.clientHeight / 1080;
    setScale(Math.min(sx, sy, 1));
  }, []);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  return (
    <div
      ref={wrapperRef}
      className="absolute bg-white shadow-2xl shadow-black/10 ring-1 ring-border/20 rounded-lg overflow-hidden"
      style={{
        width: 1920,
        height: 1080,
        left: "50%",
        top: "50%",
        marginLeft: -960,
        marginTop: -540,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {slide.type === "cover" && (
        <div className="relative w-full h-full">
          {slide.image && <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          <div className="absolute top-16 left-20 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
              <Hexagon size={32} className="text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-white/60 tracking-[0.25em] uppercase">Aero Dynamics</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-[3px] bg-cyan-400 rounded-full" />
              <span className="text-base font-semibold text-cyan-400 tracking-widest uppercase">Pitch Deck · Q1 2025</span>
            </div>
            <EditableText
              value={slide.title}
              onChange={(v) => onUpdate({ title: v })}
              className="text-7xl font-black text-white leading-[1.05] tracking-tight max-w-[1200px]"
            />
            {slide.body && (
              <EditableText
                value={slide.body}
                onChange={(v) => onUpdate({ body: v })}
                tag="p"
                className="text-white/50 text-2xl mt-8 max-w-[800px]"
              />
            )}
          </div>
        </div>
      )}

      {slide.type === "content" && (
        <div className="w-full h-full flex">
          <div className="w-[42%] h-full relative bg-slate-50 flex items-center justify-center overflow-hidden">
            {slide.image && <img src={slide.image} alt="" className="w-[480px] h-[480px] rounded-3xl object-cover shadow-2xl" />}
          </div>
          <div className="w-[58%] h-full flex flex-col justify-center p-20">
            <EditableText
              value={slide.title}
              onChange={(v) => onUpdate({ title: v })}
              className="text-5xl font-extrabold text-slate-900 mb-12"
            />
            <div className="space-y-8">
              {slide.bullets?.map((b, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center mt-1">
                    <Check size={20} className="text-cyan-600" />
                  </div>
                  <EditableText
                    value={b}
                    onChange={(v) => {
                      const newBullets = [...(slide.bullets || [])];
                      newBullets[i] = v;
                      onUpdate({ bullets: newBullets });
                    }}
                    tag="p"
                    className="text-2xl text-slate-600 leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {slide.type === "art" && (
        <div className="w-full h-full flex flex-col p-20">
          <EditableText
            value={slide.title}
            onChange={(v) => onUpdate({ title: v })}
            className="text-5xl font-extrabold text-slate-900 mb-12"
          />
          <div className="flex-1 flex gap-10">
            <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border border-slate-100">
              {slide.image && <img src={slide.image} alt="Moodboard" className="w-full h-full object-cover" />}
            </div>
            {slide.colors && (
              <div className="w-80 flex flex-col gap-5">
                <p className="text-base font-bold text-slate-400 uppercase tracking-wider mb-2">Paleta Cromática</p>
                {slide.colors.map((c) => (
                  <div key={c.name} className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl shadow-sm border border-slate-100" style={{ background: c.hex }} />
                    <div>
                      <p className="text-lg font-semibold text-slate-700">{c.name}</p>
                      <p className="text-sm text-slate-400 font-mono">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Editor Page ── */
const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const campaign = initialCampaigns.find((c) => c.id === id) ?? initialCampaigns[0];
  const [slides, setSlides] = useState<SlideData[]>(campaign.slides);
  const [activeIdx, setActiveIdx] = useState(0);
  const [docTitle, setDocTitle] = useState(campaign.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const activeSlide = slides[activeIdx];

  const updateSlide = (patch: Partial<SlideData>) => {
    setSlides((prev) => prev.map((s, i) => (i === activeIdx ? { ...s, ...patch } : s)));
    setSaveState("idle");
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      id: `new-${Date.now()}`,
      type: "content",
      title: "Nueva Diapositiva",
      body: "Haz clic para editar este contenido",
      bullets: ["Punto clave 1", "Punto clave 2", "Punto clave 3"],
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveIdx(slides.length);
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await fetch("https://webhook.site/b80d309d-86be-445b-9bf5-4f678639f781", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_presentation",
          presentation_id: id ?? campaign.id,
          title: docTitle,
          slides_count: slides.length,
          timestamp: new Date().toISOString(),
          status: "success",
        }),
      });
    } catch {
      // Webhook may fail due to CORS — still show success for demo
    }
    await new Promise((r) => setTimeout(r, 800));
    setSaveState("saved");
    toast({ title: "✅ Presentación guardada", description: "Cambios sincronizados con el servidor." });
    setTimeout(() => setSaveState("idle"), 3000);
  };

  const handleExport = () => {
    toast({ title: "📋 Exportando PDF", description: "Generando archivo de alta resolución… (Simulado)" });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="h-14 bg-white border-b border-border/40 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-3 text-xs">
           <ArrowLeft size={14} /> Volver
          </Button>

          <div className="w-px h-6 bg-border/40" />
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            <Hexagon size={14} className="text-primary" />
          </div>
          <input
            value={docTitle}
            onChange={(e) => { setDocTitle(e.target.value); setSaveState("idle"); }}
            className="text-sm font-bold text-foreground bg-transparent border-none outline-none focus:ring-0 w-64 truncate"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Cloud size={12} className={saveState === "saved" ? "text-emerald-500" : "text-muted-foreground/50"} />
            {saveState === "saving" ? "Sincronizando..." : saveState === "saved" ? "Guardado" : "Guardado automáticamente"}
          </span>
          <Button onClick={handleExport} variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 border-border/40">
            <FileDown size={13} /> Exportar PDF
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveState === "saving"}
            size="sm"
            className="h-8 px-4 text-xs gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-sm shadow-cyan-500/20"
          >
            {saveState === "saving" ? (
              <><Loader2 size={13} className="animate-spin" /> Sincronizando...</>
            ) : saveState === "saved" ? (
              <><Check size={13} /> Guardado</>
            ) : (
              <><Save size={13} /> Guardar Cambios</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar (Tool Palette) ── */}
        <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-1 flex-shrink-0">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = activeTool === t.label;
            return (
              <button
                key={t.label}
                onClick={() => setActiveTool(active ? null : t.label)}
                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
                  active ? "bg-white/10 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title={t.label}
              >
                <Icon size={18} />
                <span className="text-[8px] font-medium leading-none">{t.label.slice(0, 6)}</span>
              </button>
            );
          })}

          <div className="flex-1" />

          {/* AI Magic button */}
          <button
            onClick={() => toast({ title: "✨ Magia IA", description: "Motor de IA generativa activado (Simulado)" })}
            className="w-11 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-all border border-cyan-500/20 mb-2"
            title="Magia IA"
          >
            <Sparkles size={18} />
            <span className="text-[8px] font-bold leading-none">IA</span>
          </button>
        </div>

        {/* ── Canvas Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <SlideCanvas slide={activeSlide} onUpdate={updateSlide} />
              </motion.div>
            </AnimatePresence>

            {/* Slide counter pill */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
              <button onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0} className="disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="tabular-nums">{activeIdx + 1} / {slides.length}</span>
              <button onClick={() => setActiveIdx(Math.min(slides.length - 1, activeIdx + 1))} disabled={activeIdx === slides.length - 1} className="disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>

          {/* ── Filmstrip ── */}
          <div className="h-28 bg-white border-t border-border/40 flex items-center px-4 gap-3 flex-shrink-0 overflow-x-auto">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveIdx(i)}
                className={`relative flex-shrink-0 w-40 h-[88px] rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  i === activeIdx
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/30"
                    : "border-border/30 hover:border-primary/30"
                }`}
              >
                {/* Mini slide preview */}
                <div className="absolute inset-0 bg-slate-50">
                  {s.image && <img src={s.image} alt="" className="w-full h-full object-cover opacity-60" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <p className="text-[9px] font-bold text-white truncate">{s.title}</p>
                  </div>
                </div>
                {/* Slide number */}
                <div className={`absolute top-1 left-1.5 text-[9px] font-bold rounded px-1 ${
                  i === activeIdx ? "bg-cyan-500 text-slate-950" : "bg-black/40 text-white/70"
                }`}>
                  {i + 1}
                </div>
              </button>
            ))}

            {/* Add slide */}
            <button
              onClick={addSlide}
              className="flex-shrink-0 w-40 h-[88px] rounded-lg border-2 border-dashed border-border/40 hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus size={18} />
              <span className="text-[10px] font-semibold">Nueva Slide</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
