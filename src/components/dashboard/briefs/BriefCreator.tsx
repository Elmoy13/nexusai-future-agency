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
  Check,
  Loader2,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import ReactMarkdown from "react-markdown";
import type { SlideElement } from "./campaignData";
import { ScaledSlidePreview } from "@/components/agent/ScaledSlidePreview";
import { useAgency } from "@/contexts/AgencyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  createBrief,
  getBrief,
  updateBrief,
  type BrandBrief,
  type BriefKind,
  type BriefPatch,
  type ChatMessage as DbChatMessage,
  type UploadedImage,
} from "@/lib/briefService";
import { createDraft } from "@/lib/draftService";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { apiCall, getAuthHeaders, API_URL } from "@/lib/apiClient";

const BASE_URL = "https://representative-tier-customize-bonus.trycloudflare.com";

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
type SaveStatus = "idle" | "saving" | "saved" | "error";

const uid = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/* ── Serialization helpers ──────────────────────────────── */
function toDbMessages(msgs: ChatMessage[]): DbChatMessage[] {
  return msgs.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: new Date().toISOString(),
    attachments: m.images,
    cta: m.cta,
  }));
}

function fromDbMessages(msgs: DbChatMessage[] | null | undefined): ChatMessage[] {
  if (!Array.isArray(msgs)) return [];
  return msgs.map((m) => ({
    id: uid(),
    role: m.role,
    content: m.content,
    images: m.attachments,
    cta: m.cta as "open-editor" | undefined,
  }));
}

/* ── Component ───────────────────────────────────────────── */

interface Props {
  /** Legacy — optional display hint when no brief is bootstrapped */
  brandName?: string;
  /** Required — controlled brief flow */
  briefId?: string;
  brandId?: string;
  kind?: BriefKind;
  /** Called after a brief is created so parent can sync URL */
  onBriefCreated?: (briefId: string) => void;
}

