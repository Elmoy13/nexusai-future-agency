import { supabase } from "@/integrations/supabase/client";
import { apiCall } from "@/lib/apiClient";

export interface DraftRow {
  id: string;
  agency_id: string;
  brand_id: string;
  user_id: string;
  title: string | null;
  status: "draft" | "generating" | "generated" | "discarded";
  chat_messages: unknown;
  config: unknown;
  selected_product_ids: string[] | null;
  last_step: string | null;
  brief_id: string | null;
  created_at: string;
  updated_at: string;
}

export type DraftPatch = Partial<
  Pick<DraftRow, "title" | "chat_messages" | "config" | "selected_product_ids" | "last_step" | "status">
>;

export async function createDraft(params: {
  agencyId: string;
  brandId: string;
  userId: string;
  title?: string;
  briefId?: string | null;
  config?: Record<string, unknown>;
}): Promise<DraftRow> {
  const { data, error } = await supabase
    .from("parrilla_drafts")
    .insert({
      agency_id: params.agencyId,
      brand_id: params.brandId,
      user_id: params.userId,
      title: params.title ?? null,
      status: "draft",
      chat_messages: [],
      config: params.config ?? {},
      selected_product_ids: [],
      last_step: "init",
      brief_id: params.briefId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as DraftRow;
}

export async function getDraft(draftId: string): Promise<DraftRow | null> {
  const { data, error } = await supabase
    .from("parrilla_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();
  if (error) throw error;
  return (data as DraftRow) ?? null;
}

export async function patchDraft(draftId: string, patch: DraftPatch): Promise<void> {
  const { error } = await supabase
    .from("parrilla_drafts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", draftId);
  if (error) throw error;
}

export async function listDrafts(agencyId: string, limit = 5): Promise<Array<DraftRow & { brand: { id: string; name: string; logo_url: string | null } | null }>> {
  const { data, error } = await supabase
    .from("parrilla_drafts")
    .select("*, brand:brands(id, name, logo_url)")
    .eq("agency_id", agencyId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as any;
}

export async function deleteDraft(draftId: string): Promise<void> {
  const { error } = await supabase.from("parrilla_drafts").delete().eq("id", draftId);
  if (error) throw error;
}

/**
 * Fetches a draft with its associated jobs and generated posts via the API.
 * Falls back to Supabase direct queries if the API endpoint is unavailable.
 */
export interface DraftWithPosts {
  draft: DraftRow;
  jobs: Array<{
    id: string;
    status: string;
    total_posts: number | null;
    completed_posts: number | null;
    campaign_description: string | null;
    language: string | null;
    created_at: string;
  }>;
  posts: Array<Record<string, unknown>>;
}

export async function getDraftWithPosts(draftId: string): Promise<DraftWithPosts | null> {
  // Try API endpoint first
  try {
    const data = await apiCall<DraftWithPosts>(`/api/v1/drafts/${draftId}/posts`);
    return data;
  } catch {
    // Fallback: build from Supabase direct queries
    console.warn("[draftService] /api/v1/drafts/:id/posts unavailable, falling back to Supabase");
  }

  const draft = await getDraft(draftId);
  if (!draft) return null;

  // Find jobs linked to this draft
  const { data: jobs, error: jobsErr } = await supabase
    .from("generation_jobs")
    .select("id, status, total_posts, completed_posts, campaign_description, language, created_at")
    .eq("draft_id", draftId)
    .order("created_at", { ascending: false });

  if (jobsErr) {
    console.error("[draftService] fallback: jobs query failed", jobsErr);
    return { draft, jobs: [], posts: [] };
  }

  const jobList = (jobs ?? []) as DraftWithPosts["jobs"];
  if (jobList.length === 0) return { draft, jobs: jobList, posts: [] };

  // Fetch posts for the latest job
  const latestJob = jobList[0];
  const { data: posts, error: postsErr } = await supabase
    .from("generated_posts")
    .select("id, job_id, index, platform, format, status, error_message, headline, body, cta, image_prompt, rendered_image_url, video_url, video_status, image_status, approval_status, approved_at")
    .eq("job_id", latestJob.id)
    .order("index", { ascending: true });

  if (postsErr) {
    console.error("[draftService] fallback: posts query failed", postsErr);
    return { draft, jobs: jobList, posts: [] };
  }

  return { draft, jobs: jobList, posts: (posts ?? []) as Record<string, unknown>[] };
}
