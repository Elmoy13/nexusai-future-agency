import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CreativeAgentChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  isGenerating: boolean;
  generatingStatus?: string;
  brandDetected: boolean;
}

const CreativeAgentChat = ({
  messages,
  onSendMessage,
  isThinking,
  isGenerating,
  generatingStatus,
  brandDetected,
}: CreativeAgentChatProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking, isGenerating]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput("");
    onSendMessage(text);
  }, [input, isThinking, onSendMessage]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[380px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-secondary/30">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-primary flex items-center justify-center shadow-md">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Nano Banano Content Agent</p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online · IA Creativa
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-md"
                  : "bg-secondary/60 border border-border/40 text-foreground rounded-tl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-1 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0 text-foreground [&_strong]:text-foreground [&_a]:text-primary">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User size={12} className="text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {isThinking && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={12} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm bg-secondary/60 border border-border/40 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Pensando...
              </span>
            </div>
          </motion.div>
        )}

        {/* Generating status */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
              <Loader2 size={12} className="text-white animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm bg-secondary/60 border border-border/40 text-muted-foreground">
              <span className="animate-pulse">{generatingStatus || "Generando contenido..."}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={!brandDetected ? "Sube tu logo primero..." : "Escribe aquí..."}
            disabled={isThinking}
            className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl px-3.5 py-2.5 transition-all disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreativeAgentChat;
