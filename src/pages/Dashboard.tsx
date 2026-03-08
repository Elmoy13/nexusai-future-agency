import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, Layers, LogOut, Plus, Radar, Palette, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const agents = [
  {
    id: "planner",
    name: "Planner",
    fullName: "Agente Planner",
    status: "Esperando Brief",
    icon: Radar,
    active: false,
    metric: "0",
    metricLabel: "briefs hoy",
    // Responsive positions handled via CSS
    cx: 20, cy: 45,
    size: 120,
  },
  {
    id: "content",
    name: "Content",
    fullName: "Agente Content & Diseño",
    status: "Generando 30 posts",
    icon: Palette,
    active: true,
    metric: "85",
    metricLabel: "% completado",
    cx: 50, cy: 40,
    size: 160,
  },
  {
    id: "community",
    name: "Community",
    fullName: "Agente Community",
    status: "Monitoreando 3 redes",
    icon: MessageCircle,
    active: true,
    metric: "3",
    metricLabel: "redes activas",
    cx: 80, cy: 48,
    size: 120,
  },
];

const ghostLogs = [
  { time: "14:32", agent: "Planner", msg: "Estrategia de Acme aprobada. Pasando directrices al equipo de diseño..." },
  { time: "14:35", agent: "Content", msg: "Recibido. Iniciando renderizado de 12 carruseles." },
  { time: "14:38", agent: "Community", msg: "Pico de menciones detectado (+340%). Protocolo de respuesta activado." },
  { time: "14:41", agent: "Content", msg: "Renderizado completado. 12 carruseles listos para revisión." },
  { time: "14:44", agent: "Planner", msg: "Nuevo brief: 'Tech Summit 2026'. Analizando con RAG..." },
  { time: "14:47", agent: "Community", msg: "3 respuestas enviadas. Sentiment score: 92% positivo." },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);

  // Ghost notifications appearing one by one
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ghostLogs.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleLogs(prev => [...prev, i]);
      }, 1500 + i * 2500));
      // Auto-remove after 5s
      timers.push(setTimeout(() => {
        setVisibleLogs(prev => prev.filter(idx => idx !== i));
      }, 6500 + i * 2500));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[200px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-accent/3 blur-[150px] animate-float-slower pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 pt-8">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
          <span className="font-bold text-lg tracking-tight text-foreground">NexusAI</span>
          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm glow-cyan hover:brightness-110 transition-all duration-200">
          <Plus size={16} />
          <span className="hidden sm:inline">Desplegar Campaña</span>
        </button>
      </header>

      {/* Title */}
      <div className="relative z-10 px-6 md:px-12 mt-6 md:mt-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground"
        >
          Centro de<br />
          <span className="text-gradient-cyan">Comando</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm md:text-base mt-2 max-w-md"
        >
          Estado en tiempo real de los agentes autónomos.
        </motion.p>
      </div>

      {/* Agent Nodes Canvas */}
      <div className="relative z-10 w-full mt-8 md:mt-4" style={{ height: "clamp(320px, 50vh, 500px)" }}>
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Line from Planner to Content */}
          <line x1="20%" y1="45%" x2="50%" y2="40%" stroke="url(#lineGrad)" strokeWidth="1" />
          {/* Line from Content to Community */}
          <line x1="50%" y1="40%" x2="80%" y2="48%" stroke="url(#lineGrad)" strokeWidth="1" />

          {/* Traveling pulse 1 */}
          <circle r="3" fill="hsl(var(--primary))" opacity="0.8">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 0,0 L 1,0" />
            <animate attributeName="opacity" values="0;0.9;0" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Animated pulse traveling along path 1 */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-primary glow-cyan pointer-events-none"
          style={{ top: "45%", left: "20%" }}
          animate={{
            left: ["20%", "50%"],
            top: ["45%", "40%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />
        {/* Pulse traveling along path 2 */}
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-primary glow-cyan pointer-events-none"
          style={{ top: "40%", left: "50%" }}
          animate={{
            left: ["50%", "80%"],
            top: ["40%", "48%"],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 2, repeatDelay: 1 }}
        />

        {/* Agent Nodes */}
        {agents.map((agent, i) => {
          const mobileSize = agent.size * 0.7;
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 200 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{
                left: `${agent.cx}%`,
                top: `${agent.cy}%`,
              }}
            >
              {/* Outer ring */}
              <div
                className="rounded-full border border-primary/20 group-hover:border-primary/50 transition-all duration-500 flex items-center justify-center relative"
                style={{ width: mobileSize, height: mobileSize }}
              >
                {/* Glow ring on hover */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.2), inset 0 0 40px hsl(var(--primary) / 0.05)" }}
                />

                {/* Inner glass circle */}
                <div className="glass-strong rounded-full flex flex-col items-center justify-center text-center p-2 md:p-3 relative"
                  style={{ width: mobileSize - 20, height: mobileSize - 20 }}
                >
                  {/* Active pulse */}
                  {agent.active && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
                  )}
                  <agent.icon size={window.innerWidth < 768 ? 18 : 22} className="text-primary icon-neon mb-1" />
                  <span className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-none">
                    {agent.metric}
                  </span>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    {agent.metricLabel}
                  </span>
                </div>
              </div>

              {/* Label below */}
              <div className="text-center mt-2 md:mt-3">
                <p className="text-xs md:text-sm font-semibold text-foreground">{agent.name}</p>
                <p className="text-[9px] md:text-[10px] text-muted-foreground">{agent.status}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ghost Notifications */}
      <div className="fixed top-20 right-4 md:right-8 z-30 space-y-2 max-w-xs md:max-w-sm pointer-events-none">
        <AnimatePresence>
          {visibleLogs.map(idx => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
              className="font-mono text-[10px] md:text-xs backdrop-blur-md bg-background/40 border border-border/20 rounded-lg px-3 py-2"
            >
              <span className="text-muted-foreground/40">[{ghostLogs[idx].time}] </span>
              <span className="text-primary font-semibold">{ghostLogs[idx].agent}: </span>
              <span className="text-muted-foreground">"{ghostLogs[idx].msg}"</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="glass-strong rounded-full px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-1 md:gap-2 border border-primary/10"
        >
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: FileText, label: "Briefs", active: false },
            { icon: Layers, label: "Parrillas", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex flex-col items-center gap-0.5 px-3 md:px-4 py-2 rounded-full transition-all duration-200 border-none cursor-pointer ${
                item.active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20 bg-transparent"
              }`}
            >
              <item.icon size={18} className={item.active ? "icon-neon" : ""} />
              <span className="text-[9px] md:text-[10px] font-medium">{item.label}</span>
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-8 bg-border/30 mx-1" />

          {/* Logout */}
          <button
            onClick={() => navigate("/login")}
            className="flex flex-col items-center gap-0.5 px-3 md:px-4 py-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 bg-transparent border-none cursor-pointer"
          >
            <LogOut size={18} />
            <span className="text-[9px] md:text-[10px] font-medium">Salir</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
