import { supabase } from "@/integrations/supabase/client";
import type { SlideElement } from "@/components/dashboard/briefs/campaignData";

export type BriefKind = "strategic" | "campaign";
export type BriefStatus = "interviewing" | "done" | "archived";

/**
 * Snapshot completo del estado del editor que se persiste en
 * `brand_briefs.editor_state` (JSONB). Es el estado COMPLETO, no incremental.
 */
export interface EditorSlideMeta {
  id: string;
  type: "cover" | "content" | "art" | string;
  image?: string;
  backgroundColor?: string;
  transition?: "none" | "fade" | "slide" | "zoom";
}

export interface EditorState {
  version: 1;
  docTitle: string;
  slidesElements: SlideElement[][];
  slideMeta: EditorSlideMeta[];
}

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
  editor_state: EditorState | null;
  editor_last_saved_at: string | null;
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
  editor_state: EditorState | null;
  editor_last_saved_at: string | null;
}>;

/** UUID v4 regex — usado para distinguir IDs reales de IDs legacy `agent-xxx` */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string | undefined | null): boolean =>
  !!s && UUID_REGEX.test(s);

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

/**
 * Persiste el snapshot completo del editor.
 * Always full replace: no diff, no merge — el caller envía el EditorState íntegro.
 */
export async function updateEditorState(
  briefId: string,
  editorState: EditorState,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("brand_briefs")
    .update({
      editor_state: editorState as any,
      editor_last_saved_at: now,
      updated_at: now,
    })
    .eq("id", briefId);
  if (error) throw error;
}

/**
 * Fallback síncrono para `beforeunload` usando navigator.sendBeacon.
 * Supabase JS hace fetch async; sendBeacon garantiza la entrega aunque
 * la pestaña se esté cerrando. Devuelve true si el navegador aceptó el envío.
 */
export function persistEditorStateBeacon(
  briefId: string,
  editorState: EditorState,
): boolean {
  if (typeof fetch === "undefined") return false;
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
    const url = `${SUPABASE_URL}/rest/v1/brand_briefs?id=eq.${encodeURIComponent(briefId)}`;
    const now = new Date().toISOString();
    const body = JSON.stringify({
      editor_state: editorState,
      editor_last_saved_at: now,
      updated_at: now,
    });

    // Recuperar el JWT del usuario activo desde el storage de supabase-js
    // (clave: sb-<project-ref>-auth-token). Si no existe usamos solo la anon key.
    let bearer = SUPABASE_ANON_KEY;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? "";
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token) {
              bearer = parsed.access_token;
              break;
            }
          }
        }
      }
    } catch {}

    // fetch con keepalive permite PATCH con headers custom incluso en
    // beforeunload (sendBeacon no soporta headers custom).
    fetch(url, {
      method: "PATCH",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${bearer}`,
        Prefer: "return=minimal",
      },
      body,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

// ─── DELETE ───
export async function deleteBrief(briefId: string): Promise<void> {
  const { error } = await supabase
    .from("brand_briefs")
    .delete()
    .eq("id", briefId);
  if (error) throw error;
}
