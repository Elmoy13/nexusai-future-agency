import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Send,
  Paperclip,
  Bot,
  User,
  UserCheck,
  Phone,
  MoreVertical,
  Trash2,
  Upload,
  FileText,
  Check,
  Loader2,
  MessageSquare,
  Instagram,
  Hexagon,
  Sparkles,
  Tag,
  Clock,
  BarChart3,
  Zap,
  RefreshCw,
  PenLine,
  AtSign,
  Star,
  MessageCircle,
  Shield,
  Plug,
  Linkedin,
  Facebook,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface Conversation {
  id: string;
  contact_id: string;
  last_message_at: string;
  contact_name: string;
  contact_platform: string;
  mode: "ai" | "manual";
}

interface DbMessage {
  id: string;
  conversation_id: string;
  sender: "customer" | "agent" | "ai";
  content: string;
  sent_at: string;
}

interface KnowledgeFile {
  id: string;
  name: string;
  size: string;
}

/* ── Mock data for CRM sidebar (unchanged) ── */
const mockKnowledgeFiles: KnowledgeFile[] = [
  { id: "1", name: "manual_drone_x10.pdf", size: "2.4 MB" },
  { id: "2", name: "politicas_de_devolucion.pdf", size: "156 KB" },
  { id: "3", name: "especificaciones_tecnicas.pdf", size: "890 KB" },
];

/* ── Helpers ── */
const getPlatformIcon = (platform: string, size = 12) => {
  switch (platform) {
    case "whatsapp": return <Phone size={size} className="text-green-500" />;
    case "instagram": return <Instagram size={size} className="text-pink-500" />;
    case "messenger": return <MessageSquare size={size} className="text-blue-500" />;
    default: return <Globe size={size} className="text-muted-foreground" />;
  }
};

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatRelative = (iso: string) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  } catch {
    return "";
  }
};

