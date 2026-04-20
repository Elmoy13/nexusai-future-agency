import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Sparkles, CalendarDays, ChevronRight, BarChart3, Layers, Plus,
  Instagram, Linkedin, FolderOpen, Building2, AlertCircle, RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const TikTokIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface JobRow {
  id: string;
  campaign_description: string | null;
  status: string;
  total_posts: number | null;
  completed_posts: number | null;
  created_at: string;
  updated_at: string;
}

interface BrandRow {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  generation_jobs: JobRow[];
}

type Health = "healthy" | "needs-attention" | "no-activity";

const getBrandHealth = (jobs: JobRow[]): Health => {
  if (jobs.some((j) => j.status === "failed")) return "needs-attention";
  if (jobs.length === 0) return "no-activity";
  return "healthy";
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: "En cola",    className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  processing: { label: "Generando",  className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  completed:  { label: "Completada", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  failed:     { label: "Error",      className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const PlatformIcon = ({ platform }: { platform: string }) => {
  const p = platform.toLowerCase();
  if (p.includes("instagram") || p.includes("ig")) return <Instagram size={12} />;
  if (p.includes("tiktok") || p.includes("tt")) return <TikTokIcon size={12} />;
  if (p.includes("linkedin") || p.includes("li")) return <Linkedin size={12} />;
  return <Layers size={12} />;
};

const ParrillasHub = () => {
  const navigate = useNavigate();
  const { currentAgencyId } = useAuth();

  const [brands, setBrands] = useState<BrandRow[] | null>(null);
  const [platformsByJob, setPlatformsByJob] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!currentAgencyId) return;
    setBrands(null);
    setError(null);

    const { data, error: err } = await supabase
      .from("brands")
      .select(`
        id, name, logo_url, primary_color, secondary_color,
        generation_jobs (
          id, campaign_description, status, total_posts, completed_posts, created_at, updated_at
        )
      `)
      .eq("agency_id", currentAgencyId)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setBrands([]);
      toast({ title: "Error cargando parrillas", description: err.message, variant: "destructive" });
      return;
    }

    const list = (data as unknown as BrandRow[]) ?? [];
    setBrands(list);

    const jobIds = list.flatMap((b) => (b.generation_jobs || []).map((j) => j.id));
    if (jobIds.length > 0) {
      const { data: posts } = await supabase
        .from("generated_posts")
        .select("job_id, platform")
        .in("job_id", jobIds);

      const map: Record<string, Set<string>> = {};
      (posts ?? []).forEach((p: any) => {
        if (!p.platform) return;
        if (!map[p.job_id]) map[p.job_id] = new Set();
        map[p.job_id].add(p.platform);
      });
      setPlatformsByJob(
        Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Array.from(v)]))
      );
    } else {
      setPlatformsByJob({});
    }
  };

  useEffect(() => {
    load();
  }, [currentAgencyId]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Parrillas de Contenido
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y programa el contenido social de todos tus clientes.
          </p>
        </div>
        <Button
          onClick={() => navigate("/parrilla/nueva")}
          className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm"
        >
          <Sparkles size={16} /> Nueva Parrilla IA
        </Button>
      </div>

      {/* Loading */}
      {brands === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {brands !== null && error && (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <AlertCircle size={32} className="mx-auto text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={load} variant="outline" size="sm" className="gap-2">
            <RefreshCw size={14} /> Reintentar
          </Button>
        </div>
      )}

      {/* Empty: agencia sin marcas */}
      {brands !== null && !error && brands.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center space-y-4 border border-border/30">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Building2 size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Aún no tienes marcas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primera marca para comenzar a generar parrillas de contenido.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            <Plus size={16} /> Ir a Marcas
          </Button>
        </div>
      )}

      {/* Grid */}
      {brands !== null && !error && brands.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {brands.map((brand, i) => {
            const jobs = brand.generation_jobs || [];
            const health = getBrandHealth(jobs);
            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <Card className="group bg-card/60 border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
                  <CardContent className="p-6 space-y-5">
                    {/* Brand Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 overflow-hidden shrink-0"
                          style={brand.primary_color ? { borderColor: `${brand.primary_color}40` } : undefined}
                        >
                          {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={20} className="text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground truncate">{brand.name}</h3>
                          <Badge
                            variant="secondary"
                            className={`mt-1 text-[10px] px-2 py-0 h-5 font-medium border ${
                              health === "healthy"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                                : health === "needs-attention"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/15"
                                : "bg-slate-500/15 text-slate-400 border-slate-500/30 hover:bg-slate-500/15"
                            }`}
                          >
                            {health === "healthy"
                              ? "Portafolio Saludable"
                              : health === "needs-attention"
                              ? "Requiere Atención"
                              : "Sin actividad"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                        <BarChart3 size={13} />
                        <span className="text-xs font-semibold">{jobs.length} parrillas</span>
                      </div>
                    </div>

                    {/* Parrillas List */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Layers size={12} className="text-primary/60" />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Parrillas de Contenido
                        </span>
                      </div>

                      {jobs.length === 0 && (
                        <div className="flex items-center justify-between gap-2.5 text-sm bg-secondary/20 rounded-lg px-3 py-3 border border-border/20 border-dashed">
                          <div className="flex items-center gap-2 text-muted-foreground/70">
                            <CalendarDays size={14} className="shrink-0" />
                            <span className="text-xs">Sin parrillas todavía</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/parrilla/nueva?brand_id=${brand.id}`)}
                            className="h-7 px-2.5 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1 font-semibold"
                          >
                            <Plus size={11} /> Nueva
                          </Button>
                        </div>
                      )}

                      {jobs.slice(0, 4).map((job) => {
                        const sc = statusConfig[job.status] ?? statusConfig.processing;
                        const platforms = platformsByJob[job.id] ?? [];
                        return (
                          <div
                            key={job.id}
                            className="flex items-center gap-2.5 bg-secondary/30 rounded-xl px-3 py-2.5 border border-border/20 group/row hover:border-primary/25 hover:bg-secondary/50 transition-all"
                          >
                            <CalendarDays size={14} className="text-primary/70 shrink-0" />
                            <span className="truncate text-sm text-foreground/80 flex-1 font-medium">
                              {job.campaign_description || "Parrilla sin nombre"}
                            </span>
                            {platforms.length > 0 && (
                              <div className="flex items-center gap-1 shrink-0">
                                {platforms.slice(0, 3).map((p) => (
                                  <span
                                    key={p}
                                    className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-primary/60"
                                  >
                                    <PlatformIcon platform={p} />
                                  </span>
                                ))}
                              </div>
                            )}
                            <Badge variant="secondary" className={`text-[10px] px-2 py-0 h-5 border shrink-0 ${sc.className}`}>
                              {sc.label}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/parrilla/${job.id}`)}
                              className="h-7 px-2.5 text-[11px] text-primary/70 hover:text-primary hover:bg-primary/10 gap-1 font-semibold shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                            >
                              Abrir <ChevronRight size={12} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer CTA */}
                    {jobs.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/parrilla/nueva?brand_id=${brand.id}`)}
                          className="h-9 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 gap-1.5"
                        >
                          <Plus size={13} /> Nueva Parrilla
                        </Button>
                        {jobs.length > 4 && (
                          <span className="text-[11px] text-muted-foreground/60">
                            +{jobs.length - 4} más
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParrillasHub;
