import { useState, useEffect, useRef, useCallback, forwardRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useHistory } from "@/hooks/useHistory";
import {
  ArrowLeft, Save, FileDown, Check, Loader2,
  LayoutTemplate, Type, Image, Hexagon, Sparkles,
  Plus, ChevronLeft, ChevronRight, Cloud, Palette,
  Play, X, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, Minus,
  Bold, Trash2, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown, Pipette,
  Smartphone, Monitor, Tablet,
} from "lucide-react";
import { initialCampaigns } from "@/components/dashboard/briefs/campaignData";
import type { SlideData, SlideElement } from "@/components/dashboard/briefs/campaignData";

/* ── helpers ── */
const uid = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const FONTS = ["Inter", "Playfair Display", "Montserrat", "Roboto", "Georgia", "Courier New"];
const COLORS_PALETTE = ["#0f172a", "#ffffff", "#06b6d4", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b", "#1e40af"];
const SNAP_THRESHOLD = 5;

function slideToElements(slide: SlideData): SlideElement[] {
  if (slide.elements?.length) return slide.elements;
  const els: SlideElement[] = [];
  let z = 0;
  if (slide.type === "cover") {
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 0, y: 0, width: 1920, height: 1080, opacity: 0.7, zIndex: z++ });
    els.push({ id: uid(), type: "text", content: slide.title, x: 80, y: 680, width: 1760, height: 120, fontSize: 96, fontWeight: "900", color: "#ffffff", zIndex: z++ });
    if (slide.body) els.push({ id: uid(), type: "text", content: slide.body, x: 80, y: 820, width: 1400, height: 60, fontSize: 28, fontWeight: "400", color: "rgba(255,255,255,0.5)", zIndex: z++ });
  } else if (slide.type === "content") {
    els.push({ id: uid(), type: "text", content: slide.title, x: 860, y: 80, width: 980, height: 80, fontSize: 56, fontWeight: "800", color: "#0f172a", zIndex: z++ });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 100, y: 200, width: 600, height: 600, zIndex: z++ });
    slide.bullets?.forEach((b, i) => {
      els.push({ id: uid(), type: "text", content: b, x: 860, y: 220 + i * 120, width: 980, height: 100, fontSize: 28, fontWeight: "400", color: "#475569", zIndex: z++ });
    });
  } else {
    els.push({ id: uid(), type: "text", content: slide.title, x: 80, y: 80, width: 1000, height: 80, fontSize: 56, fontWeight: "800", color: "#0f172a", zIndex: z++ });
    if (slide.body) els.push({ id: uid(), type: "text", content: slide.body, x: 80, y: 180, width: 1000, height: 50, fontSize: 32, fontWeight: "400", color: "#64748b", zIndex: z++ });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 80, y: 280, width: 1000, height: 600, zIndex: z++ });
    slide.colors?.forEach((c, i) => {
      els.push({ id: uid(), type: "shape", content: c.hex, x: 1200 + (i % 2) * 200, y: 280 + Math.floor(i / 2) * 200, width: 160, height: 160, zIndex: z++ });
      els.push({ id: uid(), type: "text", content: `${c.name}\n${c.hex}`, x: 1200 + (i % 2) * 200, y: 460 + Math.floor(i / 2) * 200, width: 180, height: 50, fontSize: 18, fontWeight: "500", color: "#475569", zIndex: z++ });
    });
  }
  return els;
}

/* ── build CSS transform string for an element ── */
function buildTransform(el: SlideElement): string {
  const parts: string[] = [];
  if (el.rotation) parts.push(`rotate(${el.rotation}deg)`);
  const flipX = (el as SlideElement & { flipX?: boolean }).flipX;
  const flipY = (el as SlideElement & { flipY?: boolean }).flipY;
  if (el.flipH || flipX) parts.push("scaleX(-1)");
  if (el.flipV || flipY) parts.push("scaleY(-1)");
  return parts.length ? parts.join(" ") : "none";
}

/* ── Smart Guides Engine ── */
interface GuideLines { x: number | null; y: number | null }

function computeSnapAndGuides(
  dragEl: { x: number; y: number; w: number; h: number },
  others: { x: number; y: number; w: number; h: number }[],
  canvasW: number, canvasH: number,
): { snappedX: number; snappedY: number; guides: GuideLines } {
  let snappedX = dragEl.x, snappedY = dragEl.y;
  let guideX: number | null = null, guideY: number | null = null;
  const dragCX = dragEl.x + dragEl.w / 2, dragCY = dragEl.y + dragEl.h / 2;
  const cxCanvas = canvasW / 2, cyCanvas = canvasH / 2;

  if (Math.abs(dragCX - cxCanvas) < SNAP_THRESHOLD) { snappedX = cxCanvas - dragEl.w / 2; guideX = cxCanvas; }
  if (Math.abs(dragCY - cyCanvas) < SNAP_THRESHOLD) { snappedY = cyCanvas - dragEl.h / 2; guideY = cyCanvas; }

  for (const o of others) {
    const oCX = o.x + o.w / 2, oCY = o.y + o.h / 2;
    if (guideX === null && Math.abs(dragCX - oCX) < SNAP_THRESHOLD) { snappedX = oCX - dragEl.w / 2; guideX = oCX; }
    if (guideY === null && Math.abs(dragCY - oCY) < SNAP_THRESHOLD) { snappedY = oCY - dragEl.h / 2; guideY = oCY; }
    if (guideX === null && Math.abs(dragEl.x - o.x) < SNAP_THRESHOLD) { snappedX = o.x; guideX = o.x; }
    if (guideX === null && Math.abs((dragEl.x + dragEl.w) - (o.x + o.w)) < SNAP_THRESHOLD) { snappedX = o.x + o.w - dragEl.w; guideX = o.x + o.w; }
    if (guideY === null && Math.abs(dragEl.y - o.y) < SNAP_THRESHOLD) { snappedY = o.y; guideY = o.y; }
    if (guideY === null && Math.abs((dragEl.y + dragEl.h) - (o.y + o.h)) < SNAP_THRESHOLD) { snappedY = o.y + o.h - dragEl.h; guideY = o.y + o.h; }
  }
  return { snappedX, snappedY, guides: { x: guideX, y: guideY } };
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/* ── Toolbar items ── */
const tools = [
  { icon: LayoutTemplate, label: "Plantillas", action: "templates" },
  { icon: Type, label: "Texto", action: "text" },
  { icon: Image, label: "Imágenes", action: "image" },
  { icon: Smartphone, label: "Mockups", action: "mockups" },
  { icon: Palette, label: "Brand Hub", action: "brand" },
];

/* ── Brand Hub Data ── */
const BRAND_COLORS = [
  { name: "Cian Primary", hex: "#06B6D4" },
  { name: "Deep Navy", hex: "#0F172A" },
  { name: "Clean White", hex: "#FFFFFF" },
  { name: "Soft Slate", hex: "#94A3B8" },
  { name: "Accent Teal", hex: "#14B8A6" },
  { name: "Electric Blue", hex: "#3B82F6" },
];
const BRAND_FONTS = [
  { name: "Inter", role: "Primaria · Sans-serif" },
  { name: "Playfair Display", role: "Display · Serif" },
  { name: "Montserrat", role: "Alternativa · Sans-serif" },
];

/* ── Slide Templates ── */
const TEMPLATE_COVER = (): SlideElement[] => [
  { id: uid(), type: "text", content: "Título Principal", x: 160, y: 380, width: 1600, height: 140, fontSize: 96, fontWeight: "900", color: "#0f172a", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "Subtítulo descriptivo de la diapositiva", x: 460, y: 540, width: 1000, height: 60, fontSize: 32, fontWeight: "400", color: "#64748b", zIndex: 3, textAlign: "center" },
  { id: uid(), type: "shape", content: "#06b6d4", x: 860, y: 660, width: 200, height: 6, zIndex: 1 },
];
const TEMPLATE_CONTENT = (): SlideElement[] => [
  { id: uid(), type: "text", content: "Sección de Contenido", x: 80, y: 60, width: 1760, height: 80, fontSize: 56, fontWeight: "800", color: "#0f172a", zIndex: 3 },
  { id: uid(), type: "shape", content: "#06b6d4", x: 80, y: 155, width: 120, height: 5, zIndex: 1 },
  { id: uid(), type: "text", content: "• Primer punto clave de la presentación", x: 100, y: 220, width: 1720, height: 70, fontSize: 32, fontWeight: "400", color: "#334155", zIndex: 2 },
  { id: uid(), type: "text", content: "• Segundo punto con datos relevantes", x: 100, y: 340, width: 1720, height: 70, fontSize: 32, fontWeight: "400", color: "#334155", zIndex: 2 },
  { id: uid(), type: "text", content: "• Tercer punto de acción estratégica", x: 100, y: 460, width: 1720, height: 70, fontSize: 32, fontWeight: "400", color: "#334155", zIndex: 2 },
];
const TEMPLATE_VISUAL = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#e2e8f0", x: 60, y: 60, width: 880, height: 960, zIndex: 0 },
  { id: uid(), type: "text", content: "📷 Imagen", x: 340, y: 480, width: 300, height: 60, fontSize: 36, fontWeight: "500", color: "#94a3b8", zIndex: 1, textAlign: "center" },
  { id: uid(), type: "text", content: "Título Visual", x: 1020, y: 120, width: 840, height: 80, fontSize: 56, fontWeight: "800", color: "#0f172a", zIndex: 2 },
  { id: uid(), type: "text", content: "Descripción detallada que acompaña la imagen. Aquí puedes añadir contexto.", x: 1020, y: 260, width: 840, height: 200, fontSize: 28, fontWeight: "400", color: "#64748b", zIndex: 2 },
];

