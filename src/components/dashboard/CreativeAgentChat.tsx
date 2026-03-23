import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Loader2, Sparkles, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "agent" | "user";
  text: string;
}

type ChatStep = "brand" | "audience" | "style" | "ready";

const AGENT_NAME = "Nano Banano Strategist";

const QUESTIONS: Record<Exclude<ChatStep, "ready">, string> = {
  brand:
    "¡Hola! 👋 Soy tu **Nano Banano Strategist**. Vamos a crear contenido visual increíble juntos.\n\nPrimero, cuéntame: **¿Qué es tu marca y qué la hace especial?**",
  audience:
    "¡Perfecto! 🎯 Ahora necesito saber: **¿Quién es tu público objetivo?**",
  style:
    "¡Genial! 🎨 Última pregunta: **¿Qué estilo visual quieres para tu campaña?**\n\nAlgunas ideas:\n• 🌃 Neón Cyberpunk\n• ✨ Minimalista Elegante\n• 📸 Fotografía Callejera\n• 🎉 Fiesta & Energía\n• 🏔️ Lifestyle Premium\n\n¿O describe tu propio estilo!",
};

const LOADING_MESSAGES = [
  "🔗 Conectando con Vertex AI...",
  "🧠 Construyendo prompt técnico...",
  "🎨 Generando arte publicitario...",
];

interface CreativeAgentChatProps {
  onPromptReady: (payload: {
    prompt: string;
    brandContext: string;
    audience: string;
    style: string;
  }) => void;
  isGenerating: boolean;
  hasContextImage: boolean;
  generatingStatus?: string;
}

const CreativeAgentChat = ({
  onPromptReady,
  isGenerating,
  hasContextImage,
  generatingStatus,
}: CreativeAgentChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", text: QUESTIONS.brand },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<ChatStep>("brand");
  const [answers, setAnswers] = useState<{
    brand: string;
    audience: string;
    style: string;
  }>({ brand: "", audience: "", style: "" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isGenerating]);

  // Cycle loading messages while generating
  useEffect(() => {
    if (!isGenerating) { setLoadingMsgIdx(0); return; }
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const advanceStep = useCallback(
    (currentStep: ChatStep, userText: string) => {
      const newAnswers = { ...answers, [currentStep]: userText };
      setAnswers(newAnswers);

      let nextStep: ChatStep;
      if (currentStep === "brand") nextStep = "audience";
      else if (currentStep === "audience") nextStep = "style";
      else nextStep = "ready";

      setTimeout(() => {
        if (nextStep === "ready") {
          const readyMsg = hasContextImage
            ? "🚀 ¡Listo! Ya tengo toda la información. He detectado tu **logo en Brand Assets** y lo integraré como imagen de referencia.\n\nHaz clic abajo para generar tu arte publicitario."
            : "🚀 ¡Listo! Ya tengo toda la información que necesito.\n\n⚠️ **No detecté un logo** en Brand Assets. Si quieres integrar tu marca, súbelo en el panel izquierdo antes de generar.\n\nHaz clic abajo para generar tu arte publicitario.";
          setMessages((prev) => [...prev, { role: "agent", text: readyMsg }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "agent", text: QUESTIONS[nextStep] },
          ]);
        }
        setStep(nextStep);
      }, 600);
    },
    [answers, hasContextImage]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || step === "ready") return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    advanceStep(step, text);
  }, [input, step, advanceStep]);

  const handleGenerate = useCallback(() => {
    const sceneDescription = `a ${answers.style} advertising scene featuring ${answers.brand}, targeting ${answers.audience}`;

    let prompt: string;
    if (hasContextImage) {
      prompt = `A high-end, photorealistic advertisement mockup of ${sceneDescription}. The complete visual appearance, lines, icon, and precise typography from [1] (the brand logo) must be flawlessly preserved without any artistic re-interpretation or modification. The exact design [1] must be integrated not as a flat overlay, but embedded with depth, texture, and realistic lighting into the scene. The model must generate real shadows and highlights over the embedded logo [1] as if it were a physical object, not a post-process overlay. Preserve text legibility.`;
    } else {
      prompt = `Create a high-end, photorealistic advertisement for ${sceneDescription}. Cinematic lighting, professional composition, depth of field.`;
    }

    onPromptReady({
      prompt,
      brandContext: answers.brand,
      audience: answers.audience,
      style: answers.style,
    });
  }, [answers, hasContextImage, onPromptReady]);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[320px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-secondary/30">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-primary flex items-center justify-center shadow-md">
          <Bot size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{AGENT_NAME}</p>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online · Agente Creativo IA
          </p>
        </div>
        {hasContextImage && (
          <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
              <ImageIcon size={10} /> Logo detectado
            </span>
          </div>
        )}
        {step === "ready" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30"
          >
            <span className="text-[10px] font-semibold text-emerald-400">
              ✓ Brief completo
            </span>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "agent" && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-md"
                    : "bg-secondary/60 border border-border/40 text-foreground rounded-tl-md"
                }`}
              >
                {msg.text.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1" : ""}>
                    {line.split(/(\*\*.*?\*\*)/).map((segment, k) =>
                      segment.startsWith("**") && segment.endsWith("**") ? (
                        <strong key={k} className="font-bold text-foreground">
                          {segment.slice(2, -2)}
                        </strong>
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
          ))}
        </AnimatePresence>

        {/* Generating status inside chat */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 justify-start"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shrink-0 mt-0.5">
              <Loader2 size={12} className="text-white animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm bg-secondary/60 border border-border/40 text-muted-foreground">
              <span className="animate-pulse">{generatingStatus || LOADING_MESSAGES[loadingMsgIdx]}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input / Generate Button */}
      <div className="border-t border-border p-3">
        {step === "ready" ? (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-11 text-sm font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-primary hover:from-violet-700 hover:via-purple-700 hover:to-primary/80 shadow-lg shadow-primary/25 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {LOADING_MESSAGES[loadingMsgIdx]}
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                ✨ Generar Arte Publicitario
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Escribe tu respuesta..."
              className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl px-3.5 py-2.5 transition-all disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeAgentChat;