const BriefCreator = ({ brandName, briefId: briefIdProp, brandId, kind = "campaign", onBriefCreated }: Props) => {
  const navigate = useNavigate();
  const { currentAgencyId } = useAgency();
  const { user } = useAuth();

  // Brief lifecycle
  const [brief, setBrief] = useState<BrandBrief | null>(null);
  const [briefId, setBriefId] = useState<string | null>(briefIdProp ?? null);
  const [isHydrating, setIsHydrating] = useState<boolean>(!!briefIdProp || !!brandId);
  const [resolvedBrandName, setResolvedBrandName] = useState<string | undefined>(brandName);

  // Session
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [step, setStep] = useState<Step>("welcome");

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Uploads
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedImageObjs, setUploadedImageObjs] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Presentation
  const [presentation, setPresentation] = useState<ApiSlide[] | null>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* ── Bootstrap brief: hydrate or create ──────────────── */
  useEffect(() => {
    if (briefId && brief?.id === briefId) return;
    if (!briefIdProp && !brandId) {
      // Legacy standalone usage (Agent.tsx) — no persistence
      setIsHydrating(false);
      if (messages.length === 0) {
        setMessages([
          {
            id: uid(),
            role: "assistant",
            content: brandName
              ? `Listo. Voy a generar un brief para **"${brandName}"**. Arrastra logos/fotos y cuéntame el objetivo.`
              : "Hola. Soy tu **Agente Estratega**. Arrastra logos/fotos aquí y cuéntame el producto y a quién queremos venderle.",
          },
        ]);
      }
      return;
    }

    let cancelled = false;
    (async () => {
      setIsHydrating(true);
      try {
        let target: BrandBrief | null = null;
        if (briefIdProp) {
          target = await getBrief(briefIdProp);
          if (!target) throw new Error("No se encontró el brief");
        } else if (brandId && currentAgencyId && user) {
          target = await createBrief({
            agencyId: currentAgencyId,
            brandId,
            kind,
            userId: user.id,
          });
          onBriefCreated?.(target.id);
        }

        if (cancelled || !target) return;

        // Hydrate states
        setBrief(target);
        setBriefId(target.id);
        setSessionId(target.session_id ?? crypto.randomUUID());
        const dbMsgs = fromDbMessages(target.chat_messages);
        const imgs = Array.isArray(target.uploaded_images) ? target.uploaded_images : [];
        const urls = imgs.map((i) => i.url);
        setUploadedImages(urls);
        setUploadedImageObjs(imgs);
        if (urls.length > 0) setLogoUrl(urls[0]);
        setPresentation(target.presentation ?? null);
        setStep(target.status === "done" ? "done" : dbMsgs.length > 0 ? "interviewing" : "welcome");

        // Fetch brand name for header
        const { data: brandRow } = await supabase
          .from("brands")
          .select("name")
          .eq("id", target.brand_id)
          .maybeSingle();
        const bName = (brandRow as any)?.name ?? brandName;
        setResolvedBrandName(bName);

        // Welcome message if chat empty
        if (dbMsgs.length === 0) {
          const kindLabel = target.kind === "strategic" ? "estratégico" : "de campaña";
          setMessages([
            {
              id: uid(),
              role: "assistant",
              content: bName
                ? `Listo. Vamos a crear un brief ${kindLabel} para **"${bName}"**. Arrastra logos/fotos y cuéntame el objetivo.`
                : `Hola. Soy tu **Agente Estratega**. Voy a crear un brief ${kindLabel}. Arrastra logos/fotos aquí y cuéntame el producto.`,
            },
          ]);
        } else {
          setMessages(dbMsgs);
        }
      } catch (err: any) {
        console.error("[BriefCreator] hydration error:", err);
        toast({
          title: "Error cargando brief",
          description: err?.message || "Intenta de nuevo",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefIdProp, brandId, currentAgencyId, user, kind]);

  /* ── Auto-save debounced ─────────────────────────────── */
  // Acumulamos el patch pendiente entre llamadas para que múltiples useEffects
  // (mensajes, imágenes, presentación) no se pisen entre sí. El debounce
  // dispara una única escritura con el patch combinado.
  const pendingPatchRef = useRef<BriefPatch>({});

  const flushPersist = useDebouncedCallback(async () => {
    if (!briefId) return;
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = {};
    if (Object.keys(patch).length === 0) {
      setSaveStatus("saved");
      return;
    }
    try {
      await updateBrief(briefId, patch);
      setSaveStatus("saved");
      setLastSaved(new Date());
    } catch (err: any) {
      setSaveStatus("error");
      console.error("[BriefCreator] save error:", err);
      toast({
        title: "Error al guardar",
        description: err?.message || "Reintenta en unos segundos",
        variant: "destructive",
      });
    }
  }, 2000);

  const queuePersist = useCallback(
    (patch: BriefPatch) => {
      if (!briefId) return;
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      // Mostrar "Guardando…" inmediatamente al encolar (no después del debounce)
      setSaveStatus("saving");
      flushPersist();
    },
    [briefId, flushPersist],
  );

  // Save messages
  useEffect(() => {
    if (!briefId || isHydrating) return;
    if (messages.length === 0) return;
    queuePersist({ chat_messages: toDbMessages(messages) });
  }, [messages, briefId, isHydrating, queuePersist]);

  // Save uploaded images
  useEffect(() => {
    if (!briefId || isHydrating) return;
    queuePersist({ uploaded_images: uploadedImageObjs });
  }, [uploadedImageObjs, briefId, isHydrating, queuePersist]);

  // Save presentation + status
  useEffect(() => {
    if (!briefId || isHydrating) return;
    if (step === "done" && presentation) {
      queuePersist({ status: "done", presentation });
    }
  }, [step, presentation, briefId, isHydrating, queuePersist]);

  /* ── Upload file ─────────────────────────────────────── */
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/v1/agent/upload`, {
        method: "POST",
        headers: authHeaders, // No Content-Type — browser sets it with boundary
        body: fd,
      });
      if (res.status === 401) {
        toast.error("Sesión expirada, vuelve a iniciar sesión");
        await supabase.auth.signOut();
        window.location.href = "/login";
        return null;
      }
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      return data.url as string;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;

      const newAttachments: Attachment[] = list.map((file) => ({
        id: uid(),
        file,
        url: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newAttachments].slice(0, 10));

      for (const file of list) {
        const serverUrl = await uploadFile(file);
        if (serverUrl) {
          if (!logoUrl) setLogoUrl(serverUrl);
          setUploadedImages((prev) => [...prev, serverUrl]);
          setUploadedImageObjs((prev) => [
            ...prev,
            {
              url: serverUrl,
              filename: file.name,
              uploaded_at: new Date().toISOString(),
            },
          ]);

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

  /* ── Drag & Drop ─────────────────────────────────────── */
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

      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/api/v1/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          logo_url: logoUrl,
          uploaded_images: uploadedImages.length ? uploadedImages : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 401) {
        toast.error("Sesión expirada, vuelve a iniciar sesión");
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.reply || "...",
          cta: data.status === "done" ? "open-editor" : undefined,
        },
      ]);

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
      const authHeaders = await getAuthHeaders();
      await fetch(`${BASE_URL}/api/v1/agent/session/${sessionId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
    } catch {}

    if (briefId) {
      try {
        await updateBrief(briefId, {
          chat_messages: [],
          uploaded_images: [],
          presentation: null,
          status: "interviewing",
        });
      } catch (err) {
        console.error("[BriefCreator] reset error:", err);
      }
    }
    window.location.reload();
  }, [sessionId, briefId]);

  /* ── Open editor ─────────────────────────────────────── */
  const handleOpenEditor = useCallback(async () => {
    if (!presentation) return;

    // Si tenemos briefId, persistimos `presentation` en DB antes de navegar
    // para garantizar que el editor pueda hidratarse desde la fuente real.
    if (briefId) {
      try {
        await updateBrief(briefId, { presentation });
      } catch (err) {
        console.error("[BriefCreator] no se pudo guardar presentation antes de abrir editor:", err);
        toast({
          title: "No se pudo abrir el editor",
          description: "Hubo un problema guardando la presentación. Reintenta.",
          variant: "destructive",
        });
        return;
      }
      navigate(`/editor/${briefId}`);
      return;
    }

    // Fallback legacy (sin briefId): mantenemos sessionStorage temporalmente.
    // TODO: Eliminar este fallback después de 2026-05-01.
    const id = `agent-${Date.now()}`;
    const draft = {
      docTitle: resolvedBrandName ? `${resolvedBrandName} — Brief` : "Brief Estratégico",
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
  }, [presentation, resolvedBrandName, navigate, briefId]);

  /* ── Open parrilla from brief ─────────────────────────── */
  const handleCreateParrilla = useCallback(async () => {
    if (!brief || !currentAgencyId || !user) return;
    try {
      const draft = await createDraft({
        agencyId: currentAgencyId,
        brandId: brief.brand_id,
        userId: user.id,
        title: `Parrilla — ${brief.title}`,
        briefId: brief.id,
        config: brief.extracted_config || {},
      });
      navigate(`/parrilla/nueva?draft_id=${draft.id}`);
    } catch (err: any) {
      toast({
        title: "No se pudo crear la parrilla",
        description: err?.message || "Intenta de nuevo",
        variant: "destructive",
      });
    }
  }, [brief, currentAgencyId, user, navigate]);

  const slideLabel = useMemo(() => {
    if (!presentation) return null;
    return `${presentation.length} slide${presentation.length !== 1 ? "s" : ""}`;
  }, [presentation]);

  const saveIndicator = useMemo(() => {
    if (!briefId) return null;
    if (saveStatus === "saving") {
      return (
        <span className="flex items-center gap-1 text-[10px] text-amber-400">
          <Loader2 size={10} className="animate-spin" /> Guardando…
        </span>
      );
    }
    if (saveStatus === "error") {
      return (
        <button
          onClick={() => flushPersist.flush()}
          className="flex items-center gap-1 text-[10px] text-destructive hover:underline"
        >
          <AlertCircle size={10} /> Error — reintentar
        </button>
      );
    }
    if (saveStatus === "saved" && lastSaved) {
      const secs = Math.max(1, Math.floor((Date.now() - lastSaved.getTime()) / 1000));
      return (
        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
          <Check size={10} /> Guardado
        </span>
      );
    }
    return null;
  }, [saveStatus, lastSaved, briefId, flushPersist]);

  /* ── Render ──────────────────────────────────────────── */
  if (isHydrating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 size={16} className="animate-spin" /> Cargando brief…
        </div>
      </div>
    );
  }

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

        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agente Estratega</h3>
            <p className="text-[11px] text-muted-foreground">
              {resolvedBrandName ? `Contexto: ${resolvedBrandName}` : "Powered by NexusAI"}
              {brief ? ` · Brief ${brief.kind === "strategic" ? "estratégico" : "de campaña"}` : ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {saveIndicator}
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
                      <div className="grid grid-cols-1 gap-2">
                        <Button onClick={handleOpenEditor} className="w-full h-11 text-sm font-semibold">
                          Abrir en el Editor Avanzado
                        </Button>
                        {brief && (
                          <Button
                            onClick={handleCreateParrilla}
                            variant="secondary"
                            className="w-full h-11 text-sm font-semibold gap-2"
                          >
                            <Wand2 size={14} /> Crear parrilla con este brief
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

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
