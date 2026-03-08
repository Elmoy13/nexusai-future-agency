import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Zap, FileText, Send, Layers, Target, Users, MessageSquare, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const initialMessages = [
  {
    role: "agent" as const,
    text: "Hola. Soy tu Agente Estratega. Para comenzar, cuéntame sobre el producto estrella de tu nuevo cliente y a quién queremos venderle.",
  },
];

const docSections = [
  { icon: Target, title: "Público Primario", content: "Ejecutivos C-Level en empresas de tecnología, 35-55 años, interesados en innovación y eficiencia operativa." },
  { icon: Users, title: "Público Secundario", content: "Gerentes de marketing digital en startups de alto crecimiento, orientados a performance y resultados medibles." },
  { icon: MessageSquare, title: "Tono de Comunicación", content: "Profesional pero accesible. Autoridad técnica con calidez humana. Evitar jerga excesiva." },
  { icon: Palette, title: "Paleta de Colores", content: null },
];

const BriefCreator = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "agent" as const, text: input }]);
    setInput("");
    setIsGenerating(true);
    setGenerationStep(0);

    const steps = [1, 2, 3, 4];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setGenerationStep(step);
        if (step === 4) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                role: "agent" as const,
                text: "Perfecto. He analizado tu input y estoy generando el Brand Hub. Puedes ver el progreso en tiempo real a la derecha. ¿Hay algo que quieras ajustar?",
              },
            ]);
          }, 800);
        }
      }, (i + 1) * 1400);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[70vh]"
    >
      {/* LEFT: Agent Chat */}
      <Card className="bg-card/60 border-border/40 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agente Estratega</h3>
            <p className="text-[11px] text-muted-foreground">Powered by NexusAI</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">Online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-secondary/60 text-foreground/90 rounded-tl-md"
                      : "bg-primary/15 text-primary border border-primary/20 rounded-tr-md"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-border/40">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Describe el producto, audiencia, tono..."
              className="bg-secondary/30 border-border/30 text-sm h-11 placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-11 w-11 shrink-0 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              size="icon"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* RIGHT: Live Document */}
      <Card className="bg-card/60 border-border/40 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <FileText size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Documento Vivo</h3>
            <p className="text-[11px] text-muted-foreground">Brand Hub en construcción</p>
          </div>
          {isGenerating && (
            <div className="ml-auto flex items-center gap-1.5">
              <Layers size={13} className="text-primary animate-pulse" />
              <span className="text-[10px] text-primary font-medium">Generando...</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isGenerating && generationStep === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
              <div className="w-16 h-16 rounded-2xl bg-secondary/40 border border-border/30 flex items-center justify-center">
                <Sparkles size={28} className="text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground/60">El Brand Hub se generará aquí</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Comienza la conversación con el Agente para activar la generación</p>
              </div>
            </div>
          ) : (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Generando Brand Hub...</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Extrayendo insights de la conversación</p>
              </motion.div>

              {docSections.map((section, i) => {
                const isRevealed = generationStep > i;
                const isActive = generationStep === i + 1 && isGenerating;
                const SectionIcon = section.icon;

                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isRevealed || isActive ? 1 : 0.3, y: 0 }}
                    transition={{ duration: 0.4, delay: isRevealed ? 0 : 0.1 }}
                    className={`rounded-xl border p-4 transition-all duration-500 ${
                      isRevealed
                        ? "bg-secondary/30 border-primary/20"
                        : isActive
                        ? "bg-secondary/20 border-primary/40 shadow-md shadow-primary/5"
                        : "bg-secondary/10 border-border/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <SectionIcon size={15} className={isRevealed ? "text-primary" : "text-muted-foreground/40"} />
                      <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">{section.title}</h4>
                      {isActive && (
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="ml-auto">
                          <span className="text-[10px] text-primary font-mono">analizando...</span>
                        </motion.div>
                      )}
                      {isRevealed && <span className="ml-auto text-[10px] text-emerald-400">✓</span>}
                    </div>

                    {isRevealed && section.content ? (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="text-sm text-foreground/70 leading-relaxed">
                        {section.content}
                      </motion.p>
                    ) : isRevealed && !section.content ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mt-1">
                        {["hsl(var(--primary))", "hsl(200 60% 30%)", "hsl(210 20% 90%)", "hsl(160 50% 45%)", "hsl(0 0% 15%)"].map((c, ci) => (
                          <div key={ci} className="w-8 h-8 rounded-lg border border-border/30" style={{ background: c }} />
                        ))}
                      </motion.div>
                    ) : isActive ? (
                      <div className="space-y-2 mt-1">
                        <Skeleton className="h-3 w-full bg-primary/10" />
                        <Skeleton className="h-3 w-4/5 bg-primary/8" />
                        <Skeleton className="h-3 w-3/5 bg-primary/5" />
                      </div>
                    ) : (
                      <div className="space-y-2 mt-1">
                        <Skeleton className="h-3 w-full bg-muted/30" />
                        <Skeleton className="h-3 w-3/4 bg-muted/20" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BriefCreator;
