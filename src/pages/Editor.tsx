import { useState, useEffect, useRef, useCallback, forwardRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Smartphone, Monitor, Tablet, Globe, Linkedin, Youtube, Twitter, 
  RectangleHorizontal, Square, Copy, MoveLeft, MoveRight, PaintBucket,
  Shapes, Film, Circle, Triangle, Star, Zap, ChevronDown,
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
  { icon: Shapes, label: "Elementos", action: "elements" },
  { icon: Film, label: "GIFs", action: "gifs" },
  { icon: Smartphone, label: "Mockups", action: "mockups" },
  { icon: Palette, label: "Brand Hub", action: "brand" },
];

/* ── SVG Shape Definitions ── */
type ShapeDef = { id: string; name: string; icon: React.ReactNode; defaultColor: string };

const SHAPE_DEFS: ShapeDef[] = [
  { id: "rect", name: "Rectángulo", icon: <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" />, defaultColor: "#06b6d4" },
  { id: "circle", name: "Círculo", icon: <circle cx="12" cy="12" r="10" fill="currentColor" />, defaultColor: "#8b5cf6" },
  { id: "triangle", name: "Triángulo", icon: <polygon points="12,2 22,22 2,22" fill="currentColor" />, defaultColor: "#22c55e" },
  { id: "star", name: "Estrella", icon: <polygon points="12,2 15,9 22,9 17,14 19,22 12,18 5,22 7,14 2,9 9,9" fill="currentColor" />, defaultColor: "#f59e0b" },
  { id: "line", name: "Línea", icon: <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />, defaultColor: "#0f172a" },
  { id: "arrow", name: "Flecha", icon: <><line x1="2" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><polyline points="14,6 20,12 14,18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>, defaultColor: "#ef4444" },
  { id: "blob1", name: "Blob 1", icon: <path d="M12 2C17 2 22 6 22 12C22 18 18 22 12 22C6 22 2 17 2 12C2 7 6 2 12 2Z" fill="currentColor" />, defaultColor: "#ec4899" },
  { id: "blob2", name: "Blob 2", icon: <path d="M12 2C18 4 22 8 20 14C18 20 14 22 8 20C2 18 0 12 4 6C8 2 12 2 12 2Z" fill="currentColor" />, defaultColor: "#14b8a6" },
];

/* ── GIF Gallery (Static URLs) ── */
const GIF_GALLERY = [
  { id: "g1", url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", label: "Celebrating" },
  { id: "g2", url: "https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif", label: "Mind Blown" },
  { id: "g3", url: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", label: "Rocket" },
  { id: "g4", url: "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif", label: "Thumbs Up" },
  { id: "g5", url: "https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif", label: "Fire" },
  { id: "g6", url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif", label: "Applause" },
  { id: "g7", url: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif", label: "Success" },
  { id: "g8", url: "https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif", label: "Tech" },
];

/* ── Animation Options ── */
const ANIMATION_OPTIONS: { value: SlideElement["animation"]; label: string; icon: React.ReactNode }[] = [
  { value: "none", label: "Ninguna", icon: <X size={14} /> },
  { value: "fade-in", label: "Aparecer suave", icon: <span className="text-xs">✨</span> },
  { value: "slide-up", label: "Deslizar arriba", icon: <ArrowUp size={14} /> },
  { value: "pop-bounce", label: "Pop / Rebote", icon: <Zap size={14} /> },
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
const TEMPLATE_PROMO = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#0f172a", x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
  { id: uid(), type: "shape", content: "#06b6d4", x: 0, y: 0, width: 960, height: 1080, zIndex: 1 },
  { id: uid(), type: "text", content: "50%", x: 980, y: 200, width: 900, height: 300, fontSize: 200, fontWeight: "900", color: "#06b6d4", zIndex: 2, textAlign: "right" },
  { id: uid(), type: "text", content: "OFF", x: 980, y: 480, width: 900, height: 100, fontSize: 96, fontWeight: "900", color: "#ffffff", zIndex: 2, textAlign: "right" },
  { id: uid(), type: "text", content: "Solo por tiempo limitado", x: 980, y: 600, width: 900, height: 50, fontSize: 28, fontWeight: "400", color: "rgba(255,255,255,0.6)", zIndex: 2, textAlign: "right" },
  { id: uid(), type: "shape", content: "#ffffff", x: 1400, y: 720, width: 440, height: 64, zIndex: 3 },
  { id: uid(), type: "text", content: "COMPRAR AHORA →", x: 1410, y: 730, width: 420, height: 44, fontSize: 24, fontWeight: "800", color: "#0f172a", zIndex: 4, textAlign: "center" },
  { id: uid(), type: "text", content: "📷 Imagen del\nproducto aquí", x: 160, y: 360, width: 640, height: 200, fontSize: 36, fontWeight: "500", color: "rgba(255,255,255,0.3)", zIndex: 2, textAlign: "center" },
];
const TEMPLATE_TESTIMONIAL = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#fafafa", x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
  { id: uid(), type: "shape", content: "#06b6d4", x: 860, y: 140, width: 200, height: 200, zIndex: 1 },
  { id: uid(), type: "text", content: "👤", x: 910, y: 180, width: 100, height: 100, fontSize: 72, fontWeight: "400", color: "#ffffff", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "★ ★ ★ ★ ★", x: 660, y: 380, width: 600, height: 60, fontSize: 36, fontWeight: "400", color: "#f59e0b", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "\"Este producto transformo completamente\nnuestra forma de trabajar. Increible.\"", x: 360, y: 480, width: 1200, height: 160, fontSize: 36, fontWeight: "400", color: "#334155", zIndex: 2, textAlign: "center", fontFamily: "Georgia" },
  { id: uid(), type: "text", content: "— María García, CEO en TechCorp", x: 460, y: 680, width: 1000, height: 50, fontSize: 24, fontWeight: "600", color: "#94a3b8", zIndex: 2, textAlign: "center" },
];
const TEMPLATE_CAROUSEL = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#0f172a", x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
  { id: uid(), type: "text", content: "5 Errores que\nEstás Cometiendo\nen tu Estrategia", x: 160, y: 240, width: 1600, height: 400, fontSize: 96, fontWeight: "900", color: "#ffffff", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "shape", content: "#06b6d4", x: 860, y: 700, width: 200, height: 6, zIndex: 1 },
  { id: uid(), type: "text", content: "Desliza →", x: 760, y: 780, width: 400, height: 60, fontSize: 32, fontWeight: "600", color: "#06b6d4", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "@aerodynamics", x: 760, y: 920, width: 400, height: 40, fontSize: 22, fontWeight: "500", color: "rgba(255,255,255,0.4)", zIndex: 2, textAlign: "center" },
];
const TEMPLATE_QUOTE = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#1e293b", x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
  { id: uid(), type: "text", content: "❝", x: 160, y: 60, width: 400, height: 400, fontSize: 320, fontWeight: "900", color: "rgba(6,182,212,0.12)", zIndex: 1, textAlign: "left" },
  { id: uid(), type: "text", content: "La creatividad es la\ninteligencia divirtiéndose.", x: 260, y: 340, width: 1400, height: 280, fontSize: 64, fontWeight: "400", color: "#e2e8f0", zIndex: 2, textAlign: "center", fontFamily: "Playfair Display" },
  { id: uid(), type: "shape", content: "#06b6d4", x: 860, y: 680, width: 200, height: 4, zIndex: 1 },
  { id: uid(), type: "text", content: "— Albert Einstein", x: 660, y: 720, width: 600, height: 50, fontSize: 24, fontWeight: "600", color: "#94a3b8", zIndex: 2, textAlign: "center" },
];
const TEMPLATE_COMUNICADO = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#ffffff", x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
  { id: uid(), type: "shape", content: "#0f172a", x: 60, y: 60, width: 1800, height: 8, zIndex: 1 },
  { id: uid(), type: "shape", content: "#0f172a", x: 60, y: 1012, width: 1800, height: 8, zIndex: 1 },
  { id: uid(), type: "text", content: "⬡ AERO DYNAMICS", x: 660, y: 100, width: 600, height: 60, fontSize: 28, fontWeight: "800", color: "#0f172a", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "COMUNICADO OFICIAL", x: 460, y: 200, width: 1000, height: 60, fontSize: 48, fontWeight: "900", color: "#0f172a", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "Por medio del presente, se comunica a todos nuestros socios y colaboradores que la empresa ha tomado la decisión estratégica de expandir sus operaciones al mercado internacional.\n\nEsta iniciativa forma parte de nuestra visión 2025 de crecimiento sostenible y liderazgo en innovación tecnológica.", x: 260, y: 320, width: 1400, height: 400, fontSize: 26, fontWeight: "400", color: "#334155", zIndex: 2, textAlign: "left" },
  { id: uid(), type: "text", content: "Firma: ___________________________\nDirector General · Aero Dynamics", x: 260, y: 800, width: 600, height: 100, fontSize: 20, fontWeight: "500", color: "#64748b", zIndex: 2 },
];
const TEMPLATE_MEME = (): SlideElement[] => [
  { id: uid(), type: "shape", content: "#ffffff", x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
  { id: uid(), type: "shape", content: "#e2e8f0", x: 80, y: 0, width: 48, height: 48, zIndex: 1 },
  { id: uid(), type: "text", content: "Aero Dynamics", x: 148, y: 6, width: 300, height: 22, fontSize: 18, fontWeight: "800", color: "#0f172a", zIndex: 2 },
  { id: uid(), type: "text", content: "@aerodynamics · 2h", x: 148, y: 28, width: 300, height: 20, fontSize: 15, fontWeight: "400", color: "#94a3b8", zIndex: 2 },
  { id: uid(), type: "text", content: "Cuando descubres que tu herramienta de IA hace presentaciones sola 🤯🚀\n\nEsto cambia todo. No more templates genéricos.", x: 80, y: 80, width: 1760, height: 160, fontSize: 32, fontWeight: "400", color: "#0f172a", zIndex: 2 },
  { id: uid(), type: "shape", content: "#f1f5f9", x: 80, y: 280, width: 1760, height: 700, zIndex: 1 },
  { id: uid(), type: "text", content: "📷 Imagen viral aquí", x: 700, y: 570, width: 520, height: 60, fontSize: 32, fontWeight: "500", color: "#94a3b8", zIndex: 2, textAlign: "center" },
  { id: uid(), type: "text", content: "♡ 4.2K     💬 328     ↗ 1.1K     🔖", x: 80, y: 1010, width: 800, height: 40, fontSize: 20, fontWeight: "500", color: "#64748b", zIndex: 2 },
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
type TemplateEntry = { name: string; desc: string; factory: () => SlideElement[]; preview: string };

const ALL_TEMPLATES: TemplateEntry[] = [
  { name: "Portada", desc: "Título grande al centro", factory: TEMPLATE_COVER, preview: "cover" },
  { name: "Contenido", desc: "Título + 3 viñetas", factory: TEMPLATE_CONTENT, preview: "content" },
  { name: "Visual", desc: "Imagen + texto lateral", factory: TEMPLATE_VISUAL, preview: "visual" },
  { name: "Promo 50% Off", desc: "Descuento impactante", factory: TEMPLATE_PROMO, preview: "promo" },
  { name: "Testimonio", desc: "Cliente + estrellas + cita", factory: TEMPLATE_TESTIMONIAL, preview: "testimonial" },
  { name: "Carrusel IG", desc: "Hook masivo · Slide 1", factory: TEMPLATE_CAROUSEL, preview: "carousel" },
  { name: "Frase / Quote", desc: "Cita inspiracional", factory: TEMPLATE_QUOTE, preview: "quote" },
  { name: "Comunicado", desc: "Oficial corporativo", factory: TEMPLATE_COMUNICADO, preview: "comunicado" },
  { name: "Meme / Viral", desc: "Layout tipo Twitter/X", factory: TEMPLATE_MEME, preview: "meme" },
];

const MiniPreview = ({ type }: { type: string }) => {
  if (type === "cover") return (<div className="w-full h-full flex flex-col items-center justify-center gap-1"><div className="w-3/4 h-3 bg-slate-800 rounded-sm" /><div className="w-1/2 h-2 bg-slate-300 rounded-sm" /><div className="w-8 h-0.5 bg-cyan-500 mt-1" /></div>);
  if (type === "content") return (<div className="w-full h-full flex flex-col gap-1.5"><div className="w-2/3 h-3 bg-slate-800 rounded-sm" /><div className="w-6 h-0.5 bg-cyan-500" /><div className="w-full h-2 bg-slate-200 rounded-sm mt-1" /><div className="w-full h-2 bg-slate-200 rounded-sm" /><div className="w-3/4 h-2 bg-slate-200 rounded-sm" /></div>);
  if (type === "visual") return (<div className="w-full h-full flex gap-2"><div className="w-1/2 h-full bg-slate-100 rounded-sm flex items-center justify-center"><div className="w-5 h-5 rounded bg-slate-300" /></div><div className="w-1/2 flex flex-col gap-1 justify-center"><div className="w-full h-2.5 bg-slate-800 rounded-sm" /><div className="w-full h-1.5 bg-slate-200 rounded-sm" /><div className="w-3/4 h-1.5 bg-slate-200 rounded-sm" /></div></div>);
  if (type === "promo") return (<div className="w-full h-full flex"><div className="w-1/2 h-full bg-cyan-500 rounded-l-sm" /><div className="w-1/2 h-full bg-slate-900 rounded-r-sm flex flex-col items-end justify-center pr-2 gap-0.5"><div className="text-[10px] font-black text-cyan-400 leading-none">50%</div><div className="text-[7px] font-bold text-white leading-none">OFF</div><div className="w-10 h-2 bg-white rounded-sm mt-1" /></div></div>);
  if (type === "testimonial") return (<div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-1"><div className="w-5 h-5 rounded-full bg-cyan-500" /><div className="text-[6px] text-amber-500">★★★★★</div><div className="w-3/4 h-1.5 bg-slate-300 rounded-sm" /><div className="w-1/2 h-1 bg-slate-200 rounded-sm" /></div>);
  if (type === "carousel") return (<div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-1"><div className="w-3/4 h-2.5 bg-white rounded-sm" /><div className="w-1/2 h-2 bg-white/60 rounded-sm" /><div className="w-6 h-0.5 bg-cyan-500 mt-0.5" /><div className="text-[6px] text-cyan-400 font-bold">Desliza →</div></div>);
  if (type === "quote") return (<div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-0.5"><div className="text-[14px] text-cyan-500/20 font-black leading-none">❝</div><div className="w-3/4 h-1.5 bg-slate-400 rounded-sm" /><div className="w-1/2 h-1 bg-slate-400 rounded-sm" /><div className="w-5 h-0.5 bg-cyan-500 mt-1" /></div>);
  if (type === "comunicado") return (<div className="w-full h-full bg-white flex flex-col gap-1 p-1.5"><div className="w-full h-0.5 bg-slate-800" /><div className="w-1/3 h-1.5 bg-slate-800 rounded-sm mx-auto" /><div className="w-2/3 h-1 bg-slate-300 rounded-sm mx-auto mt-0.5" /><div className="flex-1 flex flex-col gap-0.5 mt-1"><div className="w-full h-1 bg-slate-200 rounded-sm" /><div className="w-full h-1 bg-slate-200 rounded-sm" /><div className="w-3/4 h-1 bg-slate-200 rounded-sm" /></div><div className="w-full h-0.5 bg-slate-800" /></div>);
  if (type === "meme") return (<div className="w-full h-full bg-white flex flex-col gap-1 p-1"><div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-300" /><div className="w-10 h-1.5 bg-slate-800 rounded-sm" /></div><div className="w-full h-1 bg-slate-300 rounded-sm" /><div className="flex-1 bg-slate-100 rounded-sm" /><div className="flex gap-2 mt-0.5"><div className="w-3 h-1 bg-slate-300 rounded-sm" /><div className="w-3 h-1 bg-slate-300 rounded-sm" /><div className="w-3 h-1 bg-slate-300 rounded-sm" /></div></div>);
  return <div className="w-full h-full bg-slate-100" />;
};

const TemplatesPanel = ({
  onApplyTemplate,
}: {
  onApplyTemplate: (elements: SlideElement[]) => void;
}) => {
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
        {ALL_TEMPLATES.map((t) => (
          <button
            key={t.name}
            onDoubleClick={() => handleApply(t.factory)}
            className="group border border-border/40 rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="aspect-video bg-white relative p-3">
              <MiniPreview type={t.preview} />
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
  category: "device" | "social" | "professional" | "outdoor";
  width: number;
  height: number;
  screenRadius: string;
  screenInset: { top: number; right: number; bottom: number; left: number };
  frameColor: string;
  notch?: boolean;
  socialUI?: string;
}

const MOCKUP_DEFS: MockupDef[] = [
  // ── Dispositivos Digitales ──
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
    id: "browser", name: "Browser Window", icon: Globe, category: "device",
    width: 800, height: 600,
    screenRadius: "0.5rem", screenInset: { top: 44, right: 8, bottom: 8, left: 8 },
    frameColor: "#f5f5f5", socialUI: "browser",
  },

  // ── Redes Sociales (B2C) ──
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

  // ── Profesional & Video (B2B) ──
  {
    id: "linkedin", name: "LinkedIn Post", icon: Linkedin, category: "professional",
    width: 520, height: 400,
    screenRadius: "0.5rem", screenInset: { top: 60, right: 16, bottom: 50, left: 16 },
    frameColor: "#ffffff", socialUI: "linkedin",
  },
  {
    id: "youtube", name: "YouTube Video", icon: Youtube, category: "professional",
    width: 640, height: 360,
    screenRadius: "0.75rem", screenInset: { top: 0, right: 0, bottom: 40, left: 0 },
    frameColor: "#000000", socialUI: "youtube",
  },
  {
    id: "twitter", name: "X / Twitter Post", icon: Twitter, category: "professional",
    width: 500, height: 280,
    screenRadius: "1rem", screenInset: { top: 50, right: 16, bottom: 50, left: 16 },
    frameColor: "#ffffff", socialUI: "twitter",
  },

  // ── Publicidad Exterior (OOH) ✨ ──
  {
    id: "billboard", name: "Espectacular", icon: RectangleHorizontal, category: "outdoor",
    width: 800, height: 380,
    screenRadius: "0.25rem", screenInset: { top: 40, right: 40, bottom: 80, left: 40 },
    frameColor: "#424242", socialUI: "billboard",
  },
  {
    id: "mupi", name: "Mupi / Parabús", icon: Square, category: "outdoor",
    width: 400, height: 600,
    screenRadius: "0.5rem", screenInset: { top: 40, right: 20, bottom: 40, left: 20 },
    frameColor: "#2d3748", socialUI: "mupi",
  },
];

const getMockupDef = (mockupType?: string) => MOCKUP_DEFS.find((m) => m.id === mockupType);

/* ── Smart Frame Station (Immersive Focus Mode) ── */
const SmartFrameStation = ({ imgSrc, mockupDef, initialScale, initialX, initialY, onSave, onClose }: {
  imgSrc: string;
  mockupDef: MockupDef;
  initialScale: number;
  initialX: number; // normalized translate X (%)
  initialY: number; // normalized translate Y (%)
  onSave: (scale: number, x: number, y: number) => void;
  onClose: () => void;
}) => {
  // Local state MUST hydrate from the current mockup state (no amnesia)
  const [scale, setScale] = useState(initialScale || 1);
  const [normX, setNormX] = useState(initialX || 0);
  const [normY, setNormY] = useState(initialY || 0);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Screen aspect ratio MUST mirror the canvas dropzone
  const inset = mockupDef.screenInset;
  const screenW = mockupDef.width - inset.left - inset.right;
  const screenH = mockupDef.height - inset.top - inset.bottom;
  const aspectRatio = screenW / screenH;

  // Hole dimensions in the modal
  const HOLE_H = 520;
  const HOLE_W = Math.round(HOLE_H * aspectRatio);
  const holeRadius = mockupDef.id === "iphone15" ? 36 : mockupDef.id === "tablet" ? 16 : 12;

  // Unique mask id
  const maskId = useMemo(() => `sfs-mask-${Math.random().toString(36).slice(2, 8)}`, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      // transform: translate(%) scale(scale) => translation scales too
      const denomX = HOLE_W * Math.max(scale, 0.0001);
      const denomY = HOLE_H * Math.max(scale, 0.0001);
      setNormX((v) => v + (dx / denomX) * 100);
      setNormY((v) => v + (dy / denomY) * 100);
    };

    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, HOLE_W, HOLE_H, scale]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((s) => Math.max(0.2, Math.min(5, +(s + delta).toFixed(2))));
  }, []);

  const resetPosition = () => {
    setScale(1);
    setNormX(0);
    setNormY(0);
  };

  const handleApprove = () => {
    onSave(scale, normX, normY);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 w-screen h-screen z-[99999] flex"
      style={{ background: "hsl(0 0% 0% / 0.95)" }}
    >
      {/* LEFT */}
      <div
        className="relative flex-[3] flex items-center justify-center overflow-hidden select-none"
        style={{ background: "hsl(222 47% 11%)" }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {/* Crop box */}
        <div
          className="absolute"
          style={{
            width: HOLE_W,
            height: HOLE_H,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: holeRadius,
            overflow: "hidden",
          }}
        >
          <img
            src={imgSrc}
            alt="Encuadre"
            draggable={false}
            className="w-full h-full pointer-events-none"
            style={{
              objectFit: "contain",
              transform: `translate3d(${normX}%, ${normY}%, 0) scale(${scale})`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 100ms ease-out",
            }}
          />
        </div>

        {/* Mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              <rect
                x="50%"
                y="50%"
                width={HOLE_W}
                height={HOLE_H}
                rx={holeRadius}
                ry={holeRadius}
                fill="black"
                transform={`translate(-${HOLE_W / 2}, -${HOLE_H / 2})`}
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="hsl(0 0% 0% / 0.7)" mask={`url(#${maskId})`} />
        </svg>

        {/* Outline */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: HOLE_W,
            height: HOLE_H,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: holeRadius,
            border: "2px solid hsl(var(--primary) / 0.35)",
            boxShadow: "0 0 40px hsl(var(--primary) / 0.08), inset 0 0 20px hsl(var(--primary) / 0.04)",
          }}
        />

        {/* Dynamic Island */}
        {mockupDef.notch && mockupDef.id === "iphone15" && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: 110,
              height: 30,
              left: "50%",
              top: "50%",
              transform: `translate(-50%, calc(-50% - ${HOLE_H / 2 - 22}px))`,
              borderRadius: 16,
              background: "hsl(0 0% 0% / 0.9)",
              border: "1px solid hsl(0 0% 100% / 0.06)",
            }}
          />
        )}

        {/* Status */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full"
          style={{
            background: "hsl(0 0% 0% / 0.55)",
            backdropFilter: "blur(12px)",
            border: "1px solid hsl(0 0% 100% / 0.06)",
          }}
        >
          <span className="text-[11px] font-mono" style={{ color: "hsl(var(--primary))" }}>
            {Math.round(scale * 100)}%
          </span>
          <span className="w-px h-3" style={{ background: "hsl(0 0% 100% / 0.15)" }} />
          <span className="text-[11px] font-mono" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            X: {Math.round(normX)}% · Y: {Math.round(normY)}%
          </span>
          <span className="w-px h-3" style={{ background: "hsl(0 0% 100% / 0.15)" }} />
          <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            Scroll zoom · Drag pan
          </span>
        </div>

        <div className="absolute inset-0" style={{ cursor: dragging ? "grabbing" : "grab" }} />
      </div>

      {/* RIGHT */}
      <div className="flex-[1] flex flex-col" style={{ background: "hsl(0 0% 0%)", borderLeft: "1px solid hsl(0 0% 100% / 0.06)" }}>
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>
              Encuadre - {mockupDef.name}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ color: "hsl(0 0% 100% / 0.45)" }}
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            Estado hidratado desde el lienzo
          </p>
        </div>

        <div className="flex-1 p-6 space-y-7 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                Zoom
              </label>
              <span className="text-xs font-mono font-semibold" style={{ color: "hsl(var(--primary))" }}>
                {Math.round(scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={500}
              value={Math.round(scale * 100)}
              onChange={(e) => setScale(parseInt(e.target.value) / 100)}
              className="sfs-slider w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                Posición X
              </label>
              <span className="text-xs font-mono font-semibold" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
                {Math.round(normX)}%
              </span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              value={Math.round(normX)}
              onChange={(e) => setNormX(parseInt(e.target.value))}
              className="sfs-slider w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
                Posición Y
              </label>
              <span className="text-xs font-mono font-semibold" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
                {Math.round(normY)}%
              </span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              value={Math.round(normY)}
              onChange={(e) => setNormY(parseInt(e.target.value))}
              className="sfs-slider w-full"
            />
          </div>

          <div style={{ height: 1, background: "hsl(0 0% 100% / 0.06)" }} />

          <button
            onClick={resetPosition}
            className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider"
            style={{
              border: "1px solid hsl(0 0% 100% / 0.12)",
              color: "hsl(0 0% 100% / 0.55)",
              background: "transparent",
            }}
          >
            Resetear
          </button>
        </div>

        <div className="p-6 space-y-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg text-sm font-semibold"
            style={{
              border: "1px solid hsl(var(--primary) / 0.25)",
              color: "hsl(var(--primary))",
              background: "transparent",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleApprove}
            className="w-full py-3 rounded-lg text-sm font-bold"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              boxShadow: "0 4px 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1)",
            }}
          >
            Aprobar Encuadre
          </button>
        </div>
      </div>

      <style>{`
        .sfs-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: hsl(0 0% 100% / 0.08);
          outline: none;
          cursor: pointer;
        }
        .sfs-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 0 10px hsl(var(--primary) / 0.4);
        }
        .sfs-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px hsl(var(--primary) / 0.4);
        }
        .sfs-slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: hsl(0 0% 100% / 0.08);
        }
      `}</style>
    </motion.div>
  );
};

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
  const [showAdjustModal, setShowAdjustModal] = useState(false);

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
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const src = URL.createObjectURL(file);
        onNativeFileDrop?.(el.id, src);
        return;
      }
    }
    const data = e.dataTransfer.getData("application/mockup-drop");
    if (data && onDrop) {
      try {
        const { imgSrc, imgElId } = JSON.parse(data);
        onDrop(el.id, imgSrc, imgElId);
      } catch {}
    }
  };

  return (
    <>
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
          {def.notch && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-b-2xl" style={{ background: def.frameColor }} />
          )}
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
                <span className="text-sm">♡</span><span className="text-sm">💬</span><span className="text-sm">↗</span><span className="flex-1" /><span className="text-sm">🔖</span>
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
                <span className="text-[8px] text-white/80">🏠</span><span className="text-[8px] text-white/80">🔍</span>
                <span className="text-[10px] text-white bg-gradient-to-r from-cyan-400 to-pink-500 rounded px-2 py-0.5 font-bold">+</span>
                <span className="text-[8px] text-white/80">💬</span><span className="text-[8px] text-white/80">👤</span>
              </div>
            </>
          )}
          {def.socialUI === "browser" && (
            <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3" style={{ height: inset.top - 2, background: "#f6f7f8", borderBottom: "1px solid #e1e5e9" }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded border px-2 py-1 text-[8px] text-gray-500">
                  https://www.aerodynamics.com
                </div>
              </div>
            </div>
          )}
          {def.socialUI === "linkedin" && (
            <>
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3" style={{ height: inset.top - 2, background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">AD</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-gray-900">Aero Dynamics</span>
                  <span className="text-[7px] text-gray-500">Empresa · Patrocinado</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-3 py-2" style={{ height: inset.bottom - 2, background: "#fff", borderTop: "1px solid #e0e0e0" }}>
                <span className="text-[8px] text-gray-600">👍 Me gusta</span>
                <span className="text-[8px] text-gray-600">💬 Comentar</span>
                <span className="text-[8px] text-gray-600">↗ Compartir</span>
              </div>
            </>
          )}
          {def.socialUI === "youtube" && (
            <div className="absolute bottom-0 left-0 right-0" style={{ height: inset.bottom }}>
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <Play size={20} fill="white" className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" style={{ width: "35%" }} />
            </div>
          )}
          {def.socialUI === "twitter" && (
            <>
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3" style={{ height: inset.top - 2, background: "#fff", borderBottom: "1px solid #e1e8ed" }}>
                <div className="w-8 h-8 rounded-full bg-gray-300" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-900">AeroDynamics</span>
                  <span className="text-[7px] text-gray-500">@aerodynamics</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-3" style={{ height: inset.bottom - 2, background: "#fff", borderTop: "1px solid #e1e8ed" }}>
                <span className="text-[8px] text-gray-500">💬</span>
                <span className="text-[8px] text-gray-500">🔁</span>
                <span className="text-[8px] text-gray-500">♡</span>
                <span className="text-[8px] text-gray-500">↗</span>
              </div>
            </>
          )}
          {def.socialUI === "billboard" && (
            <>
              {/* Metal frame top */}
              <div className="absolute top-0 left-0 right-0" style={{ height: inset.top, background: "linear-gradient(180deg, #6b7280 0%, #374151 50%, #1f2937 100%)", borderBottom: "2px solid #9ca3af" }} />
              {/* Support posts */}
              <div className="absolute" style={{ bottom: -20, left: "20%", width: 8, height: 60, background: "linear-gradient(90deg, #6b7280, #374151)", borderRadius: "0 0 4px 4px" }} />
              <div className="absolute" style={{ bottom: -20, right: "20%", width: 8, height: 60, background: "linear-gradient(90deg, #6b7280, #374151)", borderRadius: "0 0 4px 4px" }} />
              {/* Lights */}
              <div className="absolute flex justify-around px-8" style={{ top: 8, left: 0, right: 0 }}>
                <div className="w-3 h-3 rounded-full bg-yellow-300 opacity-60" />
                <div className="w-3 h-3 rounded-full bg-yellow-300 opacity-60" />
                <div className="w-3 h-3 rounded-full bg-yellow-300 opacity-60" />
              </div>
            </>
          )}
          {def.socialUI === "mupi" && (
            <>
              {/* Silver metallic frame */}
              <div className="absolute inset-0 rounded-lg" style={{ 
                background: "linear-gradient(145deg, #e5e7eb 0%, #9ca3af 50%, #6b7280 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.2)"
              }} />
              {/* Inner shadow for depth */}
              <div className="absolute" style={{
                top: inset.top - 8, right: inset.right - 8, bottom: inset.bottom - 8, left: inset.left - 8,
                borderRadius: `calc(${def.screenRadius} + 2px)`,
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)"
              }} />
            </>
          )}
        </div>

        {/* Screen area (drop zone) */}
        <div
          className={`absolute z-[4] overflow-hidden transition-all ${dragOver ? "ring-4 ring-cyan-500 ring-inset" : ""}`}
          style={{
            top: inset.top, right: inset.right, bottom: inset.bottom, left: inset.left,
            borderRadius: `calc(${def.screenRadius} - ${Math.min(inset.top, inset.left)}px)`,
            background: el.mockupChild ? "transparent" : (def.frameColor === "#ffffff" ? "#f1f5f9" : "#18181b"),
            pointerEvents: "auto",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropEvt}
          onDoubleClick={(e) => {
            if (interactive && el.mockupChild) {
              e.stopPropagation();
              setShowAdjustModal(true);
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
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `translate3d(${el.mockupChildX ?? 0}%, ${el.mockupChildY ?? 0}%, 0) scale(${el.mockupChildScale ?? 1})`,
                transformOrigin: "center center",
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
              <Image size={24} />
              <span className="text-[9px] font-medium">Drop image here</span>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Modal — portaled to document.body */}
      {showAdjustModal && el.mockupChild && def && createPortal(
        <AnimatePresence>
          <SmartFrameStation
            imgSrc={el.mockupChild}
            mockupDef={def}
            initialScale={el.mockupChildScale ?? 1}
            initialX={el.mockupChildX ?? 0}
            initialY={el.mockupChildY ?? 0}
            onSave={(s, x, y) => onChildAdjust?.({ mockupChildScale: s, mockupChildX: x, mockupChildY: y })}
            onClose={() => setShowAdjustModal(false)}
          />
        </AnimatePresence>,
        document.body
      )}
    </>
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
  const professional = MOCKUP_DEFS.filter((m) => m.category === "professional");
  const outdoor = MOCKUP_DEFS.filter((m) => m.category === "outdoor");

  const renderMockupButton = (m: MockupDef) => {
    const Icon = m.icon;
    const isWhiteBg = m.frameColor === "#ffffff" || m.frameColor === "#f5f5f5";
    
    return (
      <button
        key={m.id}
        onClick={() => onAddMockup(m.id)}
        className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
      >
        <div 
          className="w-10 h-14 rounded-lg flex items-center justify-center shadow-sm" 
          style={{ 
            background: m.frameColor, 
            border: isWhiteBg ? "1px solid #e2e8f0" : "none" 
          }}
        >
          <Icon 
            size={16} 
            className={isWhiteBg ? "text-gray-600" : "text-white/80"} 
          />
        </div>
        <div className="text-left">
          <span className="text-xs font-semibold text-foreground block">{m.name}</span>
          <span className="text-[10px] text-muted-foreground">{m.width}×{m.height}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Smart Containers</h3>
        <p className="text-[11px] text-muted-foreground">Haz clic para agregar · Arrastra imágenes dentro</p>
      </div>

      {/* Dispositivos Digitales */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            💻 Dispositivos Digitales
          </h4>
        </div>
        <div className="flex flex-col gap-2">
          {devices.map(renderMockupButton)}
        </div>
      </div>

      {/* Redes Sociales (B2C) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            📲 Redes Sociales (B2C)
          </h4>
        </div>
        <div className="flex flex-col gap-2">
          {social.map(renderMockupButton)}
        </div>
      </div>

      {/* Profesional & Video (B2B) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            💼 Profesional & Video (B2B)
          </h4>
        </div>
        <div className="flex flex-col gap-2">
          {professional.map(renderMockupButton)}
        </div>
      </div>

      {/* Publicidad Exterior (OOH) ✨ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            🏗️ Publicidad Exterior (OOH) ✨
          </h4>
        </div>
        <div className="flex flex-col gap-2">
          {outdoor.map(renderMockupButton)}
        </div>
      </div>
    </div>
  );
};

/* ── Elements Panel (SVG Shapes) ── */
const ElementsPanel = ({
  onAddShape,
}: {
  onAddShape: (shapeType: string, color: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Elementos</h3>
        <p className="text-[11px] text-muted-foreground">Haz clic para añadir al lienzo</p>
      </div>

      <div>
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Formas Básicas
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {SHAPE_DEFS.map((shape) => (
            <button
              key={shape.id}
              onClick={() => onAddShape(shape.id, shape.defaultColor)}
              className="aspect-square rounded-xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center transition-all group"
              title={shape.name}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors">
                {shape.icon}
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Usa el selector de color en la barra superior para cambiar el color del relleno
        </p>
      </div>
    </div>
  );
};

/* ── GIFs Panel ── */
const GifsPanel = ({
  onAddGif,
}: {
  onAddGif: (url: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">GIFs</h3>
        <p className="text-[11px] text-muted-foreground">Arrastra o haz clic para añadir</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {GIF_GALLERY.map((gif) => (
          <button
            key={gif.id}
            onClick={() => onAddGif(gif.url)}
            className="aspect-square rounded-lg border border-border/40 hover:border-primary/40 overflow-hidden relative group"
            title={gif.label}
          >
            <img
              src={gif.url}
              alt={gif.label}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <span className="text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                {gif.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground text-center">
          🎬 Los GIFs se reproducen automáticamente en el Modo Presentación
        </p>
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
  if (el.type === "gif") {
    return (
      <div style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 400, height: el.height ?? 300, opacity: el.opacity ?? 1, zIndex: el.zIndex ?? 0, transform }}>
        <img src={el.content} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
    );
  }
  if (el.type === "shape") {
    return <StaticShapeElement el={el} transform={transform} />;
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

/* ── Static Shape Element with SVG support ── */
const StaticShapeElement = ({ el, transform }: { el: SlideElement; transform: string }) => {
  const w = el.width ?? 160;
  const h = el.height ?? 160;
  const color = el.content || "#06b6d4";
  const shapeType = el.shapeType ?? "rect";

  const renderShape = () => {
    switch (shapeType) {
      case "circle":
        return <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={color} />;
      case "triangle":
        return <polygon points={`${w/2},0 ${w},${h} 0,${h}`} fill={color} />;
      case "star":
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
        const points = Array.from({ length: 10 }, (_, i) => {
          const angle = (i * 36 - 90) * Math.PI / 180;
          const radius = i % 2 === 0 ? r : r * 0.5;
          return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
        }).join(" ");
        return <polygon points={points} fill={color} />;
      case "line":
        return <line x1="0" y1={h/2} x2={w} y2={h/2} stroke={color} strokeWidth={Math.max(4, h * 0.1)} strokeLinecap="round" />;
      case "arrow":
        const arrowW = w * 0.7, arrowH = h * 0.3;
        return (
          <>
            <line x1="0" y1={h/2} x2={arrowW} y2={h/2} stroke={color} strokeWidth={Math.max(4, h * 0.1)} strokeLinecap="round" />
            <polygon points={`${arrowW - arrowH/2},${h/2 - arrowH/2} ${w},${h/2} ${arrowW - arrowH/2},${h/2 + arrowH/2}`} fill={color} />
          </>
        );
      case "blob1":
        return <ellipse cx="50%" cy="50%" rx="48%" ry="45%" fill={color} />;
      case "blob2":
        return <path d={`M ${w*0.5} ${h*0.05} Q ${w*0.95} ${h*0.15} ${w*0.9} ${h*0.5} Q ${w*0.85} ${h*0.9} ${w*0.4} ${h*0.95} Q ${h*0.05} ${h*0.8} ${w*0.1} ${h*0.4} Q ${w*0.15} ${h*0.1} ${w*0.5} ${h*0.05}`} fill={color} />;
      default: // rect
        return <rect x="0" y="0" width={w} height={h} rx={Math.min(w, h) * 0.1} fill={color} />;
    }
  };

  return (
    <div style={{ position: "absolute", left: el.x, top: el.y, width: w, height: h, zIndex: el.zIndex ?? 0, transform }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {renderShape()}
      </svg>
    </div>
  );
};

/* ── Slide Thumbnail ── */
const SlideThumbnail = ({ elements, bgImage, backgroundColor }: { elements: SlideElement[]; bgImage?: string; backgroundColor?: string }) => {
  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: backgroundColor ?? "#ffffff" }}>
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
  onMockupDrop, onMockupChildAdjust, onMockupNativeFileDrop,
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
  onMockupNativeFileDrop?: (mockupId: string, src: string) => void;
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
        pointerEvents: "auto",
      }}
    >
      <div
        className={`w-full h-full relative ${!selected && !editing ? "hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/40" : ""}`}
        onDoubleClick={(e) => { e.stopPropagation(); if (el.type === "text") setEditing(true); }}
        onClick={(e) => {
          if (eyedropperMode && el.type === "image" && onImageClick) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const localX = (e.clientX - rect.left) / (rect.width / w);
            const localY = (e.clientY - rect.top) / (rect.height / h);
            onImageClick(el.id, localX, localY);
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
            onNativeFileDrop={onMockupNativeFileDrop}
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
  eyedropperMode, onImageClick, onMockupDrop, onMockupChildAdjust, onNativeFileDrop, onMockupNativeFileDrop,
  backgroundColor, onBackgroundClick,
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
  onNativeFileDrop?: (src: string, x: number, y: number) => void;
  onMockupNativeFileDrop?: (mockupId: string, src: string) => void;
  backgroundColor?: string;
  onBackgroundClick?: () => void;
}) => {
  const [guides, setGuides] = useState<GuideLines>({ x: null, y: null });
  const [canvasDragOver, setCanvasDragOver] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)), [elements]);

  const handleDragMove = useCallback((dragId: string, x: number, y: number, w: number, h: number) => {
    const others = elements.filter((e) => e.id !== dragId).map((e) => ({ x: e.x, y: e.y, w: e.width ?? 400, h: e.height ?? 80 }));
    const result = computeSnapAndGuides({ x, y, w, h }, others, 1920, 1080);
    setGuides(result.guides);
  }, [elements]);

  const handleDragEnd = useCallback(() => { setGuides({ x: null, y: null }); }, []);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCanvasDragOver(true);
  }, []);

  const handleCanvasDragLeave = useCallback(() => { setCanvasDragOver(false); }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCanvasDragOver(false);
    if (!e.dataTransfer.files?.length) return;
    const file = e.dataTransfer.files[0];
    if (!file.type.startsWith("image/")) return;
    const src = URL.createObjectURL(file);
    // Calculate drop position in canvas coords
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      onNativeFileDrop?.(src, Math.round(x - 200), Math.round(y - 150));
    } else {
      onNativeFileDrop?.(src, 400, 200);
    }
  }, [scale, onNativeFileDrop]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onDeselect(); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={handleCanvasDrop}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", willChange: "transform" }}>
        <div
          ref={canvasRef}
          className={`shadow-2xl shadow-black/10 ring-1 ring-border/20 rounded-lg overflow-hidden transition-shadow ${canvasDragOver ? "ring-4 ring-cyan-500/60 shadow-cyan-500/20" : ""}`}
          style={{ width: 1920, height: 1080, position: "relative", backgroundColor: backgroundColor ?? "#ffffff" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas) {
              onDeselect();
              onBackgroundClick?.();
            }
          }}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-[1]" />}

          {canvasDragOver && (
            <div className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center bg-cyan-500/5 border-2 border-dashed border-cyan-500/40 rounded-lg">
              <div className="bg-slate-900/80 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                <Image size={16} /> Soltar imagen aquí
              </div>
            </div>
          )}

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
                onMockupNativeFileDrop={onMockupNativeFileDrop}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Animated Element for Presentation Mode ── */
const AnimatedElement = ({ el, index }: { el: SlideElement; index: number }) => {
  const animation = el.animation ?? "none";
  
  const getAnimationProps = () => {
    const baseDelay = index * 0.12; // Stagger effect
    
    switch (animation) {
      case "fade-in":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.8, delay: baseDelay, ease: "easeOut" },
        };
      case "slide-up":
        return {
          initial: { opacity: 0, y: 50 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay: baseDelay, ease: "easeOut" },
        };
      case "pop-bounce":
        return {
          initial: { opacity: 0, scale: 0.5 },
          animate: { opacity: 1, scale: 1 },
          transition: { type: "spring", bounce: 0.5, delay: baseDelay },
        };
      default:
        return {};
    }
  };

  const animProps = getAnimationProps();
  const hasAnimation = animation !== "none";

  if (hasAnimation) {
    return (
      <motion.div
        {...animProps}
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
      >
        <StaticElement el={el} />
      </motion.div>
    );
  }

  return <StaticElement el={el} />;
};

/* ── Presentation Slide (window-aware scaling with animations) ── */
const PresentationSlide = ({ elements, bgImage, backgroundColor }: { elements: SlideElement[]; bgImage?: string; backgroundColor?: string }) => {
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
      <div className="overflow-hidden relative" style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${s})`, transformOrigin: "center center", backgroundColor: backgroundColor ?? "#ffffff" }}>
        {bgImage && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-[1]" />}
        <div className="absolute inset-0 z-[2]">
          {sorted.map((el, idx) => (
            <AnimatedElement key={el.id} el={el} index={idx} />
          ))}
        </div>
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
    campaign.slides.map((s) => ({ id: s.id, type: s.type, image: s.type === "cover" ? s.image : undefined, backgroundColor: "#ffffff" }))
  );
  const [isBackgroundSelected, setIsBackgroundSelected] = useState(false);

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
    setIsBackgroundSelected(false);
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

  const addShape = (shapeType: string, color: string) => {
    const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
    const el: SlideElement = {
      id: uid(), type: "shape", content: color, shapeType: shapeType as any,
      x: 760, y: 400, width: 200, height: 200, zIndex: maxZ + 1, animation: "none",
    };
    history.set((prev) => [...prev, el]);
    setSelectedIds(new Set([el.id]));
    setActiveTool(null);
    toast({ title: "🔷 Forma añadida", description: "Cambia el color desde la barra de formato." });
  };

  const addGif = (url: string) => {
    const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
    const el: SlideElement = {
      id: uid(), type: "gif", content: url,
      x: 660, y: 340, width: 400, height: 300, zIndex: maxZ + 1, animation: "none",
    };
    history.set((prev) => [...prev, el]);
    setSelectedIds(new Set([el.id]));
    setActiveTool(null);
    toast({ title: "🎬 GIF añadido", description: "Se reproducirá en el Modo Presentación." });
  };

  const handleMockupDrop = useCallback((mockupId: string, imgSrc: string, imgElId: string) => {
    const mockupEl = currentElements.find((e) => e.id === mockupId);
    const def = getMockupDef(mockupEl?.mockupType);

    // Immediate paint (then we upgrade to a proper "cover" scale once the image dimensions are known)
    history.set((prev) => {
      const updated = prev.map((e) =>
        e.id === mockupId
          ? { ...e, mockupChild: imgSrc, mockupChildScale: 1, mockupChildX: 0, mockupChildY: 0 }
          : e,
      );
      return updated.filter((e) => e.id !== imgElId);
    });

    if (def) {
      const maskW = def.width - def.screenInset.left - def.screenInset.right;
      const maskH = def.height - def.screenInset.top - def.screenInset.bottom;

      const img = new window.Image();
      img.onload = () => {
        // We render with objectFit: contain at scale=1.
        // Additional scale to behave like objectFit: cover is maxRatio/minRatio.
        const rW = maskW / Math.max(1, img.naturalWidth);
        const rH = maskH / Math.max(1, img.naturalHeight);
        const coverScale = Math.max(rW, rH) / Math.min(rW, rH);
        const scaleToFit = Math.max(1, coverScale * 1.03);

        history.set((prev) => prev.map((e) =>
          e.id === mockupId
            ? { ...e, mockupChildScale: scaleToFit, mockupChildX: 0, mockupChildY: 0 }
            : e,
        ));
      };
      img.src = imgSrc;
    }

    toast({ title: "🎯 Imagen insertada en Mockup", description: "Doble clic en el mockup para re-encuadrar." });
  }, [currentElements, history]);

  const handleMockupChildAdjust = useCallback((id: string, patch: Partial<SlideElement>) => {
    history.set((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, [history]);

  const handleNativeFileDrop = useCallback((src: string, x: number, y: number) => {
    const maxZ = Math.max(0, ...currentElements.map((e) => e.zIndex ?? 0));
    const el: SlideElement = { id: uid(), type: "image", content: src, x, y, width: 400, height: 300, zIndex: maxZ + 1 };
    history.set((prev) => [...prev, el]);
    setSelectedIds(new Set([el.id]));
    toast({ title: "🖼️ Imagen importada", description: "Arrastra y redimensiona." });
  }, [currentElements, history]);

  const handleMockupNativeFileDrop = useCallback((mockupId: string, src: string) => {
    const mockupEl = currentElements.find((e) => e.id === mockupId);
    const def = getMockupDef(mockupEl?.mockupType);

    // Immediate paint with scale=1, then upgrade to "cover" once dimensions are known
    history.set((prev) => prev.map((e) =>
      e.id === mockupId ? { ...e, mockupChild: src, mockupChildScale: 1, mockupChildX: 0, mockupChildY: 0 } : e
    ));

    if (def) {
      const maskW = def.width - def.screenInset.left - def.screenInset.right;
      const maskH = def.height - def.screenInset.top - def.screenInset.bottom;

      const img = new window.Image();
      img.onload = () => {
        // Calculate scale to achieve object-fit: cover behavior
        const rW = maskW / Math.max(1, img.naturalWidth);
        const rH = maskH / Math.max(1, img.naturalHeight);
        const coverScale = Math.max(rW, rH) / Math.min(rW, rH);
        const scaleToFit = Math.max(1, coverScale * 1.03); // 3% margin

        history.set((prev) => prev.map((e) =>
          e.id === mockupId
            ? { ...e, mockupChildScale: scaleToFit, mockupChildX: 0, mockupChildY: 0 }
            : e,
        ));
      };
      img.src = src;
    }

    toast({ title: "🎯 Imagen insertada en Mockup", description: "Doble clic para re-encuadrar." });
  }, [currentElements, history]);

  const addSlide = () => {
    const newId = `new-${Date.now()}`;
    setSlideMeta((prev) => [...prev, { id: newId, type: "content" as const, image: undefined, backgroundColor: "#ffffff" }]);
    setSlidesElements((prev) => [...prev, [
      { id: uid(), type: "text", content: "Nueva Diapositiva", x: 80, y: 80, width: 800, height: 80, fontSize: 64, fontWeight: "800", color: "#0f172a", zIndex: 1 },
      { id: uid(), type: "text", content: "Haz clic para editar", x: 80, y: 200, width: 800, height: 50, fontSize: 32, fontWeight: "400", color: "#64748b", zIndex: 2 },
    ]]);
    setActiveIdx(slideMeta.length);
  };

  /* ── Filmstrip CRUD ── */
  const duplicateSlide = (idx: number) => {
    const newId = `dup-${Date.now()}`;
    const clonedElements = (slidesElements[idx] ?? []).map((el) => ({ ...el, id: uid() }));
    const clonedMeta = { ...slideMeta[idx], id: newId };
    setSlideMeta((prev) => [...prev.slice(0, idx + 1), clonedMeta, ...prev.slice(idx + 1)]);
    setSlidesElements((prev) => [...prev.slice(0, idx + 1), clonedElements, ...prev.slice(idx + 1)]);
    setActiveIdx(idx + 1);
    toast({ title: "📋 Diapositiva duplicada" });
  };

  const deleteSlide = (idx: number) => {
    if (slideMeta.length <= 1) {
      toast({ title: "⚠️ No se puede eliminar", description: "Debe haber al menos una diapositiva." });
      return;
    }
    setSlideMeta((prev) => prev.filter((_, i) => i !== idx));
    setSlidesElements((prev) => prev.filter((_, i) => i !== idx));
    if (activeIdx >= idx && activeIdx > 0) setActiveIdx(activeIdx - 1);
    toast({ title: "🗑️ Diapositiva eliminada" });
  };

  const moveSlide = (idx: number, direction: "left" | "right") => {
    const newIdx = direction === "left" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= slideMeta.length) return;
    setSlideMeta((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
    setSlidesElements((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
    setActiveIdx(newIdx);
  };

  /* ── Background Color ── */
  const updateBackgroundColor = (color: string) => {
    setSlideMeta((prev) => prev.map((m, i) => i === activeIdx ? { ...m, backgroundColor: color } : m));
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
        const bgColor = slideMeta[i]?.backgroundColor ?? "#ffffff";
        container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:1920px;height:1080px;background:${bgColor};overflow:hidden;`;
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
        {hasSelection && !isBackgroundSelected && (
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

      {/* ── Background Format Bar ── */}
      <AnimatePresence>
        {isBackgroundSelected && !hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-12 bg-white border-b border-border/40 flex items-center px-4 gap-4 flex-shrink-0 z-10"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <PaintBucket size={14} />
              <span>Fondo de la diapositiva</span>
            </div>
            <div className="h-5 w-px bg-border/40" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">Color:</span>
              {COLORS_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => updateBackgroundColor(c)}
                  className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${slideMeta[activeIdx]?.backgroundColor === c ? "border-cyan-500 ring-2 ring-cyan-500/30" : "border-border/40"}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={slideMeta[activeIdx]?.backgroundColor ?? "#ffffff"}
                onChange={(e) => updateBackgroundColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-border/40"
                title="Custom color"
              />
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBackgroundSelected(false)}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <X size={14} />
            </Button>
          </motion.div>
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

        {/* ── Slide-out Panel (Templates / Brand / Mockups / Elements / GIFs) ── */}
        <AnimatePresence>
          {(activeTool === "templates" || activeTool === "brand" || activeTool === "mockups" || activeTool === "elements" || activeTool === "gifs") && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="bg-background border-r border-border/40 flex-shrink-0 overflow-hidden"
            >
              <div className="w-[260px] h-full overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b border-border/20">
                  <span className="text-xs font-bold text-foreground">
                    {activeTool === "brand" ? "Brand Hub" : activeTool === "mockups" ? "Mockups" : activeTool === "elements" ? "Elementos" : activeTool === "gifs" ? "GIFs" : "Plantillas"}
                  </span>
                  <button onClick={() => setActiveTool(null)} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"><X size={14} /></button>
                </div>
                {activeTool === "brand" ? (
                  <BrandPanel selectedIds={selectedIds} elements={currentElements} onUpdate={updateElement} />
                ) : activeTool === "mockups" ? (
                  <MockupsPanel onAddMockup={addMockup} />
                ) : activeTool === "elements" ? (
                  <ElementsPanel onAddShape={addShape} />
                ) : activeTool === "gifs" ? (
                  <GifsPanel onAddGif={addGif} />
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
                onDeselect={() => { setSelectedIds(new Set()); setEyedropperMode(false); setIsBackgroundSelected(true); }}
                backgroundColor={slideMeta[activeIdx]?.backgroundColor ?? "#ffffff"}
                onBackgroundClick={() => { setSelectedIds(new Set()); setIsBackgroundSelected(true); }}
                  eyedropperMode={eyedropperMode}
                  onImageClick={handleImageClick}
                  onMockupDrop={handleMockupDrop}
                  onMockupChildAdjust={handleMockupChildAdjust}
                  onNativeFileDrop={handleNativeFileDrop}
                  onMockupNativeFileDrop={handleMockupNativeFileDrop}
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
              <div
                key={meta.id}
                className="relative flex-shrink-0 group"
                style={{ width: 160, height: 90 }}
              >
                <button
                  onClick={() => setActiveIdx(i)}
                  className={`w-full h-full rounded-lg overflow-hidden border-2 transition-all duration-150 ${i === activeIdx ? "border-cyan-500 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/30" : "border-border/30 hover:border-primary/30"}`}
                >
                  <SlideThumbnail elements={slidesElements[i] ?? []} bgImage={meta.image} backgroundColor={meta.backgroundColor} />
                  <div className={`absolute top-1 left-1.5 text-[9px] font-bold rounded px-1 z-10 ${i === activeIdx ? "bg-cyan-500 text-slate-950" : "bg-black/40 text-white/70"}`}>{i + 1}</div>
                </button>
                {/* Hover Actions */}
                <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20 pointer-events-none group-hover:pointer-events-auto">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }}
                    className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={13} />
                  </button>
                  {i > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSlide(i, "left"); }}
                      className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      title="Mover a la izquierda"
                    >
                      <MoveLeft size={13} />
                    </button>
                  )}
                  {i < slideMeta.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSlide(i, "right"); }}
                      className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                      title="Mover a la derecha"
                    >
                      <MoveRight size={13} />
                    </button>
                  )}
                  {slideMeta.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSlide(i); }}
                      className="w-7 h-7 rounded-md bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
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
  slideMeta: { id: string; type: string; image?: string; backgroundColor?: string }[];
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
          <PresentationSlide elements={allElements[activeIdx] ?? []} bgImage={slideMeta[activeIdx]?.image} backgroundColor={slideMeta[activeIdx]?.backgroundColor} />
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
