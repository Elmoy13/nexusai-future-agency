import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { apiCall } from "@/lib/apiClient";
import type { PostCard, BrandProfile, ChatMsg, PostVersion } from "@/types/parrilla";
import { ALL_FORMATS, QUICK_ACTIONS, getDimensionsFromFormat, getAspectClass, relativeTime } from "@/types/parrilla";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Sparkles, Loader2, X, Send, Check,
  MessageCircle, Wand2, Layers,
} from "lucide-react";

interface EditPostModalProps {
  post: PostCard | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedPost: PostCard) => void;
  brand: BrandProfile;
}

const EditPostModal = ({ post, open, onClose, onSave, brand }: EditPostModalProps) => {
  // Manual fields
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [format, setFormat] = useState("instagram_feed");
  const [activeTab, setActiveTab] = useState<"chat" | "manual">("chat");

  // Chat & versions
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [highlightVersionId, setHighlightVersionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);
  const lastVersionCountRef = useRef<number>(0);

  // Reset & load when post changes
  useEffect(() => {
    if (!post || !open) return;
    setHeadline(post.headline || post.title || "");
    setBody(post.body || post.caption || "");
    setCta(post.cta || "");
    setImagePrompt(post.imagePrompt || "");
    setStyleDescription(post.styleDescription || "profesional y moderno");
    setFormat(post.format || "instagram_feed");
    setPreviewImage(post.image || null);
    setActiveTab("chat");
    setSelectedVersionId(null);
    setHighlightVersionId(null);

    // Load chat + versions
    (async () => {
      setIsLoadingHistory(true);
      try {
        const [chatData, versionsData] = await Promise.all([
          apiCall<{ messages?: ChatMsg[] }>(`/api/v1/posts/${post.id}/edit-chat`).catch(() => null),
          apiCall<{ versions?: PostVersion[] }>(`/api/v1/posts/${post.id}/versions`).catch(() => null),
        ]);
        if (chatData) {
          const msgs: ChatMsg[] = Array.isArray((chatData as Record<string, unknown>)?.messages)
            ? (chatData as Record<string, unknown>).messages as ChatMsg[]
            : (Array.isArray(chatData) ? chatData as unknown as ChatMsg[] : []);
          setMessages(msgs);
        } else {
          setMessages([]);
        }
        if (versionsData) {
          const vs: PostVersion[] = Array.isArray((versionsData as Record<string, unknown>)?.versions)
            ? (versionsData as Record<string, unknown>).versions as PostVersion[]
            : (Array.isArray(versionsData) ? versionsData as unknown as PostVersion[] : []);
          setVersions(vs);
          lastVersionCountRef.current = vs.length;
          const current = vs.find(v => v.is_current);
          if (current) {
            setSelectedVersionId(current.id);
            setPreviewImage(current.image_url || post.image || null);
          }
        } else {
          setVersions([]);
          lastVersionCountRef.current = 0;
        }
      } catch (e) {
        console.warn("Edit modal load error:", e);
      } finally {
        setIsLoadingHistory(false);
      }
    })();

    return () => {
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [post, open]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isRegenerating]);

  // Stop polling on close
  useEffect(() => {
    if (!open && pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [open]);

  // Esc to close handled by Dialog. Cmd+Enter to send.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startPolling = useCallback(() => {
    if (!post) return;
    if (pollRef.current) window.clearInterval(pollRef.current);
    setIsRegenerating(true);
    pollRef.current = window.setInterval(async () => {
      try {
        const data = await apiCall<{ versions?: PostVersion[] }>(`/api/v1/posts/${post.id}/versions`);
        const vs: PostVersion[] = Array.isArray(data?.versions) ? data.versions : (Array.isArray(data) ? data as unknown as PostVersion[] : []);
        if (vs.length > lastVersionCountRef.current) {
          // New version arrived
          const sorted = [...vs].sort((a, b) => (b.version_number || 0) - (a.version_number || 0));
          const newest = sorted[0];
          setVersions(vs);
          lastVersionCountRef.current = vs.length;
          if (newest?.is_current) {
            setSelectedVersionId(newest.id);
            setPreviewImage(newest.image_url || null);
            if (newest.headline) setHeadline(newest.headline);
            if (newest.body) setBody(newest.body);
            if (newest.cta) setCta(newest.cta);
            if (newest.image_prompt) setImagePrompt(newest.image_prompt);
          }
          setHighlightVersionId(newest?.id || null);
          setTimeout(() => setHighlightVersionId(null), 2500);
          setIsRegenerating(false);
          if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
        }
      } catch {}
    }, 3000);

    // Safety timeout: stop after 5 min
    window.setTimeout(() => {
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; setIsRegenerating(false); }
    }, 5 * 60 * 1000);
  }, [post]);

  const sendChat = useCallback(async (userMessage: string, quickAction?: string) => {
    if (!post) return;
    const optimisticUser: ChatMsg = { role: "user", content: userMessage };
    setMessages(prev => [...prev, optimisticUser]);
    setIsSending(true);
    try {
      const data = await apiCall<{ assistant_message?: string; message?: string; reply?: string; regenerating?: boolean }>(
        `/api/v1/posts/${post.id}/edit-chat`,
        { method: "POST", body: { user_message: userMessage, quick_action: quickAction || null } },
      );
      const aiContent: string = data?.assistant_message || data?.message || data?.reply || "🎨 Generando nueva versión...";
      setMessages(prev => [...prev, { role: "assistant", content: aiContent }]);
      // If backend signals a regeneration is in progress, start polling versions
      if (data?.regenerating !== false) {
        startPolling();
      }
    } catch (err) {
      console.error("edit-chat error:", err);
      toast({ title: "⚠️ No se pudo enviar", description: "Intenta de nuevo en unos segundos.", variant: "destructive" });
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Hubo un problema procesando tu mensaje. Intenta de nuevo." }]);
    } finally {
      setIsSending(false);
    }
  }, [post, startPolling]);

  const handleSend = () => {
    const txt = chatInput.trim();
    if (!txt || isSending) return;
    setChatInput("");
    sendChat(txt);
  };

  const handleQuickAction = (qa: typeof QUICK_ACTIONS[number]) => {
    if (isSending) return;
    sendChat(`${qa.emoji} ${qa.label}`, qa.id);
  };

  const handleManualRegenerate = () => {
    const summary = `Manual edit: headline="${headline}", body="${body}", cta="${cta}", prompt="${imagePrompt}", style="${styleDescription}", format="${format}"`;
    sendChat(summary, "manual_edit");
  };

  const handleSelectVersion = (v: PostVersion) => {
    setSelectedVersionId(v.id);
    setPreviewImage(v.image_url);
  };

  const handleRestoreVersion = async (v: PostVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post) return;
    try {
      const data = await apiCall<{ versions?: PostVersion[] }>(
        `/api/v1/posts/${post.id}/versions/${v.id}/restore`,
        { method: "POST" },
      ).catch(() => ({} as { versions?: PostVersion[] }));
      const updatedVersions: PostVersion[] = data?.versions || versions.map(x => ({ ...x, is_current: x.id === v.id }));
      setVersions(updatedVersions);
      setSelectedVersionId(v.id);
      setPreviewImage(v.image_url);
      if (v.headline) setHeadline(v.headline);
      if (v.body) setBody(v.body);
      if (v.cta) setCta(v.cta);
      if (v.image_prompt) setImagePrompt(v.image_prompt);
      toast({ title: `↺ Versión v${v.version_number} restaurada` });
    } catch (err) {
      console.error("restore error:", err);
      toast({ title: "⚠️ No se pudo restaurar", variant: "destructive" });
    }
  };

  const handleClearChat = () => {
    if (!confirm("¿Limpiar todo el historial de chat de este post?")) return;
    setMessages([]);
  };

  const handleSaveAndClose = () => {
    if (!post) return;
    onSave({
      ...post,
      headline, body, cta, imagePrompt, styleDescription, format,
      image: previewImage || post.image,
    });
    onClose();
  };

  if (!post) return null;

  const currentVersion = versions.find(v => v.is_current) || null;
  const displayedVersionNumber = (selectedVersionId && versions.find(v => v.id === selectedVersionId)?.version_number) || currentVersion?.version_number || 1;
  const totalVersions = versions.length || 1;
  const isViewingCurrent = !selectedVersionId || selectedVersionId === currentVersion?.id;
  const formatDims = getDimensionsFromFormat(format);
  const formatLabel: Record<string, string> = {};
  ALL_FORMATS.forEach(f => { formatLabel[f.id] = `${f.label} • ${f.platform}`; });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[1400px] w-[95vw] h-[92vh] bg-card border-border p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Editor IA del Post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[35%_45%_20%] overflow-hidden">

          {/* ── COL 1: CHAT ── */}
          <aside className="flex flex-col border-r border-border bg-background/40 min-h-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary" /> Editor IA
                </h3>
                <p className="text-[11px] text-muted-foreground">Dime qué cambiar</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearChat} aria-label="Limpiar chat" title="Limpiar chat" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {isLoadingHistory && (
                <div className="text-center text-xs text-muted-foreground py-4">
                  <Loader2 size={14} className="inline animate-spin mr-1" /> Cargando historial...
                </div>
              )}
              {!isLoadingHistory && messages.length === 0 && (
                <div className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-lg p-3">
                  👋 Soy tu editor IA. Pídeme cambios concretos: <em>"hazla más cinematográfica"</em>, <em>"botella más cristalina"</em>, <em>"fondo nocturno con luces"</em>...
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm border border-border"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isRegenerating && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm bg-secondary border border-border">
                    <div className="flex items-center gap-2 text-foreground">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <span>🎨 Generando nueva versión...</span>
                    </div>
                    <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary via-violet-500 to-primary"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="px-3 py-2 border-t border-border">
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.id}
                    onClick={() => handleQuickAction(qa)}
                    disabled={isSending || isRegenerating}
                    title={qa.tooltip}
                    aria-label={qa.tooltip}
                    className="shrink-0 text-xs px-2.5 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 border border-border text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="mr-1">{qa.emoji}</span>{qa.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-end">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: hazla más publicitaria, botella más cristalina..."
                  rows={2}
                  className="bg-secondary/50 border-border resize-none text-sm min-h-[60px]"
                  aria-label="Mensaje al editor IA"
                />
                <Button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isSending || isRegenerating}
                  size="icon"
                  className="bg-primary text-primary-foreground h-10 w-10 shrink-0"
                  aria-label="Enviar mensaje"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Enter envía • Shift+Enter nueva línea</p>
            </div>
          </aside>

          {/* ── COL 2: PREVIEW + MANUAL ── */}
          <section className="flex flex-col bg-secondary/20 min-h-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "manual")} className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-3 pb-2 border-b border-border bg-background/40">
                <TabsList className="bg-secondary/60">
                  <TabsTrigger value="chat" className="text-xs"><MessageCircle size={12} className="mr-1" /> Chat</TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs"><Wand2 size={12} className="mr-1" /> Manual</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 overflow-y-auto m-0 p-6 min-h-0">
                <div className="max-w-md mx-auto flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-primary/20 text-primary border-primary/30">Versión {displayedVersionNumber} {isViewingCurrent ? "• Actual" : ""}</Badge>
                    <span className="text-[11px] text-muted-foreground">{formatDims.w}×{formatDims.h} • {formatLabel[format] || format}</span>
                  </div>
                  <div className={`w-full rounded-xl overflow-hidden border border-border bg-secondary relative ${getAspectClass(format)} ${format.includes("story") || format.includes("reel") || format.includes("tiktok") ? "max-h-[420px]" : ""}`}>
                    {previewImage ? (
                      <img src={previewImage} alt="Preview del post" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sin imagen</div>
                    )}
                    {isRegenerating && (
                      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                        <Loader2 size={28} className="animate-spin text-primary" />
                        <p className="text-xs text-foreground">Generando nueva versión...</p>
                      </div>
                    )}
                  </div>

                  {/* Caption preview */}
                  <div className="w-full mt-4 bg-background/60 border border-border rounded-lg p-3 space-y-2">
                    {headline && <p className="text-sm font-bold text-foreground leading-tight">{headline}</p>}
                    {body && <p className="text-xs text-muted-foreground leading-snug">{body}</p>}
                    {cta && (
                      <div>
                        <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30">{cta}</span>
                      </div>
                    )}
                    {!headline && !body && !cta && (
                      <p className="text-[11px] text-muted-foreground italic">Sin caption aún</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="flex-1 overflow-y-auto m-0 p-6 min-h-0">
                <div className="max-w-lg mx-auto space-y-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contenido</p>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Headline</label>
                    <Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60} className="bg-secondary/50 border-border" />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{headline.length}/60</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={150} rows={2} className="bg-secondary/50 border-border resize-none" />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{body.length}/150</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA</label>
                    <Input value={cta} onChange={(e) => setCta(e.target.value)} maxLength={30} className="bg-secondary/50 border-border" />
                  </div>

                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-2">Imagen</p>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Image prompt</label>
                    <Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={4} className="bg-background border-border resize-none font-mono text-xs" placeholder="Describe la imagen..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Estilo</label>
                    <Input value={styleDescription} onChange={(e) => setStyleDescription(e.target.value)} className="bg-secondary/50 border-border" placeholder="ej: elegante, premium" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Formato</label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_FORMATS.map(f => <SelectItem key={f.id} value={f.id}>{f.icon} {f.label} ({f.width}×{f.height})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleManualRegenerate} disabled={isSending || isRegenerating} className="w-full h-11 bg-gradient-to-r from-violet-600 to-primary text-white font-semibold">
                    {isRegenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Regenerando...</> : <><Sparkles size={16} className="mr-2" /> Regenerar con cambios manuales</>}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* ── COL 3: VERSIONS ── */}
          <aside className="flex flex-col border-l border-border bg-background/40 min-h-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Versiones</h3>
              <span className="text-[11px] text-muted-foreground">({totalVersions})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {versions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">Solo versión original</p>
              )}
              {versions.map(v => {
                const isSelected = selectedVersionId === v.id;
                const isHighlighted = highlightVersionId === v.id;
                return (
                  <motion.div
                    key={v.id}
                    layout
                    initial={isHighlighted ? { opacity: 0, scale: 0.9 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleSelectVersion(v)}
                    className={`group relative cursor-pointer rounded-lg border overflow-hidden transition-all ${
                      isSelected ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-primary/50"
                    } ${isHighlighted ? "shadow-[0_0_20px_hsl(var(--primary)/0.6)]" : ""}`}
                  >
                    <div className={`w-full ${getAspectClass(format)} bg-secondary relative`}>
                      {v.image_url ? (
                        <img src={v.image_url} alt={`Versión ${v.version_number}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">sin preview</div>
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm text-[10px] font-semibold text-foreground">
                        v{v.version_number}
                      </div>
                      {v.is_current && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold">
                          Actual
                        </div>
                      )}
                      {!v.is_current && (
                        <button
                          onClick={(e) => handleRestoreVersion(v, e)}
                          className="absolute inset-x-1 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border border-border text-foreground text-[10px] font-medium rounded py-1 hover:bg-primary hover:text-primary-foreground"
                          aria-label={`Restaurar versión ${v.version_number}`}
                        >
                          ↺ Restaurar
                        </button>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] text-foreground truncate" title={v.change_description || ""}>
                        {v.change_description || "Sin descripción"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{relativeTime(v.created_at)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-border">
              <Button variant="ghost" size="sm" disabled={versions.length < 2} className="w-full text-xs text-muted-foreground hover:text-foreground">
                <Layers size={12} className="mr-1.5" /> Exportar comparación
              </Button>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 border-t border-border bg-background/40 flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSaveAndClose} className="bg-primary text-primary-foreground font-semibold">
            <Check size={14} className="mr-1.5" /> Guardar y cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
