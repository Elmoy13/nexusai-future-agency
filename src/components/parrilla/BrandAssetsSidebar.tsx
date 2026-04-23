import { useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import ParrillaProductSelector from "@/components/dashboard/ParrillaProductSelector";
import type { BrandProfile } from "@/types/parrilla";
import type { BrandProduct } from "@/lib/productService";
import {
  Upload, X, Loader2, ImageIcon, Camera, Plus,
} from "lucide-react";

/* ── Checkerboard Pattern ── */
const CheckerboardBg = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}
    style={{
      backgroundImage: `linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)`,
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      backgroundColor: "hsl(var(--card))",
    }}
  >{children}</div>
);

export interface BrandAssetsSidebarProps {
  // Brand identity
  brandName: string;
  onBrandNameChange: (name: string) => void;
  brand: BrandProfile;
  onBrandChange: (fn: (prev: BrandProfile) => BrandProfile) => void;

  // Logo / assets
  brandAssets: string[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearLogo: () => void;

  // Brand analysis
  brandDetected: boolean;
  isAnalyzingBrand: boolean;
  brandVision: { logo_description?: string; brand_name_detected?: string; personality?: string } | null;

  // Logo/text in image toggles
  includeLogoInImage: boolean;
  onIncludeLogoChange: (val: boolean) => void;
  includeTextInImage: boolean;
  onIncludeTextChange: (val: boolean) => void;

  // Language
  language: "auto" | "es" | "en";
  onLanguageChange: (val: "auto" | "es" | "en") => void;
  detectedLanguage: "es" | "en" | null;

  // Persistent products
  brandId: string | null;
  agencyId: string | null;
  brandProducts: BrandProduct[] | null;
  selectedProductIds: string[];
  onToggleProduct: (pid: string) => void;
  onProductCreated: (product: BrandProduct) => void;

  // Legacy temporary product images
  productImages: string[];
  onProductImagesChange: (fn: (prev: string[]) => string[]) => void;
  onProductImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzingProduct: boolean;
  productVision: { product_type?: string; product_description?: string } | null;
}

const BrandAssetsSidebar = (props: BrandAssetsSidebarProps) => {
  const {
    brandName, onBrandNameChange, brand, onBrandChange,
    brandAssets, onFileUpload, onClearLogo,
    brandDetected, isAnalyzingBrand, brandVision,
    includeLogoInImage, onIncludeLogoChange,
    includeTextInImage, onIncludeTextChange,
    language, onLanguageChange, detectedLanguage,
    brandId, agencyId, brandProducts, selectedProductIds, onToggleProduct, onProductCreated,
    productImages, onProductImagesChange, onProductImageUpload,
    isAnalyzingProduct, productVision,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }}
      className="sticky top-[73px] self-start max-h-[calc(100vh-73px)] bg-card border-r border-border p-5 flex flex-col overflow-y-auto shrink-0"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
          <ImageIcon size={16} className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm">Brand Assets</h2>
          <p className="text-[10px] text-muted-foreground">Inteligencia visual de marca</p>
        </div>
      </div>

      {/* Brand Name */}
      <div className="mb-4 space-y-1.5">
        <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Nombre de tu marca</label>
        <Input
          value={brandName}
          onChange={(e) => onBrandNameChange(e.target.value)}
          placeholder="Ej: Bacachito Feliz"
          className="bg-secondary/50 border-border h-9 text-sm"
        />
      </div>

