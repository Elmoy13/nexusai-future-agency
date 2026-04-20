import { useState } from "react";
import { Plus, Package, Star, Check, ImagePlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddProductDialog } from "@/components/dashboard/ProductsSection";
import type { BrandProduct } from "@/lib/productService";

interface Props {
  brandId: string | null;
  agencyId: string | null;
  brandProducts: BrandProduct[] | null;
  selectedProductIds: string[];
  onToggle: (productId: string) => void;
  onProductCreated: (product: BrandProduct) => void;
}

const ParrillaProductSelector = ({
  brandId,
  agencyId,
  brandProducts,
  selectedProductIds,
  onToggle,
  onProductCreated,
}: Props) => {
  const [showAdd, setShowAdd] = useState(false);

  const isLoading = brandProducts === null;
  const isEmpty = !isLoading && brandProducts.length === 0;

  return (
    <div className="mb-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Package size={12} className="text-primary" />
          Productos de tu marca
        </p>
        {brandProducts && brandProducts.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {selectedProductIds.length}/{brandProducts.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-secondary/30 p-4 text-center space-y-2">
          <ImagePlus size={20} className="mx-auto text-muted-foreground/60" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Esta marca aún no tiene productos persistentes. Súbelos para reutilizarlos en futuras parrillas, o usa imágenes temporales abajo.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            disabled={!brandId || !agencyId}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors disabled:opacity-50"
          >
            <Plus size={12} /> Agregar producto
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {brandProducts!.map((p) => {
            const checked = selectedProductIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg border transition-all ${
                  checked
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-secondary/40 hover:bg-secondary/70"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-muted/30 border border-border/50">
                    <img src={p.image_url} alt={p.name ?? ""} className="w-full h-full object-cover" />
                  </div>
                  {checked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
                      <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] font-medium text-foreground truncate">{p.name || "Producto"}</p>
                  {p.is_primary && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider text-amber-400 font-mono">
                      <Star size={8} /> Principal
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setShowAdd(true)}
            disabled={!brandId || !agencyId}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-[10px] font-medium text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            <Plus size={12} /> Agregar nuevo producto a la marca
          </button>
        </div>
      )}

      {brandId && (
        <AddProductDialog
          open={showAdd}
          onClose={() => setShowAdd(false)}
          brandId={brandId}
          agencyId={agencyId}
          onCreated={(product) => {
            if (product) onProductCreated(product);
          }}
        />
      )}
    </div>
  );
};

export default ParrillaProductSelector;
