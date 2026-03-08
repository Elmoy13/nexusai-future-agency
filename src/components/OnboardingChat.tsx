import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useState, useEffect } from "react";

const aiQuestion = "¿Cuál es el enfoque primario y el look & feel deseado para esta campaña?";
const userResponse = "Queremos un enfoque premium, sofisticado, con tonos oscuros y acentos en cian. El público es C-level de empresas tech.";

const TypingBubble = ({ text, delay }: { text: string; delay: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [started, text]);

  if (!started) return null;
  return (
    <span>
      {displayed}
      <span
        className="inline-block w-1.5 h-4 bg-cyan-glow/70 animate-pulse ml-0.5 align-middle"
        style={{ opacity: displayed.length < text.length ? 1 : 0 }}
      />
    </span>
  );
};

const OnboardingChat = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            El Brief a{" "}
            <span className="text-gradient-cyan">Prueba de Balas.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Todo comienza con nuestro Agente Entrevistador. Extraemos la esencia de tu marca,
            definimos tus públicos digitales y establecemos el tono de comunicación correcto
            antes de crear un solo pixel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto glass-strong rounded-2xl overflow-hidden border border-cyan-glow/10"
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
            <div className="w-8 h-8 rounded-full bg-cyan-glow/20 flex items-center justify-center">
              <Bot size={16} className="text-cyan-glow icon-neon" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Agente Entrevistador</p>
              <p className="text-xs text-emerald-accent flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-accent pulse-dot" />
                Online
              </p>
            </div>
          </div>

          {/* Chat body */}
          <div className="p-6 space-y-5 min-h-[200px]">
            {/* AI message */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-cyan-glow/10 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-cyan-glow" />
              </div>
              <div className="glass rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%] border border-cyan-glow/10">
                <p className="text-sm text-foreground leading-relaxed">{aiQuestion}</p>
              </div>
            </div>

            {/* User message */}
            <div className="flex gap-3 justify-end">
              <div className="bg-secondary/60 rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] border border-border/30">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <TypingBubble text={userResponse} delay={1500} />
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                <User size={14} className="text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OnboardingChat;
