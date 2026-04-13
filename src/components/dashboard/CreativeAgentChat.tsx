import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Loader2, Sparkles, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "agent" | "user";
  text: string;
  type?: "normal" | "summary" | "tone-buttons";
}

type ChatStep = "waiting-logo" | "question-1" | "question-2" | "question-3" | "ready";

interface CampaignBrief {
  description: string;
  tone: string;
  extras: string;
  isComplete: boolean;
}

interface CreativeAgentChatProps {
  onBriefComplete: (brief: CampaignBrief) => void;
  isGenerating: boolean;
  brandDetected: boolean;
  brandPalette?: string[];
  brandFont?: string;
  platforms: Record<string, boolean>;
  frequency: string;
  objective: string;
  generatingStatus?: string;
  productImageCount?: number;
}

/* ── Color describer ── */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s, l };
}

function describeColor(hex: string): string {
  try {
    const { h, s, l } = hexToHSL(hex);
    let name = "";
    if (s < 0.1) {
      if (l < 0.3) return "negro";
      if (l < 0.7) return "gris";
      return "blanco";
    }
    if (h < 15 || h >= 345) name = "rojo";
    else if (h < 45) name = "naranja";
    else if (h < 70) name = "amarillo";
    else if (h < 160) name = "verde";
    else if (h < 200) name = "cian";
    else if (h < 260) name = "azul";
    else if (h < 300) name = "púrpura";
    else name = "rosa";

    if (l < 0.35) return `${name} profundo`;
    if (l > 0.7) return `${name} claro`;
    if (s > 0.7) return `${name} intenso`;
    return name;
  } catch { return "color"; }
}

function describePalette(palette: string[]): string {
  const described = palette.slice(0, 3).map(describeColor);
  if (described.length <= 1) return described[0] || "colores de marca";
  const last = described.pop();
  return `${described.join(", ")} y ${last}`;
}

const TONE_OPTIONS = [
  { emoji: "🎩", label: "Elegante y premium" },
  { emoji: "😄", label: "Divertido y casual" },
  { emoji: "📊", label: "Informativo y directo" },
  { emoji: "🔥", label: "Audaz y disruptivo" },
];

const LOADING_MESSAGES = [
  "🔗 Conectando con Vertex AI...",
  "🧠 Construyendo prompt técnico...",
  "🎨 Generando arte publicitario...",
];

