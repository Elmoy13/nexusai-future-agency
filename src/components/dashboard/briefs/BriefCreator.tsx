import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Zap, FileText, Send, Layers, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SlideElement } from "./campaignData";
import { ScaledSlidePreview } from "@/components/agent/ScaledSlidePreview";

type Attachment = {
  id: string;
  file: File;
  url: string;
};

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  text?: string;
  images?: string[];
  cta?: "open-editor";
};

type PresentationDraft = {
  docTitle: string;
  slidesElements: SlideElement[][];
  slideMeta: { id: string; type: "cover" | "content" | "visual"; image?: string; backgroundColor?: string; transition: "fade" }[];
};

const uid = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createDraftFromImages = (opts: { brandName?: string; images: string[] }): PresentationDraft => {
  const brand = opts.brandName?.trim() || "Nueva Marca";
  const imgA = opts.images[0];
  const imgB = opts.images[1] ?? opts.images[0];
  const imgC = opts.images[2] ?? opts.images[0];

  const fg = "hsl(var(--foreground))";
  const bg = "hsl(var(--background))";
  const pf = "hsl(var(--primary-foreground))";

  const slidesElements: SlideElement[][] = [
    // 1) Cover
    [
      {
        id: uid(),
        type: "text",
        content: `${brand}\nBrief Estratégico`,
        x: 120,
        y: 680,
        width: 1680,
        height: 220,
        zIndex: 2,
        fontSize: 92 as any,
        fontWeight: "900" as any,
        color: pf as any,
      } as any,
      {
        id: uid(),
        type: "text",
        content: "3 slides generadas desde tu input + tus imágenes",
        x: 120,
        y: 910,
        width: 1500,
        height: 60,
        zIndex: 3,
        fontSize: 30 as any,
        fontWeight: "500" as any,
        color: "hsl(var(--primary-foreground) / 0.75)" as any,
      } as any,
    ],

    // 2) Content
    [
      {
        id: uid(),
        type: "text",
        content: "Insight clave",
        x: 120,
        y: 110,
        width: 1680,
        height: 80,
        zIndex: 2,
        fontSize: 64 as any,
        fontWeight: "900" as any,
        color: fg as any,
      } as any,
      {
        id: uid(),
        type: "shape",
        content: "hsl(var(--primary) / 0.16)",
        x: 120,
        y: 220,
        width: 760,
        height: 740,
        zIndex: 0,
      } as any,
      ...(imgB
        ? ([
            {
              id: uid(),
              type: "image",
              content: imgB,
              x: 140,
              y: 260,
              width: 720,
              height: 520,
              zIndex: 1,
            } as any,
          ] as SlideElement[])
        : []),
      {
        id: uid(),
        type: "text",
        content: "• Propuesta de valor: claridad + consistencia\n• Mensaje: técnico, humano, sin ruido\n• Próximo paso: iterar el tono con ejemplos",
        x: 960,
        y: 260,
        width: 840,
        height: 520,
        zIndex: 2,
        fontSize: 34 as any,
        fontWeight: "500" as any,
        color: "hsl(var(--foreground) / 0.78)" as any,
      } as any,
    ],

    // 3) Visual / Palette
    [
      {
        id: uid(),
        type: "text",
        content: "Look & Feel (propuesta)",
        x: 120,
        y: 110,
        width: 1680,
        height: 80,
        zIndex: 2,
        fontSize: 64 as any,
        fontWeight: "900" as any,
        color: fg as any,
      } as any,
      ...(imgC
        ? ([
            {
              id: uid(),
              type: "image",
              content: imgC,
              x: 120,
              y: 220,
              width: 980,
              height: 740,
              zIndex: 1,
            } as any,
          ] as SlideElement[])
        : []),
      {
        id: uid(),
        type: "shape",
        content: "hsl(var(--primary))",
        x: 1160,
        y: 260,
        width: 620,
        height: 150,
        zIndex: 0,
      } as any,
      {
        id: uid(),
        type: "shape",
        content: "hsl(var(--secondary))",
        x: 1160,
        y: 440,
        width: 620,
        height: 150,
        zIndex: 0,
      } as any,
      {
        id: uid(),
        type: "shape",
        content: "hsl(var(--accent))",
        x: 1160,
        y: 620,
        width: 620,
        height: 150,
        zIndex: 0,
      } as any,
      {
        id: uid(),
        type: "shape",
        content: "hsl(var(--muted))",
        x: 1160,
        y: 800,
        width: 620,
        height: 150,
        zIndex: 0,
      } as any,
      {
        id: uid(),
        type: "text",
        content: "Primary\nSecondary\nAccent\nMuted",
        x: 1200,
        y: 292,
        width: 560,
        height: 800,
        zIndex: 2,
        fontSize: 34 as any,
        fontWeight: "800" as any,
        color: "hsl(var(--foreground) / 0.85)" as any,
      } as any,
    ],
  ];

  const slideMeta: PresentationDraft["slideMeta"] = [
    { id: uid(), type: "cover", image: imgA, backgroundColor: bg, transition: "fade" },
    { id: uid(), type: "content", image: undefined, backgroundColor: bg, transition: "fade" },
    { id: uid(), type: "visual", image: undefined, backgroundColor: bg, transition: "fade" },
  ];

  return {
    docTitle: `${brand} — Brief` ,
    slidesElements,
    slideMeta,
  };
};

interface Props {
  brandName?: string;
}

