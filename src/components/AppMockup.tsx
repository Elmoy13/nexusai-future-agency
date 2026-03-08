import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const typedLine = { text: '$ nexus-ai start-campaign --brand="{Tu_Marca_Aquí}"', color: "text-muted-foreground" };

const instantLines = [
  { text: "→ Ejecutando Agente Entrevistador... Brief completado.", color: "text-muted-foreground", delay: 0.8 },
  { text: "→ Definiendo Look & Feel y Públicos Digitales...", color: "text-muted-foreground", delay: 1.6 },
  { text: "→ Generando 30 posts alineados a la estrategia...", color: "text-cyan-glow", delay: 2.4 },
  { text: "", color: "", delay: 3.2 },
  { text: "[NexusAI] > Parrilla multimodal lista. Tiempo de ejecución: 3.8s", color: "text-emerald-accent", delay: 4.0 },
];

const TypingText = ({ text, color, startDelay }: { text: string; color: string; startDelay: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), startDelay * 1000);
    return () => clearTimeout(timeout);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [started, text]);

  if (!started) return null;
  return <div className={color}>{displayed}<span className="inline-block w-1.5 h-4 bg-cyan-glow/70 animate-pulse ml-0.5 align-middle" style={{ opacity: displayed.length < text.length ? 1 : 0 }} /></div>;
};

const AppMockup = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-strong rounded-2xl overflow-hidden border border-cyan-glow/10"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/50">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            <span className="ml-4 text-xs text-muted-foreground/50 font-mono">
              nexus-ai — terminal
            </span>
          </div>

          {/* Terminal content */}
          <div className="p-6 md:p-8 font-mono text-sm md:text-base space-y-1.5 min-h-[280px]">
            {lines.map((line, i) =>
              line.text ? (
                <TypingText key={i} text={line.text} color={line.color} startDelay={line.delay + 0.5} />
              ) : (
                <div key={i} className="h-4" />
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppMockup;
