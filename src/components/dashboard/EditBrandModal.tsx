import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Plus, X, RefreshCw, Sparkles, Image as ImageIcon } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadBrandLogo } from "@/lib/brandStorage";
import { apiCall } from "@/lib/apiClient";
import { useAgency } from "@/contexts/AgencyContext";

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Playfair Display",
  "Cormorant",
  "Poppins",
  "Montserrat",
  "Lora",
  "Raleway",
  "Open Sans",
  "Work Sans",
];

export interface EditableBrand {
  id: string;
  name: string;
  brief: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_colors: string[] | null;
  font_family: string | null;
  strategy_tone?: string | null;
  strategy_audience?: string | null;
  vision_analysis?: any | null;
}

interface Props {
  brand: EditableBrand;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const ColorSwatch = ({
  color,
  onChange,
  label,
}: {
  color: string;
  onChange: (c: string) => void;
  label?: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/40 text-xs"
      >
        <span
          className="w-5 h-5 rounded-md border border-border/40"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-muted-foreground">{color.toUpperCase()}</span>
        {label && <span className="text-muted-foreground">· {label}</span>}
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-3 bg-card border-border" align="start">
      <HexColorPicker color={color} onChange={onChange} />
      <Input
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 font-mono text-xs"
      />
    </PopoverContent>
  </Popover>
);

const EditBrandModal = ({ brand, open, onClose, onUpdated }: Props) => {
  const { currentAgencyId } = useAgency();

  const [name, setName] = useState(brand.name);
  const [brief, setBrief] = useState(brand.brief ?? "");
  const [strategyTone, setStrategyTone] = useState(brand.strategy_tone ?? "");
  const [strategyAudience, setStrategyAudience] = useState(brand.strategy_audience ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logo_url);
  const [primaryColor, setPrimaryColor] = useState(brand.primary_color || "#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState(brand.secondary_color || "#0F172A");
  const [accentColors, setAccentColors] = useState<string[]>(brand.accent_colors ?? []);
  const [fontFamily, setFontFamily] = useState(brand.font_family || "Inter");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(brand.name);
      setBrief(brand.brief ?? "");
      setStrategyTone(brand.strategy_tone ?? "");
      setStrategyAudience(brand.strategy_audience ?? "");
      setLogoUrl(brand.logo_url);
      setPrimaryColor(brand.primary_color || "#3B82F6");
      setSecondaryColor(brand.secondary_color || "#0F172A");
      setAccentColors(brand.accent_colors ?? []);
      setFontFamily(brand.font_family || "Inter");
    }
  }, [open, brand]);

