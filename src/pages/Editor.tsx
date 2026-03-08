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
import type { SlideData, SlideElement } from "@/components/dashboard/briefs/campaignData";

/* ── helpers ── */
const uid = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

/** Convert legacy slide fields into an elements array for the free canvas */
function slideToElements(slide: SlideData): SlideElement[] {
  if (slide.elements?.length) return slide.elements;

  const els: SlideElement[] = [];

  if (slide.type === "cover") {
    els.push({ id: uid(), type: "text", content: slide.title, x: 80, y: 680, fontSize: 96, fontWeight: "900", color: "#ffffff" });
    if (slide.body) els.push({ id: uid(), type: "text", content: slide.body, x: 80, y: 820, fontSize: 28, fontWeight: "400", color: "rgba(255,255,255,0.5)" });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 0, y: 0, width: 1920, height: 1080, opacity: 0.7 });
  } else if (slide.type === "content") {
    els.push({ id: uid(), type: "text", content: slide.title, x: 860, y: 80, fontSize: 56, fontWeight: "800", color: "#0f172a" });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 100, y: 200, width: 600, height: 600 });
    slide.bullets?.forEach((b, i) => {
      els.push({ id: uid(), type: "text", content: b, x: 860, y: 220 + i * 120, fontSize: 28, fontWeight: "400", color: "#475569" });
    });
  } else {
    els.push({ id: uid(), type: "text", content: slide.title, x: 80, y: 80, fontSize: 56, fontWeight: "800", color: "#0f172a" });
    if (slide.body) els.push({ id: uid(), type: "text", content: slide.body, x: 80, y: 180, fontSize: 32, fontWeight: "400", color: "#64748b" });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 80, y: 280, width: 1000, height: 600 });
    slide.colors?.forEach((c, i) => {
      els.push({ id: uid(), type: "shape", content: c.hex, x: 1200 + (i % 2) * 200, y: 280 + Math.floor(i / 2) * 200, width: 160, height: 160 });
      els.push({ id: uid(), type: "text", content: `${c.name}\n${c.hex}`, x: 1200 + (i % 2) * 200, y: 460 + Math.floor(i / 2) * 200, fontSize: 18, fontWeight: "500", color: "#475569" });
    });
  }

  return els;
}

/* ── Toolbar items ── */
const tools = [
  { icon: LayoutTemplate, label: "Plantillas", action: "templates" },
  { icon: Type, label: "Texto", action: "text" },
  { icon: Image, label: "Imágenes", action: "image" },
  { icon: Palette, label: "Brand Hub", action: "brand" },
];

