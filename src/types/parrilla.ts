// src/types/parrilla.ts
// Shared types for the Parrilla (content grid) domain.
// Used by Parrilla.tsx, ParrillasHub, OverviewModule, etc.

export type Platform = "instagram" | "tiktok" | "linkedin" | "twitter";

export type PostStatus = "draft" | "scheduled" | "published";

export type ViewMode = "kanban" | "calendar";

export type GenerationJobStatus = "pending" | "processing" | "completed" | "failed";

export type PostGenerationStatus = "generating" | "success" | "error";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "published";

export type PostImageStatus = "pending" | "generating" | "ready" | "error";

export type VideoStatus = "idle" | "generating" | "completed" | "success" | "processing" | "error";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type QuickActionId =
  | "more_vibrant"
  | "another_angle"
  | "more_minimal"
  | "change_background"
  | "more_editorial"
  | "better_lighting"
  | "closer"
  | "change_typography";

export interface QuickAction {
  id: QuickActionId;
  label: string;
  emoji: string;
  tooltip: string;
}

export interface FormatOption {
  id: string;
  platform: string;
  label: string;
  width: number;
  height: number;
  icon: string;
}

export interface BrandProfile {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  palette: string[];
  contrast_color: string;
  font_family: string;
  suggested_fonts: string[];
  background_suggestion: string;
}

export interface GenerationJob {
  id: string;
  brand_id: string;
  brand_name?: string;
  campaign_description: string | null;
  status: string;
  total_posts: number | null;
  completed_posts: number | null;
  language?: string;
  created_at: string;
  updated_at?: string;
}

export interface GeneratedPost {
  id: string;
  job_id: string;
  index: number;
  platform: Platform;
  format: string;
  status: PostGenerationStatus;
  image_status: PostImageStatus;
  error_message?: string;
  headline?: string;
  body?: string;
  cta?: string;
  image_prompt?: string;
  rendered_image_url?: string;
  video_url?: string;
  video_status?: string;
  video_error?: string;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  created_at?: string;
}

export interface PostVersion {
  id: string;
  version_number: number;
  image_url: string;
  headline?: string;
  body?: string;
  cta?: string;
  image_prompt?: string;
  change_description?: string;
  is_current?: boolean;
  created_at?: string;
}

export interface ChatMsg {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  pending?: boolean;
  created_at?: string;
}

/**
 * UI-only shape representing a post card in the parrilla grid.
 * NOT persisted to DB — derived from GeneratedPost + local state.
 */
export interface PostCard {
  id: string;
  platform: Platform;
  format: string;
  status: PostStatus;
  image?: string;
  caption?: string;
  audio?: string;
  title?: string;
  hashtags?: string[];
  scheduledAt?: string;
  calendarDay?: number;
  headline?: string;
  body?: string;
  cta?: string;
  imagePrompt?: string;
  styleDescription?: string;
  isRendering?: boolean;
  error?: string | null;
  video_url?: string;
  video_status?: VideoStatus;
  video_error?: string;
  image_status?: PostImageStatus;
  approval_status?: ApprovalStatus;
  approved_at?: string | null;
}

/* ── Constants ── */

export const ALL_FORMATS: FormatOption[] = [
  { id: "instagram_feed", platform: "instagram", label: "Feed", width: 1080, height: 1080, icon: "□" },
  { id: "instagram_story", platform: "instagram", label: "Story", width: 1080, height: 1920, icon: "▯" },
  { id: "instagram_reel", platform: "instagram", label: "Reel", width: 1080, height: 1920, icon: "▯" },
  { id: "tiktok_video", platform: "tiktok", label: "Video", width: 1080, height: 1920, icon: "▯" },
  { id: "linkedin_post", platform: "linkedin", label: "Post", width: 1200, height: 627, icon: "▬" },
  { id: "linkedin_story", platform: "linkedin", label: "Story", width: 1080, height: 1920, icon: "▯" },
  { id: "twitter_post", platform: "twitter", label: "Post", width: 1200, height: 630, icon: "▬" },
];

export const DEFAULT_BRAND: BrandProfile = {
  primary_color: "#FF6B35",
  secondary_color: "#004E89",
  accent_color: "#F1FAEE",
  palette: ["#FF6B35", "#004E89", "#F1FAEE", "#A8DADC", "#457B9D"],
  contrast_color: "#FFFFFF",
  font_family: "Montserrat",
  suggested_fonts: ["Montserrat", "Poppins", "Inter"],
  background_suggestion: "dark",
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "more_vibrant", label: "Más vibrante", emoji: "🎨", tooltip: "Aumenta saturación y contraste" },
  { id: "another_angle", label: "Otro ángulo", emoji: "🔄", tooltip: "Genera la misma escena desde otra perspectiva" },
  { id: "more_minimal", label: "Más minimalista", emoji: "✨", tooltip: "Reduce elementos y limpia la composición" },
  { id: "change_background", label: "Cambiar fondo", emoji: "🌅", tooltip: "Reemplaza el fondo manteniendo el sujeto" },
  { id: "more_editorial", label: "Más editorial", emoji: "📸", tooltip: "Estilo revista, fotografía profesional" },
  { id: "better_lighting", label: "Mejor iluminación", emoji: "💡", tooltip: "Mejora luz, sombras y mood" },
  { id: "closer", label: "Más cercano", emoji: "🔍", tooltip: "Acerca la cámara al sujeto" },
  { id: "change_typography", label: "Cambiar tipografía", emoji: "🔤", tooltip: "Prueba otra fuente para el texto" },
];

/* ── Helpers ── */

export function getDimensionsFromFormat(format: string): { w: number; h: number } {
  const f = ALL_FORMATS.find(f => f.id === format);
  if (f) return { w: f.width, h: f.height };
  return { w: 1080, h: 1080 };
}

export function getAspectClass(format: string): string {
  const dims = getDimensionsFromFormat(format);
  if (dims.w === dims.h) return "aspect-square";
  if (dims.h > dims.w) return "aspect-[9/16]";
  return "aspect-[1.91/1]";
}

export function relativeTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "hace unos segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}
