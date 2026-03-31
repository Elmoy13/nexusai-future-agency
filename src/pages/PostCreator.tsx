import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Square, RectangleVertical, RectangleHorizontal, Upload, X, Download, RefreshCw, Plus, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE_URL = "https://loaded-roles-behavior-mystery.trycloudflare.com";

// --- Types ---
interface FormatOption {
  id: string;
  label: string;
  width: number;
  height: number;
  icon: React.ElementType;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
}

interface BrandConfig {
  primary_color: string;
  secondary_color: string;
  font_family: string;
  logo_b64: string | null;
}

// --- Constants ---
const FORMATS: FormatOption[] = [
  { id: "instagram_feed", label: "Instagram Feed", width: 1080, height: 1080, icon: Square },
  { id: "instagram_story", label: "Instagram Story", width: 1080, height: 1920, icon: RectangleVertical },
  { id: "facebook_post", label: "Facebook Post", width: 1200, height: 630, icon: RectangleHorizontal },
  { id: "linkedin_post", label: "LinkedIn Post", width: 1200, height: 627, icon: RectangleHorizontal },
];

const MOCK_TEMPLATES: TemplateOption[] = [
  { id: "bold-center", name: "Bold Center", description: "Headline grande centrado sobre imagen con overlay" },
  { id: "split-left", name: "Split Left", description: "Panel de color izquierdo con imagen derecha" },
  { id: "minimal-bottom", name: "Minimal Bottom", description: "Barra inferior con color de marca" },
  { id: "card-overlay", name: "Card Overlay", description: "Tarjeta flotante centrada sobre imagen" },
];

const FONT_OPTIONS = ["Montserrat", "Inter", "Poppins", "Playfair Display", "Roboto"];

const TEMPLATE_THUMBS: Record<string, React.ReactNode> = {
  "bold-center": (
    <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-end p-3 gap-1">
      <div className="w-full h-1/2 rounded bg-muted" />
      <div className="w-3/4 h-3 rounded bg-primary/40" />
      <div className="w-1/2 h-2 rounded bg-muted-foreground/20" />
    </div>
  ),
  "split-left": (
    <div className="w-full h-full flex">
      <div className="w-2/5 bg-primary/20 flex flex-col items-center justify-center gap-1 p-2">
        <div className="w-full h-2 rounded bg-primary/40" />
        <div className="w-3/4 h-1.5 rounded bg-muted-foreground/20" />
      </div>
      <div className="w-3/5 bg-muted/50" />
    </div>
  ),
  "minimal-bottom": (
    <div className="w-full h-full bg-muted/50 flex flex-col">
      <div className="flex-1" />
      <div className="h-1/4 bg-primary/20 flex items-center px-3">
        <div className="w-1/2 h-2 rounded bg-primary/40" />
      </div>
    </div>
  ),
  "card-overlay": (
    <div className="w-full h-full bg-muted/50 flex items-center justify-center p-3">
      <div className="w-3/4 h-3/5 rounded-lg border border-border/50 bg-card/80 flex flex-col items-center justify-center gap-1 p-2">
        <div className="w-3/4 h-2 rounded bg-primary/40" />
        <div className="w-1/2 h-1.5 rounded bg-muted-foreground/20" />
      </div>
    </div>
  ),
};

