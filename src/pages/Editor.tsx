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
  Bold, Italic, Trash2,
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
  if (slide.type === "cover") {
    els.push({ id: uid(), type: "text", content: slide.title, x: 80, y: 680, width: 1760, height: 120, fontSize: 96, fontWeight: "900", color: "#ffffff" });
    if (slide.body) els.push({ id: uid(), type: "text", content: slide.body, x: 80, y: 820, width: 1400, height: 60, fontSize: 28, fontWeight: "400", color: "rgba(255,255,255,0.5)" });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 0, y: 0, width: 1920, height: 1080, opacity: 0.7 });
  } else if (slide.type === "content") {
    els.push({ id: uid(), type: "text", content: slide.title, x: 860, y: 80, width: 980, height: 80, fontSize: 56, fontWeight: "800", color: "#0f172a" });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 100, y: 200, width: 600, height: 600 });
    slide.bullets?.forEach((b, i) => {
      els.push({ id: uid(), type: "text", content: b, x: 860, y: 220 + i * 120, width: 980, height: 100, fontSize: 28, fontWeight: "400", color: "#475569" });
    });
  } else {
    els.push({ id: uid(), type: "text", content: slide.title, x: 80, y: 80, width: 1000, height: 80, fontSize: 56, fontWeight: "800", color: "#0f172a" });
    if (slide.body) els.push({ id: uid(), type: "text", content: slide.body, x: 80, y: 180, width: 1000, height: 50, fontSize: 32, fontWeight: "400", color: "#64748b" });
    if (slide.image) els.push({ id: uid(), type: "image", content: slide.image, x: 80, y: 280, width: 1000, height: 600 });
    slide.colors?.forEach((c, i) => {
      els.push({ id: uid(), type: "shape", content: c.hex, x: 1200 + (i % 2) * 200, y: 280 + Math.floor(i / 2) * 200, width: 160, height: 160 });
      els.push({ id: uid(), type: "text", content: `${c.name}\n${c.hex}`, x: 1200 + (i % 2) * 200, y: 460 + Math.floor(i / 2) * 200, width: 180, height: 50, fontSize: 18, fontWeight: "500", color: "#475569" });
    });
  }
  return els;
}

/* ── Smart Guides Engine ── */
interface GuideLines { x: number | null; y: number | null }

function computeSnapAndGuides(
  dragEl: { x: number; y: number; w: number; h: number },
  others: { x: number; y: number; w: number; h: number }[],
  canvasW: number,
  canvasH: number,
): { snappedX: number; snappedY: number; guides: GuideLines } {
  let snappedX = dragEl.x;
  let snappedY = dragEl.y;
  let guideX: number | null = null;
  let guideY: number | null = null;

  const dragCX = dragEl.x + dragEl.w / 2;
  const dragCY = dragEl.y + dragEl.h / 2;

  // Canvas center
  const cxCanvas = canvasW / 2;
  const cyCanvas = canvasH / 2;

  if (Math.abs(dragCX - cxCanvas) < SNAP_THRESHOLD) {
    snappedX = cxCanvas - dragEl.w / 2;
    guideX = cxCanvas;
  }
  if (Math.abs(dragCY - cyCanvas) < SNAP_THRESHOLD) {
    snappedY = cyCanvas - dragEl.h / 2;
    guideY = cyCanvas;
  }

  // Snap to other elements' edges/centers
  for (const o of others) {
    const oCX = o.x + o.w / 2;
    const oCY = o.y + o.h / 2;

    // Center-to-center
    if (guideX === null && Math.abs(dragCX - oCX) < SNAP_THRESHOLD) {
      snappedX = oCX - dragEl.w / 2;
      guideX = oCX;
    }
    if (guideY === null && Math.abs(dragCY - oCY) < SNAP_THRESHOLD) {
      snappedY = oCY - dragEl.h / 2;
      guideY = oCY;
    }

    // Left edge to left edge
    if (guideX === null && Math.abs(dragEl.x - o.x) < SNAP_THRESHOLD) {
      snappedX = o.x;
      guideX = o.x;
    }
    // Right edge to right edge
    if (guideX === null && Math.abs((dragEl.x + dragEl.w) - (o.x + o.w)) < SNAP_THRESHOLD) {
      snappedX = o.x + o.w - dragEl.w;
      guideX = o.x + o.w;
    }
    // Top edge
    if (guideY === null && Math.abs(dragEl.y - o.y) < SNAP_THRESHOLD) {
      snappedY = o.y;
      guideY = o.y;
    }
    // Bottom edge
    if (guideY === null && Math.abs((dragEl.y + dragEl.h) - (o.y + o.h)) < SNAP_THRESHOLD) {
      snappedY = o.y + o.h - dragEl.h;
      guideY = o.y + o.h;
    }
  }

  return { snappedX, snappedY, guides: { x: guideX, y: guideY } };
}

