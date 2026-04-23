import { supabase } from "@/integrations/supabase/client";
import type { GeneratedPost } from "@/types/parrilla";

const POST_COLUMNS =
  "id, job_id, index, platform, format, status, error_message, headline, body, cta, image_prompt, rendered_image_url, video_url, video_status, video_error, image_status, approval_status, approved_at, created_at";

export async function getPostsByJob(jobId: string): Promise<GeneratedPost[]> {
  const { data, error } = await supabase
    .from("generated_posts")
    .select(POST_COLUMNS)
    .eq("job_id", jobId)
    .order("index", { ascending: true });
  if (error) throw error;
  return (data as GeneratedPost[]) ?? [];
}

export async function getPost(postId: string): Promise<GeneratedPost | null> {
  const { data, error } = await supabase
    .from("generated_posts")
    .select(POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle();
  if (error) throw error;
  return (data as GeneratedPost) ?? null;
}

export async function updatePost(
  postId: string,
  patch: Partial<{
    headline: string;
    body: string;
    cta: string;
    image_prompt: string;
    style_description: string;
  }>,
): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from("generated_posts")
    .update(patch)
    .eq("id", postId)
    .select(POST_COLUMNS)
    .single();
  if (error) throw error;
  return data as GeneratedPost;
}

/**
 * Setea approval_status = 'approved' y approved_at = now().
 */
export async function approvePost(postId: string): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from("generated_posts")
    .update({ approval_status: "approved", approved_at: new Date().toISOString() })
    .eq("id", postId)
    .select(POST_COLUMNS)
    .single();
  if (error) throw error;
  return data as GeneratedPost;
}

/**
 * Aprueba todos los posts de un job en bulk.
 * Retorna el número de posts aprobados.
 */
export async function approveAllPosts(jobId: string): Promise<number> {
  const { data, error } = await supabase
    .from("generated_posts")
    .update({ approval_status: "approved", approved_at: new Date().toISOString() })
    .eq("job_id", jobId)
    .eq("status", "success")
    .neq("approval_status", "approved")
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Soft delete: approval_status = 'rejected'.
 */
export async function rejectPost(postId: string): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from("generated_posts")
    .update({ approval_status: "rejected" })
    .eq("id", postId)
    .select(POST_COLUMNS)
    .single();
  if (error) throw error;
  return data as GeneratedPost;
}

export async function markAsPublished(postId: string): Promise<GeneratedPost> {
  const { data, error } = await supabase
    .from("generated_posts")
    .update({ approval_status: "published" })
    .eq("id", postId)
    .select(POST_COLUMNS)
    .single();
  if (error) throw error;
  return data as GeneratedPost;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("generated_posts")
    .delete()
    .eq("id", postId);
  if (error) throw error;
}
