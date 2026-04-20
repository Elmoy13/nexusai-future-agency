import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, ChevronRight, Hexagon, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";

interface BrandRow {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  brand_briefs: { id: string; kind: "strategic" | "campaign"; status: string }[];
}

interface Props {
  onOpenBrand: (brandId: string) => void;
  onNewBrief: () => void;
}

const BriefsDirectory = ({ onOpenBrand, onNewBrief }: Props) => {
  const { currentAgencyId } = useAgency();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentAgencyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, logo_url, primary_color, brand_briefs(id, kind, status)")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) console.error("[BriefsDirectory]", error);
        setBrands((data ?? []) as any);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentAgencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
        <Loader2 size={16} className="animate-spin" /> Cargando marcas…
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Briefs y Estrategia
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Selecciona una marca para ver su brief estratégico y briefs de campaña.
          </p>
        </div>
        <Button
          onClick={onNewBrief}
          className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm"
        >
          <Sparkles size={16} /> Entrenar nuevo brief
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-10 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Hexagon size={22} className="text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Aún no tienes marcas</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Crea una marca desde el dashboard para comenzar a entrenar sus briefs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {brands.map((brand, i) => {
            const briefs = brand.brand_briefs ?? [];
            const hasStrategic = briefs.some((b) => b.kind === "strategic");
            const campaignCount = briefs.filter((b) => b.kind === "campaign").length;
            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card className="group bg-card/60 border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden h-full">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-start gap-3.5">
                      {brand.logo_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/40 bg-muted/30 shrink-0">
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
                          style={{
                            backgroundColor: brand.primary_color ? `${brand.primary_color}20` : "hsl(var(--primary) / 0.1)",
                            borderColor: brand.primary_color ? `${brand.primary_color}40` : "hsl(var(--primary) / 0.2)",
                          }}
                        >
                          <Hexagon size={22} className="text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{brand.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {campaignCount} brief{campaignCount === 1 ? "" : "s"} de campaña
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {hasStrategic ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15 gap-1.5 h-6"
                        >
                          <FileText size={11} /> Brief estratégico listo
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15 gap-1.5 h-6"
                        >
                          <AlertTriangle size={11} /> Sin brief estratégico
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={() => onOpenBrand(brand.id)}
                      variant="ghost"
                      className="w-full h-10 text-xs text-primary/80 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 gap-1.5 font-semibold"
                    >
                      Abrir portafolio <ChevronRight size={14} />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default BriefsDirectory;
