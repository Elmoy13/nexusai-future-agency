import { motion } from "framer-motion";
import { FileInput, Users, Palette, Zap } from "lucide-react";

const steps = [
  { icon: FileInput, label: "Brief Inteligente", sub: "Input de datos" },
  { icon: Users, label: "Estrategia de Marca", sub: "Públicos Digitales" },
  { icon: Palette, label: "Estrategia de Comunicación", sub: "Tono & Look & Feel" },
  { icon: Zap, label: "Ejecución Autómata", sub: "Parrilla lista" },
];

const StrategicFlow = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/[0.04] blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-mono tracking-widest uppercase">
            El Flujo Estratégico
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
            Conectando la Marca con el{" "}
            <span className="text-gradient-cyan">Rendimiento</span>
          </h2>
        </motion.div>

        {/* Pipeline */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px -translate-y-1/2">
            <div className="relative w-full h-full bg-border/30">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary/30"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              />
              {/* travelling glow */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-16 h-4 rounded-full bg-primary/60 blur-md"
                initial={{ left: "-5%" }}
                whileInView={{ left: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 3, ease: "easeInOut", delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
              />
            </div>
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.25 }}
                className="relative z-10 flex flex-col items-center text-center w-full md:w-1/4"
              >
                <div className="w-16 h-16 rounded-2xl glass-strong glow-border flex items-center justify-center mb-4">
                  <Icon size={24} className="text-primary icon-neon" />
                </div>
                <span className="text-xs text-primary font-mono mb-1">0{i + 1}</span>
                <h3 className="text-sm font-bold text-foreground">{step.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{step.sub}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StrategicFlow;