const CreativeAgentChat = ({
  onBriefComplete,
  isGenerating,
  brandDetected,
  brandPalette = [],
  brandFont = "Montserrat",
  platforms,
  frequency,
  objective,
  generatingStatus,
  productImageCount = 0,
}: CreativeAgentChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", text: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**. Vamos a crear contenido visual increíble juntos.\n\n📸 **Primero sube tu logo** en el panel de Brand Assets para que pueda analizar tu marca. 👈" },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<ChatStep>("waiting-logo");
  const [brief, setBrief] = useState<CampaignBrief>({ description: "", tone: "", extras: "", isComplete: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const brandDetectedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (!isGenerating) { setLoadingMsgIdx(0); return; }
    const interval = setInterval(() => setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // React to brand detection
  const brandDetectedRef = useRef(false);
  useEffect(() => {
    if (brandDetected && !brandDetectedRef.current) {
      brandDetectedRef.current = true;
      const colorDesc = describePalette(brandPalette);
      const welcomeMsg = `🎨 ¡Excelente! Ya analicé tu logo. Detecté una paleta con tonos **${colorDesc}** y te sugerí **${brandFont}**.\n\nAhora cuéntame sobre tu campaña: **¿Qué producto o servicio quieres promocionar? ¿Cuál es el mensaje principal?**`;
      setMessages(prev => [...prev, { role: "agent", text: welcomeMsg }]);
      setStep("question-1");
    }
  }, [brandDetected, brandPalette, brandFont]);

  // React to product images
  const prevProductCountRef = useRef(0);
  useEffect(() => {
    if (productImageCount > 0 && productImageCount !== prevProductCountRef.current) {
      prevProductCountRef.current = productImageCount;
      addAgentMessage(`📸 ¡Perfecto! Ya tengo **${productImageCount} foto(s)** de tu producto. Las voy a usar como referencia para que tus posts se vean increíbles con tu producto REAL, no imágenes genéricas. 🔥`);
    }
    if (productImageCount === 0 && prevProductCountRef.current > 0) {
      prevProductCountRef.current = 0;
    }
  }, [productImageCount, addAgentMessage]);

  const addAgentMessage = useCallback((text: string, type: ChatMessage["type"] = "normal") => {
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "agent", text, type }]);
    }, 500);
  }, []);

  const handleSend = useCallback((overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text) return;

    // Block if no logo
    if (step === "waiting-logo") {
      setMessages(prev => [...prev, { role: "user", text }]);
      setInput("");
      addAgentMessage("🤖 ¡Primero sube tu logo en el panel de **Brand Assets**! Así puedo analizar tu marca y crear contenido que se vea increíble con tus colores. 👈");
      return;
    }

    if (step === "ready") return;

    setMessages(prev => [...prev, { role: "user", text }]);
    if (!overrideText) setInput("");

    if (step === "question-1") {
      setBrief(prev => ({ ...prev, description: text }));
      setStep("question-2");
      addAgentMessage("¡Genial! 🎯 **¿Qué tono quieres para tus posts?**");
      // Add tone buttons after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "agent", text: "", type: "tone-buttons" }]);
      }, 800);
    } else if (step === "question-2") {
      setBrief(prev => ({ ...prev, tone: text }));
      setStep("question-3");
      addAgentMessage("✨ Último paso: **¿hay algo específico que quieras incluir?** Por ejemplo: un descuento, una fecha, un hashtag, un call-to-action especial...\n\n(Puedes escribir \"no, así está bien\" si no hay nada adicional)");
    } else if (step === "question-3") {
      const finalBrief: CampaignBrief = { description: brief.description, tone: brief.tone, extras: text, isComplete: true };
      setBrief(finalBrief);
      setStep("ready");

      const activePlatforms = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
      const platformNames = activePlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ") || "Ninguna";
      const freqLabel = { "3-week": "3/semana", "5-week": "5/semana", "daily": "Diario" }[frequency] || frequency;
      const objLabel = { engagement: "Engagement", conversion: "Conversión", awareness: "Awareness" }[objective] || objective;
      const colorDesc = describePalette(brandPalette);

      const summary = `🚀 **¡Listo! Ya tengo todo:**\n\n📋 **Campaña:** ${brief.description}\n🎨 **Marca:** ${colorDesc} + ${brandFont}\n🎯 **Tono:** ${finalBrief.tone}\n📱 **Plataformas:** ${platformNames}\n📅 **Frecuencia:** ${freqLabel} | **Objetivo:** ${objLabel}${finalBrief.extras.toLowerCase() !== "no" && finalBrief.extras.toLowerCase() !== "no, así está bien" ? `\n💡 **Extras:** ${finalBrief.extras}` : ""}\n\nDale click a **'Generar'** cuando estés listo 🚀`;

      setTimeout(() => {
        setMessages(prev => [...prev, { role: "agent", text: summary, type: "summary" }]);
        onBriefComplete(finalBrief);
      }, 600);
    }
  }, [input, step, brief, addAgentMessage, onBriefComplete, platforms, frequency, objective, brandPalette, brandFont]);

  const handleToneSelect = useCallback((tone: string) => {
    handleSend(tone);
  }, [handleSend]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[340px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-secondary/30">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-primary flex items-center justify-center shadow-md">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Nano Banano Content Agent</p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online · Agente Creativo IA
          </p>
        </div>
        {brandDetected && (
          <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
              <ImageIcon size={10} /> Logo detectado
            </span>
          </div>
        )}
        {step === "ready" && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30"
          >
            <span className="text-[10px] font-semibold text-emerald-400">✓ Brief completo</span>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => {
            // Tone buttons special render
            if (msg.type === "tone-buttons") {
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 flex-wrap pl-8"
                >
                  {TONE_OPTIONS.map(opt => (
                    <button key={opt.label} onClick={() => step === "question-2" && handleToneSelect(`${opt.emoji} ${opt.label}`)}
                      disabled={step !== "question-2"}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/5 text-foreground hover:bg-primary/15 hover:border-primary/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </motion.div>
              );
            }

            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "agent" && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.type === "summary"
                    ? "bg-primary/5 border-2 border-primary/20 text-foreground rounded-xl"
                    : msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-md"
                    : "bg-secondary/60 border border-border/40 text-foreground rounded-tl-md"
                }`}>
                  {msg.text.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1" : ""}>
                      {line.split(/(\*\*.*?\*\*)/).map((segment, k) =>
                        segment.startsWith("**") && segment.endsWith("**") ? (
                          <strong key={k} className="font-bold text-foreground">{segment.slice(2, -2)}</strong>
                        ) : (
                          <span key={k}>{segment}</span>
                        )
                      )}
                    </p>
                  ))}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isGenerating && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
              <Loader2 size={12} className="text-white animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm bg-secondary/60 border border-border/40 text-muted-foreground">
              <span className="animate-pulse">{generatingStatus || LOADING_MESSAGES[loadingMsgIdx]}</span>
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
            placeholder={step === "ready" ? "Brief completado ✓" : step === "waiting-logo" ? "Sube tu logo primero..." : "Escribe tu respuesta..."}
            disabled={step === "ready"}
            className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || step === "ready"}
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
