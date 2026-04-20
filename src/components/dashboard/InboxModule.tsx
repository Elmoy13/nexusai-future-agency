import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareWarning, Send, Loader2, Bot, ChevronDown, Building2, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/contexts/AgencyContext";

const WEBHOOK_URL = "https://steady-potential-drug-advances.trycloudflare.com/api/webhook/chat";
const STORAGE_KEY = "inbox_selected_brand_id";
const REQUEST_TIMEOUT_MS = 10_000;

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Message {
  role: "user" | "agent";
  text: string;
}

const InboxModule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentAgencyId } = useAgency();

  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [webhookDown, setWebhookDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load brands of current agency
  useEffect(() => {
    if (!currentAgencyId) return;
    (async () => {
      setBrands(null);
      const { data } = await supabase
        .from("brands")
        .select("id, name, logo_url")
        .eq("agency_id", currentAgencyId)
        .order("name");

      const list = (data as Brand[]) ?? [];
      setBrands(list);

      if (list.length > 0) {
        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = stored && list.some((b) => b.id === stored);
        setSelectedBrandId(valid ? stored : list[0].id);
      } else {
        setSelectedBrandId(null);
      }
      // Reset chat al cambiar de agencia
      setMessages([]);
      setWebhookDown(false);
    })();
  }, [currentAgencyId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSelectBrand = (id: string) => {
    setSelectedBrandId(id);
    localStorage.setItem(STORAGE_KEY, id);
    setMessages([]);
    setWebhookDown(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedBrandId || !user) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsTyping(true);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: selectedBrandId,
          social_user_id: user.id,
          message: text,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.response || data.reply || data.message || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: "agent", text: reply }]);
      setWebhookDown(false);
    } catch {
      setWebhookDown(true);
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "⚠️ El agente está desconectado en este momento. Intenta más tarde." },
      ]);
    } finally {
      clearTimeout(timeout);
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    setWebhookDown(false);
    setMessages((prev) => prev.filter((m) => !m.text.startsWith("⚠️")));
  };

  const selectedBrand = brands?.find((b) => b.id === selectedBrandId) ?? null;

  // Empty state: no brands in agency
  if (brands !== null && brands.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            <MessageSquareWarning className="inline icon-neon text-cyan-glow mr-2" size={24} />
            Inbox Autónomo
          </h2>
        </div>
        <div className="glass-strong rounded-2xl p-12 text-center space-y-4 border border-border/30">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Building2 size={28} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Crea una marca primero</h3>
            <p className="text-sm text-muted-foreground mt-1">
              El Inbox necesita estar asociado a una marca para responder mensajes.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")}>Ir a Marcas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <MessageSquareWarning className="inline icon-neon text-cyan-glow mr-2" size={24} />
          Inbox Autónomo
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Chat con el agente RAG omnicanal en tiempo real.
        </p>
      </div>

      {/* Demo banner */}
      <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 border border-amber-500/20 bg-amber-500/5">
        <span className="text-base">🧪</span>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-amber-400">Modo demo</span> — este inbox aún no está conectado a redes sociales reales.
          Pronto podrás recibir mensajes de Instagram, WhatsApp y TikTok.
        </p>
      </div>

      {/* Brand selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Marca activa:</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/40 text-sm text-foreground transition disabled:opacity-50" disabled={!brands || brands.length <= 1}>
            {selectedBrand?.logo_url ? (
              <img src={selectedBrand.logo_url} alt={selectedBrand.name} className="w-5 h-5 rounded object-cover" />
            ) : (
              <Building2 size={14} className="text-primary" />
            )}
            <span className="font-medium truncate max-w-[180px]">
              {selectedBrand?.name ?? (brands === null ? "Cargando…" : "Selecciona marca")}
            </span>
            {brands && brands.length > 1 && <ChevronDown size={12} className="text-muted-foreground" />}
          </DropdownMenuTrigger>
          {brands && brands.length > 1 && (
            <DropdownMenuContent align="start" className="w-64 bg-card border-border">
              <DropdownMenuLabel>Tus marcas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {brands.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => handleSelectBrand(b.id)}
                  className={b.id === selectedBrandId ? "bg-primary/10 text-primary" : ""}
                >
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-5 h-5 rounded object-cover mr-2" />
                  ) : (
                    <Building2 size={14} className="mr-2 opacity-70" />
                  )}
                  <span className="truncate">{b.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>

        <span className="text-xs text-muted-foreground font-medium ml-2">Canal:</span>
        <span className="px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-xs text-muted-foreground">
          Webhook general
        </span>
      </div>

      {/* Webhook down banner */}
      {webhookDown && (
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-destructive/30 bg-destructive/5">
          <AlertTriangle size={16} className="text-destructive shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            El agente está desconectado en este momento.
          </p>
          <Button onClick={handleRetry} variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <RefreshCw size={12} /> Reintentar
          </Button>
        </div>
      )}

      <div className="glass-strong rounded-2xl flex flex-col flex-1 min-h-[460px] overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground/40 pt-20">
              <Bot size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">Envía un mensaje para iniciar la conversación con el agente IA.</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-muted/30 border border-border/30 text-foreground"
                      : "bg-primary/10 border border-primary/20 text-foreground glow-border"
                  }`}
                >
                  {msg.role === "agent" && (
                    <span className="text-[10px] font-mono text-cyan-glow bg-cyan-glow/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                      IA Autónoma
                    </span>
                  )}
                  <p className={msg.role === "agent" ? "mt-1" : ""}>{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-cyan-glow text-sm">
              <Loader2 size={14} className="animate-spin" />
              Agente escribiendo...
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/20 p-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={selectedBrandId ? "Escribe un mensaje..." : "Selecciona una marca primero"}
            disabled={!selectedBrandId}
            className="flex-1 bg-muted/20 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim() || !selectedBrandId}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl px-4 py-2.5 transition-all duration-200 hover:glow-cyan disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InboxModule;