  // Load Google Font for live preview
  useEffect(() => {
    const fontName = fontFamily.replace(/ /g, "+");
    const linkId = `font-preview-${fontName}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  const handleLogoUpload = async (file: File) => {
    if (!currentAgencyId) return;
    setUploading(true);
    try {
      const { publicUrl } = await uploadBrandLogo({
        file,
        agencyId: currentAgencyId,
        brandId: brand.id,
        filename: file.name,
      });
      setLogoUrl(publicUrl);
      toast.success("Logo actualizado");
    } catch (err: any) {
      toast.error("Error al subir logo", { description: err?.message });
    } finally {
      setUploading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await apiCall(`/api/v1/brand/analyze-vision`, {
        method: "POST",
        body: { brand_id: brand.id, logo_url: logoUrl },
      });
      toast.success("Análisis actualizado");
      onUpdated();
    } catch (err: any) {
      toast("Re-análisis disponible pronto", { description: err?.message });
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("brands")
        .update({
          name: name.trim(),
          brief: brief.trim() || null,
          strategy_tone: strategyTone.trim() || null,
          strategy_audience: strategyAudience.trim() || null,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_colors: accentColors,
          font_family: fontFamily,
        })
        .eq("id", brand.id);
      if (error) throw error;
      toast.success("Cambios guardados");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error("Error al guardar", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const addAccent = () => {
    if (accentColors.length >= 3) return;
    setAccentColors([...accentColors, "#22D3EE"]);
  };
  const updateAccent = (i: number, c: string) =>
    setAccentColors(accentColors.map((a, idx) => (idx === i ? c : a)));
  const removeAccent = (i: number) => setAccentColors(accentColors.filter((_, idx) => idx !== i));

  const vision: any = brand.vision_analysis ?? null;
  const visionPalette: string[] = Array.isArray(vision?.palette)
    ? vision.palette
    : Array.isArray(vision?.colors)
    ? vision.colors
    : [];
  const visionTraits: string[] = Array.isArray(vision?.personality)
    ? vision.personality
    : Array.isArray(vision?.traits)
    ? vision.traits
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar marca</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="visual">Identidad</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="vision">Análisis IA</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-5 pt-4">
            <div>
              <Label className="text-xs">Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="w-20 h-20 rounded-xl bg-muted/30 border border-border/40 overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-muted-foreground/50" />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || !currentAgencyId}
                  className="gap-1.5"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {logoUrl ? "Cambiar logo" : "Subir logo"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Color primario</Label>
                <div className="mt-1.5">
                  <ColorSwatch color={primaryColor} onChange={setPrimaryColor} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Color secundario</Label>
                <div className="mt-1.5">
                  <ColorSwatch color={secondaryColor} onChange={setSecondaryColor} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs">Colores de acento ({accentColors.length}/3)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={addAccent}
                  disabled={accentColors.length >= 3}
                >
                  <Plus size={12} /> Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {accentColors.length === 0 && (
                  <span className="text-xs text-muted-foreground">Sin colores de acento</span>
                )}
                {accentColors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <ColorSwatch color={c} onChange={(v) => updateAccent(i, v)} />
                    <button
                      onClick={() => removeAccent(i)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Tipografía</Label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="mt-1.5 w-full bg-secondary/40 border border-border/40 rounded-lg px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <div
                className="mt-2 px-3 py-2 rounded-lg bg-secondary/20 border border-border/30 text-lg"
                style={{ fontFamily }}
              >
                Aa Bb Cc 123 — {fontFamily}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="b-name" className="text-xs">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="b-brief" className="text-xs">
                Brief
              </Label>
              <Textarea
                id="b-brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value.slice(0, 500))}
                className="mt-1 min-h-[100px]"
                placeholder="Qué hace la marca, su esencia, tono..."
              />
              <p className="text-[11px] text-muted-foreground mt-1 text-right">{brief.length}/500</p>
            </div>
            <div>
              <Label htmlFor="b-tone" className="text-xs">
                Tono estratégico
              </Label>
              <Input
                id="b-tone"
                value={strategyTone}
                onChange={(e) => setStrategyTone(e.target.value)}
                className="mt-1"
                placeholder="Ej. Cercano, premium, juvenil"
              />
            </div>
            <div>
              <Label htmlFor="b-aud" className="text-xs">
                Audiencia
              </Label>
              <Input
                id="b-aud"
                value={strategyAudience}
                onChange={(e) => setStrategyAudience(e.target.value)}
                className="mt-1"
                placeholder="Ej. Jóvenes 18-30, urbanos"
              />
            </div>
          </TabsContent>

          <TabsContent value="vision" className="space-y-4 pt-4">
            {!vision ? (
              <div className="glass rounded-xl p-6 text-center">
                <Sparkles size={28} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Sube un logo para que la IA analice tu identidad visual automáticamente.
                </p>
              </div>
            ) : (
              <>
                {vision.mood && (
                  <div>
                    <Label className="text-xs">Mood detectado</Label>
                    <p className="mt-1 text-sm text-foreground">{String(vision.mood)}</p>
                  </div>
                )}
                {vision.style && (
                  <div>
                    <Label className="text-xs">Estilo</Label>
                    <p className="mt-1 text-sm text-foreground">{String(vision.style)}</p>
                  </div>
                )}
                {visionTraits.length > 0 && (
                  <div>
                    <Label className="text-xs">Personalidad</Label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {visionTraits.map((t, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {visionPalette.length > 0 && (
                  <div>
                    <Label className="text-xs">Paleta detectada</Label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {visionPalette.map((c, i) => (
                        <span
                          key={i}
                          className="w-8 h-8 rounded-lg border border-border/40"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={reanalyzing || !logoUrl}
              className="gap-1.5"
            >
              {reanalyzing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Re-analizar logo
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-border/30 pt-4 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditBrandModal;
