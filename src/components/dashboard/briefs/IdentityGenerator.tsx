import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload, Wand2, PenTool, Scissors, MousePointer2, FlipHorizontal2,
  Check, Loader2, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const tools = [
  { icon: PenTool, label: "Pincel Máscara", shortcut: "B" },
  { icon: Scissors, label: "Perfeccionar Borde", shortcut: "R" },
  { icon: MousePointer2, label: "Lazo Poligonal", shortcut: "L" },
  { icon: FlipHorizontal2, label: "Invertir Selección", shortcut: "I" },
];

const zoomTools = [
  { icon: ZoomIn, label: "Zoom In" },
  { icon: ZoomOut, label: "Zoom Out" },
  { icon: RotateCcw, label: "Reset" },
];

type Stage = "upload" | "processing" | "done";

const IdentityGenerator = () => {
  const [stage, setStage] = useState<Stage>("upload");
  const [activeTool, setActiveTool] = useState(0);

  const handleUpload = () => {
    setStage("processing");
    setTimeout(() => setStage("done"), 2800);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Configuración de Identidad Visual</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sube el logo de tu cliente y la IA perfeccionará el recorte automáticamente.
        </p>
      </div>

      <Card className="bg-card/60 border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[420px]">
            {/* Canvas area */}
            <div className="flex-1 relative">
              {/* Transparency checkerboard */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%),
                    linear-gradient(-45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%),
                    linear-gradient(-45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%)
                  `,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              />

              <div className="relative z-10 flex items-center justify-center h-full p-8">
                <AnimatePresence mode="wait">
                  {stage === "upload" && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center"
                    >
                      <button
                        onClick={handleUpload}
                        className="group w-56 h-56 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-card/40 hover:bg-card/60 transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer"
                      >
                        <Upload size={32} className="text-primary/50 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Arrastra tu logo aquí
                        </span>
                        <span className="text-[11px] text-muted-foreground/60">
                          PNG, SVG o JPG · Máx 10MB
                        </span>
                      </button>
                    </motion.div>
                  )}

                  {stage === "processing" && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-4"
                    >
                      {/* Simulated logo shape */}
                      <div className="relative mx-auto w-48 h-48">
                        <div className="absolute inset-0 rounded-2xl bg-secondary/50 border border-border/30" />
                        <motion.div
                          className="absolute inset-3 rounded-xl border-2 border-primary/60"
                          animate={{ borderColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.3)"] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.2)" }}
                        >
                          <div className="flex items-center justify-center h-full">
                            <Wand2 size={36} className="text-primary animate-pulse" />
                          </div>
                        </motion.div>
                        {/* Scanning line */}
                        <motion.div
                          className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                          animate={{ top: ["12px", "180px", "12px"] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                        <Loader2 size={14} className="animate-spin" />
                        Removiendo fondo con IA...
                      </div>
                    </motion.div>
                  )}

                  {stage === "done" && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative"
                    >
                      {/* Simulated masked logo */}
                      <div className="relative w-52 h-52">
                        {/* The "logo" shape */}
                        <div className="absolute inset-4 flex items-center justify-center">
                          <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center"
                            style={{ boxShadow: "0 0 0 2px hsl(var(--primary) / 0.5)" }}
                          >
                            <span className="text-4xl font-black text-primary tracking-tighter">AB</span>
                          </div>
                        </div>
                        {/* Cyan neon outline indicating mask edge */}
                        <motion.div
                          className="absolute inset-4 rounded-2xl pointer-events-none"
                          style={{
                            boxShadow: "0 0 12px hsl(var(--primary) / 0.4), inset 0 0 12px hsl(var(--primary) / 0.1)",
                            border: "1.5px solid hsl(var(--primary) / 0.6)",
                          }}
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-3 text-sm text-emerald-400 font-medium">
                        <Check size={14} />
                        Fondo removido · Máscara perfecta
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom zoom bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-lg border border-border/30 px-2 py-1">
                {zoomTools.map((t, i) => (
                  <button key={i} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title={t.label}>
                    <t.icon size={14} />
                  </button>
                ))}
                <span className="text-[10px] text-muted-foreground font-mono ml-1 px-1">100%</span>
              </div>
            </div>

            {/* Right toolbar */}
            <div className="w-full lg:w-14 border-t lg:border-t-0 lg:border-l border-border/30 bg-card/40 flex lg:flex-col items-center justify-center lg:justify-start gap-1 p-2 lg:pt-4">
              {tools.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTool(i)}
                  title={`${t.label} (${t.shortcut})`}
                  className={`relative p-2.5 rounded-lg transition-all duration-200 group ${
                    activeTool === i
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <t.icon size={16} />
                  {activeTool === i && (
                    <motion.div
                      layoutId="tool-active"
                      className="absolute inset-0 rounded-lg border border-primary/40"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  {/* Shortcut hint */}
                  <span className="absolute -right-0.5 -top-0.5 text-[8px] font-mono text-muted-foreground/40 hidden lg:block">
                    {t.shortcut}
                  </span>
                </button>
              ))}

              <div className="hidden lg:block w-8 border-t border-border/20 my-2" />

              <Button
                onClick={() => setStage("upload")}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground w-9 h-9"
                title="Reset"
              >
                <RotateCcw size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default IdentityGenerator;
