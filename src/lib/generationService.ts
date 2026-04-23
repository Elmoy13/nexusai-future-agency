import { supabase } from "@/integrations/supabase/client";
import { apiCall } from "@/lib/apiClient";
import type { GenerationJob } from "@/types/parrilla";

/** Payload shape used by both generate endpoints. */
export interface GenerationRequest {
  brand: {
    name: string;
    logo_b64?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
  };
  campaign: {
    description: string;
    tone: string;
    extras: string;
  };
  brand_vision: unknown;
  product_vision: unknown;
  product_images: string[];
  selected_product_ids: string[];
  draft_id: string | null;
  posts_config: { platform: string; format: string }[];
  include_logo_in_image: boolean;
  include_text_in_image: boolean;
  language: string;
  objective?: "engagement" | "conversion" | "awareness";
}

interface GenerationResponse {
  job_id: string;
  total_posts: number;
  status: string;
}

/**
 * Genera la parrilla completa (copy + imágenes) en una sola pasada.
 * POST /api/v1/posts/generate
 */
export async function generateFullParrilla(
  payload: GenerationRequest
): Promise<GenerationResponse> {
  return await apiCall<GenerationResponse>(
    "/api/v1/posts/generate",
    { method: "POST", body: payload }
  );
}

/**
 * Polling del estado de un job + sus posts.
 * GET /api/v1/posts/job/{jobId}
 */
export async function pollJob(jobId: string): Promise<{
  job: Record<string, unknown>;
  posts: Record<string, unknown>[];
}> {
  return await apiCall(`/api/v1/posts/job/${jobId}`);
}

export async function getJob(jobId: string): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("id, brand_id, brand_name, campaign_description, language, status, total_posts, completed_posts, created_at, updated_at")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  return (data as GenerationJob) ?? null;
}

export async function listJobsByBrand(
  brandId: string,
  options?: { status?: GenerationJob["status"]; limit?: number },
): Promise<GenerationJob[]> {
  let q = supabase
    .from("generation_jobs")
    .select("id, brand_id, brand_name, campaign_description, language, status, total_posts, completed_posts, created_at, updated_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (options?.status) q = q.eq("status", options.status);
  if (options?.limit) q = q.limit(options.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data as GenerationJob[]) ?? [];
}

export async function listJobsByAgency(
  agencyId: string,
  options?: { status?: GenerationJob["status"]; limit?: number },
): Promise<GenerationJob[]> {
  let q = supabase
    .from("generation_jobs")
    .select("id, brand_id, brand_name, campaign_description, language, status, total_posts, completed_posts, created_at, updated_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });
  if (options?.status) q = q.eq("status", options.status);
  if (options?.limit) q = q.limit(options.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data as GenerationJob[]) ?? [];
}

export async function countActiveJobs(agencyId: string): Promise<number> {
  const { count, error } = await supabase
    .from("generation_jobs")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .in("status", ["pending", "processing"]);
  if (error) throw error;
  return count ?? 0;
}

export async function countPostsThisMonth(agencyId: string): Promise<number> {
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count, error } = await supabase
    .from("generated_posts")
    .select("id, generation_jobs!inner(agency_id)", { count: "exact", head: true })
    .eq("generation_jobs.agency_id", agencyId)
    .gte("created_at", firstDay);
  if (error) throw error;
  return count ?? 0;
}