      {/* Upload / Logo Preview */}
      {brandAssets.length === 0 ? (
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary bg-secondary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group mb-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
            <Upload size={24} className="text-primary-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Subir Logo de Marca</p>
            <p className="text-[11px] text-muted-foreground">PNG, JPG hasta 10MB</p>
          </div>
        </button>
      ) : (
        <div className="mb-4 space-y-3">
          <div className="relative group/logo">
            <CheckerboardBg className="aspect-square rounded-xl overflow-hidden border border-border shadow-sm">
              <img src={brandAssets[brandAssets.length - 1]} alt="Logo" className="w-full h-full object-contain p-2" />
            </CheckerboardBg>
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs gap-1.5 bg-secondary/90 hover:bg-secondary"
              >
                <Upload size={13} /> Cambiar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={onClearLogo}
                className="h-8 text-xs gap-1.5 bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30"
              >
                <X size={13} /> Quitar
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <label htmlFor="logo-integrate" className="text-[11px] font-medium text-foreground cursor-pointer">
              ✨ Integrar logo en la imagen
            </label>
            <Switch id="logo-integrate" checked={includeLogoInImage} onCheckedChange={onIncludeLogoChange} />
          </div>
          <p className="text-[10px] px-1 leading-relaxed" style={{ color: includeLogoInImage ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
            {includeLogoInImage
              ? "La IA integrará tu logo dentro de la escena (tarda un poco más)"
              : "El logo aparecerá como marca de agua en la esquina"}
          </p>
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <label htmlFor="text-integrate" className="text-[11px] font-medium text-foreground cursor-pointer">
              📝 Incluir texto en la imagen
            </label>
            <Switch id="text-integrate" checked={includeTextInImage} onCheckedChange={onIncludeTextChange} />
          </div>
          <p className="text-[10px] px-1 leading-relaxed" style={{ color: includeTextInImage ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
            {includeTextInImage
              ? "La IA agregará el headline y CTA directamente en la imagen con tipografía profesional"
              : "El headline y CTA aparecerán solo en el caption"}
          </p>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileUpload} />

      {brandAssets.length === 0 && !isAnalyzingBrand && !brandDetected && (
        <p className="text-xs text-muted-foreground text-center py-4 px-2 italic">
          Sube tu logo para detectar automáticamente los colores de tu marca
        </p>
      )}

      {isAnalyzingBrand && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-primary" />
            <p className="text-xs text-primary font-medium">🔍 Analizando tu marca...</p>
          </div>
          <div className="flex gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                className="w-8 h-8 rounded-full bg-secondary animate-pulse border border-border"
              />
            ))}
          </div>
          <div className="h-9 bg-secondary rounded-lg animate-pulse" />
        </motion.div>
      )}

      {brandDetected && !isAnalyzingBrand && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-4 space-y-4">
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">✨ Paleta Detectada</p>
            <div className="flex items-center gap-2 justify-center">
              {brand.palette.map((color, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08, type: "spring" }}
                  className="flex flex-col items-center gap-1"
                >
                  <label className="cursor-pointer group/swatch">
                    <input type="color" value={color} onChange={(e) => {
                      const newColor = e.target.value;
                      onBrandChange(prev => {
                        const newPalette = [...prev.palette];
                        newPalette[i] = newColor;
                        const updates: Partial<BrandProfile> = { palette: newPalette };
                        if (i === 0) updates.primary_color = newColor;
                        if (i === 1) updates.secondary_color = newColor;
                        if (i === 2) updates.accent_color = newColor;
                        return { ...prev, ...updates };
                      });
                    }} className="sr-only" />
                    <div
                      className="w-8 h-8 rounded-full border border-white/20 shadow-sm group-hover/swatch:scale-110 group-hover/swatch:ring-2 group-hover/swatch:ring-primary transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                  {i < 3 && (
                    <>
                      <p className="text-[8px] text-muted-foreground font-medium">
                        {["Primario", "Secundario", "Acento"][i]}
                      </p>
                      <p className="text-[8px] text-muted-foreground font-mono">{color}</p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground text-center">Puedes editar cualquier color</p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">🔤 Tipografía Sugerida</p>
            <Select value={brand.font_family} onValueChange={(v) => onBrandChange(prev => ({ ...prev, font_family: v }))}>
              <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {brand.suggested_fonts.map(f => <SelectItem key={f} value={f}>{f} ⭐</SelectItem>)}
                <SelectSeparator />
                {["Inter", "Poppins", "Montserrat", "Playfair Display", "Roboto", "Space Grotesk"]
                  .filter(f => !brand.suggested_fonts.includes(f))
                  .map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)
                }
              </SelectContent>
            </Select>
            <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border">
              <p className="text-lg text-foreground" style={{ fontFamily: brand.font_family }}>Aa Bb Cc 123</p>
              <p className="text-[10px] text-muted-foreground mt-1">{brand.font_family}</p>
            </div>
          </div>
          {/* Brand Vision Analysis */}
          {brandVision && (
            <div className="space-y-1.5 px-1">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                🧠 {brandVision.logo_description || "Marca analizada"}
              </p>
              {brandVision.brand_name_detected && (
                <p className="text-[10px] text-muted-foreground">
                  📛 Nombre detectado: <span className="text-foreground font-medium">{brandVision.brand_name_detected}</span>
                </p>
              )}
              {brandVision.personality && (
                <p className="text-[10px] text-muted-foreground">
                  ✨ Personalidad: <span className="text-foreground font-medium">{brandVision.personality}</span>
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 🌐 Content Language */}
      <div className="mb-4 space-y-2">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">🌐 Idioma del contenido</p>
        <Select value={language} onValueChange={(v) => onLanguageChange(v as "auto" | "es" | "en")}>
          <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">🌐 Auto-detectar</SelectItem>
            <SelectItem value="es">🇪🇸 Español</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
          </SelectContent>
        </Select>
        {language === "auto" ? (
          detectedLanguage ? (
            <p className="text-[10px] text-emerald-400 font-medium px-1 transition-colors">
              Detectado: {detectedLanguage === "es" ? "Español 🇪🇸" : "English 🇺🇸"} ✓
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
              Se detectará del chat y tu marca
            </p>
          )
        ) : (
          <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
            {language === "es"
              ? "Forzado a Español — Nano Banano y los posts saldrán en este idioma"
              : "Forced to English — Nano Banano and posts will use this language"}
          </p>
        )}
      </div>

      {/* 📦 Persistent Brand Products */}
      <ParrillaProductSelector
        brandId={brandId}
        agencyId={agencyId}
        brandProducts={brandProducts}
        selectedProductIds={selectedProductIds}
        onToggle={onToggleProduct}
        onProductCreated={onProductCreated}
      />

      {/* Separator: legacy temporary uploads */}
      <div className="my-4 flex items-center gap-2">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-mono">
          o sube imágenes temporales
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* 📸 Product Photos (LEGACY — temporary, not persisted) */}
      <div className="mb-4 space-y-2.5">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">📸 Imágenes temporales</p>
        <p className="text-[10px] text-muted-foreground -mt-1.5">No se guardan, solo para esta parrilla.</p>
        {productImages.length === 0 ? (
          <button onClick={() => productFileInputRef.current?.click()}
            className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-primary bg-secondary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <Camera size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="text-xs font-medium text-foreground">Sube fotos de tu producto</p>
            <p className="text-[10px] text-muted-foreground">La IA usará estas fotos para crear tus posts</p>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {productImages.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden group/thumb">
                  <img src={img} alt={`Producto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onProductImagesChange(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {productImages.length < 4 && (
                <button onClick={() => productFileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary bg-secondary/30 hover:bg-primary/5 transition-all flex items-center justify-center"
                >
                  <Plus size={20} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-emerald-400 font-medium">✅ {productImages.length} foto(s) lista(s) — La IA usará estas como referencia</p>
            {isAnalyzingProduct && (
              <p className="text-[10px] text-muted-foreground animate-pulse">🧠 Analizando producto con IA...</p>
            )}
            {productVision && !isAnalyzingProduct && (
              <p className="text-[10px] text-muted-foreground">
                🧠 {productVision.product_type ? `${productVision.product_type} — ` : ""}{productVision.product_description || "Producto analizado"}
              </p>
            )}
          </div>
        )}
        <input ref={productFileInputRef} type="file" accept="image/png,image/jpeg" multiple className="hidden" onChange={onProductImageUpload} />
      </div>
    </motion.aside>
  );
};

export default BrandAssetsSidebar;