const BriefCreator = ({ brandName }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resolvedBrand = brandName ?? (searchParams.get("brand") ?? undefined);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "agent",
      text: resolvedBrand
        ? `Listo. Voy a generar un brief para “${resolvedBrand}”. Arrastra logos/fotos de campaña aquí y cuéntame el objetivo.`
        : "Hola. Soy tu Agente Estratega. Arrastra logos/fotos aquí y cuéntame el producto y a quién queremos venderle.",
    },
  ]);

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [draft, setDraft] = useState<PresentationDraft | null>(null);

  const allAttachedUrls = useMemo(() => attachments.map((a) => a.url), [attachments]);

  useEffect(() => {
    return () => {
      // Cleanup any unsent previews
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const images = list.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    setAttachments((prev) => {
      const next = [...prev];
      for (const file of images) {
        const url = URL.createObjectURL(file);
        next.push({ id: uid(), file, url });
      }
      return next.slice(0, 10);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const toRemove = prev.find((a) => a.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const images = allAttachedUrls;

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: text || undefined, images: images.length ? images : undefined },
    ]);

    setInput("");
    setAttachments([]);

    setIsGenerating(true);
    setGenerationStep(0);
    setDraft(null);

    const steps = [1, 2, 3];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setGenerationStep(step);

        if (step === 3) {
          // “Efecto magia”: generamos JSON e inyectamos al estado
          const built = createDraftFromImages({ brandName: resolvedBrand, images });
          setDraft(built);

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: "agent",
                text: "¡Brief generado! ¿Qué te parece?",
                cta: "open-editor",
              },
            ]);
            setIsGenerating(false);
          }, 500);
        }
      }, (i + 1) * 900);
    });
  };

  const handleOpenEditor = () => {
    if (!draft) return;

    const id = `agent-${Date.now()}`;
    sessionStorage.setItem(`presentation_draft_${id}`, JSON.stringify(draft));
    navigate(`/editor/${id}`);
  };

  const generatingLabel = useMemo(() => {
    if (!isGenerating) return null;
    if (generationStep <= 1) return "Analizando contexto…";
    if (generationStep === 2) return "Estructurando slides…";
    return "Renderizando Documento Vivo…";
  }, [generationStep, isGenerating]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[70vh]"
    >
      {/* LEFT: Agent Chat */}
      <Card
        className="bg-card/60 border-border/40 flex flex-col overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="rounded-2xl border border-border/60 bg-card/70 px-6 py-5 text-center shadow-lg">
                <div className="mx-auto w-12 h-12 rounded-xl border border-border/60 bg-secondary/40 flex items-center justify-center mb-3">
                  <ImageIcon size={20} className="text-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Suelta tus imágenes aquí</p>
                <p className="text-xs text-muted-foreground mt-1">Se previsualizan y se envían junto a tu mensaje</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agente Estratega</h3>
            <p className="text-[11px] text-muted-foreground">{resolvedBrand ? `Contexto: ${resolvedBrand}` : "Powered by NexusAI"}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary font-medium">Online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-3 ${
                    msg.role === "agent"
                      ? "bg-secondary/60 text-foreground/90 rounded-tl-md"
                      : "bg-primary/15 text-primary border border-primary/20 rounded-tr-md"
                  }`}
                >
                  {msg.text ? <div className="whitespace-pre-wrap">{msg.text}</div> : null}

                  {msg.images?.length ? (
                    <div className="grid grid-cols-3 gap-2">
                      {msg.images.slice(0, 6).map((src) => (
                        <div key={src} className="aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                          <img src={src} alt="" className="w-full h-full object-cover" draggable={false} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {msg.cta === "open-editor" ? (
                    <Button
                      onClick={handleOpenEditor}
                      className="w-full h-12 text-sm font-semibold"
                    >
                      Abrir en el Editor Avanzado
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Attachments strip (before send) */}
        {attachments.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {attachments.map((a) => (
                <div key={a.id} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border/50 bg-muted/20 shrink-0">
                  <img src={a.url} alt={a.file.name} className="w-full h-full object-cover" draggable={false} loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 border border-border/60 flex items-center justify-center"
                    title="Quitar"
                  >
                    <X size={14} className="text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border/40">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu mensaje… (Enter para enviar, Shift+Enter para salto)"
              className="bg-secondary/30 border-border/30 text-sm min-h-11 max-h-28 resize-none placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className="h-11 w-11 shrink-0"
              size="icon"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* RIGHT: Live Document */}
      <Card className="bg-card/60 border-border/40 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <FileText size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Documento Vivo</h3>
            <p className="text-[11px] text-muted-foreground">Render read-only (motor del Editor)</p>
          </div>
          {(isGenerating || draft) && (
            <div className="ml-auto flex items-center gap-1.5">
              <Layers size={13} className="text-primary" />
              <span className="text-[10px] text-primary font-medium">{draft ? "Listo" : "Generando…"}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!draft ? (
            <div className="rounded-2xl border border-border/40 bg-secondary/10 p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Esperando generación</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Envía tu mensaje (con imágenes) para activar las 3 slides en tiempo real.</p>

              {isGenerating ? (
                <div className="mt-5 space-y-3">
                  <p className="text-xs text-primary font-medium">{generatingLabel}</p>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full bg-muted/30" />
                    <Skeleton className="h-3 w-4/5 bg-muted/20" />
                    <Skeleton className="h-3 w-3/5 bg-muted/20" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              {draft.slidesElements.slice(0, 3).map((els, i) => {
                const meta = draft.slideMeta[i];
                return (
                  <div key={meta.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">Slide {i + 1}</p>
                      <p className="text-[10px] text-muted-foreground">{meta.type.toUpperCase()}</p>
                    </div>
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/50 bg-muted/10">
                      <ScaledSlidePreview
                        elements={els}
                        bgImage={meta.image}
                        backgroundColor={meta.backgroundColor}
                        className="absolute inset-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BriefCreator;
