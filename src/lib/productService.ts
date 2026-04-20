import { supabase } from "@/integrations/supabase/client";
import { apiCall } from "@/lib/apiClient";

export interface BrandProduct {
  id: string;
  brand_id: string;
  name: string | null;
  image_url: string;
  storage_path: string;
  vision_analysis: unknown | null;
  analyzed_at: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

const BUCKET = "brand-assets";
const MAX_PRODUCTS = 20;

export async function listProducts(brandId: string): Promise<BrandProduct[]> {
  const { data, error } = await supabase
    .from("brand_products")
    .select("*")
    .eq("brand_id", brandId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BrandProduct[];
}

export async function countProducts(brandId: string): Promise<number> {
  const { count, error } = await supabase
    .from("brand_products")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brandId);
  if (error) throw error;
  return count ?? 0;
}

export async function uploadProduct(params: {
  agencyId: string;
  brandId: string;
  file: File;
  name?: string;
}): Promise<BrandProduct> {
  const { agencyId, brandId, file, name } = params;

  if (file.size > 10 * 1024 * 1024) throw new Error("Imagen muy grande (máx 10MB)");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Formato no soportado (usa PNG, JPG o WEBP)");
  }

  const current = await countProducts(brandId);
  if (current >= MAX_PRODUCTS) throw new Error(`Límite de ${MAX_PRODUCTS} productos por marca`);

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : "png";
  const path = `${agencyId}/${brandId}/products/product_${crypto.randomUUID()}_${Date.now()}.${safeExt}`;

  const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: "3600",
  });
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { data, error: insertErr } = await supabase
    .from("brand_products")
    .insert({
      brand_id: brandId,
      name: name?.trim() || `Producto ${current + 1}`,
      image_url: urlData.publicUrl,
      storage_path: path,
      display_order: current,
      is_primary: current === 0,
    })
    .select("*")
    .single();

  if (insertErr) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw insertErr;
  }
  return data as BrandProduct;
}

/**
 * Triggers backend analysis. Does not throw — returns null if backend is unavailable.
 */
export async function analyzeProduct(productId: string): Promise<unknown | null> {
  try {
    const data = await apiCall(`/api/v1/product/analyze`, {
      method: "POST",
      body: { product_id: productId },
    });
    return data;
  } catch (err) {
    console.warn("[productService] analyze unavailable:", err);
    return null;
  }
}

export async function updateProduct(
  productId: string,
  updates: { name?: string | null; display_order?: number; is_primary?: boolean }
): Promise<BrandProduct> {
  const { data, error } = await supabase
    .from("brand_products")
    .update(updates)
    .eq("id", productId)
    .select("*")
    .single();
  if (error) throw error;
  return data as BrandProduct;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { data: row, error: getErr } = await supabase
    .from("brand_products")
    .select("storage_path")
    .eq("id", productId)
    .single();
  if (getErr) throw getErr;

  await supabase.storage.from(BUCKET).remove([row.storage_path]).catch(() => {});

  const { error: delErr } = await supabase.from("brand_products").delete().eq("id", productId);
  if (delErr) throw delErr;
}

export async function setPrimaryProduct(brandId: string, productId: string): Promise<void> {
  // Unset others, set the chosen one
  const { error: e1 } = await supabase
    .from("brand_products")
    .update({ is_primary: false })
    .eq("brand_id", brandId);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from("brand_products")
    .update({ is_primary: true })
    .eq("id", productId);
  if (e2) throw e2;
}