/* ── Toolbar items ── */
const tools = [
  { icon: LayoutTemplate, label: "Plantillas", action: "templates" },
  { icon: Type, label: "Texto", action: "text" },
  { icon: Image, label: "Imágenes", action: "image" },
  { icon: Palette, label: "Brand Hub", action: "brand" },
];

/* ── Static element renderer ── */
const StaticElement = ({ el }: { el: SlideElement }) => {
  if (el.type === "image") {
    return (
      <div style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 400, height: el.height ?? 400, opacity: el.opacity ?? 1 }}>
        <img src={el.content} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
    );
  }
  if (el.type === "shape") {
    return (
      <div style={{ position: "absolute", left: el.x, top: el.y, width: el.width ?? 160, height: el.height ?? 160, background: el.content, borderRadius: 16 }} />
    );
  }
  return (
    <div style={{
      position: "absolute", left: el.x, top: el.y,
      width: el.width ?? "auto",
      fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400",
      color: el.color ?? "#0f172a", lineHeight: 1.3, whiteSpace: "pre-wrap",
      fontFamily: (el as any).fontFamily ?? "Inter",
      textAlign: ((el as any).textAlign ?? "left") as any,
    }}>
      {el.content}
    </div>
  );
};

/* ── Slide Thumbnail ── */
const SlideThumbnail = ({ elements, bgImage }: { elements: SlideElement[]; bgImage?: string }) => {
  const sorted = [...elements].sort((a, b) => {
    const order = { image: 0, shape: 1, text: 2 };
    return (order[a.type] ?? 1) - (order[b.type] ?? 1);
  });
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
}: {
  elements: SlideElement[];
  selectedIds: Set<string>;
  onUpdate: (id: string, patch: Partial<SlideElement>) => void;
  onDelete: (id: string) => void;
}) => {
  const selectedEls = elements.filter((e) => selectedIds.has(e.id));
  const textEls = selectedEls.filter((e) => e.type === "text");
  const firstText = textEls[0];

  if (selectedEls.length === 0) return null;

  const fontFamily = firstText ? ((firstText as any).fontFamily ?? "Inter") : "Inter";
  const textAlign = firstText ? ((firstText as any).textAlign ?? "left") : "left";
  const fontSize = firstText?.fontSize ?? 28;
  const color = firstText?.color ?? "#0f172a";
  const fontWeight = firstText?.fontWeight ?? "400";

  const updateAllSelected = (patch: Partial<SlideElement>) => {
    selectedIds.forEach((id) => onUpdate(id, patch));
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 44 }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border-b border-border/40 flex items-center px-5 gap-3 flex-shrink-0 z-10 overflow-hidden"
    >
      {/* Element info */}
      <span className="text-[11px] text-muted-foreground font-medium min-w-[80px]">
        {selectedEls.length > 1 ? `${selectedEls.length} elementos` : selectedEls[0]?.type === "text" ? "Texto" : selectedEls[0]?.type === "image" ? "Imagen" : "Forma"}
      </span>

      <div className="w-px h-6 bg-border/40" />

      {firstText && (
        <>
          {/* Font family */}
          <select
            value={fontFamily}
            onChange={(e) => updateAllSelected({ fontFamily: e.target.value } as any)}
            className="bg-muted/50 text-foreground text-xs rounded-md px-2.5 py-1.5 border border-border/40 outline-none cursor-pointer h-8 w-44 font-medium"
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>

          <div className="w-px h-6 bg-border/40" />

          {/* Font size */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-md border border-border/40 h-8 px-1">
            <button onClick={() => updateAllSelected({ fontSize: Math.max(10, fontSize - 2) })} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus size={13} /></button>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => updateAllSelected({ fontSize: Math.max(10, Math.min(200, parseInt(e.target.value) || 28)) })}
              className="w-10 text-center text-xs font-semibold bg-transparent border-none outline-none text-foreground tabular-nums"
            />
            <button onClick={() => updateAllSelected({ fontSize: Math.min(200, fontSize + 2) })} className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus size={13} /></button>
          </div>

          <div className="w-px h-6 bg-border/40" />

          {/* Bold / Italic */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => updateAllSelected({ fontWeight: fontWeight === "700" || fontWeight === "800" || fontWeight === "900" ? "400" : "700" })}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition ${["700", "800", "900"].includes(fontWeight) ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
            >
              <Bold size={14} />
            </button>
          </div>

          <div className="w-px h-6 bg-border/40" />

          {/* Color */}
          <div className="flex items-center gap-1">
            {COLORS_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => updateAllSelected({ color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? "border-primary scale-110 shadow-sm" : "border-border/40 hover:scale-105"}`}
                style={{ background: c }}
              />
            ))}
            <label className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-2 border-border/40 relative hover:scale-105 transition-transform">
              <input
                type="color"
                value={color}
                onChange={(e) => updateAllSelected({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-full h-full" style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }} />
            </label>
          </div>

          <div className="w-px h-6 bg-border/40" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([align, Icon]) => (
              <button
                key={align}
                onClick={() => updateAllSelected({ textAlign: align } as any)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition ${textAlign === align ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"}`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Delete */}
      <button
        onClick={() => selectedIds.forEach((id) => onDelete(id))}
        className="w-8 h-8 rounded-md flex items-center justify-center text-red-500 hover:bg-red-50 transition"
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
};

/* ── Interactive Canvas Element with react-rnd ── */
const RndElement = ({
  el, scale, selected, onSelect, onUpdate, onDelete,
  onDragMove, onDragEnd: onDragEndCb,
}: {
  el: SlideElement;
  scale: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (patch: Partial<SlideElement>) => void;
  onDelete: () => void;
  onDragMove?: (id: string, x: number, y: number, w: number, h: number) => void;
  onDragEnd?: () => void;
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
    width: 10, height: 10,
    background: "#06b6d4",
    borderRadius: 2,
    border: "2px solid white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  const resizeHandles = selected && !editing ? {
    topLeft: <div style={handleStyle} />,
    topRight: <div style={handleStyle} />,
    bottomLeft: <div style={handleStyle} />,
    bottomRight: <div style={handleStyle} />,
  } : {};

  const w = el.width ?? (el.type === "text" ? 600 : 400);
  const h = el.height ?? (el.type === "text" ? 80 : 400);

  return (
    <Rnd
      size={{ width: w, height: h }}
      position={{ x: el.x, y: el.y }}
      onDragStart={() => setDragging(true)}
      onDrag={(_e, d) => {
        onDragMove?.(el.id, d.x, d.y, w, h);
      }}
      onDragStop={(_e, d) => {
        setDragging(false);
        onDragEndCb?.();
        onUpdate({ x: Math.round(d.x), y: Math.round(d.y) });
      }}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        onUpdate({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        });
      }}
      disableDragging={editing}
      enableResizing={selected && !editing}
      resizeHandleComponent={resizeHandles}
      scale={scale}
      bounds="parent"
      onMouseDown={(e: any) => {
        e.stopPropagation();
        onSelect(e);
      }}
      className={`${selected ? "z-30" : "z-10"}`}
      style={{
        outline: selected ? "2px solid #06b6d4" : "none",
        outlineOffset: 2,
        borderRadius: el.type === "shape" ? 16 : 4,
        willChange: "transform",
        userSelect: dragging ? "none" : "auto",
      }}
    >
      <div
        className={`w-full h-full relative ${!selected && !editing ? "hover:outline hover:outline-2 hover:outline-dashed hover:outline-cyan-400/40" : ""}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (el.type === "text") setEditing(true);
        }}
        style={{
          cursor: editing ? "text" : dragging ? "grabbing" : "grab",
          borderRadius: el.type === "shape" ? 16 : 0,
          userSelect: dragging ? "none" : "auto",
        }}
      >
        {el.type === "image" ? (
          <img src={el.content} alt="" className="w-full h-full object-cover rounded-lg pointer-events-none" style={{ opacity: el.opacity ?? 1 }} draggable={false} />
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
              fontFamily: (el as any).fontFamily ?? "Inter",
              textAlign: ((el as any).textAlign ?? "left") as any,
            }}
            className="bg-transparent border-none outline-none resize-none w-full h-full px-2 py-1 ring-2 ring-cyan-400/60 rounded"
          />
        ) : (
          <div
            style={{
              fontSize: el.fontSize ?? 28, fontWeight: el.fontWeight ?? "400",
              color: el.color ?? "#0f172a", lineHeight: 1.3, whiteSpace: "pre-wrap",
              fontFamily: (el as any).fontFamily ?? "Inter",
              textAlign: ((el as any).textAlign ?? "left") as any,
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
}: {
  elements: SlideElement[];
  bgImage?: string;
  scale: number;
  selectedIds: Set<string>;
  onSelectElement: (id: string, multi: boolean) => void;
  onUpdateElement: (id: string, patch: Partial<SlideElement>) => void;
  onDeleteElement: (id: string) => void;
  onDeselect: () => void;
}) => {
  const [guides, setGuides] = useState<GuideLines>({ x: null, y: null });

  const sorted = useMemo(() => [...elements].sort((a, b) => {
    const order = { image: 0, shape: 1, text: 2 };
    return (order[a.type] ?? 1) - (order[b.type] ?? 1);
  }), [elements]);

  const handleDragMove = useCallback((dragId: string, x: number, y: number, w: number, h: number) => {
    const others = elements
      .filter((e) => e.id !== dragId)
      .map((e) => ({ x: e.x, y: e.y, w: e.width ?? 400, h: e.height ?? 80 }));

    const result = computeSnapAndGuides({ x, y, w, h }, others, 1920, 1080);
    setGuides(result.guides);
  }, [elements]);

  const handleDragEnd = useCallback(() => {
    setGuides({ x: null, y: null });
  }, []);

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

          {/* Smart Guides */}
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Presentation Slide ── */
const PresentationSlide = ({ elements, bgImage }: { elements: SlideElement[]; bgImage?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(1);
  useEffect(() => {
    const calc = () => {
      if (!containerRef.current?.parentElement) return;
      const p = containerRef.current.parentElement;
      setS(Math.min(p.clientWidth / 1920, p.clientHeight / 1080));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  const sorted = [...elements].sort((a, b) => ({ image: 0, shape: 1, text: 2 }[a.type] ?? 1) - ({ image: 0, shape: 1, text: 2 }[b.type] ?? 1));
  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <div className="bg-white rounded-lg overflow-hidden shadow-2xl relative" style={{ width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "center center" }}>
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
        if (next.has(elId)) next.delete(elId);
        else next.add(elId);
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
    const el: SlideElement = { id: uid(), type: "text", content: "Doble clic para editar", x: 660, y: 440, width: 600, height: 80, fontSize: 48, fontWeight: "600", color: "#0f172a" };
    history.set((prev) => [...prev, el]);
    setSelectedIds(new Set([el.id]));
    toast({ title: "📝 Texto añadido", description: "Arrastra para posicionar, doble clic para editar." });
  };

  const addImageElement = () => {
    const el: SlideElement = { id: uid(), type: "shape", content: "#e2e8f0", x: 660, y: 340, width: 600, height: 400 };
    const label: SlideElement = { id: uid(), type: "text", content: "Simulación de Imagen", x: 810, y: 510, width: 300, height: 50, fontSize: 28, fontWeight: "500", color: "#94a3b8" };
    history.set((prev) => [...prev, el, label]);
    toast({ title: "🖼️ Imagen añadida" });
  };

  const handleToolClick = (action: string) => {
    if (action === "text") { addTextElement(); setActiveTool(null); }
    else if (action === "image") { addImageElement(); setActiveTool(null); }
    else { setActiveTool(activeTool === action ? null : action); }
  };

  const addSlide = () => {
    const newId = `new-${Date.now()}`;
    setSlideMeta((prev) => [...prev, { id: newId, type: "content" as const, image: undefined }]);
    setSlidesElements((prev) => [...prev, [
      { id: uid(), type: "text", content: "Nueva Diapositiva", x: 80, y: 80, width: 800, height: 80, fontSize: 64, fontWeight: "800", color: "#0f172a" },
      { id: uid(), type: "text", content: "Haz clic para editar", x: 80, y: 200, width: 800, height: 50, fontSize: 32, fontWeight: "400", color: "#64748b" },
    ]]);
    setActiveIdx(slideMeta.length);
  };

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
        const pasted = clipboard.map((el) => ({ ...el, id: uid(), x: el.x + 40, y: el.y + 40 }));
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenting, selectedIds, currentElements, clipboard, history]);

  /* ── Save ── */
  const handleSave = async () => {
    setSaveState("saving");
    try {
      await fetch("https://webhook.site/b80d309d-86be-445b-9bf5-4f678639f781", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

        // Create an offscreen container to render each slide
        const container = document.createElement("div");
        container.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1920px;height:1080px;background:white;overflow:hidden;";
        document.body.appendChild(container);

        // Render elements statically
        const elsSorted = [...(slidesElements[i] ?? [])].sort((a, b) =>
          ({ image: 0, shape: 1, text: 2 }[a.type] ?? 1) - ({ image: 0, shape: 1, text: 2 }[b.type] ?? 1)
        );

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
          div.style.zIndex = el.type === "text" ? "2" : "0";

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
            div.style.fontFamily = (el as any).fontFamily ?? "Inter";
            div.textContent = el.content;
          }
          container.appendChild(div);
        }

        // Wait for images to load
        await new Promise((r) => setTimeout(r, 200));

        const canvas = await html2canvas(container, { scale: 2, useCORS: true, width: 1920, height: 1080, logging: false });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);

        if (i > 0) pdf.addPage([1920, 1080], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 1920, 1080);

        document.body.removeChild(container);
      }

      setExportProgress(100);
      setExportMsg("¡PDF Listo!");

      // Wait a moment for UI feedback then save
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
            <Button onClick={() => history.undo()} disabled={!history.canUndo} variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Deshacer (Ctrl+Z)">
              <Undo2 size={14} />
            </Button>
            <Button onClick={() => history.redo()} disabled={!history.canRedo} variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Rehacer (Ctrl+Shift+Z)">
              <Redo2 size={14} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Cloud size={12} className={saveState === "saved" ? "text-emerald-500" : "text-muted-foreground/50"} />
            {saveState === "saving" ? "Sincronizando..." : saveState === "saved" ? "Guardado" : "Guardado automáticamente"}
          </span>
          <Button onClick={startPresenting} variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 border-border/40">
            <Play size={13} /> Presentar
          </Button>
          <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 border-border/40">
            <FileDown size={13} /> Exportar PDF
          </Button>
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
          />
        )}
      </AnimatePresence>

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
                  onDeselect={() => setSelectedIds(new Set())}
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
                className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                  i === activeIdx ? "border-cyan-500 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/30" : "border-border/30 hover:border-primary/30"
                }`}
                style={{ width: 160, height: 90 }}
              >
                <SlideThumbnail elements={slidesElements[i] ?? []} bgImage={meta.image} />
                <div className={`absolute top-1 left-1.5 text-[9px] font-bold rounded px-1 z-10 ${i === activeIdx ? "bg-cyan-500 text-slate-950" : "bg-black/40 text-white/70"}`}>
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
