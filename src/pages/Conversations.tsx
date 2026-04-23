import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  Bot,
  User,
  UserCheck,
  MoreVertical,
  Loader2,
  MessageCircle,
  Phone,
  Instagram,
  Facebook,
  Globe,
  X,
  Archive,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  StickyNote,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "@/hooks/use-toast";
import {
  listConversationsByAgency,
  getConversation,
  sendAgentMessage,
  updateConversationMode,
  type ConversationListItem,
  type ConversationDetail,
  type MessageItem,
} from "@/lib/conversationService";

/* ── Helpers ── */
type FilterType = "all" | "ai" | "manual" | "closed";

const getPlatformIcon = (platform: string, size = 12) => {
  switch (platform) {
    case "facebook":
    case "messenger":
      return <Facebook size={size} className="text-[#1877F2]" />;
    case "instagram":
      return <Instagram size={size} className="text-[#E1306C]" />;
    case "whatsapp":
      return <Phone size={size} className="text-[#25D366]" />;
    default:
      return <Globe size={size} className="text-muted-foreground" />;
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case "facebook":
    case "messenger":
      return "border-[#1877F2]";
    case "instagram":
      return "border-[#E1306C]";
    case "whatsapp":
      return "border-[#25D366]";
    default:
      return "border-muted-foreground";
  }
};

const getPlatformDisplayName = (platform: string) => {
  switch (platform) {
    case "facebook":
    case "messenger":
      return "Facebook Messenger";
    case "instagram":
      return "Instagram DMs";
    case "whatsapp":
      return "WhatsApp";
    default:
      return platform;
  }
};

const formatRelative = (iso: string | null) => {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch {
    return "";
  }
};

