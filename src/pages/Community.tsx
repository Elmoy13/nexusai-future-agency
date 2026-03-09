import { useState, useRef, useEffect } from "react";
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

/* ── Types ── */
interface ChatContact {
  id: string;
  name: string;
  platform: "whatsapp" | "instagram" | "messenger";
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  aiActive: boolean;
  sentiment: "complaint" | "lead" | "question";
  slaAlert?: string;
  type: "dm" | "comment" | "mention" | "review";
}

interface Message {
  id: string;
  sender: "user" | "ai" | "agent";
  content: string;
  timestamp: string;
}

interface KnowledgeFile {
  id: string;
  name: string;
  size: string;
}

/* ── Mock Data ── */
const mockContacts: ChatContact[] = [
  {
    id: "1", name: "Carlos Ruiz", platform: "whatsapp",
    lastMessage: "¿El dron puede volar con lluvia?", timestamp: "hace 2 min",
    unread: true, aiActive: true, sentiment: "lead", type: "dm",
  },
  {
    id: "2", name: "María González", platform: "instagram",
    lastMessage: "Me interesa el modelo X10 Pro", timestamp: "hace 15 min",
    unread: true, aiActive: true, sentiment: "lead", type: "dm",
  },
  {
    id: "3", name: "Tech Reviews MX", platform: "messenger",
    lastMessage: "¿Tienen programa de afiliados?", timestamp: "hace 1 hora",
    unread: false, aiActive: false, sentiment: "question", slaAlert: "Esperando 10m", type: "dm",
  },
  {
    id: "4", name: "Andrés López", platform: "whatsapp",
    lastMessage: "Esto es un desastre, mi dron llegó roto", timestamp: "hace 25 min",
    unread: true, aiActive: false, sentiment: "complaint", slaAlert: "Esperando 10m", type: "dm",
  },
  {
    id: "5", name: "Laura Soto", platform: "instagram",
    lastMessage: "¡Increíble toma! ¿Qué dron usaron?", timestamp: "hace 40 min",
    unread: false, aiActive: true, sentiment: "lead", type: "comment",
  },
  {
    id: "6", name: "DronesMX", platform: "instagram",
    lastMessage: "Nos encantaría hacer un review del X10", timestamp: "hace 2 horas",
    unread: false, aiActive: true, sentiment: "question", type: "mention",
  },
];

const mockMessages: Message[] = [
  { id: "1", sender: "user", content: "Hola, tengo una pregunta sobre el Drone X10", timestamp: "10:30" },
  { id: "2", sender: "ai", content: "¡Hola Carlos! 👋 Soy el asistente virtual de Aero Dynamics. Estaré encantado de ayudarte con cualquier duda sobre el Drone X10. ¿Qué te gustaría saber?", timestamp: "10:30" },
  { id: "3", sender: "user", content: "¿El dron puede volar con lluvia? Necesito usarlo para filmaciones en exteriores", timestamp: "10:32" },
  { id: "4", sender: "ai", content: "¡Excelente pregunta! El Drone X10 cuenta con certificación IP68, lo que significa que es resistente al agua y polvo. Puede operar bajo lluvia ligera a moderada sin problemas. Para condiciones más extremas, recomendamos revisar el manual de operaciones incluido. ¿Te gustaría conocer más especificaciones técnicas?", timestamp: "10:32" },
];

const mockKnowledgeFiles: KnowledgeFile[] = [
  { id: "1", name: "manual_drone_x10.pdf", size: "2.4 MB" },
  { id: "2", name: "politicas_de_devolucion.pdf", size: "156 KB" },
  { id: "3", name: "especificaciones_tecnicas.pdf", size: "890 KB" },
];

/* ── Helpers ── */
const getSentimentDot = (s: ChatContact["sentiment"]) => {
  switch (s) {
    case "complaint": return "bg-red-500 shadow-[0_0_8px_hsl(0_84%_60%/0.6)]";
    case "lead": return "bg-green-500 shadow-[0_0_8px_hsl(142_71%_45%/0.6)]";
    case "question": return "bg-muted-foreground/50";
  }
};

const getSentimentLabel = (s: ChatContact["sentiment"]) => {
  switch (s) {
    case "complaint": return "😡 Queja";
    case "lead": return "🤑 Lead";
    case "question": return "❓ Duda";
  }
};

const getPlatformIcon = (platform: string, size = 12) => {
  switch (platform) {
    case "whatsapp": return <Phone size={size} className="text-green-500" />;
    case "instagram": return <Instagram size={size} className="text-pink-500" />;
    case "messenger": return <MessageSquare size={size} className="text-blue-500" />;
    default: return null;
  }
};

