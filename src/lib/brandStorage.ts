import { supabase } from "@/integrations/supabase/client";

const BUCKET = "brand-assets";

/**
 * Sube un logo al bucket `brand-assets` y actualiza brands.logo_url.
 * Estructura: {agency_id}/{brand_id}/logo_{timestamp}.{ext}
 */
export async function uploadBrandLogo(params: {
  file: Blob;
  agencyId: string;
  brandId: string;
  filename?: string;
}): Promise<{ publicUrl: string; path: string }> {
  const { file, agencyId, brandId, filename } = params;
  const ext = (filename?.split(".").pop() || "png").toLowerCase();
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : "png";
  const path = `${agencyId}/${brandId}/logo_${Date.now()}.${safeExt}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: (file as any).type || `image/${safeExt}`,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: updErr } = await supabase
    .from("brands")
    .update({ logo_url: publicUrl })
    .eq("id", brandId);
  if (updErr) throw updErr;

  return { publicUrl, path };
}

/**
 * Convierte un base64 dataURL a Blob.
 */
export async function base64ToBlob(b64: string): Promise<Blob> {
  const res = await fetch(b64);
  return res.blob();
}

/**
 * Devuelve el brand_id válido o null. Verifica que pertenezca a la agencia activa.
 */
export async function ensureBrandBelongsToAgency(brandId: string, agencyId: string): Promise<boolean> {
  const { data } = await supabase
    .from("brands")
    .select("id")
    .eq("id", brandId)
    .eq("agency_id", agencyId)
    .maybeSingle();
  return !!data;
}
