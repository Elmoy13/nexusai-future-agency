import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Star, ImagePlus, Loader2, X, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  listProducts,
  uploadProduct,
  analyzeProduct,
  deleteProduct,
  setPrimaryProduct,
  type BrandProduct,
} from "@/lib/productService";
import { useAgency } from "@/contexts/AgencyContext";

const MAX_PRODUCTS = 20;

interface Props {
  brandId: string;
}

const ProductsSection = ({ brandId }: Props) => {
  const { currentAgencyId } = useAgency();
  const [products, setProducts] = useState<BrandProduct[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = async () => {
    try {
      const list = await listProducts(brandId);
      setProducts(list);
    } catch (err: any) {
      toast.error("Error cargando productos", { description: err?.message });
      setProducts([]);
    }
  };

  useEffect(() => {
    refresh();
  }, [brandId]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
      toast.success("Producto eliminado");
    } catch (err: any) {
      toast.error("Error al eliminar", { description: err?.message });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryProduct(brandId, id);
      setProducts((prev) =>
        prev ? prev.map((p) => ({ ...p, is_primary: p.id === id })) : prev
      );
      toast.success("Producto principal actualizado");
    } catch (err: any) {
      toast.error("Error al actualizar", { description: err?.message });
    }
  };

  const count = products?.length ?? 0;
  const atLimit = count >= MAX_PRODUCTS;
  const nearLimit = count >= MAX_PRODUCTS - 2 && !atLimit;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ImagePlus size={18} className="text-primary" />
          Productos
          <span className="text-sm text-muted-foreground font-normal">
            ({count} / {MAX_PRODUCTS})
          </span>
        </h2>
        <Button
          size="sm"
          onClick={() => setShowAdd(true)}
          disabled={atLimit || !currentAgencyId}
          className="gap-1.5"
          title={atLimit ? "Límite alcanzado" : undefined}
        >
          <Plus size={14} /> Agregar
        </Button>
      </div>

      {nearLimit && (
        <div className="mb-4 glass rounded-lg px-4 py-2.5 flex items-center gap-2 border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={14} className="text-amber-400" />
          <p className="text-xs text-muted-foreground">
            Te acercas al límite de {MAX_PRODUCTS} productos por marca.
          </p>
        </div>
      )}

      {products === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <ImagePlus size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Aún no tienes productos. Agrega el primero para que aparezcan en tus parrillas.
          </p>
          <Button onClick={() => setShowAdd(true)} disabled={!currentAgencyId} className="gap-1.5">
            <Plus size={14} /> Agregar producto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="group relative glass rounded-xl overflow-hidden border border-border/30"
            >
              <div className="aspect-square bg-muted/20">
                <img src={p.image_url} alt={p.name ?? ""} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground truncate flex-1">{p.name}</p>
                {p.is_primary ? (
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 shrink-0">
                    Principal
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPrimary(p.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-amber-400 p-0.5"
                    title="Marcar como principal"
                  >
                    <Star size={12} />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 transition"
                title="Eliminar"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddProductDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        brandId={brandId}
        agencyId={currentAgencyId}
        onCreated={() => {
          refresh();
        }}
      />
    </section>
  );
};

export interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  brandId: string;
  agencyId: string | null;
  onCreated: (product?: BrandProduct) => void;
}

export const AddProductDialog = ({ open, onClose, brandId, agencyId, onCreated }: AddProductDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setName("");
      setPreview(null);
      setUploading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePick = (f: File | null) => {
    if (!f) return;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !agencyId) return;
    setUploading(true);
    try {
      const created = await uploadProduct({ agencyId, brandId, file, name });
      toast.success("Producto subido");
      // Fire-and-forget analysis
      analyzeProduct(created.id).catch(() => undefined);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error("Error al subir", { description: err?.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar producto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {preview ? (
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/20 border border-border/30">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="absolute top-2 right-2 bg-destructive/80 text-destructive-foreground rounded-full p-1.5"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition"
            >
              <ImagePlus size={32} className="text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground">PNG, JPG o WEBP — máx 10MB</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
          />
          <div>
            <Label htmlFor="product-name" className="text-xs">
              Nombre (opcional)
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Botella 750ml"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading} className="gap-1.5">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Subir y analizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductsSection;