/* ── Component ── */
const Community = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inboxTab, setInboxTab] = useState<"dm" | "comment" | "mention" | "review">("dm");
  const [selectedContact, setSelectedContact] = useState<ChatContact>(mockContacts[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(true);
  const [clientTags, setClientTags] = useState<string[]>(["Lead Caliente"]);

  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(mockKnowledgeFiles);
  const [aiTemperature, setAiTemperature] = useState([30]);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [connectedChannels, setConnectedChannels] = useState<Record<string, boolean>>({});
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredContacts = mockContacts.filter((c) => c.type === inboxTab);

  const handleSendMessage = (content?: string) => {
    const text = content || inputMessage.trim();
    if (!text) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: isManualMode ? "agent" : (content ? "ai" : "user"),
      content: text,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    if (content) { setShowSuggestion(false); return; }

    if (!isManualMode) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          content: "Gracias por tu mensaje. Basándome en nuestra documentación, puedo confirmar que el Drone X10 es ideal para tus necesidades. ¿Hay algo más en lo que pueda ayudarte?",
          timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        }]);
        setIsTyping(false);
      }, 1500);
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
        </div>
      </div>

      {/* ═══ 3-COLUMN LAYOUT ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── COL 1: SMART INBOX (30%) ── */}
        <div className="w-[30%] border-r border-border/20 flex flex-col bg-card/30">
          {/* Triage Tabs */}
          <div className="px-3 pt-3">
            <div className="flex gap-1 bg-muted/20 rounded-lg p-1">
              {[
                { key: "dm" as const, label: "DMs", icon: MessageSquare },
                { key: "comment" as const, label: "Comentarios", icon: MessageCircle },
                { key: "mention" as const, label: "Menciones", icon: AtSign },
                { key: "review" as const, label: "Reseñas", icon: Star },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setInboxTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all",
                    inboxTab === tab.key
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 h-8 text-xs bg-muted/20 border-border/30" />
            </div>
          </div>

          {/* Contact List / Tickets */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {filteredContacts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground/40">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Sin conversaciones en esta categoría</p>
              </div>
            )}

            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                onClick={() => { setSelectedContact(contact); setShowSuggestion(true); }}
                className={cn(
                  "p-3 rounded-xl cursor-pointer transition-all group",
                  selectedContact.id === contact.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/15 border border-transparent"
                )}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-2.5">
                  {/* Sentiment Dot */}
                  <div className="pt-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", getSentimentDot(contact.sentiment))} />
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[11px] font-semibold">
                        {contact.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card flex items-center justify-center border border-border/40">
                      {getPlatformIcon(contact.platform, 9)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-xs">{contact.name}</span>
                      <span className="text-[9px] text-muted-foreground">{contact.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{contact.lastMessage}</p>

                    {/* Badges Row */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className={cn(
                        "text-[8px] py-0 px-1.5 h-4",
                        contact.aiActive
                          ? "border-primary/30 text-primary bg-primary/10"
                          : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      )}>
                        {contact.aiActive ? "🤖 AI" : "🧑‍💻 Humano"}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] py-0 px-1.5 h-4 border-border/30 text-muted-foreground">
                        {getSentimentLabel(contact.sentiment)}
                      </Badge>
                      {contact.slaAlert && (
                        <span className="text-[8px] text-red-400 font-medium animate-pulse">
                          ⏱ {contact.slaAlert}
                        </span>
                      )}
                    </div>
                  </div>

                  {contact.unread && <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-1.5 shrink-0" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── COL 2: COMMAND CENTER (45%) ── */}
        <div className="w-[45%] flex flex-col bg-background/50">
          {/* Chat Header */}
          <div className="h-14 border-b border-border/20 px-4 flex items-center justify-between bg-card/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={cn("w-2 h-2 rounded-full absolute -left-4 top-1/2 -translate-y-1/2", getSentimentDot(selectedContact.sentiment))} />
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-[10px] font-semibold">
                    {selectedContact.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{selectedContact.name}</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {getPlatformIcon(selectedContact.platform, 10)}
                  <span className="capitalize">{selectedContact.platform}</span>
                  <span className="text-border">·</span>
                  <span>{getSentimentLabel(selectedContact.sentiment)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isManualMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsManualMode(!isManualMode)}
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

          {/* Unified Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.sender === "user" ? "justify-start" : "justify-end")}
                >
                  <div className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                    msg.sender === "user" && "bg-muted/25 border border-border/25",
                    msg.sender === "ai" && "bg-gradient-to-br from-primary/15 to-cyan-500/10 border border-primary/20",
                    msg.sender === "agent" && "bg-amber-500/15 border border-amber-500/25"
                  )}>
                    {msg.sender !== "user" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        {msg.sender === "ai" ? (
                          <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Bot size={9} /> IA Autónoma
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <UserCheck size={9} /> Agente
                          </span>
                        )}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <span className="text-[9px] text-muted-foreground/60 mt-1 block text-right">{msg.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span className="text-xs text-primary">NexusAI escribiendo...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ✨ AI Suggested Draft */}
          {showSuggestion && !isManualMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-2 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-cyan-500/5 p-3"
              style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.1), inset 0 1px 0 hsl(var(--primary) / 0.1)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-primary" />
                <span className="text-[11px] font-semibold text-primary">Sugerencia de NexusAI</span>
                <span className="text-[9px] text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded-full">Basado en Manual_Drone.pdf</span>
              </div>
              <p className="text-[12px] text-foreground/80 leading-relaxed mb-3">
                "¡Hola Carlos! Sí, el Drone X10 es resistente al agua con certificación IP68. Puede volar bajo lluvia ligera sin problemas. ¿Te gustaría ver un video de prueba en condiciones reales?"
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-[11px] bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                  onClick={() => handleSendMessage("¡Hola Carlos! Sí, el Drone X10 es resistente al agua con certificación IP68. Puede volar bajo lluvia ligera sin problemas. ¿Te gustaría ver un video de prueba en condiciones reales?")}
                >
                  <Send size={11} className="mr-1" /> Enviar esto
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground">
                  <PenLine size={11} className="mr-1" /> Editar
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground">
                  <RefreshCw size={11} className="mr-1" /> Otra opción
                </Button>
              </div>
            </motion.div>
          )}

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
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
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
                    {selectedContact.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{selectedContact.name}</h3>
                <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  {getPlatformIcon(selectedContact.platform, 12)}
                  <span className="capitalize">{selectedContact.platform}</span>
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
    </div>
  );
};

export default Community;
