import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  platform: "whatsapp" | "instagram" | "messenger";
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  aiActive: boolean;
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

const mockContacts: ChatContact[] = [
  {
    id: "1",
    name: "Carlos Ruiz",
    platform: "whatsapp",
    lastMessage: "¿El dron puede volar con lluvia?",
    timestamp: "hace 2 min",
    unread: true,
    aiActive: true,
  },
  {
    id: "2",
    name: "María González",
    platform: "instagram",
    lastMessage: "Me interesa el modelo X10 Pro",
    timestamp: "hace 15 min",
    unread: true,
    aiActive: true,
  },
  {
    id: "3",
    name: "Tech Reviews MX",
    platform: "messenger",
    lastMessage: "¿Tienen programa de afiliados?",
    timestamp: "hace 1 hora",
    unread: false,
    aiActive: false,
  },
  {
    id: "4",
    name: "Andrés López",
    platform: "whatsapp",
    lastMessage: "Gracias por la info, lo pensaré",
    timestamp: "hace 3 horas",
    unread: false,
    aiActive: true,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "user",
    content: "Hola, tengo una pregunta sobre el Drone X10",
    timestamp: "10:30",
  },
  {
    id: "2",
    sender: "ai",
    content:
      "¡Hola Carlos! 👋 Soy el asistente virtual de Aero Dynamics. Estaré encantado de ayudarte con cualquier duda sobre el Drone X10. ¿Qué te gustaría saber?",
    timestamp: "10:30",
  },
  {
    id: "3",
    sender: "user",
    content: "¿El dron puede volar con lluvia? Necesito usarlo para filmaciones en exteriores",
    timestamp: "10:32",
  },
  {
    id: "4",
    sender: "ai",
    content:
      "¡Excelente pregunta! El Drone X10 cuenta con certificación IP68, lo que significa que es resistente al agua y polvo. Puede operar bajo lluvia ligera a moderada sin problemas. Para condiciones más extremas, recomendamos revisar el manual de operaciones incluido. ¿Te gustaría conocer más especificaciones técnicas?",
    timestamp: "10:32",
  },
];

const mockKnowledgeFiles: KnowledgeFile[] = [
  { id: "1", name: "manual_drone_x10.pdf", size: "2.4 MB" },
  { id: "2", name: "politicas_de_devolucion.pdf", size: "156 KB" },
  { id: "3", name: "especificaciones_tecnicas.pdf", size: "890 KB" },
];

