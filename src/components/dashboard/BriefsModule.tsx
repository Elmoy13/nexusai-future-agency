import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, FolderOpen, Target, Palette, Users, MessageSquare, Send, FileText, Layers, PenTool, Eye, Zap, Hexagon, Triangle, Circle, Diamond } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const brands = [
  {
    name: "TechVibe",
    icon: Hexagon,
    status: "complete" as const,
    audience: "C-Level",
    tone: "Corporativo",
    look: "Minimalista",
    color: "hsl(var(--primary))",
  },
  {
    name: "FreshBites",
    icon: Triangle,
    status: "complete" as const,
    audience: "Millennials",
    tone: "Casual & Fun",
    look: "Orgánico",
    color: "hsl(160 100% 45%)",
  },
  {
    name: "UrbanPulse",
    icon: Diamond,
    status: "adjustments" as const,
    audience: "Gen Z",
    tone: "Disruptivo",
    look: "Brutalist",
    color: "hsl(270 80% 60%)",
  },
  {
    name: "CloudNest",
    icon: Circle,
    status: "complete" as const,
    audience: "B2B SaaS",
    tone: "Técnico",
    look: "Futurista",
    color: "hsl(200 90% 55%)",
  },
];

const chatMessages = [
  {
    role: "agent" as const,
    text: "Hola. Soy tu Agente Estratega. Para comenzar, cuéntame sobre el producto estrella de tu nuevo cliente y a quién queremos venderle.",
  },
];

const BriefsModule = () => {
  const [activeTab, setActiveTab] = useState("directory");
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "agent", text: input }]);
    setInput("");
    setIsGenerating(true);
    setGenerationStep(0);

    // Simulate progressive generation
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

  const docSections = [
    { icon: Target, title: "Público Primario", content: "Ejecutivos C-Level en empresas de tecnología, 35-55 años, interesados en innovación y eficiencia operativa." },
    { icon: Users, title: "Público Secundario", content: "Gerentes de marketing digital en startups de alto crecimiento, orientados a performance y resultados medibles." },
    { icon: MessageSquare, title: "Tono de Comunicación", content: "Profesional pero accesible. Autoridad técnica con calidez humana. Evitar jerga excesiva." },
    { icon: Palette, title: "Paleta de Colores", content: null },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Estrategia y Briefs
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona el cerebro y la identidad de todos tus clientes.
            </p>
          </div>
          <TabsList className="bg-secondary/50 border border-border/50 h-11">
            <TabsTrigger value="directory" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary px-5">
              <FolderOpen size={15} className="mr-1.5" /> Directorio
            </TabsTrigger>
            <TabsTrigger value="new-brief" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary px-5">
              <PenTool size={15} className="mr-1.5" /> Entrenar Brief
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Brand Directory */}
        <TabsContent value="directory">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setActiveTab("new-brief")}
                className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold"
              >
                <Sparkles size={16} /> Entrenar Nueva Marca
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {brands.map((brand, i) => {
                const Icon = brand.icon;
                return (
                  <motion.div
                    key={brand.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.35 }}
                  >
                    <Card className="group bg-card/60 border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
                      <CardContent className="p-5 space-y-4">
                        {/* Brand header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20"
                            >
                              <Icon size={20} className="text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{brand.name}</h3>
                              <Badge
                                variant={brand.status === "complete" ? "default" : "secondary"}
                                className={`mt-1 text-[10px] px-2 py-0 h-5 font-medium ${
                                  brand.status === "complete"
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                                    : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/15"
                                }`}
                              >
                                {brand.status === "complete" ? "Estrategia Completa" : "Requiere Ajustes"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Summary tags */}
                        <div className="space-y-1.5">
                          {[
                            { label: "Público", value: brand.audience },
                            { label: "Tono", value: brand.tone },
                            { label: "Look", value: brand.look },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground w-14 shrink-0">{item.label}:</span>
                              <span className="text-foreground/80 font-medium">{item.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        <Button
                          variant="ghost"
                          className="w-full h-9 text-xs text-primary/80 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 gap-1.5"
                        >
                          <Eye size={13} /> Abrir Brand Hub
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* TAB 2: New Brief Creator */}
        <TabsContent value="new-brief">
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
                      <p className="text-sm font-medium text-muted-foreground/60">
                        El Brand Hub se generará aquí
                      </p>
                      <p className="text-xs text-muted-foreground/40 mt-1">
                        Comienza la conversación con el Agente para activar la generación
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-2"
                    >
                      <h2 className="text-lg font-bold text-foreground tracking-tight">
                        Generando Brand Hub...
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Extrayendo insights de la conversación
                      </p>
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
                            <SectionIcon
                              size={15}
                              className={isRevealed ? "text-primary" : "text-muted-foreground/40"}
                            />
                            <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                              {section.title}
                            </h4>
                            {isActive && (
                              <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="ml-auto"
                              >
                                <span className="text-[10px] text-primary font-mono">analizando...</span>
                              </motion.div>
                            )}
                            {isRevealed && (
                              <span className="ml-auto text-[10px] text-emerald-400">✓</span>
                            )}
                          </div>

                          {isRevealed && section.content ? (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                              className="text-sm text-foreground/70 leading-relaxed"
                            >
                              {section.content}
                            </motion.p>
                          ) : isRevealed && !section.content ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-2 mt-1"
                            >
                              {["hsl(var(--primary))", "hsl(200 60% 30%)", "hsl(210 20% 90%)", "hsl(160 50% 45%)", "hsl(0 0% 15%)"].map(
                                (c, ci) => (
                                  <div
                                    key={ci}
                                    className="w-8 h-8 rounded-lg border border-border/30"
                                    style={{ background: c }}
                                  />
                                )
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BriefsModule;
