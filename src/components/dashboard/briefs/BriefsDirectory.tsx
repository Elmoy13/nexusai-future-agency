import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertTriangle,
  Hexagon,
  Loader2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Presentation,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";

interface BriefMini {
  id: string;
  kind: "strategic" | "campaign";
  status: string;
  title: string | null;
  updated_at: string;
}

interface BrandRow {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  brand_briefs: BriefMini[];
}

interface Props {
  onOpenBrand: (brandId: string) => void;
  onNewBrief: () => void;
}

const BriefsDirectory = ({ onOpenBrand, onNewBrief }: Props) => {
  const navigate = useNavigate();
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
        .select(
          "id, name, logo_url, primary_color, brand_briefs(id, kind, status, title, updated_at)"
        )
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

  const openBrief = (briefId: string) =>
    navigate(`/agente/nueva-marca?briefId=${briefId}`);

  const newBriefForBrand = (brandId: string, kind: "strategic" | "campaign") =>
    navigate(`/agente/nueva-marca?brandId=${brandId}&kind=${kind}`);

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
            const strategicBrief = briefs.find((b) => b.kind === "strategic");
            const campaignBriefs = briefs.filter((b) => b.kind === "campaign");
            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card className="group bg-card/60 border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden h-full">
                  <CardContent className="p-6 space-y-4">
                    {/* Header: brand identity */}
                    <button
                      type="button"
                      onClick={() => onOpenBrand(brand.id)}
                      className="flex items-start gap-3.5 w-full text-left group/header"
                    >
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
                        <h3 className="font-bold text-foreground truncate group-hover/header:text-primary transition-colors">
                          {brand.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {campaignBriefs.length} brief{campaignBriefs.length === 1 ? "" : "s"} de campaña
                        </p>
                      </div>
                    </button>

                    {/* Strategic brief block */}
                    {strategicBrief ? (
                      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              <span className="text-xs font-semibold text-foreground">Brief estratégico</span>
                            </div>
                            <p className="text-[10.5px] text-muted-foreground mt-0.5">
                              {strategicBrief.status === "done"
                                ? `Listo · hace ${formatDistanceToNow(new Date(strategicBrief.updated_at), { locale: es })}`
                                : "En progreso"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {strategicBrief.status === "done" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/editor/${strategicBrief.id}`)}
                              className="h-7 px-2.5 text-[11px] gap-1 flex-1"
                            >
                              <Presentation size={11} />
                              Presentación
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBrief(strategicBrief.id)}
                            className="h-7 px-2.5 text-[11px] gap-1 flex-1"
                          >
                            <MessageSquare size={11} />
                            {strategicBrief.status === "done" ? "Editar chat" : "Continuar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                          <span className="text-xs text-foreground/90 truncate">Sin brief estratégico</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => newBriefForBrand(brand.id, "strategic")}
                          className="h-7 px-3 text-[11px] bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                        >
                          Crear ahora
                        </Button>
                      </div>
                    )}

                    {/* Campaign briefs list */}
                    {campaignBriefs.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                          Briefs de campaña
                        </p>
                        {campaignBriefs.slice(0, 3).map((b) => (
                          <button
                            key={b.id}
                            onClick={() => openBrief(b.id)}
                            className="flex items-center w-full px-2 py-1.5 text-xs hover:bg-secondary/50 rounded-md text-left gap-2 group/item"
                          >
                            <FileText size={11} className="text-muted-foreground shrink-0" />
                            <span className="truncate text-foreground/80 group-hover/item:text-foreground flex-1">
                              {b.title || "Campaña sin título"}
                            </span>
                            <span className="text-[9.5px] text-muted-foreground uppercase tracking-wide shrink-0">
                              {b.status}
                            </span>
                          </button>
                        ))}
                        {campaignBriefs.length > 3 && (
                          <p className="text-[10px] text-muted-foreground px-2">
                            +{campaignBriefs.length - 3} más
                          </p>
                        )}
                      </div>
                    )}

                    {/* Footer: new campaign brief */}
                    <div className="pt-3 border-t border-border/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => newBriefForBrand(brand.id, "campaign")}
                        className="w-full h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1.5"
                      >
                        <Plus size={12} /> Nuevo brief de campaña
                      </Button>
                    </div>
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
