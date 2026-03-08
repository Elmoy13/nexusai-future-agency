import { motion, useInView } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const typedLine = { text: '$ nexus-ai start-campaign --brand="{Tu_Marca_Aquí}"', color: "text-muted-foreground" };

const instantLines = [
  { text: "→ Ejecutando Agente Entrevistador... Brief completado.", color: "text-muted-foreground", delay: 0.8 },
  { text: "→ Definiendo Look & Feel y Públicos Digitales...", color: "text-muted-foreground", delay: 1.6 },
  { text: "→ Generando 30 posts alineados a la estrategia...", color: "text-cyan-glow", delay: 2.4 },
  { text: "", color: "", delay: 3.2 },
  { text: "[NexusAI] > Parrilla multimodal lista. Tiempo de ejecución: 3.8s", color: "text-emerald-accent", delay: 4.0 },
];

const TypingText = ({ text, color, active }: { text: string; color: string; active: boolean }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [active, text]);

  if (!active) return null;
  return (
    <div className={color}>
      {displayed}
      <span
        className="inline-block w-1.5 h-4 bg-cyan-glow/70 animate-pulse ml-0.5 align-middle"
        style={{ opacity: displayed.length < text.length ? 1 : 0 }}
      />
    </div>
  );
};

const InstantLine = ({ text, color, active }: { text: string; color: string; active: boolean }) => {
  if (!active) return null;
  if (!text) return <div className="h-4" />;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={color}
    >
      {text}
    </motion.div>
  );
};

const AppMockup = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [step, setStep] = useState(-1);

  // Typed line duration: ~50 chars * 30ms = 1.5s
  const typedDuration = typedLine.text.length * 30;

  useEffect(() => {
    if (!isInView) return;

    // Start typing immediately
    setStep(0);

    // After typing finishes, show instant lines one by one
    const timers: ReturnType<typeof setTimeout>[] = [];
    instantLines.forEach((_, i) => {
      timers.push(
        setTimeout(() => setStep(i + 1), typedDuration + 200 + i * 800)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [isInView, typedDuration]);

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto" ref={ref}>
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
            <TypingText text={typedLine.text} color={typedLine.color} active={step >= 0} />
            {instantLines.map((line, i) => (
              <InstantLine key={i} text={line.text} color={line.color} active={step >= i + 1} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppMockup;
