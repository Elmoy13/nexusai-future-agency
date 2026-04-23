import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus, CalendarRange, Image as ImageIcon, Building2,
  AlertCircle, CheckCircle2, Loader2, Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";
import { countActiveJobs, countPostsThisMonth, listJobsByAgency } from "@/lib/generationService";

interface Metrics {
  activeJobs: number;
  processingCount: number;
  monthlyPosts: number;
  brandCount: number;
}

interface RecentJob {
  id: string;
  status: string;
  total_posts: number | null;
  completed_posts: number | null;
  created_at: string;
  updated_at: string;
  brand_name: string | null;
  brands: { name: string } | null;
}

interface ActivityEntry {
  id: string;
  time: string;
  type: "success" | "info" | "error";
  text: string;
}

const jobToActivity = (job: RecentJob): ActivityEntry => {
  const brandName = job.brands?.name || job.brand_name || "Sin marca";
  const time = formatDistanceToNow(new Date(job.updated_at || job.created_at), {
    addSuffix: true,
    locale: es,
  });

  if (job.status === "completed") {
    return {
      id: job.id,
      time,
      type: "success",
      text: `${brandName}: ${job.total_posts ?? 0} posts listos para revisión`,
    };
  }
  if (job.status === "processing") {
    return {
      id: job.id,
      time,
      type: "info",
      text: `${brandName}: generando ${job.completed_posts ?? 0}/${job.total_posts ?? 0} posts`,
    };
  }
  if (job.status === "failed") {
    return {
      id: job.id,
      time,
      type: "error",
      text: `${brandName}: falló la generación`,
    };
  }
  return {
    id: job.id,
    time,
    type: "info",
    text: `${brandName}: nueva parrilla iniciada`,
  };
};

const OverviewModule = () => {
  const navigate = useNavigate();
  const { currentAgencyId } = useAgency();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null);

  useEffect(() => {
    if (!currentAgencyId) return;
    let cancelled = false;

    (async () => {
      setMetrics(null);
      setActivity(null);

      const [activeJobs, monthlyPosts, brandRes, processingRes, recentJobs] = await Promise.all([
        countActiveJobs(currentAgencyId),
        countPostsThisMonth(currentAgencyId),
        supabase
          .from("brands")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", currentAgencyId),
        supabase
          .from("generation_jobs")
          .select("id", { count: "exact", head: true })
          .eq("agency_id", currentAgencyId)
          .eq("status", "processing"),
        listJobsByAgency(currentAgencyId, { limit: 10 }),
      ]);

      if (cancelled) return;

      setMetrics({
        activeJobs,
        processingCount: processingRes.count ?? 0,
        monthlyPosts,
        brandCount: brandRes.count ?? 0,
      });

      const jobs = recentJobs as unknown as RecentJob[];
      setActivity(jobs.map(jobToActivity));
    })();

    return () => {
      cancelled = true;
    };
  }, [currentAgencyId]);

  const cards = [
    {
      icon: CalendarRange,
      label: "Parrillas activas",
      value: metrics?.activeJobs ?? 0,
      sub: metrics?.processingCount
        ? `${metrics.processingCount} generándose ahora`
        : "Ninguna en proceso",
      progress: metrics?.processingCount ? 60 : null,
    },
    {
      icon: ImageIcon,
      label: "Posts creados este mes",
      value: metrics?.monthlyPosts ?? 0,
      sub: "Total del mes en curso",
      progress: null,
    },
    {
      icon: Building2,
      label: "Marcas activas",
      value: metrics?.brandCount ?? 0,
      sub: "Gestionadas en esta agencia",
      progress: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Comando</h2>
          <p className="text-muted-foreground mt-1">Estado en tiempo real de tu agencia.</p>
        </div>
        <button
          onClick={() => navigate("/parrilla/nueva")}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm glow-cyan hover:brightness-110 transition-all duration-200"
        >
          <Plus size={16} />
          Desplegar Nueva Campaña
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics === null
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-strong rounded-2xl p-5 hover:glow-border transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <c.icon size={20} className="icon-neon text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{c.value}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
                {c.progress !== null && (
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.progress}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-accent"
                    />
                  </div>
                )}
              </motion.div>
            ))}
      </div>

      {/* Activity Feed */}
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

        <div className="p-5 max-h-[320px] overflow-y-auto space-y-3 font-mono text-xs">
          {activity === null && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 rounded-md" />
              ))}
            </div>
          )}

          {activity !== null && activity.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/60">
              <Sparkles size={24} className="mb-2 opacity-40" />
              <p className="text-xs">Sin actividad reciente. Crea tu primera parrilla para verla aquí.</p>
            </div>
          )}

          {activity?.map((log, i) => {
            const Icon =
              log.type === "success"
                ? CheckCircle2
                : log.type === "error"
                ? AlertCircle
                : Loader2;
            const color =
              log.type === "success"
                ? "text-emerald-accent"
                : log.type === "error"
                ? "text-destructive"
                : "text-primary";

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex gap-3 items-start"
              >
                <Icon size={12} className={`${color} mt-0.5 shrink-0 ${log.type === "info" ? "animate-spin" : ""}`} />
                <span className="text-muted-foreground/40 shrink-0">{log.time}</span>
                <span className="text-muted-foreground flex-1">{log.text}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewModule;