const formatTimestamp = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

    if (diffDays === 0) return `Hoy ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return `Ayer ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
    return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }) +
      ` ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "";
  }
};

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const getInitials = (name: string | null) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
};

const shouldShowTimestamp = (messages: MessageItem[], index: number) => {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].sent_at);
  const curr = new Date(messages[index].sent_at);
  return curr.getTime() - prev.getTime() > 300000; // 5 min gap
};

/* ── Component ── */
export default function Conversations() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentAgencyId } = useAgency();
  const queryClient = useQueryClient();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Active conversation state
  const [selectedId, setSelectedId] = useState<string | null>(routeId || null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Message input state
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [togglingMode, setTogglingMode] = useState(false);

  // Internal notes
  const [internalNote, setInternalNote] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Load conversations with React Query (auto-poll) ───
  const statusFilter = filter === "all" ? undefined : filter === "ai" ? "open" : filter === "manual" ? "open" : "closed";

  const {
    data: rawConversations,
    isLoading: loadingList,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["conversations", currentAgencyId, statusFilter],
    queryFn: () => listConversationsByAgency(currentAgencyId!, { status: statusFilter, limit: 50 }),
    enabled: !!currentAgencyId,
    refetchInterval: 10_000,
    retry: 3,
  });

  // Client-side filter for ai/manual mode
  const conversations = (rawConversations ?? []).filter((c) => {
    if (filter === "ai") return c.mode === "ai";
    if (filter === "manual") return c.mode === "manual";
    return true;
  });

  // Derived
  const selectedConv = conversations.find((c) => c.id === selectedId) || null;
  const isManualMode = selectedConv?.mode === "manual";

  // ─── Load conversation detail ───
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    getConversation(selectedId, { limit: 50 })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        console.error("Error loading conversation:", err);
        if (!cancelled) {
          toast({
            title: "Error cargando conversación",
            description: err instanceof Error ? err.message : "Error desconocido",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, toast]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  // ─── Send message ───
  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text || !selectedId) return;

    setIsSending(true);
    setInputMessage("");

    try {
      const newMsg = await sendAgentMessage(selectedId, text);
      setDetail((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, newMsg], total_messages: prev.total_messages + 1 }
          : prev
      );
      // Invalidate list so it picks up updated last_message
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      console.error("Send error:", err);
      toast({
        title: "Error enviando mensaje",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
      setInputMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  // ─── Toggle mode ───
  const handleToggleMode = async () => {
    if (!selectedId || togglingMode) return;
    const newMode = isManualMode ? "ai" : "manual";
    setTogglingMode(true);
    try {
      await updateConversationMode(selectedId, newMode);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (detail) setDetail({ ...detail, mode: newMode });
      toast({
        title: newMode === "manual" ? "Modo manual activado" : "IA activada",
        description: newMode === "manual" ? "Ahora respondes tú" : "El bot responderá automáticamente",
      });
    } catch (err) {
      console.error("Toggle mode error:", err);
      toast({
        title: "Error cambiando modo",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setTogglingMode(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelect = (convId: string) => {
    setSelectedId(convId);
  };

  // Filtered list
  const filteredConversations = conversations.filter((c) =>
    (c.contact.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Column 1: Conversation List (320px) ── */}
        <div
          className={cn(
            "w-full md:w-[320px] md:min-w-[320px] border-r border-border/20 flex flex-col bg-card/30",
            selectedId && "hidden md:flex"
          )}
        >
          {/* List header */}
          <div className="p-4 pb-2 space-y-3 shrink-0">
            <h2 className="text-lg font-medium text-foreground">Bandeja</h2>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-muted/20 border-border/30"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-1">
              {(["all", "ai", "manual", "closed"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border-none cursor-pointer",
                    filter === f
                      ? "bg-primary/15 text-primary"
                      : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  )}
                >
                  {f === "all" ? "Todas" : f === "ai" ? "IA" : f === "manual" ? "Humano" : "Cerradas"}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {loadingList ? (
              <div className="text-center py-16">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Cargando conversaciones...</p>
              </div>
            ) : listError ? (
              <div className="text-center py-16 px-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={24} className="text-destructive/60" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No pudimos cargar las conversaciones
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {listError instanceof Error ? listError.message : "Error desconocido"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchList()}
                  className="text-xs gap-1.5"
                >
                  <RefreshCw size={12} /> Reintentar
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle size={24} className="text-primary/60" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No hay conversaciones todavía
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Cuando alguien te escriba a Facebook o Instagram, aparecerá aquí
                </p>
                <Link
                  to="/channels"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Ir a Canales →
                </Link>
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv, i) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => handleSelect(conv.id)}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-all group",
                      selectedId === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/15 border border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10">
                          {conv.contact.profile_picture_url && (
                            <AvatarImage src={conv.contact.profile_picture_url} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[11px] font-semibold">
                            {getInitials(conv.contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-card flex items-center justify-center border-2",
                            getPlatformColor(conv.contact.platform)
                          )}
                        >
                          {getPlatformIcon(conv.contact.platform, 8)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={cn(
                              "text-[13px] truncate",
                              conv.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
                            )}
                          >
                            {conv.contact.name || "Sin nombre"}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatRelative(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] text-muted-foreground truncate flex-1">
                            {conv.last_message_preview || "Sin mensajes"}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={listEndRef} />
          </div>
        </div>

        {/* ── Column 2: Message Thread (flex-1) ── */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-background/50 min-w-0",
            !selectedId && "hidden md:flex"
          )}
        >
          {!selectedId ? (
            /* Empty state - no conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={28} className="text-primary/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Elige una conversación
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecciona una conversación de la izquierda para verla
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="h-14 border-b border-border/20 px-4 flex items-center justify-between bg-card/50 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Back button on mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft size={16} />
                  </Button>

                  {selectedConv && (
                    <>
                      <Avatar className="w-8 h-8">
                        {selectedConv.contact.profile_picture_url && (
                          <AvatarImage src={selectedConv.contact.profile_picture_url} />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[10px] font-semibold">
                          {getInitials(selectedConv.contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm">{selectedConv.contact.name || "Sin nombre"}</h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          {getPlatformIcon(selectedConv.contact.platform, 10)}
                          <span>via {getPlatformDisplayName(selectedConv.contact.platform)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Mode badge + toggle */}
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px] font-medium",
                        isManualMode
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                      )}
                    >
                      {isManualMode ? "Manual" : "IA activa"}
                    </Badge>
                    <Switch
                      checked={!isManualMode}
                      onCheckedChange={handleToggleMode}
                      disabled={togglingMode}
                    />
                  </div>

                  {/* More actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs">
                        <X size={14} className="mr-2" /> Cerrar conversación
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">
                        <Archive size={14} className="mr-2" /> Archivar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-destructive">
                        <AlertTriangle size={14} className="mr-2" /> Marcar como spam
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {loadingDetail ? (
                  <div className="text-center py-20">
                    <Loader2 size={24} className="mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Cargando mensajes...</p>
                  </div>
                ) : !detail || detail.messages.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground/40">
                    <Bot size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Sin mensajes aún</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {detail.messages.map((msg, i) => (
                      <div key={msg.id}>
                        {shouldShowTimestamp(detail.messages, i) && (
                          <div className="text-center my-4">
                            <span className="text-[10px] text-muted-foreground/60 bg-background/80 px-3 py-1 rounded-full">
                              {formatTimestamp(msg.sent_at)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn("flex mb-1", msg.sender === "customer" ? "justify-start" : "justify-end")}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                              msg.sender === "customer" && "bg-muted/25 border border-border/25",
                              msg.sender === "agent" && "bg-primary/15 border border-primary/25",
                              msg.sender === "ai" && "bg-violet-500/10 border border-violet-500/20"
                            )}
                          >
                            {(msg.sender === "agent" || msg.sender === "ai") && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className={cn(
                                    "text-[9px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1",
                                    msg.sender === "ai"
                                      ? "text-violet-400 bg-violet-500/10"
                                      : "text-primary bg-primary/10"
                                  )}
                                >
                                  <Bot size={9} /> {msg.sender === "ai" ? "IA" : "Agente"}
                                </span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <span className="text-[9px] text-muted-foreground/60 mt-1 block text-right">
                              {formatTime(msg.sent_at)}
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </AnimatePresence>
                )}

                {isSending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      <span className="text-xs text-primary">Enviando...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input footer */}
              <div className="p-3 border-t border-border/20 bg-card/50 shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isManualMode ? "Responder como agente..." : "Escribe un mensaje..."}
                    className="flex-1 min-h-[36px] max-h-[120px] rounded-xl bg-muted/15 border border-border/30 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    disabled={!selectedId || isSending}
                    rows={1}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputMessage.trim() || !selectedId || isSending}
                    size="icon"
                    className="h-9 w-9 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shrink-0"
                  >
                    <Send size={15} />
                  </Button>
                </div>
                {isManualMode && (
                  <p className="text-[9px] text-amber-400/80 mt-1.5 text-center">
                    ⚠️ Modo manual — la IA está pausada
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Column 3: Contact Info (300px) ── */}
        <div className="hidden xl:flex w-[300px] min-w-[300px] border-l border-border/20 bg-card/30 flex-col">
          {selectedConv ? (
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b border-border/20">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalles
                </h4>
              </div>

              {/* Contact info */}
              <div className="p-4 text-center border-b border-border/20">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  {selectedConv.contact.profile_picture_url && (
                    <AvatarImage src={selectedConv.contact.profile_picture_url} />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-primary/25 to-accent/25 text-lg font-bold">
                    {getInitials(selectedConv.contact.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-foreground">
                  {selectedConv.contact.name || "Sin nombre"}
                </h3>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {getPlatformIcon(selectedConv.contact.platform, 12)}
                  <span className="text-xs text-muted-foreground">
                    {getPlatformDisplayName(selectedConv.contact.platform)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-[11px] gap-1.5"
                  onClick={() => {
                    // Open profile based on platform
                    const platform = selectedConv.contact.platform;
                    if (platform === "facebook" || platform === "messenger") {
                      window.open(`https://facebook.com/${selectedConv.contact.platform_user_id}`, "_blank");
                    }
                  }}
                >
                  <ExternalLink size={12} />
                  Ver perfil en {getPlatformDisplayName(selectedConv.contact.platform).split(" ")[0]}
                </Button>
              </div>

              {/* Conversation info */}
              <div className="p-4 border-b border-border/20 space-y-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Conversación
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inicio</span>
                    <span className="text-foreground">
                      {detail?.messages?.[0]?.sent_at
                        ? new Date(detail.messages[0].sent_at).toLocaleDateString("es-ES")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensajes</span>
                    <span className="text-foreground">{detail?.total_messages ?? 0}</span>
                  </div>
                  {selectedConv.active_brand && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Marca</span>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedConv.active_brand.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags (placeholder) */}
              <div className="p-4 border-b border-border/20">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedConv.tags.length > 0 ? (
                    selectedConv.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="text-[10px] bg-primary/15 text-primary border-primary/25"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground/50">
                      Sin tags asignados
                    </p>
                  )}
                </div>
              </div>

              {/* Internal notes */}
              <div className="p-4">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <StickyNote size={12} />
                  Notas internas
                </h4>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Notas visibles solo para tu equipo..."
                  className="w-full min-h-[80px] rounded-lg bg-muted/15 border border-border/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/40">
              <p className="text-xs">Selecciona una conversación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
