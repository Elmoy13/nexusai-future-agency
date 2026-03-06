import { Activity, BrainCircuit, MessageSquareWarning, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "Campañas Activas", value: "3", icon: Activity, color: "text-cyan-glow" },
  { label: "Posts Generados", value: "47", icon: BrainCircuit, color: "text-cyan-glow" },
  { label: "Mensajes RAG", value: "1,204", icon: MessageSquareWarning, color: "text-cyan-glow" },
  { label: "ROI Promedio", value: "+42%", icon: TrendingUp, color: "text-emerald-accent" },
];

const OverviewModule = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Vista general del sistema operativo NexusAI.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-strong rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200 glow-border"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon size={20} className={`icon-neon ${stat.color}`} />
              <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-sm">Actividad del Sistema</h3>
        <div className="space-y-3 font-mono text-xs">
          {[
            { time: "14:32", msg: "[Strategy] Brief procesado → 12 posts generados", color: "text-cyan-glow" },
            { time: "14:28", msg: "[RAG] Crisis detectada en Instagram → Respuesta auto en 340ms", color: "text-yellow-400" },
            { time: "14:15", msg: "[Parrilla] 5 posts aprobados → Programación en cola", color: "text-emerald-accent" },
            { time: "13:50", msg: "[System] Motor Llama 3.3 70B reiniciado — latencia 11ms", color: "text-muted-foreground" },
          ].map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex gap-3 items-start"
            >
              <span className="text-muted-foreground/50 shrink-0">{log.time}</span>
              <span className={log.color}>{log.msg}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewModule;