/* ── Side Panel: Brand Hub ── */
const BrandPanel = ({
  selectedIds, elements, onUpdate,
}: {
  selectedIds: Set<string>;
  elements: SlideElement[];
  onUpdate: (id: string, patch: Partial<SlideElement>) => void;
}) => {
  const hasTextSelected = elements.some((e) => selectedIds.has(e.id) && e.type === "text");
  const hasAnySelected = selectedIds.size > 0;

  const applyColor = (hex: string) => {
    if (!hasAnySelected) { toast({ title: "Selecciona un elemento", description: "Haz clic en un texto o forma del lienzo primero." }); return; }
    selectedIds.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (el?.type === "text") onUpdate(id, { color: hex });
      else if (el?.type === "shape") onUpdate(id, { content: hex });
    });
    toast({ title: "🎨 Color aplicado" });
  };

  const applyFont = (font: string) => {
    if (!hasTextSelected) { toast({ title: "Selecciona un texto", description: "Haz clic en un elemento de texto del lienzo primero." }); return; }
    selectedIds.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (el?.type === "text") onUpdate(id, { fontFamily: font });
    });
    toast({ title: "🔤 Tipografía aplicada" });
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Brand Hub</h3>
        <p className="text-[11px] text-muted-foreground">Aero Dynamics</p>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Paleta de Colores</h4>
        <div className="grid grid-cols-3 gap-2">
          {BRAND_COLORS.map((c) => (
            <button key={c.hex} onClick={() => applyColor(c.hex)} className="flex flex-col items-center gap-1.5 group">
              <div
                className="w-10 h-10 rounded-full border-2 border-border/40 group-hover:scale-110 group-hover:shadow-md transition-all"
                style={{ background: c.hex }}
              />
              <span className="text-[9px] text-muted-foreground font-medium leading-tight text-center">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Tipografía</h4>
        <div className="flex flex-col gap-1.5">
          {BRAND_FONTS.map((f) => (
            <button
              key={f.name}
              onClick={() => applyFont(f.name)}
              className="text-left p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <span className="text-sm font-semibold text-foreground block" style={{ fontFamily: f.name }}>{f.name}</span>
              <span className="text-[10px] text-muted-foreground">{f.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Side Panel: Templates ── */
const TemplatesPanel = ({
  onApplyTemplate,
}: {
  onApplyTemplate: (elements: SlideElement[]) => void;
}) => {
  const templates = [
    { name: "Portada", desc: "Título grande al centro", factory: TEMPLATE_COVER, preview: "cover" as const },
    { name: "Contenido", desc: "Título + 3 viñetas", factory: TEMPLATE_CONTENT, preview: "content" as const },
    { name: "Visual", desc: "Imagen + texto lateral", factory: TEMPLATE_VISUAL, preview: "visual" as const },
  ];

  const handleApply = (factory: () => SlideElement[]) => {
    if (window.confirm("¿Deseas reemplazar el diseño actual con esta plantilla?")) {
      onApplyTemplate(factory());
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Plantillas</h3>
        <p className="text-[11px] text-muted-foreground">Doble clic para aplicar</p>
      </div>

      <div className="flex flex-col gap-3">
        {templates.map((t) => (
          <button
            key={t.name}
            onDoubleClick={() => handleApply(t.factory)}
            className="group border border-border/40 rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
          >
            {/* Mini preview */}
            <div className="aspect-video bg-white relative p-3">
              {t.preview === "cover" && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <div className="w-3/4 h-3 bg-slate-800 rounded-sm" />
                  <div className="w-1/2 h-2 bg-slate-300 rounded-sm" />
                  <div className="w-8 h-0.5 bg-cyan-500 mt-1" />
                </div>
              )}
              {t.preview === "content" && (
                <div className="w-full h-full flex flex-col gap-1.5">
                  <div className="w-2/3 h-3 bg-slate-800 rounded-sm" />
                  <div className="w-6 h-0.5 bg-cyan-500" />
                  <div className="w-full h-2 bg-slate-200 rounded-sm mt-1" />
                  <div className="w-full h-2 bg-slate-200 rounded-sm" />
                  <div className="w-3/4 h-2 bg-slate-200 rounded-sm" />
                </div>
              )}
              {t.preview === "visual" && (
                <div className="w-full h-full flex gap-2">
                  <div className="w-1/2 h-full bg-slate-100 rounded-sm flex items-center justify-center">
                    <div className="w-5 h-5 rounded bg-slate-300" />
                  </div>
                  <div className="w-1/2 flex flex-col gap-1 justify-center">
                    <div className="w-full h-2.5 bg-slate-800 rounded-sm" />
                    <div className="w-full h-1.5 bg-slate-200 rounded-sm" />
                    <div className="w-3/4 h-1.5 bg-slate-200 rounded-sm" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-3 py-2 border-t border-border/20">
              <span className="text-xs font-semibold text-foreground">{t.name}</span>
              <span className="text-[10px] text-muted-foreground block">{t.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ── Mockup Definitions ── */
interface MockupDef {
  id: string;
  name: string;
  icon: typeof Smartphone;
  category: "device" | "social";
  width: number;
  height: number;
  screenRadius: string;
  screenInset: { top: number; right: number; bottom: number; left: number };
  frameColor: string;
  notch?: boolean;
  socialUI?: string;
}

const MOCKUP_DEFS: MockupDef[] = [
  {
    id: "iphone15", name: "iPhone 15 Pro", icon: Smartphone, category: "device",
    width: 340, height: 700,
    screenRadius: "2.8rem", screenInset: { top: 16, right: 16, bottom: 16, left: 16 },
    frameColor: "#1a1a1a", notch: true,
  },
  {
    id: "macbook", name: "MacBook Air", icon: Monitor, category: "device",
    width: 740, height: 480,
    screenRadius: "0.75rem", screenInset: { top: 28, right: 40, bottom: 50, left: 40 },
    frameColor: "#2a2a2a",
  },
  {
    id: "tablet", name: "Tablet", icon: Tablet, category: "device",
    width: 520, height: 700,
    screenRadius: "1.5rem", screenInset: { top: 24, right: 20, bottom: 24, left: 20 },
    frameColor: "#1f1f1f",
  },
  {
    id: "ig-post", name: "Instagram Post", icon: Smartphone, category: "social",
    width: 400, height: 500,
    screenRadius: "0.75rem", screenInset: { top: 52, right: 0, bottom: 56, left: 0 },
    frameColor: "#ffffff", socialUI: "instagram-feed",
  },
  {
    id: "ig-story", name: "Instagram Story", icon: Smartphone, category: "social",
    width: 340, height: 600,
    screenRadius: "1.25rem", screenInset: { top: 60, right: 0, bottom: 48, left: 0 },
    frameColor: "#000000", socialUI: "instagram-story",
  },
  {
    id: "tiktok", name: "TikTok Frame", icon: Smartphone, category: "social",
    width: 340, height: 600,
    screenRadius: "1.25rem", screenInset: { top: 48, right: 0, bottom: 64, left: 0 },
    frameColor: "#000000", socialUI: "tiktok",
  },
];

const getMockupDef = (mockupType?: string) => MOCKUP_DEFS.find((m) => m.id === mockupType);

/* ── Mockup Frame Renderer (used in canvas + thumbnails) ── */
const MockupFrame = ({ el, interactive, onDrop, onChildAdjust, onNativeFileDrop }: {
  el: SlideElement;
  interactive?: boolean;
  onDrop?: (mockupId: string, imgSrc: string, imgElId: string) => void;
  onChildAdjust?: (patch: Partial<SlideElement>) => void;
  onNativeFileDrop?: (mockupId: string, src: string) => void;
}) => {
  const def = getMockupDef(el.mockupType);
  const [dragOver, setDragOver] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [localScale, setLocalScale] = useState(el.mockupChildScale ?? 1);
  const [localX, setLocalX] = useState(el.mockupChildX ?? 0);
  const [localY, setLocalY] = useState(el.mockupChildY ?? 0);

  if (!def) return <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">Mockup</div>;

  const inset = def.screenInset;

  const handleDragOver = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDropEvt = (e: React.DragEvent) => {
    if (!interactive) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const data = e.dataTransfer.getData("application/mockup-drop");
    if (data && onDrop) {
      try {
        const { imgSrc, imgElId } = JSON.parse(data);
        onDrop(el.id, imgSrc, imgElId);
      } catch {}
    }
  };

  return (
    <div className="w-full h-full relative" style={{ borderRadius: def.screenRadius }}>
      {/* Device frame */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          borderRadius: def.screenRadius,
          border: `${Math.min(inset.top, inset.left)}px solid ${def.frameColor}`,
          borderTopWidth: inset.top,
          borderRightWidth: inset.right,
          borderBottomWidth: inset.bottom,
          borderLeftWidth: inset.left,
          boxSizing: "border-box",
        }}
      >
        {/* Notch for iPhone */}
        {def.notch && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-b-2xl" style={{ background: def.frameColor }} />
        )}
        {/* Social UI overlays */}
        {def.socialUI === "instagram-feed" && (
          <>
            <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3" style={{ height: inset.top - 2, background: "#fff" }}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 border-2 border-white" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-900 leading-none">aerodynamics</span>
                <span className="text-[7px] text-slate-400">Patrocinado</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 px-3" style={{ height: inset.bottom - 2, background: "#fff" }}>
              <span className="text-sm">♡</span>
              <span className="text-sm">💬</span>
              <span className="text-sm">↗</span>
              <span className="flex-1" />
              <span className="text-sm">🔖</span>
            </div>
          </>
        )}
        {def.socialUI === "instagram-story" && (
          <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3" style={{ height: inset.top - 2, background: "rgba(0,0,0,0.3)" }}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-orange-400" />
            <span className="text-[9px] font-bold text-white leading-none">aerodynamics</span>
            <span className="text-[7px] text-white/60">12h</span>
          </div>
        )}
        {def.socialUI === "tiktok" && (
          <>
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-4" style={{ height: inset.top - 2, background: "rgba(0,0,0,0.3)" }}>
              <span className="text-[10px] text-white/60 font-semibold">Following</span>
              <span className="text-[10px] text-white font-bold border-b border-white pb-0.5">For You</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around" style={{ height: inset.bottom - 2, background: "#000" }}>
              <span className="text-[8px] text-white/80">🏠</span>
              <span className="text-[8px] text-white/80">🔍</span>
              <span className="text-[10px] text-white bg-gradient-to-r from-cyan-400 to-pink-500 rounded px-2 py-0.5 font-bold">+</span>
              <span className="text-[8px] text-white/80">💬</span>
              <span className="text-[8px] text-white/80">👤</span>
            </div>
          </>
        )}
      </div>

      {/* Screen area (drop zone) */}
      <div
        className={`absolute z-[1] overflow-hidden transition-all ${dragOver ? "ring-4 ring-cyan-500 ring-inset" : ""}`}
        style={{
          top: inset.top, right: inset.right, bottom: inset.bottom, left: inset.left,
          borderRadius: `calc(${def.screenRadius} - ${Math.min(inset.top, inset.left)}px)`,
          background: el.mockupChild ? "transparent" : (def.frameColor === "#ffffff" ? "#f1f5f9" : "#18181b"),
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropEvt}
        onDoubleClick={(e) => {
          if (interactive && el.mockupChild) {
            e.stopPropagation();
            setAdjusting(!adjusting);
          }
        }}
      >
        {el.mockupChild ? (
          <img
            src={el.mockupChild}
            alt="Mockup content"
            draggable={false}
            className="pointer-events-none"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: `scale(${localScale}) translate(${localX}px, ${localY}px)`,
              transformOrigin: "center center",
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
            <Image size={24} />
            <span className="text-[9px] font-medium">Drop image here</span>
          </div>
        )}

        {/* Pan & Zoom controls */}
        {adjusting && interactive && el.mockupChild && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { const s = Math.max(0.5, localScale - 0.1); setLocalScale(s); onChildAdjust?.({ mockupChildScale: s }); }} className="hover:text-cyan-400">−</button>
            <span className="tabular-nums w-10 text-center">{Math.round(localScale * 100)}%</span>
            <button onClick={() => { const s = Math.min(3, localScale + 0.1); setLocalScale(s); onChildAdjust?.({ mockupChildScale: s }); }} className="hover:text-cyan-400">+</button>
            <div className="w-px h-3 bg-white/20" />
            <button onClick={() => { setLocalScale(1); setLocalX(0); setLocalY(0); onChildAdjust?.({ mockupChildScale: 1, mockupChildX: 0, mockupChildY: 0 }); }} className="hover:text-cyan-400">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Mockups Panel ── */
const MockupsPanel = ({
  onAddMockup,
}: {
  onAddMockup: (mockupType: string) => void;
}) => {
  const devices = MOCKUP_DEFS.filter((m) => m.category === "device");
  const social = MOCKUP_DEFS.filter((m) => m.category === "social");

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Mockups & Previews</h3>
        <p className="text-[11px] text-muted-foreground">Haz clic para agregar al lienzo</p>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">📱 Dispositivos</h4>
        <div className="flex flex-col gap-2">
          {devices.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onAddMockup(m.id)}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-14 rounded-lg flex items-center justify-center" style={{ background: m.frameColor }}>
                  <Icon size={16} className="text-white/80" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-foreground block">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">{m.width}×{m.height}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">📲 Social Media</h4>
        <div className="flex flex-col gap-2">
          {social.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => onAddMockup(m.id)}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-14 rounded-lg flex items-center justify-center" style={{ background: m.frameColor, border: m.frameColor === "#ffffff" ? "1px solid #e2e8f0" : "none" }}>
                  <Icon size={16} className={m.frameColor === "#ffffff" ? "text-pink-500" : "text-white/80"} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-foreground block">{m.name}</span>
                  <span className="text-[10px] text-muted-foreground">{m.width}×{m.height}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Chroma Key Background Removal ── */
async function chromaKeyRemove(
  imgSrc: string,
  clickX: number, clickY: number,
  elW: number, elH: number,
  tolerance: number = 38 // ~15% of 255
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Map click coords from element space to image space
      const sx = img.naturalWidth / elW;
      const sy = img.naturalHeight / elH;
      const px = Math.round(clickX * sx);
      const py = Math.round(clickY * sy);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Get key color from click position
      const idx = (py * canvas.width + px) * 4;
      const keyR = data[idx], keyG = data[idx + 1], keyB = data[idx + 2];

      // Process pixels with flood-fill-like tolerance
      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i] - keyR);
        const dg = Math.abs(data[i + 1] - keyG);
        const db = Math.abs(data[i + 2] - keyB);
        if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
          data[i + 3] = 0; // set alpha to transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image for chroma key"));
    img.src = imgSrc;
  });
}

/* ── Static element renderer ── */
const StaticElement = ({ el }: { el: SlideElement }) => {
  const transform = buildTransform(el);
  if (el.type === "mockup") {
    return (
      <div style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 340, height: el.height ?? 700, zIndex: el.zIndex ?? 0, transform }}>
        <MockupFrame el={el} />
      </div>
    );
  }
  if (el.type === "image") {
    return (
      <div style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 400, height: el.height ?? 400, opacity: el.opacity ?? 1, zIndex: el.zIndex ?? 0, transform }}>
        <img src={el.content} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
    );
  }
  if (el.type === "shape") {
    return (
      <div style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 160, height: el.height ?? 160, background: el.content, borderRadius: 16, zIndex: el.zIndex ?? 0, transform }} />
    );
  }
  return (
    <div style={{
      position: "absolute", left: el.x, top: el.y,
      width: el.width ?? "auto",
      fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400",
      color: el.color ?? "#0f172a", lineHeight: 1.3, whiteSpace: "pre-wrap",
      fontFamily: el.fontFamily ?? "Inter",
      textAlign: (el.textAlign ?? "left") as any,
      zIndex: el.zIndex ?? 0, transform,
    }}>
      {el.content}
    </div>
  );
};

/* ── Slide Thumbnail ── */
const SlideThumbnail = ({ elements, bgImage }: { elements: SlideElement[]; bgImage?: string }) => {
  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return (
    <div className="absolute inset-0 overflow-hidden bg-white">
      <div style={{ width: 1920, height: 1080, transform: "scale(0.0833)", transformOrigin: "top left", position: "relative" }}>
        {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-[1]" />}
        <div className="absolute inset-0 z-[2]">
          {sorted.map((el) => <StaticElement key={el.id} el={el} />)}
        </div>
      </div>
    </div>
  );
};

/* ── Secondary Format Bar (Canva-style, full width) ── */
const FormatBar = ({
  elements,
  selectedIds,
  onUpdate,
  onDelete,
  onBgRemove,
  bgRemoveProcessing,
}: {
  elements: SlideElement[];
  selectedIds: Set<string>;
  onUpdate: (id: string, patch: Partial<SlideElement>) => void;
  onDelete: (id: string) => void;
  onBgRemove: () => void;
  bgRemoveProcessing: boolean;
}) => {
  const selectedEls = elements.filter((e) => selectedIds.has(e.id));
  const textEls = selectedEls.filter((e) => e.type === "text");
  const imageEls = selectedEls.filter((e) => e.type === "image");
  const firstText = textEls[0];
  const firstImage = imageEls[0];
  const first = selectedEls[0];

  if (selectedEls.length === 0) return null;

  const fontFamily = firstText?.fontFamily ?? "Inter";
  const textAlign = firstText?.textAlign ?? "left";
  const fontSize = firstText?.fontSize ?? 28;
  const color = firstText?.color ?? "#0f172a";
  const fontWeight = firstText?.fontWeight ?? "400";

  const updateAllSelected = (patch: Partial<SlideElement>) => {
    selectedIds.forEach((id) => onUpdate(id, patch));
  };

  /* Layer helpers */
  const maxZ = Math.max(...elements.map((e) => e.zIndex ?? 0));
  const minZ = Math.min(...elements.map((e) => e.zIndex ?? 0));

  const bringToFront = () => {
    let next = maxZ;
    selectedIds.forEach((id) => { next++; onUpdate(id, { zIndex: next }); });
  };
  const sendToBack = () => {
    let next = minZ;
    selectedIds.forEach((id) => { next--; onUpdate(id, { zIndex: next }); });
  };
  const moveUp = () => {
    selectedIds.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (el) onUpdate(id, { zIndex: (el.zIndex ?? 0) + 1 });
    });
  };
  const moveDown = () => {
    selectedIds.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (el) onUpdate(id, { zIndex: (el.zIndex ?? 0) - 1 });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 44 }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border-b border-border/40 flex items-center px-5 gap-3 flex-shrink-0 z-10 overflow-hidden"
    >
      {/* Element info */}
      <span className="text-[11px] text-muted-foreground font-medium min-w-[60px]">
        {selectedEls.length > 1 ? `${selectedEls.length} sel.` : first?.type === "text" ? "Texto" : first?.type === "image" ? "Imagen" : "Forma"}
      </span>
      <div className="w-px h-6 bg-border/40" />

      {/* ── Layer Controls (always visible) ── */}
      <div className="flex items-center gap-0.5" title="Capas">
        <button onClick={bringToFront} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Traer al frente"><ArrowUpToLine size={13} /></button>
        <button onClick={moveUp} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Subir un nivel"><ArrowUp size={13} /></button>
        <button onClick={moveDown} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Bajar un nivel"><ArrowDown size={13} /></button>
        <button onClick={sendToBack} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Enviar al fondo"><ArrowDownToLine size={13} /></button>
      </div>
      <div className="w-px h-6 bg-border/40" />

      {/* ── Text Controls ── */}
      {firstText && (
        <>
          <select
            value={fontFamily}
            onChange={(e) => updateAllSelected({ fontFamily: e.target.value })}
            className="bg-muted/50 text-foreground text-xs rounded-md px-2.5 py-1.5 border border-border/40 outline-none cursor-pointer h-8 w-40 font-medium"
          >
            {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
          <div className="w-px h-6 bg-border/40" />

          <div className="flex items-center gap-1 bg-muted/50 rounded-md border border-border/40 h-8 px-1">
            <button onClick={() => updateAllSelected({ fontSize: Math.max(10, fontSize - 2) })} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus size={13} /></button>
            <input type="number" value={fontSize} onChange={(e) => updateAllSelected({ fontSize: Math.max(10, Math.min(200, parseInt(e.target.value) || 28)) })} className="w-10 text-center text-xs font-semibold bg-transparent border-none outline-none text-foreground tabular-nums" />
            <button onClick={() => updateAllSelected({ fontSize: Math.min(200, fontSize + 2) })} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus size={13} /></button>
          </div>
          <div className="w-px h-6 bg-border/40" />

          <button
            onClick={() => updateAllSelected({ fontWeight: ["700", "800", "900"].includes(fontWeight) ? "400" : "700" })}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition ${["700", "800", "900"].includes(fontWeight) ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
          ><Bold size={14} /></button>
          <div className="w-px h-6 bg-border/40" />

          <div className="flex items-center gap-1">
            {COLORS_PALETTE.slice(0, 6).map((c) => (
              <button key={c} onClick={() => updateAllSelected({ color: c })} className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? "border-primary scale-110" : "border-border/40 hover:scale-105"}`} style={{ background: c }} />
            ))}
            <label className="w-5 h-5 rounded-full overflow-hidden cursor-pointer border-2 border-border/40 relative hover:scale-105 transition-transform">
              <input type="color" value={color} onChange={(e) => updateAllSelected({ color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="w-full h-full" style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} />
            </label>
          </div>
          <div className="w-px h-6 bg-border/40" />

          <div className="flex items-center gap-0.5">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([align, Icon]) => (
              <button key={align} onClick={() => updateAllSelected({ textAlign: align })} className={`w-7 h-7 rounded-md flex items-center justify-center transition ${textAlign === align ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}><Icon size={13} /></button>
            ))}
          </div>
        </>
      )}

      {/* ── Image Controls (rotation, flip, bg remove) ── */}
      {firstImage && (
        <>
          <div className="flex items-center gap-0.5" title="Rotación">
            <button onClick={() => updateAllSelected({ rotation: ((first?.rotation ?? 0) - 90) % 360 })} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Rotar 90° izq"><RotateCcw size={13} /></button>
            <button onClick={() => updateAllSelected({ rotation: ((first?.rotation ?? 0) + 90) % 360 })} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition" title="Rotar 90° der"><RotateCw size={13} /></button>
            <input
              type="number"
              value={first?.rotation ?? 0}
              onChange={(e) => updateAllSelected({ rotation: parseInt(e.target.value) || 0 })}
              className="w-12 text-center text-xs font-semibold bg-muted/50 border border-border/40 rounded-md h-7 outline-none text-foreground tabular-nums"
              title="Ángulo de rotación"
            />
          </div>
          <div className="w-px h-6 bg-border/40" />

          <div className="flex items-center gap-0.5" title="Voltear">
            <button
              onClick={() => updateAllSelected({ flipH: !(first?.flipH ?? false), flipX: !((first as SlideElement & { flipX?: boolean })?.flipX ?? false) })}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition ${first?.flipH ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
              title="Voltear Horizontal"
            ><FlipHorizontal size={13} /></button>
            <button
              onClick={() => updateAllSelected({ flipV: !(first?.flipV ?? false), flipY: !((first as SlideElement & { flipY?: boolean })?.flipY ?? false) })}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition ${first?.flipV ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
              title="Voltear Vertical"
            ><FlipVertical size={13} /></button>
          </div>
          <div className="w-px h-6 bg-border/40" />

          <button
            onClick={onBgRemove}
            disabled={bgRemoveProcessing}
            className="h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 border border-cyan-500/20 transition disabled:opacity-50"
          >
            {bgRemoveProcessing ? <><Loader2 size={12} className="animate-spin" /> Procesando píxeles...</> : <><Pipette size={12} /> Quitar Fondo</>}
          </button>
        </>
      )}

      <div className="flex-1" />

      <button onClick={() => selectedIds.forEach((id) => onDelete(id))} className="w-8 h-8 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition" title="Eliminar"><Trash2 size={14} /></button>
    </motion.div>
  );
};

/* ── Interactive Canvas Element with react-rnd ── */
const RndElement = ({
  el, scale, selected, onSelect, onUpdate, onDelete,
  onDragMove, onDragEnd: onDragEndCb, eyedropperMode, onImageClick,
  onMockupDrop, onMockupChildAdjust,
}: {
  el: SlideElement;
  scale: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (patch: Partial<SlideElement>) => void;
  onDelete: () => void;
  onDragMove?: (id: string, x: number, y: number, w: number, h: number) => void;
  onDragEnd?: () => void;
  eyedropperMode?: boolean;
  onImageClick?: (elId: string, localX: number, localY: number) => void;
  onMockupDrop?: (mockupId: string, imgSrc: string, imgElId: string) => void;
  onMockupChildAdjust?: (id: string, patch: Partial<SlideElement>) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [localContent, setLocalContent] = useState(el.content);
  const [dragging, setDragging] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setLocalContent(el.content); }, [el.content]);
  useEffect(() => { if (editing && textRef.current) { textRef.current.focus(); textRef.current.select(); } }, [editing]);

  const commitEdit = () => {
    setEditing(false);
    if (localContent !== el.content) onUpdate({ content: localContent });
  };

  const handleStyle: React.CSSProperties = {
    width: 10, height: 10, background: "#06b6d4", borderRadius: 2,
    border: "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  const resizeHandles = selected && !editing ? {
    topLeft: <div style={handleStyle} />, topRight: <div style={handleStyle} />,
    bottomLeft: <div style={handleStyle} />, bottomRight: <div style={handleStyle} />,
  } : {};

  const w = el.width ?? (el.type === "text" ? 600 : el.type === "mockup" ? 340 : 400);
  const h = el.height ?? (el.type === "text" ? 80 : el.type === "mockup" ? 700 : 400);
  const transform = buildTransform(el);
  const isMockup = el.type === "mockup";

  return (
    <Rnd
      size={{ width: w, height: h }}
      position={{ x: el.x, y: el.y }}
      onDragStart={(e) => {
        setDragging(true);
        // Enable image drag data for mockup drop
        if (el.type === "image" && e instanceof MouseEvent) {
          // We'll use a native drag approach via onDragStart on the inner div
        }
      }}
      onDrag={(_e, d) => { onDragMove?.(el.id, d.x, d.y, w, h); }}
      onDragStop={(_e, d) => {
        setDragging(false);
        onDragEndCb?.();
        onUpdate({ x: Math.round(d.x), y: Math.round(d.y) });
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        onUpdate({ width: parseInt(ref.style.width), height: parseInt(ref.style.height), x: Math.round(pos.x), y: Math.round(pos.y) });
      }}
      disableDragging={editing || (eyedropperMode && el.type === "image")}
      enableResizing={selected && !editing}
      resizeHandleComponent={resizeHandles}
      scale={scale}
      bounds="parent"
      onMouseDown={(e: any) => { e.stopPropagation(); onSelect(e); }}
      style={{
        position: "absolute",
        zIndex: selected ? 9999 : (el.zIndex ?? 0),
        outline: selected ? "2px solid #06b6d4" : "none",
        outlineOffset: 2,
        borderRadius: isMockup ? 0 : el.type === "shape" ? 16 : 4,
        willChange: "transform",
        userSelect: dragging ? "none" : "auto",
      }}
    >
      <div
        className={`w-full h-full relative ${!selected && !editing ? "hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/40" : ""}`}
        onDoubleClick={(e) => { e.stopPropagation(); if (el.type === "text") setEditing(true); }}
        onClick={(e) => {
          if (eyedropperMode && el.type === "image" && selected && onImageClick) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const localX = (e.clientX - rect.left) / (rect.width / w);
            const localY = (e.clientY - rect.top) / (rect.height / h);
            onImageClick(el.id, localX, localY);
          }
        }}
        draggable={el.type === "image"}
        onDragStart={(e) => {
          if (el.type === "image") {
            e.dataTransfer.setData("application/mockup-drop", JSON.stringify({ imgSrc: el.content, imgElId: el.id }));
            e.dataTransfer.effectAllowed = "move";
          }
        }}
        style={{
          cursor: eyedropperMode && el.type === "image" ? "crosshair" : editing ? "text" : dragging ? "grabbing" : "grab",
          borderRadius: isMockup ? 0 : el.type === "shape" ? 16 : 0,
          userSelect: dragging ? "none" : "auto",
        }}
      >
        {isMockup ? (
          <MockupFrame
            el={el}
            interactive
            onDrop={onMockupDrop}
            onChildAdjust={(patch) => onMockupChildAdjust?.(el.id, patch)}
          />
        ) : el.type === "image" ? (
          <div
            className="w-full h-full"
            style={{
              transform,
              transformOrigin: "center center",
              transition: "transform 120ms ease-out",
              willChange: "transform",
            }}
          >
            <img src={el.content} alt="" className="w-full h-full object-cover rounded-lg pointer-events-none" style={{ opacity: el.opacity ?? 1 }} draggable={false} />
          </div>
        ) : el.type === "shape" ? (
          <div className="w-full h-full" style={{ background: el.content, borderRadius: 16 }} />
        ) : editing ? (
          <textarea
            ref={textRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === "Escape") commitEdit(); }}
            style={{
              fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400",
              color: el.color ?? "#0f172a", lineHeight: 1.3,
              fontFamily: el.fontFamily ?? "Inter",
              textAlign: (el.textAlign ?? "left") as any,
            }}
            className="bg-transparent border-none outline-none resize-none w-full h-full px-2 py-1 ring-2 ring-cyan-400/60 rounded"
          />
        ) : (
          <div
            style={{
              fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400",
              color: el.color ?? "#0f172a", lineHeight: 1.3, whiteSpace: "pre-wrap",
              fontFamily: el.fontFamily ?? "Inter",
              textAlign: (el.textAlign ?? "left") as any,
              overflow: "hidden",
            }}
            className="px-2 py-1 select-none w-full h-full"
          >
            {el.content}
          </div>
        )}
      </div>
    </Rnd>
  );
};

/* ── Interactive Canvas with Smart Guides ── */
const InteractiveCanvas = ({
  elements, bgImage, scale, selectedIds, onSelectElement, onUpdateElement, onDeleteElement, onDeselect,
  eyedropperMode, onImageClick, onMockupDrop, onMockupChildAdjust,
}: {
  elements: SlideElement[];
  bgImage?: string;
  scale: number;
  selectedIds: Set<string>;
  onSelectElement: (id: string, multi: boolean) => void;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
  onDeselect: () => void;
  eyedropperMode?: boolean;
  onImageClick?: (elId: string, localX: number, localY: number) => void;
  onMockupDrop?: (mockupId: string, imgSrc: string, imgElId: string) => void;
  onMockupChildAdjust?: (id: string, patch: Partial<SlideElement>) => void;
}) => {
  const [guides, setGuides] = useState<GuideLines>({ x: null, y: null });

  const sorted = useMemo(() => [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)), [elements]);

  const handleDragMove = useCallback((dragId: string, x: number, y: number, w: number, h: number) => {
    const others = elements.filter((e) => e.id !== dragId).map((e) => ({ x: e.x, y: e.y, w: e.width ?? 400, h: e.height ?? 80 }));
    const result = computeSnapAndGuides({ x, y, w, h }, others, 1920, 1080);
    setGuides(result.guides);
  }, [elements]);

  const handleDragEnd = useCallback(() => { setGuides({ x: null, y: null }); }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onDeselect(); }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", willChange: "transform" }}>
        <div
          className="bg-white shadow-2xl shadow-black/10 ring-1 ring-border/20 rounded-lg overflow-hidden"
          style={{ width: 1920, height: 1080, position: "relative" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) onDeselect();
          }}
        >
          {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-[1]" />}

          {guides.x !== null && (
            <div className="absolute top-0 bottom-0 z-[50] pointer-events-none" style={{ left: guides.x, width: 1, background: "#06b6d4" }}>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-cyan-500 text-white text-[9px] font-bold px-1 rounded">{Math.round(guides.x)}</div>
            </div>
          )}
          {guides.y !== null && (
            <div className="absolute left-0 right-0 z-[50] pointer-events-none" style={{ top: guides.y, height: 1, background: "#06b6d4" }}>
              <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-white text-[9px] font-bold px-1 rounded">{Math.round(guides.y)}</div>
            </div>
          )}

          <div className="absolute inset-0 z-[2]" data-canvas="true" style={{ position: "relative", width: 1920, height: 1080 }}>
            {sorted.map((el) => (
              <RndElement
                key={el.id}
                el={el}
                scale={scale}
                selected={selectedIds.has(el.id)}
                onSelect={(e) => onSelectElement(el.id, e.shiftKey)}
                onUpdate={(patch) => onUpdateElement(el.id, patch)}
                onDelete={() => onDeleteElement(el.id)}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                eyedropperMode={eyedropperMode}
                onImageClick={onImageClick}
                onMockupDrop={onMockupDrop}
                onMockupChildAdjust={onMockupChildAdjust}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Presentation Slide (window-aware scaling) ── */
const PresentationSlide = ({ elements, bgImage }: { elements: SlideElement[]; bgImage?: string }) => {
  const [s, setS] = useState(1);
  useEffect(() => {
    const calc = () => {
      setS(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="bg-white overflow-hidden relative" style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${s})`, transformOrigin: "center center" }}>
        {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-[1]" />}
        <div className="absolute inset-0 z-[2]">{sorted.map((el) => <StaticElement key={el.id} el={el} />)}</div>
      </div>
    </div>
  );
};

/* ── Main Editor Page ── */
const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const campaign = initialCampaigns.find((c) => c.id === id) ?? initialCampaigns[0];

  const [slidesElements, setSlidesElements] = useState<SlideElement[][]>(() =>
    campaign.slides.map(slideToElements)
  );
  const [slideMeta, setSlideMeta] = useState(() =>
    campaign.slides.map((s) => ({ id: s.id, type: s.type, image: s.type === "cover" ? s.image : undefined }))
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [docTitle, setDocTitle] = useState(campaign.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState("");
  const [clipboard, setClipboard] = useState<SlideElement[]>([]);
  const [eyedropperMode, setEyedropperMode] = useState(false);
  const [bgRemoveProcessing, setBgRemoveProcessing] = useState(false);

  const history = useHistory(slidesElements[activeIdx] ?? []);

  useEffect(() => {
    setSlidesElements((prev) => prev.map((els, i) => (i === activeIdx ? history.state : els)));
  }, [history.state, activeIdx]);

  const prevActiveRef = useRef(activeIdx);
  useEffect(() => {
    if (prevActiveRef.current !== activeIdx) {
      history.reset(slidesElements[activeIdx] ?? []);
      prevActiveRef.current = activeIdx;
      setSelectedIds(new Set());
      setEyedropperMode(false);
    }
  }, [activeIdx]);

  const currentElements = history.state;

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(0.5);

  const recalcScale = useCallback(() => {
    if (!canvasAreaRef.current) return;
    const p = canvasAreaRef.current;
    const sx = (p.clientWidth - 80) / 1920;
    const sy = (p.clientHeight - 80) / 1080;
    setCanvasScale(Math.min(sx, sy, 1));
  }, []);

  useEffect(() => {
    recalcScale();
    window.addEventListener("resize", recalcScale);
    return () => window.removeEventListener("resize", recalcScale);
  }, [recalcScale]);

  const selectElement = (elId: string, multi: boolean) => {
    setSelectedIds((prev) => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(elId)) next.delete(elId); else next.add(elId);
        return next;
      }
      return new Set([elId]);
    });
  };

  const updateElement = (elId: string, patch: Partial<SlideElement>) => {
    history.set((prev) => prev.map((e) => (e.id === elId ? { ...e, ...patch } : e)));
    setSaveState("idle");
  };

  const deleteElement = (elId: string) => {
    history.set((prev) => prev.filter((e) => e.id !== elId));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(elId); return n; });
  };

  const addTextElement = () => {
    const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
    const el: SlideElement = { id: uid(), type: "text", content: "Doble clic para editar", x: 660, y: 440, width: 600, height: 80, fontSize: 48, fontWeight: "600", color: "#0f172a", zIndex: maxZ + 1 };
    history.set((prev) => [...prev, el]);
    setSelectedIds(new Set([el.id]));
    toast({ title: "📝 Texto añadido", description: "Arrastra para posicionar, doble clic para editar." });
  };

  const addImageElement = () => {
    const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
    const el: SlideElement = { id: uid(), type: "shape", content: "#e2e8f0", x: 660, y: 340, width: 600, height: 400, zIndex: maxZ + 1 };
    const label: SlideElement = { id: uid(), type: "text", content: "Simulación de Imagen", x: 810, y: 510, width: 300, height: 50, fontSize: 28, fontWeight: "500", color: "#94a3b8", zIndex: maxZ + 2 };
    history.set((prev) => [...prev, el, label]);
    toast({ title: "🖼️ Imagen añadida" });
  };

  const handleToolClick = (action: string) => {
    if (action === "text") { addTextElement(); setActiveTool(null); }
    else if (action === "image") { addImageElement(); setActiveTool(null); }
    else { setActiveTool(activeTool === action ? null : action); }
  };

  const applyTemplate = (elements: SlideElement[]) => {
    history.set(elements);
    setSelectedIds(new Set());
    toast({ title: "📐 Plantilla aplicada", description: "El diseño ha sido reemplazado." });
  };

  const addMockup = (mockupType: string) => {
    const def = getMockupDef(mockupType);
    if (!def) return;
    const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
    const el: SlideElement = {
      id: uid(), type: "mockup", content: mockupType,
      x: 760, y: 140, width: def.width, height: def.height,
      zIndex: maxZ + 1, mockupType: mockupType,
    };
    history.set((prev) => [...prev, el]);
    setSelectedIds(new Set([el.id]));
    setActiveTool(null);
    toast({ title: `📱 ${def.name} añadido`, description: "Arrastra una imagen sobre el dispositivo para insertarla." });
  };

  const handleMockupDrop = useCallback((mockupId: string, imgSrc: string, imgElId: string) => {
    history.set((prev) => {
      const updated = prev.map((e) =>
        e.id === mockupId ? { ...e, mockupChild: imgSrc, mockupChildScale: 1, mockupChildX: 0, mockupChildY: 0 } : e
      );
      // Remove the original image element from the canvas
      return updated.filter((e) => e.id !== imgElId);
    });
    toast({ title: "🎯 Imagen insertada en Mockup", description: "Doble clic en el mockup para ajustar escala." });
  }, [history]);

  const handleMockupChildAdjust = useCallback((id: string, patch: Partial<SlideElement>) => {
    history.set((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, [history]);

  const addSlide = () => {
    const newId = `new-${Date.now()}`;
    setSlideMeta((prev) => [...prev, { id: newId, type: "content" as const, image: undefined }]);
    setSlidesElements((prev) => [...prev, [
      { id: uid(), type: "text", content: "Nueva Diapositiva", x: 80, y: 80, width: 800, height: 80, fontSize: 64, fontWeight: "800", color: "#0f172a", zIndex: 1 },
      { id: uid(), type: "text", content: "Haz clic para editar", x: 80, y: 200, width: 800, height: 50, fontSize: 32, fontWeight: "400", color: "#64748b", zIndex: 2 },
    ]]);
    setActiveIdx(slideMeta.length);
  };

  /* ── Background removal via chroma key ── */
  const handleBgRemoveStart = () => {
    const imageEls = currentElements.filter((e) => selectedIds.has(e.id) && e.type === "image");
    if (imageEls.length === 0) return;
    setEyedropperMode(true);
    toast({ title: "🎯 Modo Pipeta activo", description: "Haz clic en el color de fondo de la imagen que deseas eliminar." });
  };

  const handleImageClick = useCallback(async (elId: string, localX: number, localY: number) => {
    if (!eyedropperMode) return;
    setEyedropperMode(false);
    setBgRemoveProcessing(true);

    try {
      const el = currentElements.find((e) => e.id === elId);
      if (!el || el.type !== "image") throw new Error("Not an image");
      const w = el.width ?? 400;
      const h = el.height ?? 400;
      const newSrc = await chromaKeyRemove(el.content, localX, localY, w, h);
      history.set((prev) => prev.map((item) => (item.id === elId ? { ...item, content: newSrc } : item)));
      toast({ title: "✅ Fondo eliminado", description: "Se procesaron los píxeles correctamente." });
    } catch (err) {
      console.error(err);
      toast({ title: "❌ Error al procesar", description: "No se pudo eliminar el fondo. Puede ser un problema CORS." });
    } finally {
      setBgRemoveProcessing(false);
    }
  }, [eyedropperMode, currentElements, history]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    if (presenting) return;
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (isMeta && e.key === "z" && !e.shiftKey) { e.preventDefault(); history.undo(); return; }
      if ((isMeta && e.shiftKey && e.key === "z") || (isMeta && e.key === "y")) { e.preventDefault(); history.redo(); return; }
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") return;
      if (isMeta && e.key === "c" && selectedIds.size > 0) {
        e.preventDefault();
        setClipboard(currentElements.filter((el) => selectedIds.has(el.id)).map((el) => ({ ...el })));
        toast({ title: "📋 Copiado" });
        return;
      }
      if (isMeta && e.key === "x" && selectedIds.size > 0) {
        e.preventDefault();
        setClipboard(currentElements.filter((el) => selectedIds.has(el.id)).map((el) => ({ ...el })));
        history.set((prev) => prev.filter((e) => !selectedIds.has(e.id)));
        setSelectedIds(new Set());
        toast({ title: "✂️ Cortado" });
        return;
      }
      if (isMeta && e.key === "v" && clipboard.length > 0) {
        e.preventDefault();
        const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
        const pasted = clipboard.map((el, i) => ({ ...el, id: uid(), x: el.x + 40, y: el.y + 40, zIndex: maxZ + 1 + i }));
        history.set((prev) => [...prev, ...pasted]);
        setSelectedIds(new Set(pasted.map((p) => p.id)));
        toast({ title: "📌 Pegado" });
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
        e.preventDefault();
        history.set((prev) => prev.filter((e) => !selectedIds.has(e.id)));
        setSelectedIds(new Set());
        toast({ title: "🗑️ Eliminado" });
        return;
      }
      if (e.key === "Escape" && eyedropperMode) {
        setEyedropperMode(false);
        toast({ title: "Modo pipeta cancelado" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenting, selectedIds, currentElements, clipboard, history, eyedropperMode]);

  /* ── Save ── */
  const handleSave = async () => {
    setSaveState("saving");
    try {
      await fetch("https://webhook.site/b80d309d-86be-445b-9bf5-4f678639f781", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_presentation", presentation_id: id ?? campaign.id, title: docTitle, slides: slidesElements, timestamp: new Date().toISOString(), status: "success" }),
      });
    } catch { /* CORS */ }
    await new Promise((r) => setTimeout(r, 800));
    setSaveState("saved");
    toast({ title: "✅ Presentación guardada" });
    setTimeout(() => setSaveState("idle"), 3000);
  };

  /* ── Real PDF Export ── */
  const slideRenderRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    setExportMsg("Preparando assets...");

    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });

      for (let i = 0; i < slidesElements.length; i++) {
        setExportProgress(Math.round(((i + 0.3) / slidesElements.length) * 90));
        setExportMsg(i === 0 ? "Preparando assets..." : `Renderizando diapositiva ${i + 1}...`);

        const container = document.createElement("div");
        container.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1920px;height:1080px;background:white;overflow:hidden;";
        document.body.appendChild(container);

        const elsSorted = [...(slidesElements[i] ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const meta = slideMeta[i];
        if (meta?.image && meta.type === "cover") {
          const gradient = document.createElement("div");
          gradient.style.cssText = "position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.9),rgba(0,0,0,0.4),rgba(0,0,0,0.2));z-index:1;";
          container.appendChild(gradient);
        }

        for (const el of elsSorted) {
          const div = document.createElement("div");
          div.style.position = "absolute";
          div.style.left = `${el.x}px`;
          div.style.top = `${el.y}px`;
          div.style.zIndex = `${el.zIndex ?? 0}`;
          const t = buildTransform(el);
          if (t !== "none") div.style.transform = t;

          if (el.type === "image") {
            div.style.width = `${el.width ?? 400}px`;
            div.style.height = `${el.height ?? 400}px`;
            div.style.opacity = `${el.opacity ?? 1}`;
            const img = document.createElement("img");
            img.src = el.content;
            img.style.cssText = "width:100%;height:100%;object-fit:cover;";
            img.crossOrigin = "anonymous";
            div.appendChild(img);
          } else if (el.type === "shape") {
            div.style.width = `${el.width ?? 160}px`;
            div.style.height = `${el.height ?? 160}px`;
            div.style.background = el.content;
            div.style.borderRadius = "16px";
          } else {
            div.style.width = `${el.width ?? 600}px`;
            div.style.fontSize = `${el.fontSize ?? 28}px`;
            div.style.fontWeight = el.fontWeight ?? "400";
            div.style.color = el.color ?? "#0f172a";
            div.style.lineHeight = "1.3";
            div.style.whiteSpace = "pre-wrap";
            div.style.fontFamily = el.fontFamily ?? "Inter";
            if (el.textAlign) div.style.textAlign = el.textAlign;
            div.textContent = el.content;
          }
          container.appendChild(div);
        }

        await new Promise((r) => setTimeout(r, 200));
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, width: 1920, height: 1080, logging: false });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage([1920, 1080], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1920, 1080);
        document.body.removeChild(container);
      }

      setExportProgress(100);
      setExportMsg("¡PDF Listo!");
      await new Promise((r) => setTimeout(r, 500));
      const fileName = docTitle.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") + ".pdf";
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Export error:", err);
      toast({ title: "❌ Error al exportar", description: "No se pudo generar el PDF. Intenta de nuevo." });
      setExporting(false);
    }
  };

  /* ── Presentation keyboard ── */
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

  const presRef = useRef<HTMLDivElement>(null);
  const startPresenting = () => {
    setPresenting(true);
    setTimeout(() => { presRef.current?.requestFullscreen?.().catch(() => {}); }, 100);
  };

  const hasSelection = selectedIds.size > 0;

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
          <div className="flex items-center gap-0.5 ml-2">
            <Button onClick={() => history.undo()} disabled={!history.canUndo} variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Deshacer (Ctrl+Z)"><Undo2 size={14} /></Button>
            <Button onClick={() => history.redo()} disabled={!history.canRedo} variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Rehacer (Ctrl+Shift+Z)"><Redo2 size={14} /></Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Cloud size={12} className={saveState === "saved" ? "text-emerald-500" : "text-muted-foreground/50"} />
            {saveState === "saving" ? "Sincronizando..." : saveState === "saved" ? "Guardado" : "Guardado automáticamente"}
          </span>
          <Button onClick={startPresenting} variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 border-border/40"><Play size={13} /> Presentar</Button>
          <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 border-border/40"><FileDown size={13} /> Exportar PDF</Button>
          <Button
            onClick={handleSave}
            disabled={saveState === "saving"}
            size="sm"
            className="h-8 px-4 text-xs gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-sm shadow-cyan-500/20"
          >
            {saveState === "saving" ? (<><Loader2 size={13} className="animate-spin" /> Sincronizando...</>) :
             saveState === "saved" ? (<><Check size={13} /> Guardado</>) :
             (<><Save size={13} /> Guardar Cambios</>)}
          </Button>
        </div>
      </div>

      {/* ── Format Bar (secondary, full width) ── */}
      <AnimatePresence>
        {hasSelection && (
          <FormatBar
            elements={currentElements}
            selectedIds={selectedIds}
            onUpdate={updateElement}
            onDelete={deleteElement}
            onBgRemove={handleBgRemoveStart}
            bgRemoveProcessing={bgRemoveProcessing}
          />
        )}
      </AnimatePresence>

      {/* Eyedropper mode indicator */}
      {eyedropperMode && (
        <div className="bg-cyan-500 text-white text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-2">
          <Pipette size={14} /> Modo Pipeta: haz clic en el color de fondo a eliminar · <button onClick={() => setEyedropperMode(false)} className="underline">Cancelar (Esc)</button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar (icons) ── */}
        <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-1 flex-shrink-0">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = activeTool === t.action;
            return (
              <button
                key={t.label}
                onClick={() => handleToolClick(t.action)}
                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${active ? "bg-white/10 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
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

        {/* ── Slide-out Panel (Templates / Brand) ── */}
        <AnimatePresence>
          {(activeTool === "templates" || activeTool === "brand" || activeTool === "mockups") && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="bg-background border-r border-border/40 flex-shrink-0 overflow-hidden"
            >
              <div className="w-[260px] h-full overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-border/20">
                  <span className="text-xs font-bold text-foreground">{activeTool === "brand" ? "Brand Hub" : activeTool === "mockups" ? "Mockups" : "Plantillas"}</span>
                  <button onClick={() => setActiveTool(null)} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"><X size={14} /></button>
                </div>
                {activeTool === "brand" ? (
                  <BrandPanel selectedIds={selectedIds} elements={currentElements} onUpdate={updateElement} />
                ) : activeTool === "mockups" ? (
                  <MockupsPanel onAddMockup={addMockup} />
                ) : (
                  <TemplatesPanel onApplyTemplate={applyTemplate} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Canvas Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={canvasAreaRef} className="flex-1 relative overflow-hidden bg-slate-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideMeta[activeIdx]?.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <InteractiveCanvas
                  elements={currentElements}
                  bgImage={slideMeta[activeIdx]?.image}
                  scale={canvasScale}
                  selectedIds={selectedIds}
                  onSelectElement={selectElement}
                  onUpdateElement={updateElement}
                  onDeleteElement={deleteElement}
                  onDeselect={() => { setSelectedIds(new Set()); setEyedropperMode(false); }}
                  eyedropperMode={eyedropperMode}
                  onImageClick={handleImageClick}
                  onMockupDrop={handleMockupDrop}
                  onMockupChildAdjust={handleMockupChildAdjust}
                />
              </motion.div>
            </AnimatePresence>

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
                className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${i === activeIdx ? "border-cyan-500 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/30" : "border-border/30 hover:border-primary/30"}`}
                style={{ width: 160, height: 90 }}
              >
                <SlideThumbnail elements={slidesElements[i] ?? []} bgImage={meta.image} />
                <div className={`absolute top-1 left-1.5 text-[9px] font-bold rounded px-1 z-10 ${i === activeIdx ? "bg-cyan-500 text-slate-950" : "bg-black/40 text-white/70"}`}>{i + 1}</div>
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

      {/* Hidden ref for PDF rendering */}
      <div ref={slideRenderRef} className="fixed -left-[9999px] -top-[9999px]" style={{ width: 1920, height: 1080 }} />
    </div>
  );
};

/* ── Fullscreen Presentation Mode ── */
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

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) onClose(); };
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
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <PresentationSlide elements={allElements[activeIdx] ?? []} bgImage={slideMeta[activeIdx]?.image} />
        </motion.div>
      </AnimatePresence>

      <motion.div animate={{ opacity: showControls ? 1 : 0 }} className="absolute top-4 right-4">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm transition"><X size={18} /></button>
      </motion.div>

      <motion.div animate={{ opacity: showControls ? 1 : 0 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full text-white">
        <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="disabled:opacity-30 hover:text-cyan-400 transition"><ChevronLeft size={20} /></button>
        <span className="text-sm font-medium tabular-nums min-w-[80px] text-center">{activeIdx + 1} / {slideMeta.length}</span>
        <button onClick={() => setActiveIdx((i) => Math.min(slideMeta.length - 1, i + 1))} disabled={activeIdx === slideMeta.length - 1} className="disabled:opacity-30 hover:text-cyan-400 transition"><ChevronRight size={20} /></button>
      </motion.div>
    </motion.div>
  );
});
PresentationOverlay.displayName = "PresentationOverlay";

/* ── Export PDF Modal ── */
const ExportPdfOverlay = ({ progress, message, onClose }: { progress: number; message: string; onClose: () => void }) => (
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
          <FileDown size={14} className="mr-2" /> Cerrar
        </Button>
      )}
    </motion.div>
  </motion.div>
);

export default Editor;
