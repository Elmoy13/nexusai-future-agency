import { supabase } from "@/integrations/supabase/client";

export type BriefKind = "strategic" | "campaign";
export type BriefStatus = "interviewing" | "done" | "archived";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  attachments?: string[];
  cta?: string;
}

export interface UploadedImage {
  url: string;
  filename: string;
  uploaded_at: string;
}

export interface BrandBrief {
  id: string;
  agency_id: string;
  brand_id: string;
  created_by: string | null;
  kind: BriefKind;
  title: string;
  description: string | null;
  session_id: string | null;
  chat_messages: ChatMessage[];
  uploaded_images: UploadedImage[];
  presentation: any | null;
  status: BriefStatus;
  extracted_config: any | null;
  strategic_brief_id: string | null;
  created_at: string;
  updated_at: string;
}

export type BriefPatch = Partial<{
  title: string;
  description: string | null;
  chat_messages: ChatMessage[];
  uploaded_images: UploadedImage[];
  presentation: any;
  status: BriefStatus;
  extracted_config: any;
}>;

// ─── CREATE ───
export async function createBrief(params: {
  agencyId: string;
  brandId: string;
  kind: BriefKind;
  title?: string;
  strategicBriefId?: string | null;
  userId: string;
}): Promise<BrandBrief> {
  let strategicId = params.strategicBriefId ?? null;
  if (params.kind === "campaign" && !strategicId) {
    const { data: existing } = await supabase
      .from("brand_briefs")
      .select("id")
      .eq("brand_id", params.brandId)
      .eq("kind", "strategic")
      .maybeSingle();
    strategicId = (existing as any)?.id ?? null;
  }

  const { data, error } = await supabase
    .from("brand_briefs")
    .insert({
      agency_id: params.agencyId,
      brand_id: params.brandId,
      created_by: params.userId,
      kind: params.kind,
      title:
        params.title ??
        (params.kind === "strategic" ? "Brief estratégico" : "Brief sin título"),
      status: "interviewing",
      session_id: crypto.randomUUID(),
      strategic_brief_id: strategicId,
      chat_messages: [],
      uploaded_images: [],
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as BrandBrief;
}

// ─── READ ───
export async function getBrief(briefId: string): Promise<BrandBrief | null> {
  const { data, error } = await supabase
    .from("brand_briefs")
    .select("*")
    .eq("id", briefId)
    .maybeSingle();
  if (error) throw error;
  return (data as BrandBrief) ?? null;
}

export async function listBriefsByBrand(
  brandId: string,
  kind?: BriefKind,
): Promise<BrandBrief[]> {
  let q = supabase
    .from("brand_briefs")
    .select("*")
    .eq("brand_id", brandId)
    .order("updated_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as BrandBrief[];
}

export async function getStrategicBrief(
  brandId: string,
): Promise<BrandBrief | null> {
  const { data, error } = await supabase
    .from("brand_briefs")
    .select("*")
    .eq("brand_id", brandId)
    .eq("kind", "strategic")
    .maybeSingle();
  if (error) throw error;
  return (data as BrandBrief) ?? null;
}

export async function listBriefsByAgency(
  agencyId: string,
): Promise<Array<BrandBrief & { brand: { id: string; name: string; logo_url: string | null } | null }>> {
  const { data, error } = await supabase
    .from("brand_briefs")
    .select("*, brand:brands(id, name, logo_url)")
    .eq("agency_id", agencyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

// ─── UPDATE ───
export async function updateBrief(
  briefId: string,
  patch: BriefPatch,
): Promise<BrandBrief> {
  const { data, error } = await supabase
    .from("brand_briefs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", briefId)
    .select("*")
    .single();
  if (error) throw error;
  return data as BrandBrief;
}

// ─── DELETE ───
export async function deleteBrief(briefId: string): Promise<void> {
  const { error } = await supabase
    .from("brand_briefs")
    .delete()
    .eq("id", briefId);
  if (error) throw error;
}