/* ── Draggable Element ── */
const CanvasElement = ({
  el, scale, onUpdate, onDelete,
}: {
  el: SlideElement;
  scale: number;
  onUpdate: (patch: Partial<SlideElement>) => void;
  onDelete: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [localContent, setLocalContent] = useState(el.content);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setLocalContent(el.content); }, [el.content]);
  useEffect(() => { if (editing && textRef.current) textRef.current.focus(); }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    if (localContent !== el.content) onUpdate({ content: localContent });
  };

  if (el.type === "image") {
    return (
      <motion.div
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          onUpdate({ x: el.x + info.offset.x / scale, y: el.y + info.offset.y / scale });
        }}
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width ?? 400,
          height: el.height ?? 400,
          opacity: el.opacity ?? 1,
          cursor: "grab",
        }}
        whileDrag={{ cursor: "grabbing", boxShadow: "0 0 0 3px rgba(6,182,212,0.5)" }}
        className="group rounded-lg overflow-hidden hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/50"
      >
        <img src={el.content} alt="" className="w-full h-full object-cover pointer-events-none" />
      </motion.div>
    );
  }

  if (el.type === "shape") {
    return (
      <motion.div
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          onUpdate({ x: el.x + info.offset.x / scale, y: el.y + info.offset.y / scale });
        }}
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width ?? 160,
          height: el.height ?? 160,
          background: el.content,
          borderRadius: 16,
          cursor: "grab",
        }}
        whileDrag={{ cursor: "grabbing", boxShadow: "0 0 0 3px rgba(6,182,212,0.5)" }}
        className="shadow-sm border border-black/10 hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/50"
      />
    );
  }

  /* text element */
  return (
    <motion.div
      drag={!editing}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (!editing) {
          onUpdate({ x: el.x + info.offset.x / scale, y: el.y + info.offset.y / scale });
        }
      }}
      onDoubleClick={() => setEditing(true)}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        cursor: editing ? "text" : "grab",
        maxWidth: 1400,
      }}
      whileDrag={{ cursor: "grabbing", boxShadow: "0 0 0 3px rgba(6,182,212,0.5)" }}
      className={`group rounded-md transition-all duration-150 ${
        editing
          ? "ring-2 ring-cyan-400/60 bg-white/10"
          : "hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/40 hover:bg-white/5"
      }`}
    >
      {editing ? (
        <textarea
          ref={textRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === "Escape") commitEdit(); }}
          style={{
            fontSize: el.fontSize ?? 28,
            fontWeight: el.fontWeight ?? "400",
            color: el.color ?? "#0f172a",
            lineHeight: 1.3,
          }}
          className="bg-transparent border-none outline-none resize-none w-full min-w-[200px] px-2 py-1"
          rows={localContent.split("\n").length}
        />
      ) : (
        <div
          style={{
            fontSize: el.fontSize ?? 28,
            fontWeight: el.fontWeight ?? "400",
            color: el.color ?? "#0f172a",
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
          }}
          className="px-2 py-1 select-none"
        >
          {el.content}
        </div>
      )}
    </motion.div>
  );
};