const Community = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<"all" | "unread" | "human">("all");
  const [selectedContact, setSelectedContact] = useState<ChatContact>(mockContacts[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Knowledge Base State
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(mockKnowledgeFiles);
  const [aiTemperature, setAiTemperature] = useState([30]);
  const [connections, setConnections] = useState({
    whatsapp: true,
    instagram: false,
    messenger: false,
  });
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredContacts = mockContacts.filter((contact) => {
    if (filter === "unread") return contact.unread;
    if (filter === "human") return !contact.aiActive;
    return true;
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: isManualMode ? "agent" : "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    if (!isManualMode) {
      setIsTyping(true);
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          content:
            "Gracias por tu mensaje. Basándome en nuestra documentación, puedo confirmar que el Drone X10 es ideal para tus necesidades. ¿Hay algo más en lo que pueda ayudarte?",
          timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleConnect = (platform: string) => {
    setConnectingPlatform(platform);
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [platform]: true }));
      setConnectingPlatform(null);
    }, 1200);
  };

  const handleDeleteFile = (fileId: string) => {
    setKnowledgeFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp":
        return <Phone size={12} className="text-green-500" />;
      case "instagram":
        return <Instagram size={12} className="text-pink-500" />;
      case "messenger":
        return <MessageSquare size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-border/20 bg-background/50 backdrop-blur-xl flex items-center px-4 gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft size={16} />
          Dashboard
        </Button>
        <div className="h-6 w-px bg-border/30" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hexagon size={14} className="text-primary" />
          <span>Aero Dynamics</span>
          <span>/</span>
          <span className="text-foreground font-medium">Omnichannel Inbox</span>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Inbox (30%) */}
        <div className="w-[30%] border-r border-border/20 flex flex-col bg-background/30">
          {/* Inbox Header */}
          <div className="p-4 border-b border-border/20">
            <h2 className="text-lg font-semibold mb-3">Inbox Unificado</h2>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conversación..." className="pl-9 bg-muted/20 border-border/30" />
            </div>
            {/* Filters */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "Todos" },
                { key: "unread", label: "Sin leer" },
                { key: "human", label: "Requiere Humano" },
              ].map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.key as typeof filter)}
                  className={cn(
                    "text-xs",
                    filter === f.key
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-transparent border-border/30"
                  )}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "p-3 rounded-xl cursor-pointer transition-all",
                  selectedContact.id === contact.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/20 border border-transparent"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-cyan-500/20 text-sm">
                        {contact.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border border-border/30">
                      {getPlatformIcon(contact.platform)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("font-medium text-sm", contact.unread && "text-foreground")}>
                        {contact.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{contact.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] py-0 px-1.5",
                          contact.aiActive
                            ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                            : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        )}
                      >
                        {contact.aiActive ? "🤖 AI Activa" : "🧑‍💻 Humano"}
                      </Badge>
                    </div>
                  </div>
                  {contact.unread && <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-2" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 2: Live Chat (45%) */}
        <div className="w-[45%] flex flex-col bg-background/20">
          {/* Chat Header */}
          <div className="h-16 border-b border-border/20 px-4 flex items-center justify-between bg-background/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-cyan-500/20 text-xs">
                  {selectedContact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">{selectedContact.name}</h3>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {getPlatformIcon(selectedContact.platform)}
                  <span className="capitalize">{selectedContact.platform}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isManualMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsManualMode(!isManualMode)}
                className={cn(
                  "text-xs gap-2",
                  isManualMode
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                    : "border-border/30"
                )}
              >
                {isManualMode ? <UserCheck size={14} /> : <User size={14} />}
                {isManualMode ? "Control Manual" : "Tomar Control"}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.sender === "user" ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                      msg.sender === "user" && "bg-muted/30 border border-border/30",
                      msg.sender === "ai" &&
                        "bg-gradient-to-br from-cyan-500/20 to-primary/20 border border-cyan-500/30",
                      msg.sender === "agent" && "bg-amber-500/20 border border-amber-500/30"
                    )}
                  >
                    {msg.sender !== "user" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        {msg.sender === "ai" ? (
                          <Badge className="text-[9px] py-0 px-1.5 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            <Bot size={10} className="mr-1" />
                            IA Autónoma
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] py-0 px-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <UserCheck size={10} className="mr-1" />
                            Agente Humano
                          </Badge>
                        )}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block text-right">{msg.timestamp}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-400" />
                  <span className="text-xs text-cyan-400">IA escribiendo...</span>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/20 bg-background/50">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                <Paperclip size={18} />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={isManualMode ? "Responder como agente..." : "Escribe un mensaje..."}
                className="bg-muted/20 border-border/30"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              >
                <Send size={16} />
              </Button>
            </div>
            {isManualMode && (
              <p className="text-[10px] text-amber-400 mt-2 text-center">
                ⚠️ Modo manual activo — La IA no responderá automáticamente
              </p>
            )}
          </div>
        </div>

        {/* Column 3: Brand Brain (25%) */}
        <div className="w-[25%] border-l border-border/20 bg-background/30 flex flex-col">
          <Tabs defaultValue="connections" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border/20 bg-transparent h-12 p-0">
              <TabsTrigger
                value="connections"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Conexiones
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            {/* Connections Tab */}
            <TabsContent value="connections" className="flex-1 p-4 space-y-4 mt-0">
              <div>
                <h3 className="text-sm font-semibold mb-3">Conexiones Meta</h3>
                <div className="space-y-3">
                  {[
                    { key: "whatsapp", name: "WhatsApp Business", icon: Phone, color: "green" },
                    { key: "instagram", name: "Instagram Direct", icon: Instagram, color: "pink" },
                    { key: "messenger", name: "Messenger", icon: MessageSquare, color: "blue" },
                  ].map((platform) => (
                    <div
                      key={platform.key}
                      className={cn(
                        "p-3 rounded-xl border transition-all",
                        connections[platform.key as keyof typeof connections]
                          ? "border-green-500/30 bg-green-500/5"
                          : "border-border/30 bg-muted/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              `bg-${platform.color}-500/20`
                            )}
                          >
                            <platform.icon size={16} className={`text-${platform.color}-500`} />
                          </div>
                          <span className="text-sm font-medium">{platform.name}</span>
                        </div>
                        {connections[platform.key as keyof typeof connections] ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <Check size={12} className="mr-1" />
                            Conectado
                          </Badge>
                        ) : connectingPlatform === platform.key ? (
                          <Loader2 size={16} className="animate-spin text-primary" />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnect(platform.key)}
                            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                          >
                            Conectar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="flex-1 p-4 space-y-4 mt-0 overflow-y-auto">
              {/* Dropzone */}
              <div className="border-2 border-dashed border-border/30 rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arrastra PDFs, Manuales o FAQs aquí
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  para entrenar al Agente de Servicio
                </p>
              </div>

              {/* Uploaded Files */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">ARCHIVOS CARGADOS</h4>
                <div className="space-y-2">
                  {knowledgeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/10 border border-border/20"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <div>
                          <p className="text-xs font-medium truncate max-w-[120px]">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Temperature */}
              <div className="pt-4 border-t border-border/20">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">TEMPERATURA DE LA IA</h4>
                <div className="space-y-3">
                  <Slider value={aiTemperature} onValueChange={setAiTemperature} max={100} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>📚 Estricto (PDFs)</span>
                    <span>🎨 Creativo</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {aiTemperature[0] < 40
                      ? "Solo responde con info de documentos"
                      : aiTemperature[0] < 70
                      ? "Balance entre documentos y creatividad"
                      : "Respuestas más libres y creativas"}
                  </p>
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