/* ── Component ── */
const Community = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Supabase state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingMode, setTogglingMode] = useState(false);

  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(mockKnowledgeFiles);
  const [aiTemperature, setAiTemperature] = useState([30]);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [connectedChannels, setConnectedChannels] = useState<Record<string, boolean>>({});
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [clientTags, setClientTags] = useState<string[]>(["Lead Caliente"]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derived
  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;
  const isManualMode = selectedConversation?.mode === "manual";

  const handleToggleMode = async () => {
    if (!selectedConversationId || togglingMode) return;
    const newMode = isManualMode ? "ai" : "manual";
    setTogglingMode(true);
    try {
      const res = await fetch(
        `https://steady-potential-drug-advances.trycloudflare.com/api/v1/conversations/${selectedConversationId}/mode`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: newMode }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      // Update local state immediately
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversationId ? { ...c, mode: newMode } : c))
      );
      toast({ title: newMode === "manual" ? "Modo manual activado" : "IA activada", description: newMode === "manual" ? "Ahora respondes tú" : "El bot responderá automáticamente" });
    } catch (err: any) {
      console.error("Toggle mode error:", err);
      toast({ title: "Error cambiando modo", description: err.message, variant: "destructive" });
    } finally {
      setTogglingMode(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── 1. Load conversations with contact join ───
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id, contact_id, last_message_at, mode, contacts(name, platform)")
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      const mapped: Conversation[] = data.map((row: any) => ({
        id: row.id,
        contact_id: row.contact_id,
        last_message_at: row.last_message_at,
        contact_name: row.contacts?.name || "Sin nombre",
        contact_platform: row.contacts?.platform || "web",
        mode: row.mode || "ai",
      }));
      setConversations(mapped);
      if (!selectedConversationId && mapped.length > 0) {
        setSelectedConversationId(mapped[0].id);
      }
    }
    setLoadingConversations(false);
  }, [toast, selectedConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ─── 2. Load messages for active conversation ───
  useEffect(() => {
    if (!selectedConversationId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversationId)
        .order("sent_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast({ title: "Error cargando mensajes", description: error.message, variant: "destructive" });
      } else {
        setMessages(data || []);
      }
      setLoadingMessages(false);
    };

    loadMessages();
  }, [selectedConversationId, toast]);

  // ─── 3. Realtime subscription on messages ───
  useEffect(() => {
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          if (newMsg.conversation_id === selectedConversationId) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          // Refresh conversations list to update last_message_at
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, fetchConversations]);

  // ─── 4. Send message via Edge Function ───
  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || !selectedConversationId) return;

    setIsSending(true);
    setInputMessage("");

    try {
      const res = await fetch("https://steady-potential-drug-advances.trycloudflare.com/api/v1/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: selectedConversationId,
          message_text: text,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      {
        // Re-fetch messages to ensure the sent message appears immediately
        const { data: freshMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConversationId)
          .order("sent_at", { ascending: true });
        if (freshMessages) setMessages(freshMessages);
        fetchConversations();
      }
    } catch (err: any) {
      console.error("Send error:", err);
      toast({ title: "Error de conexión", description: err.message, variant: "destructive" });
      setInputMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!clientTags.includes(tag)) setClientTags((p) => [...p, tag]);
  };

  const handleConnectChannel = (channelKey: string) => {
    if (channelKey === "whatsapp" && !showWhatsappInput && !connectedChannels.whatsapp) {
      setShowWhatsappInput(true);
      return;
    }
    setConnectingChannel(channelKey);
    setShowWhatsappInput(false);
    setTimeout(() => {
      setConnectedChannels((prev) => ({ ...prev, [channelKey]: true }));
      setConnectingChannel(null);
    }, 2000);
  };

  const integrationChannels = [
    { key: "whatsapp", name: "WhatsApp Business API", description: "Mensajería directa con clientes vía API oficial de Meta", icon: Phone, color: "text-green-500", bgColor: "bg-green-500/15", borderColor: "border-green-500/30" },
    { key: "instagram", name: "Instagram Direct", description: "DMs, comentarios y menciones de Instagram", icon: Instagram, color: "text-pink-500", bgColor: "bg-pink-500/15", borderColor: "border-pink-500/30" },
    { key: "messenger", name: "Facebook Messenger", description: "Chat de Facebook Pages y Messenger API", icon: Facebook, color: "text-blue-500", bgColor: "bg-blue-500/15", borderColor: "border-blue-500/30" },
    { key: "linkedin", name: "LinkedIn Pages", description: "Gestiona comentarios y mensajes de tu LinkedIn Company Page", icon: Linkedin, color: "text-blue-400", bgColor: "bg-blue-400/15", borderColor: "border-blue-400/30" },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* ═══ TOP BAR with KPIs ═══ */}
      <div className="h-14 border-b border-border/20 bg-card/80 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Button>
        <div className="h-6 w-px bg-border/30" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hexagon size={14} className="text-primary" />
          <span>Aero Dynamics</span>
          <span className="text-border">/</span>
          <span className="text-foreground font-semibold">Smart Inbox</span>
        </div>

        {/* KPI Metrics */}
        <div className="ml-auto flex items-center gap-6">
          {[
            { icon: MessageCircle, label: "Mensajes Hoy", value: "142", color: "text-primary" },
            { icon: Bot, label: "Tasa IA", value: "94%", color: "text-green-400" },
            { icon: Clock, label: "Tiempo Ahorro", value: "4.5 hrs", color: "text-cyan-400" },
            { icon: Zap, label: "Resolución", value: "< 30s", color: "text-amber-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-2">
              <kpi.icon size={14} className={kpi.color} />
              <div className="text-right">
                <p className={cn("text-sm font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground leading-none">{kpi.label}</p>
              </div>
            </div>
          ))}
          <div className="h-6 w-px bg-border/30 ml-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIntegrations(true)}
            className="gap-2 text-xs border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
          >
            <Plug size={14} />
            Conectar Canales
          </Button>
        </div>
      </div>

      {/* ═══ 3-COLUMN LAYOUT ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── COL 1: SMART INBOX (30%) ── */}
        <div className="w-[30%] border-r border-border/20 flex flex-col bg-card/30">
          {/* Search */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-muted/20 border-border/30"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {loadingConversations ? (
              <div className="text-center py-12">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Cargando conversaciones...</p>
              </div>
            ) : conversations.filter((c) =>
              c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground/40">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Sin conversaciones</p>
              </div>
            ) : (
              conversations
                .filter((c) => c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((conv) => (
                  <motion.div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-all group",
                      selectedConversationId === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/15 border border-transparent"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[11px] font-semibold">
                            {conv.contact_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card flex items-center justify-center border border-border/40">
                          {getPlatformIcon(conv.contact_platform, 9)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-xs">{conv.contact_name}</span>
                          <span className="text-[9px] text-muted-foreground">{formatRelative(conv.last_message_at)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate capitalize">{conv.contact_platform}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </div>

        {/* ── COL 2: COMMAND CENTER (45%) ── */}
        <div className="w-[45%] flex flex-col bg-background/50">
          {/* Chat Header */}
          <div className="h-14 border-b border-border/20 px-4 flex items-center justify-between bg-card/50 shrink-0">
            <div className="flex items-center gap-3">
              {selectedConversation ? (
                <>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[10px] font-semibold">
                      {selectedConversation.contact_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedConversation.contact_name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {getPlatformIcon(selectedConversation.contact_platform, 10)}
                      <span className="capitalize">{selectedConversation.contact_platform}</span>
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Selecciona una conversación</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isManualMode ? "default" : "outline"}
                size="sm"
                onClick={handleToggleMode}
                disabled={togglingMode}
                className={cn(
                  "text-[11px] gap-1.5 h-8",
                  isManualMode
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                    : "border-border/30 text-muted-foreground"
                )}
              >
                {isManualMode ? <UserCheck size={13} /> : <User size={13} />}
                {isManualMode ? "Manual Activo" : "Tomar Control"}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical size={15} />
              </Button>
            </div>
          </div>

          {/* Messages Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <div className="text-center py-20">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Cargando mensajes...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground/40">
                <Bot size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin mensajes aún</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", msg.sender === "customer" ? "justify-start" : "justify-end")}
                  >
                    <div className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                      msg.sender === "customer" && "bg-muted/25 border border-border/25",
                      msg.sender === "agent" && "bg-gradient-to-br from-primary/15 to-cyan-500/10 border border-primary/20",
                      msg.sender === "ai" && "bg-gradient-to-br from-violet-500/15 to-primary/10 border border-violet-500/20",
                    )}>
                      {(msg.sender === "agent" || msg.sender === "ai") && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn(
                            "text-[9px] font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1",
                            msg.sender === "ai" ? "text-violet-400 bg-violet-500/10" : "text-primary bg-primary/10"
                          )}>
                            <Bot size={9} /> {msg.sender === "ai" ? "IA" : "Agente"}
                          </span>
                        </div>
                      )}
                      <p>{msg.content}</p>
                      <span className="text-[9px] text-muted-foreground/60 mt-1 block text-right">{formatTime(msg.sent_at)}</span>
                    </div>
                  </motion.div>
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

          {/* Input Bar */}
          <div className="p-3 border-t border-border/20 bg-card/50 shrink-0">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
                <Paperclip size={16} />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={isManualMode ? "Responder como agente humano..." : "Escribe un mensaje..."}
                className="h-9 text-sm bg-muted/15 border-border/30"
                disabled={!selectedConversationId || isSending}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || !selectedConversationId || isSending}
                size="icon"
                className="h-9 w-9 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              >
                <Send size={15} />
              </Button>
            </div>
            {isManualMode && (
              <p className="text-[9px] text-amber-400/80 mt-1.5 text-center">⚠️ Modo manual — IA pausada</p>
            )}
          </div>
        </div>

        {/* ── COL 3: CRM & CONTEXT (25%) ── */}
        <div className="w-[25%] border-l border-border/20 bg-card/30 flex flex-col">
          <Tabs defaultValue="client" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border/20 bg-transparent h-11 p-0 shrink-0">
              <TabsTrigger
                value="client"
                className="flex-1 rounded-none text-xs border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                👤 Cliente
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="flex-1 rounded-none text-xs border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                🧠 Knowledge
              </TabsTrigger>
            </TabsList>

            {/* Client CRM Tab */}
            <TabsContent value="client" className="flex-1 p-4 space-y-5 mt-0 overflow-y-auto">
              {/* Profile Card */}
              <div className="text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarFallback className="bg-gradient-to-br from-primary/25 to-accent/25 text-lg font-bold">
                    {selectedConversation?.contact_name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{selectedConversation?.contact_name || "—"}</h3>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  {getPlatformIcon(selectedConversation?.contact_platform || "", 12)}
                  <span className="capitalize">{selectedConversation?.contact_platform || "—"}</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Etiquetas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {clientTags.map((tag) => (
                    <Badge key={tag} className="text-[10px] bg-primary/15 text-primary border-primary/25">
                      {tag}
                    </Badge>
                  ))}
                  {["VIP", "Hater", "Comprador"].filter((t) => !clientTags.includes(t)).map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tag)}
                      className="h-5 text-[9px] px-2 border-dashed border-border/40 text-muted-foreground hover:text-foreground"
                    >
                      <Tag size={8} className="mr-1" /> {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Interaction History */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Historial</h4>
                <div className="space-y-2">
                  {[
                    { text: "Comentó en 3 posts de Instagram este mes", icon: Instagram, time: "Últimos 30d" },
                    { text: "Preguntó por precio en WhatsApp", icon: Phone, time: "hace 5d" },
                    { text: "Abrió enlace de catálogo 2 veces", icon: BarChart3, time: "hace 2d" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 border border-border/15">
                      <item.icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground/80">{item.text}</p>
                        <p className="text-[9px] text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Gauge */}
              <div className="p-3 rounded-xl bg-muted/10 border border-border/20">
                <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Sentimiento General</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-green-500 to-primary" />
                  </div>
                  <span className="text-sm font-bold text-green-400">75%</span>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">Positivo — Potencial comprador</p>
              </div>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="flex-1 p-4 space-y-4 mt-0 overflow-y-auto">
              {/* Active Sources */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={10} /> Fuentes Activas
                </h4>
                <div className="space-y-1.5">
                  {knowledgeFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-border/20 group">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium truncate">{file.name}</p>
                          <p className="text-[9px] text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => setKnowledgeFiles((p) => p.filter((f) => f.id !== file.id))}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Dropzone */}
              <div className="border border-dashed border-border/30 rounded-xl p-4 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <Upload size={18} className="mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">Arrastra PDFs o Manuales aquí</p>
              </div>

              {/* AI Temperature */}
              <div className="pt-3 border-t border-border/20">
                <h4 className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Temperatura IA</h4>
                <Slider value={aiTemperature} onValueChange={setAiTemperature} max={100} step={1} />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-2">
                  <span>📚 Estricto</span>
                  <span>🎨 Creativo</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ═══ INTEGRATIONS MODAL ═══ */}
      <Dialog open={showIntegrations} onOpenChange={setShowIntegrations}>
        <DialogContent className="sm:max-w-2xl bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Plug size={18} className="text-primary" />
              </div>
              Centro de Integraciones
              <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground font-normal ml-1">
                Aero Dynamics
              </Badge>
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Conecta tus canales sociales para unificar la comunicación en un solo inbox.</p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {integrationChannels.map((channel) => {
              const isConnected = connectedChannels[channel.key];
              const isConnecting = connectingChannel === channel.key;
              const Icon = channel.icon;

              return (
                <motion.div
                  key={channel.key}
                  className={cn(
                    "p-5 rounded-xl border transition-all",
                    isConnected
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border/30 bg-muted/10 hover:border-border/50"
                  )}
                  whileHover={!isConnected ? { scale: 1.01 } : {}}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", channel.bgColor, channel.borderColor, "border")}>
                      <Icon size={20} className={channel.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{channel.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{channel.description}</p>
                    </div>
                  </div>

                  {/* WhatsApp phone input */}
                  {channel.key === "whatsapp" && showWhatsappInput && !isConnected && !isConnecting && (
                    <div className="mb-3">
                      <Input
                        placeholder="+52 555 123 4567"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="h-8 text-xs bg-muted/20 border-border/30 mb-2"
                      />
                    </div>
                  )}

                  {isConnected ? (
                    <div className="space-y-1">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Check size={12} className="mr-1" /> Conectado
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">Token activo · OAuth 2.0</p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isConnecting}
                      onClick={() => handleConnectChannel(channel.key)}
                      className={cn(
                        "w-full text-xs",
                        isConnecting
                          ? "border-primary/30 text-primary"
                          : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 size={13} className="mr-1.5 animate-spin" />
                          Autorizando con OAuth...
                        </>
                      ) : (
                        <>
                          <Globe size={13} className="mr-1.5" />
                          {channel.key === "whatsapp" && showWhatsappInput ? "Verificar y Conectar" : "Conectar cuenta"}
                        </>
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <p className="text-[10px] text-muted-foreground">
              {Object.values(connectedChannels).filter(Boolean).length} de {integrationChannels.length} canales conectados
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowIntegrations(false)} className="text-xs text-muted-foreground">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