// --- Helpers ---
function loadBrand(): BrandConfig {
  try {
    const raw = localStorage.getItem("nexus_post_brand");
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { primary_color: "#FF6B35", secondary_color: "#004E89", font_family: "Montserrat", logo_b64: null };
}

function saveBrand(b: BrandConfig) {
  localStorage.setItem("nexus_post_brand", JSON.stringify(b));
}

// --- Component ---
const PostCreator = () => {
  const navigate = useNavigate();

  // Format & template
  const [selectedFormat, setSelectedFormat] = useState(FORMATS[0].id);
  const [selectedTemplate, setSelectedTemplate] = useState(MOCK_TEMPLATES[0].id);

  // Brand
  const [brand, setBrand] = useState<BrandConfig>(loadBrand);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Content
  const [imagePrompt, setImagePrompt] = useState("");
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [ctaText, setCtaText] = useState("");

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Persist brand
  useEffect(() => { saveBrand(brand); }, [brand]);

  const activeFormat = FORMATS.find(f => f.id === selectedFormat)!;

  const handleLogoUpload = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|svg\+xml)$/)) {
      toast({ title: "Formato no soportado", description: "Solo PNG o SVG", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBrand(b => ({ ...b, logo_b64: reader.result as string }));
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!imagePrompt.trim() || !headline.trim()) {
      toast({ title: "Campos requeridos", description: "Escribe al menos un prompt de imagen y un headline.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Mock: simulate API delay
      await new Promise(r => setTimeout(r, 3000));
      const w = activeFormat.width;
      const h = activeFormat.height;
      const placeholderUrl = `https://placehold.co/${w}x${h}/${brand.primary_color.replace("#", "")}/${brand.secondary_color.replace("#", "")}?text=${encodeURIComponent(headline.slice(0, 30))}`;
      setGeneratedImage(placeholderUrl);

      /* Real API call (uncomment when backend is ready):
      const res = await fetch(`${BASE_URL}/api/v1/posts/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          format: selectedFormat,
          brand: {
            logo_b64: brand.logo_b64,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
            font_family: brand.font_family,
          },
          copy: { headline, body: bodyText, cta: ctaText },
          image_prompt: imagePrompt,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      const data = await res.json();
      setGeneratedImage(data.rendered_post);
      */
    } catch (err: any) {
      toast({ title: "Error al generar", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `post-${selectedFormat}-${Date.now()}.png`;
    a.click();
  };

  // Preview aspect ratio
  const previewAspect = activeFormat.width / activeFormat.height;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-border/40 bg-background/80 backdrop-blur flex items-center px-4 gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-base font-bold text-foreground tracking-tight">Crear Post</h1>
      </header>

      {/* Two columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Config panel */}
        <aside className="w-full lg:w-[40%] xl:w-[38%] border-r border-border/30 overflow-y-auto">
          <div className="p-5 space-y-7">

            {/* --- Section 1: Formato --- */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Formato</h2>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(f => {
                  const Icon = f.icon;
                  const active = selectedFormat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer",
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                          : "border-border/40 bg-card hover:border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon size={18} className={cn(active && "text-primary")} />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{f.label}</p>
                        <p className="text-[10px] text-muted-foreground">{f.width}×{f.height}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* --- Section 2: Template --- */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Template</h2>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_TEMPLATES.map(t => {
                  const active = selectedTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        "rounded-xl border overflow-hidden transition-all duration-150 cursor-pointer text-left",
                        active
                          ? "border-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                          : "border-border/40 hover:border-border"
                      )}
                    >
                      <div className="aspect-video w-full">
                        {TEMPLATE_THUMBS[t.id]}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* --- Section 3: Marca --- */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Marca</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Color primario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brand.primary_color}
                      onChange={e => setBrand(b => ({ ...b, primary_color: e.target.value }))}
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent p-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{brand.primary_color}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Color secundario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brand.secondary_color}
                      onChange={e => setBrand(b => ({ ...b, secondary_color: e.target.value }))}
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent p-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground">{brand.secondary_color}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipografía</Label>
                <Select value={brand.font_family} onValueChange={v => setBrand(b => ({ ...b, font_family: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Logo</Label>
                {brand.logo_b64 ? (
                  <div className="flex items-center gap-3 p-2 rounded-lg border border-border/40 bg-card">
                    <img src={brand.logo_b64} alt="Logo" className="h-10 w-10 object-contain rounded" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">Logo cargado</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBrand(b => ({ ...b, logo_b64: null }))}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full h-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-transparent"
                  >
                    <Upload size={18} />
                    <span className="text-xs">Subir PNG o SVG</span>
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept=".png,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
              </div>
            </section>

            {/* --- Section 4: Contenido --- */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contenido</h2>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Prompt de imagen</Label>
                <Textarea
                  rows={3}
                  placeholder="Describe la imagen de fondo que quieres generar..."
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Headline</Label>
                  <span className="text-[10px] font-mono text-muted-foreground">{headline.length}/60</span>
                </div>
                <Input
                  placeholder="Título principal del post"
                  maxLength={60}
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Body <span className="opacity-50">(opcional)</span></Label>
                  <span className="text-[10px] font-mono text-muted-foreground">{bodyText.length}/150</span>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Texto secundario"
                  maxLength={150}
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  className="text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">CTA <span className="opacity-50">(opcional)</span></Label>
                  <span className="text-[10px] font-mono text-muted-foreground">{ctaText.length}/30</span>
                </div>
                <Input
                  placeholder="Call to action..."
                  maxLength={30}
                  value={ctaText}
                  onChange={e => setCtaText(e.target.value)}
                  className="text-sm"
                />
              </div>
            </section>

            {/* --- Section 5: Generate button --- */}
            <Button
              className="w-full h-12 text-sm font-bold gap-2"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generando tu post...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generar Post
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Right: Preview */}
        <main className="flex-1 bg-secondary/30 flex flex-col items-center justify-center p-6 lg:p-10 overflow-y-auto">
          {/* Preview container */}
          <div
            className="w-full relative"
            style={{ maxWidth: previewAspect >= 1 ? "640px" : "360px" }}
          >
            <div style={{ paddingBottom: `${(1 / previewAspect) * 100}%` }} className="relative w-full">
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                {isGenerating ? (
                  <Skeleton className="w-full h-full" />
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Post generado"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <ImageIcon size={40} strokeWidth={1.2} />
                    <p className="text-sm font-medium">Tu post aparecerá aquí</p>
                    <p className="text-xs">{activeFormat.label} — {activeFormat.width}×{activeFormat.height}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons below preview */}
          {generatedImage && !isGenerating && (
            <div className="flex items-center gap-3 mt-5">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
                <Download size={14} /> Descargar PNG
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerate}>
                <RefreshCw size={14} /> Regenerar
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Próximamente", description: "La función de agregar a parrilla estará disponible pronto." })}>
                <Plus size={14} /> Agregar a Parrilla
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PostCreator;
