import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, FileEdit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgency } from "@/contexts/AgencyContext";
import { listDrafts, deleteDraft, type DraftRow } from "@/lib/draftService";
import { toast } from "@/hooks/use-toast";

type DraftWithBrand = DraftRow & {
  brand: { id: string; name: string; logo_url: string | null } | null;
};

const DraftsSection = () => {
  const navigate = useNavigate();
  const { currentAgencyId } = useAgency();
  const [drafts, setDrafts] = useState<DraftWithBrand[] | null>(null);

  const load = async () => {
    if (!currentAgencyId) return;
    setDrafts(null);
    try {
      const rows = await listDrafts(currentAgencyId, 5);
      setDrafts(rows);
    } catch (err: any) {
      console.error(err);
      setDrafts([]);
    }
  };

  useEffect(() => {
    load();
  }, [currentAgencyId]);

  const handleDiscard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDraft(id);
      setDrafts((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
      toast({ title: "Borrador descartado" });
    } catch (err: any) {
      toast({ title: "Error al descartar", description: err?.message, variant: "destructive" });
    }
  };

  if (drafts === null) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Borradores sin terminar</h2>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (drafts.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileEdit size={18} className="text-primary" />
          Borradores sin terminar
        </h2>
        <span className="text-xs text-muted-foreground">{drafts.length} guardados</span>
      </div>
      <div className="space-y-2">
        {drafts.map((d) => (
          <button
            key={d.id}
            onClick={() => navigate(`/parrilla/nueva?draft_id=${d.id}`)}
            className="w-full glass hover:bg-secondary/30 rounded-xl p-4 flex items-center gap-4 text-left border border-border/30 transition group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {d.brand?.logo_url ? (
                <img src={d.brand.logo_url} alt={d.brand.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={18} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {d.title || "Borrador sin título"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {d.brand?.name ?? "Sin marca"} ·{" "}
                {formatDistanceToNow(new Date(d.updated_at), { addSuffix: true, locale: es })}
              </p>
            </div>
            <button
              onClick={(e) => handleDiscard(d.id, e)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition opacity-0 group-hover:opacity-100"
              title="Descartar borrador"
            >
              <Trash2 size={14} />
            </button>
            <span className="text-[11px] uppercase tracking-wider font-mono px-2 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
              Borrador
            </span>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default DraftsSection;
