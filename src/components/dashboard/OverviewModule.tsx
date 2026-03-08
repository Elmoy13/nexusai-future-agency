import { Radar, Palette, MessageCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";

const agents = [
  {
    name: "Agente Planner",
    status: "Esperando Brief",
    icon: Radar,
    active: false,
    progress: null as number | null,
  },
  {
    name: "Agente Content & Diseño",
    status: "Generando 30 posts (85%)",
    icon: Palette,
    active: true,
    progress: 85,
  },
  {
    name: "Agente Community Manager",
    status: "Online — Monitoreando 3 redes",
    icon: MessageCircle,
    active: true,
    progress: null,
  },
];

const activityLogs = [
  { time: "14:32", agent: "Agente Planner", msg: "Estrategia de Acme aprobada. Pasando directrices de Look & Feel al equipo de diseño...", color: "text-primary" },
  { time: "14:35", agent: "Agente Content", msg: "Recibido. Iniciando renderizado de 12 carruseles.", color: "text-primary" },
  { time: "14:38", agent: "Agente Community", msg: "Detectado pico de menciones en Instagram (+340%). Activando protocolo de respuesta rápida.", color: "text-yellow-400" },
  { time: "14:41", agent: "Agente Content", msg: "Renderizado completado. 12 carruseles listos para aprobación humana.", color: "text-emerald-accent" },
  { time: "14:44", agent: "Agente Planner", msg: "Nuevo brief recibido: 'Tech Summit 2026'. Analizando brief con RAG...", color: "text-primary" },
  { time: "14:47", agent: "Agente Community", msg: "3 respuestas enviadas. Sentiment score: 92% positivo.", color: "text-emerald-accent" },
];

const OverviewModule = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Comando</h2>
          <p className="text-muted-foreground mt-1">Estado en tiempo real de los agentes NexusAI.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm glow-cyan hover:brightness-110 transition-all duration-200">
          <Plus size={16} />
          Desplegar Nueva Campaña
        </button>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-strong rounded-2xl p-5 hover:glow-border transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <agent.icon size={20} className="icon-neon text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{agent.name}</p>
              </div>
              {agent.active && (
                <span className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse shrink-0" />
              )}
              {!agent.active && (
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
              )}
            </div>

            <p className="text-xs text-muted-foreground">{agent.status}</p>

            {agent.progress !== null && (
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${agent.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-accent"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Activity Console */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-strong rounded-2xl overflow-hidden border border-border/30"
      >
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
          <span className="ml-3 text-xs text-muted-foreground/50 font-mono">actividad-del-sistema — live</span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-accent animate-pulse" />
        </div>

        <div className="p-5 max-h-[280px] overflow-y-auto space-y-3 font-mono text-xs">
          {activityLogs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12 }}
              className="flex gap-3 items-start"
            >
              <span className="text-muted-foreground/40 shrink-0">[{log.time}]</span>
              <span className={`${log.color} font-semibold shrink-0`}>{log.agent}:</span>
              <span className="text-muted-foreground">"{log.msg}"</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewModule;
