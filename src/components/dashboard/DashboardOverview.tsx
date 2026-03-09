import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, AlertCircle, Plus, Check, Loader2, Circle, ArrowRight, Image } from "lucide-react";

const kpis = [
  { label: "Marcas Activas", value: "4", icon: Briefcase, accent: "primary" },
  { label: "Posts Esperando Aprobación", value: "12", icon: AlertCircle, accent: "warning" },
  { label: "Horas Operativas Ahorradas", value: "180", suffix: "hrs", icon: Clock, accent: "accent" },
];

const pipelineSteps = [
  { label: "Brief & Setup", status: "done" as const },
  { label: "Look & Feel / Tono", status: "done" as const },
  { label: "Generando Parrilla", status: "active" as const, detail: "Diseñando 15 assets..." },
  { label: "Revisión Humana", status: "pending" as const },
];

const pendingActions = [
  { brand: "TechVibe", task: "Parrilla mensual lista", assets: 30 },
  { brand: "FreshBites", task: "Carruseles aprobación visual", assets: 12 },
  { brand: "UrbanFlow", task: "Stories para campaña Q3", assets: 8 },
];

const accentMap = {
  primary: "text-primary bg-primary/10 border-primary/20",
  warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  accent: "text-emerald-accent bg-emerald-accent/10 border-emerald-accent/20",
};

const DashboardOverview = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          >
            Vista General del Sistema
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen de producción y acciones pendientes.</p>
        </div>
        <motion.button
          onClick={() => navigate("/agente/nueva-marca")}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm glow-cyan hover:brightness-110 transition-all duration-200 shrink-0"
        >
          <Plus size={16} />
          Nuevo Brief de Marca
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="glass-strong rounded-2xl p-5 flex items-center gap-4 group hover:glow-border transition-all duration-300"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${accentMap[kpi.accent as keyof typeof accentMap]}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-none">
                {kpi.value}
                {kpi.suffix && <span className="text-base font-medium text-muted-foreground ml-1">{kpi.suffix}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Campaign Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-strong rounded-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Estado de Producción</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Campaña Lanzamiento Verano — <span className="text-primary">TechVibe</span></p>
          </div>
          <span className="text-[10px] font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full">EN CURSO</span>
        </div>

        {/* Pipeline Steps */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-0 flex-1 w-full sm:w-auto">
              {/* Step */}
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                    step.status === "done"
                      ? "bg-emerald-accent/15 border-emerald-accent/40 text-emerald-accent"
                      : step.status === "active"
                      ? "bg-primary/15 border-primary/40 text-primary animate-pulse"
                      : "bg-secondary/40 border-border/30 text-muted-foreground"
                  }`}
                >
                  {step.status === "done" ? (
                    <Check size={16} />
                  ) : step.status === "active" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    step.status === "done" ? "text-emerald-accent" : step.status === "active" ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className="text-[10px] text-primary/70 mt-0.5">{step.detail}</p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {i < pipelineSteps.length - 1 && (
                <div className="hidden sm:flex items-center mx-2 shrink-0">
                  <div className={`h-px w-8 md:w-12 ${
                    pipelineSteps[i + 1].status !== "pending" ? "bg-primary/40" : "bg-border/40"
                  }`} />
                  <ArrowRight size={12} className={
                    pipelineSteps[i + 1].status !== "pending" ? "text-primary/40" : "text-border/40"
                  } />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "62%" }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-accent"
          />
        </div>
      </motion.div>

      {/* Pending Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-strong rounded-2xl p-6 md:p-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-5">Acciones Requeridas</h2>

        <div className="space-y-3">
          {pendingActions.map((action, i) => (
            <motion.div
              key={action.brand}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/20 hover:border-primary/20 hover:bg-secondary/50 transition-all duration-200 group"
            >
              {/* Thumbnail placeholder */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Image size={18} className="text-primary/60" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {action.task} — <span className="text-primary">{action.brand}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.assets} assets listos para revisión</p>
              </div>

              <button className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-200">
                Revisar y Aprobar
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
