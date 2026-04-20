import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Folder, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ProductsSection from "@/components/dashboard/ProductsSection";
import EditBrandModal, { type EditableBrand } from "@/components/dashboard/EditBrandModal";

interface Job {
  id: string;
  campaign_description: string | null;
  status: string;
  created_at: string;
}

interface BriefRow {
  id: string;
  kind: "strategic" | "campaign";
  status: string;
  title: string | null;
}

const Brand = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [brand, setBrand] = useState<EditableBrand | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [briefs, setBriefs] = useState<BriefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchBrand = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: b }, { data: js }, { data: bs }] = await Promise.all([
      supabase
        .from("brands")
        .select(
          "id, name, brief, logo_url, primary_color, secondary_color, accent_colors, font_family, strategy_tone, strategy_audience, vision_analysis"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("generation_jobs")
        .select("id, campaign_description, status, created_at")
        .eq("brand_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("brand_briefs")
        .select("id, kind, status, title")
        .eq("brand_id", id),
    ]);
    setBrand((b as EditableBrand | null) ?? null);
    setJobs((js as Job[]) ?? []);
    setBriefs((bs as BriefRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrand();
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

  const swatches = [
    brand.primary_color,
    brand.secondary_color,
    ...(Array.isArray(brand.accent_colors) ? brand.accent_colors : []),
  ].filter(Boolean) as string[];

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
            {(swatches.length > 0 || brand.font_family) && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {swatches.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {swatches.map((c, i) => (
                      <span
                        key={`${c}-${i}`}
                        className="w-5 h-5 rounded-full border border-border/40 shadow-sm"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                )}
                {brand.font_family && (
                  <span
                    className="text-xs text-muted-foreground font-mono px-2 py-1 rounded-md bg-secondary/40 border border-border/30"
                    style={{ fontFamily: brand.font_family }}
                  >
                    Aa · {brand.font_family}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Pencil size={14} /> Editar marca
            </Button>
            <Button
              onClick={() => navigate(`/parrilla/nueva?brand_id=${brand.id}`)}
              className="gap-2"
            >
              <Sparkles size={14} /> Nueva parrilla
            </Button>
          </div>
        </div>

        <ProductsSection brandId={brand.id} />

        <section className="mt-10">
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

      <EditBrandModal
        brand={brand}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={fetchBrand}
      />
    </div>
  );
};

export default Brand;