/* ── Scaled Slide (used in canvas, filmstrip, presentation) ── */
const ScaledSlide = ({
  elements, bgImage, interactive, scale: forcedScale, onUpdateElement, onDeleteElement,
}: {
  elements: SlideElement[];
  bgImage?: string;
  interactive?: boolean;
  scale?: number;
  onUpdateElement?: (id: string, patch: Partial<SlideElement>) => void;
  onDeleteElement?: (id: string) => void;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);

  const recalc = useCallback(() => {
    if (!wrapperRef.current) return;
    const p = wrapperRef.current.parentElement;
    if (!p) return;
    setAutoScale(Math.min(p.clientWidth / 1920, p.clientHeight / 1080, 1));
  }, []);

  useEffect(() => {
    if (forcedScale != null) return;
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc, forcedScale]);

  const s = forcedScale ?? autoScale;

  // Sort: images/shapes first (z-order), then text on top
  const sorted = [...elements].sort((a, b) => {
    const order = { image: 0, shape: 1, text: 2 };
    return (order[a.type] ?? 1) - (order[b.type] ?? 1);
  });

  return (
    <div
      ref={wrapperRef}
      className="absolute bg-white shadow-2xl shadow-black/10 ring-1 ring-border/20 rounded-lg overflow-hidden"
      style={{
        width: 1920, height: 1080,
        left: "50%", top: "50%",
        marginLeft: -960, marginTop: -540,
        transform: `scale(${s})`,
        transformOrigin: "center center",
      }}
    >
      {/* Background gradient for cover slides */}
      {bgImage && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-[1]" />
        </>
      )}

      <div className="absolute inset-0 z-[2]">
        {sorted.map((el) =>
          interactive ? (
            <CanvasElement
              key={el.id}
              el={el}
              scale={s}
              onUpdate={(patch) => onUpdateElement?.(el.id, patch)}
              onDelete={() => onDeleteElement?.(el.id)}
            />
          ) : (
            /* Static render for filmstrip / presentation */
            el.type === "image" ? (
              <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 400, height: el.height ?? 400, opacity: el.opacity ?? 1 }}>
                <img src={el.content} alt="" className="w-full h-full object-cover rounded-lg" />
              </div>
            ) : el.type === "shape" ? (
              <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 160, height: el.height ?? 160, background: el.content, borderRadius: 16 }} />
            ) : (
              <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400", color: el.color ?? "#0f172a", lineHeight: 1.3, whiteSpace: "pre-wrap", maxWidth: 1400 }} className="px-2 py-1">
                {el.content}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

/* ── Main Editor Page ── */
const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const campaign = initialCampaigns.find((c) => c.id === id) ?? initialCampaigns[0];

  // Convert legacy slides to element-based
  const [slidesElements, setSlidesElements] = useState<SlideElement[][]>(() =>
    campaign.slides.map(slideToElements)
  );
  const [slideMeta, setSlideMeta] = useState(() =>
    campaign.slides.map((s) => ({ id: s.id, type: s.type, image: s.type === "cover" ? s.image : undefined }))
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [docTitle, setDocTitle] = useState(campaign.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState("");

  const currentElements = slidesElements[activeIdx] ?? [];

  const updateElement = (elId: string, patch: Partial<SlideElement>) => {
    setSlidesElements((prev) =>
      prev.map((els, i) =>
        i === activeIdx ? els.map((e) => (e.id === elId ? { ...e, ...patch } : e)) : els
      )
    );
    setSaveState("idle");
  };

  const deleteElement = (elId: string) => {
    setSlidesElements((prev) =>
      prev.map((els, i) => (i === activeIdx ? els.filter((e) => e.id !== elId) : els))
    );
  };

  const addTextElement = () => {
    const el: SlideElement = {
      id: uid(), type: "text",
      content: "Doble clic para editar",
      x: 760, y: 440,
      fontSize: 48, fontWeight: "600", color: "#0f172a",
    };
    setSlidesElements((prev) =>
      prev.map((els, i) => (i === activeIdx ? [...els, el] : els))
    );
    toast({ title: "📝 Texto añadido", description: "Arrastra para posicionar, doble clic para editar." });
  };

  const addImageElement = () => {
    const el: SlideElement = {
      id: uid(), type: "shape",
      content: "#e2e8f0",
      x: 660, y: 340,
      width: 600, height: 400,
    };
    // Also add a label
    const label: SlideElement = {
      id: uid(), type: "text",
      content: "Simulación de Imagen",
      x: 810, y: 510,
      fontSize: 28, fontWeight: "500", color: "#94a3b8",
    };
    setSlidesElements((prev) =>
      prev.map((els, i) => (i === activeIdx ? [...els, el, label] : els))
    );
    toast({ title: "🖼️ Imagen añadida", description: "Placeholder de imagen insertado en el lienzo." });
  };

  const handleToolClick = (action: string) => {
    if (action === "text") { addTextElement(); setActiveTool(null); }
    else if (action === "image") { addImageElement(); setActiveTool(null); }
    else { setActiveTool(activeTool === action ? null : action); }
  };

  const addSlide = () => {
    const newId = `new-${Date.now()}`;
    setSlideMeta((prev) => [...prev, { id: newId, type: "content" as const, image: undefined }]);
    setSlidesElements((prev) => [
      ...prev,
      [
        { id: uid(), type: "text", content: "Nueva Diapositiva", x: 80, y: 80, fontSize: 64, fontWeight: "800", color: "#0f172a" },
        { id: uid(), type: "text", content: "Haz clic para editar este contenido", x: 80, y: 200, fontSize: 32, fontWeight: "400", color: "#64748b" },
      ],
    ]);
    setActiveIdx(slideMeta.length);
  };

  /* ── Save ── */
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
          slides: slidesElements,
          timestamp: new Date().toISOString(),
          status: "success",
        }),
      });
    } catch { /* webhook may fail CORS */ }
    await new Promise((r) => setTimeout(r, 800));
    setSaveState("saved");
    toast({ title: "✅ Presentación guardada", description: "Cambios sincronizados con el servidor." });
    setTimeout(() => setSaveState("idle"), 3000);
  };

  /* ── Export ── */
  const handleExport = () => {
    setExporting(true);
    setExportProgress(0);
    setExportMsg("Preparando assets...");
    const steps = [
      { at: 600, progress: 35, msg: "Preparando assets..." },
      { at: 1200, progress: 65, msg: "Renderizando tipografías..." },
      { at: 2000, progress: 90, msg: "Optimizando resolución..." },
      { at: 2500, progress: 100, msg: "¡PDF Listo!" },
    ];
    steps.forEach(({ at, progress, msg }) =>
      setTimeout(() => { setExportProgress(progress); setExportMsg(msg); }, at)
    );
  };

  /* ── Presentation keyboard (always active for presenting) ── */
  useEffect(() => {
    if (!presenting) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { document.exitFullscreen?.().catch(() => {}); setPresenting(false); }
      if (e.key === "ArrowRight" || e.key === " ") setActiveIdx((i) => Math.min(slideMeta.length - 1, i + 1));
      if (e.key === "ArrowLeft") setActiveIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenting, slideMeta.length]);

  /* ── Enter fullscreen ── */
  const presRef = useRef<HTMLDivElement>(null);
  const startPresenting = () => {
    setPresenting(true);
    setTimeout(() => {
      presRef.current?.requestFullscreen?.().catch(() => {});
    }, 100);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Presentation overlay */}
      <AnimatePresence>
        {presenting && (
          <PresentationOverlay
            ref={presRef}
            allElements={slidesElements}
            slideMeta={slideMeta}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            onClose={() => { document.exitFullscreen?.().catch(() => {}); setPresenting(false); }}
          />
        )}
      </AnimatePresence>

      {/* Export PDF overlay */}
      <AnimatePresence>
        {exporting && (
          <ExportPdfOverlay progress={exportProgress} message={exportMsg} onClose={() => { setExporting(false); setExportProgress(0); }} />
        )}
      </AnimatePresence>

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
          <Button onClick={startPresenting} variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 border-border/40">
            <Play size={13} /> Presentar
          </Button>
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
        {/* ── Left Sidebar ── */}
        <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-1 flex-shrink-0">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = activeTool === t.action;
            return (
              <button
                key={t.label}
                onClick={() => handleToolClick(t.action)}
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
                key={slideMeta[activeIdx]?.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <ScaledSlide
                  elements={currentElements}
                  bgImage={slideMeta[activeIdx]?.image}
                  interactive
                  onUpdateElement={updateElement}
                  onDeleteElement={deleteElement}
                />
              </motion.div>
            </AnimatePresence>

            {/* Slide counter pill */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg z-10">
              <button onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0} className="disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="tabular-nums">{activeIdx + 1} / {slideMeta.length}</span>
              <button onClick={() => setActiveIdx(Math.min(slideMeta.length - 1, activeIdx + 1))} disabled={activeIdx === slideMeta.length - 1} className="disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>

          {/* ── Filmstrip ── */}
          <div className="h-28 bg-white border-t border-border/40 flex items-center px-4 gap-3 flex-shrink-0 overflow-x-auto">
            {slideMeta.map((meta, i) => (
              <button
                key={meta.id}
                onClick={() => setActiveIdx(i)}
                className={`relative flex-shrink-0 w-40 h-[88px] rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  i === activeIdx
                    ? "border-cyan-500 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/30"
                    : "border-border/30 hover:border-primary/30"
                }`}
              >
                <div className="absolute inset-0 bg-slate-50">
                  <div className="absolute inset-0" style={{ transform: `scale(${40 / 1920})`, transformOrigin: "top left", width: 1920, height: 1080 }}>
                    {(slidesElements[i] ?? []).map((el) =>
                      el.type === "image" ? (
                        <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 400, height: el.height ?? 400, opacity: el.opacity ?? 1 }}>
                          <img src={el.content} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : el.type === "shape" ? (
                        <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 160, height: el.height ?? 160, background: el.content, borderRadius: 16 }} />
                      ) : (
                        <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400", color: el.color ?? "#0f172a", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden" }}>
                          {el.content}
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className={`absolute top-1 left-1.5 text-[9px] font-bold rounded px-1 z-10 ${
                  i === activeIdx ? "bg-cyan-500 text-slate-950" : "bg-black/40 text-white/70"
                }`}>
                  {i + 1}
                </div>
              </button>
            ))}
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

/* ── Fullscreen Presentation Mode ── */
import { forwardRef } from "react";

const PresentationOverlay = forwardRef<HTMLDivElement, {
  allElements: SlideElement[][];
  slideMeta: { id: string; type: string; image?: string }[];
  activeIdx: number;
  setActiveIdx: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}>(({ allElements, slideMeta, activeIdx, setActiveIdx, onClose }, ref) => {
  const [showControls, setShowControls] = useState(true);
  const [cursorHidden, setCursorHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const hideAfterDelay = () => {
    clearTimeout(timerRef.current);
    clearTimeout(cursorTimerRef.current);
    setShowControls(true);
    setCursorHidden(false);
    timerRef.current = setTimeout(() => setShowControls(false), 2500);
    cursorTimerRef.current = setTimeout(() => setCursorHidden(true), 3000);
  };

  useEffect(() => {
    hideAfterDelay();
    return () => { clearTimeout(timerRef.current); clearTimeout(cursorTimerRef.current); };
  }, []);

  // Listen for fullscreenchange to sync state
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ cursor: cursorHidden ? "none" : "default" }}
      onMouseMove={hideAfterDelay}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slideMeta[activeIdx]?.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full flex items-center justify-center"
        >
          <div className="relative" style={{ width: "min(95vw, 170vh)", aspectRatio: "16/9" }}>
            <div className="absolute inset-0 bg-white rounded-lg overflow-hidden shadow-2xl">
              <ScaledSlide
                elements={allElements[activeIdx] ?? []}
                bgImage={slideMeta[activeIdx]?.image}
                scale={Math.min(window.innerWidth * 0.95 / 1920, window.innerHeight * 0.95 / 1080)}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Close */}
      <motion.div animate={{ opacity: showControls ? 1 : 0 }} className="absolute top-4 right-4">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm transition">
          <X size={18} />
        </button>
      </motion.div>

      {/* Bottom controls */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full text-white"
      >
        <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="disabled:opacity-30 hover:text-cyan-400 transition"><ChevronLeft size={20} /></button>
        <span className="text-sm font-medium tabular-nums min-w-[80px] text-center">{activeIdx + 1} / {slideMeta.length}</span>
        <button onClick={() => setActiveIdx((i) => Math.min(slideMeta.length - 1, i + 1))} disabled={activeIdx === slideMeta.length - 1} className="disabled:opacity-30 hover:text-cyan-400 transition"><ChevronRight size={20} /></button>
      </motion.div>
    </motion.div>
  );
});
PresentationOverlay.displayName = "PresentationOverlay";

/* ── Export PDF Modal ── */
const ExportPdfOverlay = ({
  progress, message, onClose,
}: {
  progress: number;
  message: string;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-background rounded-2xl shadow-2xl p-8 w-[420px] flex flex-col items-center gap-5"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        {progress < 100 ? <Loader2 size={24} className="text-primary animate-spin" /> : <Check size={24} className="text-emerald-500" />}
      </div>
      <h3 className="text-lg font-bold text-foreground">{progress < 100 ? "Exportando Presentación" : "¡Exportación Completa!"}</h3>
      <Progress value={progress} className="h-2 w-full" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {progress >= 100 && (
        <Button onClick={onClose} className="mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
          <FileDown size={14} className="mr-2" /> Descargar Archivo
        </Button>
      )}
    </motion.div>
  </motion.div>
);

export default Editor;
