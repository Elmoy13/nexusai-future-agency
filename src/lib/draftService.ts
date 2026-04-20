import { supabase } from "@/integrations/supabase/client";

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
