import { useState, useRef, useEffect } from "react";
import { MessageSquareWarning, Send, Loader2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = "https://rat-reflect-dad-sensitivity.trycloudflare.com";

interface Message {
  role: "user" | "agent";
  text: string;
}

const InboxModule = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE_URL}/api/webhook/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: "28b1c920-f35c-4a62-b510-bd41620d9dcd",
          social_user_id: "demo_user",
          message: text,
        }),
      });

      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      const reply = data.response || data.reply || data.message || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: "agent", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "agent", text: "⚠️ Error de conexión con el agente RAG." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <MessageSquareWarning className="inline icon-neon text-cyan-glow mr-2" size={24} />
          Inbox Autónomo
        </h2>
        <p className="text-muted-foreground mt-1">Chat con el agente RAG omnicanal en tiempo real.</p>
      </div>

      <div className="glass-strong rounded-2xl flex flex-col flex-1 min-h-[500px] overflow-hidden">
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
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-muted/20 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
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
