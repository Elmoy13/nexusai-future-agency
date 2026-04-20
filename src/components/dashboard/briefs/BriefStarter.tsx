import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, FileText, Megaphone } from "lucide-react";
import { useAgency } from "@/contexts/AgencyContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createBrief,
  getStrategicBrief,
  deleteBrief,
  type BriefKind,
} from "@/lib/briefService";
import { toast } from "@/hooks/use-toast";

interface BrandOpt {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Props {
  onStart: (briefId: string) => void;
}

const BriefStarter = ({ onStart }: Props) => {
  const { currentAgencyId } = useAgency();
  const { user } = useAuth();
  const [brands, setBrands] = useState<BrandOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState<string>("");
  const [kind, setKind] = useState<BriefKind>("campaign");
  const [submitting, setSubmitting] = useState(false);
  const [existingStrategicId, setExistingStrategicId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!currentAgencyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("brands")
        .select("id, name, logo_url")
        .eq("agency_id", currentAgencyId)
        .order("name", { ascending: true });
      if (!cancelled) {
        setBrands((data ?? []) as any);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentAgencyId]);

  const actuallyCreate = async (strategicIdToReplace?: string) => {
    if (!currentAgencyId || !user || !brandId) return;
    setSubmitting(true);
    try {
      if (strategicIdToReplace) {
        await deleteBrief(strategicIdToReplace);
      }
      const brief = await createBrief({
        agencyId: currentAgencyId,
        brandId,
        kind,
        userId: user.id,
      });
      onStart(brief.id);
    } catch (err: any) {
      toast({
        title: "No se pudo crear el brief",
        description: err?.message || "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleStart = async () => {
    if (!brandId) {
      toast({ title: "Selecciona una marca", variant: "destructive" });
      return;
    }
    if (kind === "strategic") {
      const existing = await getStrategicBrief(brandId);
      if (existing) {
        setExistingStrategicId(existing.id);
        setConfirmOpen(true);
        return;
      }
    }
    actuallyCreate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
        <Loader2 size={16} className="animate-spin" /> Cargando marcas…
      </div>
    );
  }

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-8 space-y-7">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Sparkles size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Entrenar nuevo brief</h2>
              <p className="text-sm text-muted-foreground">
                Escoge la marca y el tipo de brief para comenzar la sesión con el Agente Estratega.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">¿Sobre qué marca?</Label>
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                  No tienes marcas registradas. Crea una desde el dashboard primero.
                </p>
              ) : (
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger className="h-11 bg-secondary/30 border-border/40">
                    <SelectValue placeholder="Selecciona una marca…" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">¿Qué tipo de brief?</Label>
              <RadioGroup value={kind} onValueChange={(v) => setKind(v as BriefKind)} className="grid gap-2">
                <label
                  htmlFor="kind-strategic"
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    kind === "strategic" ? "border-primary/50 bg-primary/5" : "border-border/40 hover:border-border/60"
                  }`}
                >
                  <RadioGroupItem value="strategic" id="kind-strategic" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">Brief estratégico</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Base de identidad de la marca. Uno por marca.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="kind-campaign"
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    kind === "campaign" ? "border-primary/50 bg-primary/5" : "border-border/40 hover:border-border/60"
                  }`}
                >
                  <RadioGroupItem value="campaign" id="kind-campaign" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Megaphone size={15} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">Brief de campaña</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Específico para una campaña o proyecto puntual.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Button
              onClick={handleStart}
              disabled={submitting || !brandId}
              className="w-full h-11 font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Creando…
                </>
              ) : (
                <>Comenzar</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ya existe un brief estratégico</AlertDialogTitle>
            <AlertDialogDescription>
              Esta marca ya tiene un brief estratégico. ¿Quieres reemplazarlo por uno nuevo?
              El actual se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => existingStrategicId && actuallyCreate(existingStrategicId)}
              disabled={submitting}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : "Reemplazar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BriefStarter;
