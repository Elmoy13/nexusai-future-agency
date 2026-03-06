import { motion } from "framer-motion";

const lines = [
  { text: "$ nexus-ai init --agents=3", color: "text-muted-foreground", delay: 0 },
  { text: "→ Conectando módulos de razonamiento...", color: "text-muted-foreground", delay: 0.3 },
  { text: "→ Cargando modelo Llama 3.3 70B...", color: "text-muted-foreground", delay: 0.6 },
  { text: "→ Agentes desplegados: Cerebro, Motor, CM", color: "text-cyan-glow", delay: 0.9 },
  { text: "", color: "", delay: 1.2 },
  {
    text: "[NexusAI] > Sistema orquestado. 3 campañas activas. ROI +42%.",
    color: "text-emerald-accent",
    delay: 1.5,
  },
];

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
          <div className="p-6 md:p-8 font-mono text-sm md:text-base space-y-1.5 min-h-[260px]">
            {lines.map((line, i) =>
              line.text ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: line.delay + 0.5 }}
                  className={line.color}
                >
                  {line.text}
                </motion.div>
              ) : (
                <div key={i} className="h-4" />
              )
            )}
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 2.5 }}
              className="inline-block w-2.5 h-5 bg-cyan-glow/80 animate-pulse mt-2"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppMockup;
