import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Zap,
  FileText,
  Send,
  Layers,
  X,
  Image as ImageIcon,
  RotateCcw,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { SlideElement } from "./campaignData";
import { ScaledSlidePreview } from "@/components/agent/ScaledSlidePreview";

const BASE_URL = "https://dollar-privacy-above-would.trycloudflare.com";

/* ── Helpers ─────────────────────────────────────────────── */

type Attachment = { id: string; file: File; url: string };
type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  cta?: "open-editor";
};

interface ApiSlide {
  id: string;
  type: "cover" | "content" | "art";
  backgroundColor?: string;
  transition?: string;
  image?: string;
  elements: SlideElement[];
}

type Step = "welcome" | "interviewing" | "done";

const uid = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ── Component ───────────────────────────────────────────── */

interface Props {
  brandName?: string;
}

const BriefCreator = ({ brandName }: Props) => {
  const navigate = useNavigate();

  // Session
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<Step>("welcome");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      content: brandName
        ? `Listo. Voy a generar un brief para **"${brandName}"**. Arrastra logos/fotos de campaña aquí y cuéntame el objetivo.`
        : "Hola. Soy tu **Agente Estratega**. Arrastra logos/fotos aquí y cuéntame el producto y a quién queremos venderle.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Uploads
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Presentation
  const [presentation, setPresentation] = useState<ApiSlide[] | null>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* ── Upload file to backend ──────────────────────────── */
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE_URL}/api/v1/agent/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      return data.url as string;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }, []);

  /* ── Add files from drag/drop or input ───────────────── */
  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;

      // Show local previews
      const newAttachments: Attachment[] = list.map((file) => ({
        id: uid(),
        file,
        url: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newAttachments].slice(0, 10));

      // Upload each to backend
      for (const file of list) {
        const serverUrl = await uploadFile(file);
        if (serverUrl) {
          if (!logoUrl) setLogoUrl(serverUrl);
          setUploadedImages((prev) => [...prev, serverUrl]);

          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "system",
              content: `📎 Archivo subido: **${file.name}**`,
            },
          ]);
        }
      }
    },
    [logoUrl, uploadFile],
  );

  /* ── Drag & Drop handlers ────────────────────────────── */
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
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((a) => a.id !== id);
    });
  };

  /* ── Send message ────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      images: attachments.length ? attachments.map((a) => a.url) : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    if (step === "welcome") setStep("interviewing");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);

      const res = await fetch(`${BASE_URL}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          logo_url: logoUrl,
          uploaded_images: uploadedImages.length ? uploadedImages : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      // Assistant reply
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.reply || "...",
          cta: data.status === "done" ? "open-editor" : undefined,
        },
      ]);

      // Presentation
      if (
        data.status === "done" &&
        Array.isArray(data.presentation) &&
        data.presentation.length > 0
      ) {
        setPresentation(data.presentation);
        setStep("done");
      }
    } catch (err: any) {
      const errorText =
        err.name === "AbortError"
          ? "La solicitud tardó demasiado. Intenta de nuevo."
          : `Hubo un error: ${err.message || "intenta de nuevo"}`;
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: errorText },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, attachments, sessionId, logoUrl, uploadedImages, step]);

  /* ── Reset session ───────────────────────────────────── */
  const handleReset = useCallback(async () => {
    try {
      await fetch(`${BASE_URL}/api/v1/agent/session/${sessionId}`, {
        method: "DELETE",
      });
    } catch {}
    window.location.reload();
  }, [sessionId]);

  /* ── Open editor ─────────────────────────────────────── */
  const handleOpenEditor = useCallback(() => {
    if (!presentation) return;
    const id = `agent-${Date.now()}`;
    const draft = {
      docTitle: brandName ? `${brandName} — Brief` : "Brief Estratégico",
      slidesElements: presentation.map((s) => s.elements),
      slideMeta: presentation.map((s) => ({
        id: s.id,
        type: s.type,
        image: s.image,
        backgroundColor: s.backgroundColor,
        transition: s.transition || "fade",
      })),
    };
    sessionStorage.setItem(`presentation_draft_${id}`, JSON.stringify(draft));
    navigate(`/editor/${id}`);
  }, [presentation, brandName, navigate]);

  /* ── Slide count label ───────────────────────────────── */
  const slideLabel = useMemo(() => {
    if (!presentation) return null;
    return `${presentation.length} slide${presentation.length !== 1 ? "s" : ""}`;
  }, [presentation]);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[70vh]"
    >
      {/* ═══ LEFT: Agent Chat ═══ */}
      <Card
        className="bg-card/60 border-border/40 flex flex-col overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Se suben al servidor y se incluyen en tu brief
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agente Estratega</h3>
            <p className="text-[11px] text-muted-foreground">
              {brandName ? `Contexto: ${brandName}` : "Powered by NexusAI"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              title="Reiniciar sesión"
            >
              <RotateCcw size={12} />
              <span>Reiniciar</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : msg.role === "system"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                {msg.role === "system" ? (
                  <p className="text-xs text-muted-foreground bg-secondary/30 rounded-full px-3 py-1">
                    {msg.content}
                  </p>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-3 ${
                      msg.role === "assistant"
                        ? "bg-secondary/60 text-foreground/90 rounded-tl-md"
                        : "bg-primary/15 text-primary border border-primary/20 rounded-tr-md"
                    }`}
                  >
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {msg.images?.length ? (
                      <div className="grid grid-cols-3 gap-2">
                        {msg.images.slice(0, 6).map((src) => (
                          <div
                            key={src}
                            className="aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/20"
                          >
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover"
                              draggable={false}
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {msg.cta === "open-editor" && (
                      <Button onClick={handleOpenEditor} className="w-full h-12 text-sm font-semibold">
                        Abrir en el Editor Avanzado
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-secondary/60 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Attachments strip */}
        {attachments.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="relative w-16 h-16 rounded-xl overflow-hidden border border-border/50 bg-muted/20 shrink-0"
                >
                  <img
                    src={a.url}
                    alt={a.file.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 border border-border/60 flex items-center justify-center"
                  >
                    <X size={14} className="text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border/40">
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Subir imagen"
            >
              <Upload size={16} />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu mensaje… (Enter para enviar)"
              disabled={isLoading}
              className="bg-secondary/30 border-border/30 text-sm min-h-11 max-h-28 resize-none placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-11 w-11 shrink-0"
              size="icon"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* ═══ RIGHT: Live Document ═══ */}
      <Card className="bg-card/60 border-border/40 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <FileText size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Documento Vivo</h3>
            <p className="text-[11px] text-muted-foreground">Render read-only (motor del Editor)</p>
          </div>
          {presentation && (
            <div className="ml-auto flex items-center gap-1.5">
              <Layers size={13} className="text-primary" />
              <span className="text-[10px] text-primary font-medium">{slideLabel}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!presentation ? (
            <div className="rounded-2xl border border-border/40 bg-secondary/10 p-5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Esperando generación</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Envía tu mensaje para activar los slides en tiempo real.
              </p>

              {isLoading && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs text-primary font-medium">Procesando con IA…</p>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full bg-muted/30" />
                    <Skeleton className="h-3 w-4/5 bg-muted/20" />
                    <Skeleton className="h-3 w-3/5 bg-muted/20" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {presentation.map((slide, i) => (
                <div key={slide.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Slide {i + 1}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{slide.type}</p>
                  </div>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/50 bg-muted/10">
                    <ScaledSlidePreview
                      elements={slide.elements || []}
                      bgImage={slide.image}
                      backgroundColor={slide.backgroundColor}
                      className="absolute inset-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BriefCreator;
