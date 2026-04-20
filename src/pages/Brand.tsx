import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Folder, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Brand {
  id: string;
  name: string;
  brief: string | null;
  logo_url: string | null;
}

interface Job {
  id: string;
  campaign_description: string | null;
  status: string;
  created_at: string;
}

const Brand = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: b }, { data: js }] = await Promise.all([
        supabase.from("brands").select("id, name, brief, logo_url").eq("id", id).maybeSingle(),
        supabase
          .from("generation_jobs")
          .select("id, campaign_description, status, created_at")
          .eq("brand_id", id)
          .order("created_at", { ascending: false }),
      ]);
      setBrand(b as Brand | null);
      setJobs((js as Job[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={28} />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Marca no encontrada
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 glass-strong border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground">{brand.name}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-border/30 flex items-center justify-center overflow-hidden">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {brand.name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{brand.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {brand.brief || "Sin brief. Edita la marca para añadir contexto."}
            </p>
          </div>
          <button
            onClick={() => navigate(`/parrilla/nueva?brand=${brand.id}`)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold hover:glow-cyan transition shrink-0"
          >
            <Sparkles size={14} /> Nueva parrilla
          </button>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Parrillas</h2>
          {jobs.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">
              Aún no hay parrillas para esta marca.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => navigate(`/parrilla/${j.id}`)}
                  className="glass hover:bg-secondary/30 rounded-xl p-4 flex items-center gap-3 text-left border border-border/30 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {j.campaign_description || "Parrilla sin nombre"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(j.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Brand;
