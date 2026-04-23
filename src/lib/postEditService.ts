import { apiCall } from "./apiClient";
import type { ChatMsg, PostVersion } from "@/types/parrilla";

export interface EditChatResponse {
  ai_response: string;
  change_scope: "copy_only" | "text_overlay" | "logo_overlay" | "base_image" | "full";
  version_id: string;
  status: "regenerating" | "completed" | "failed";
}

export type QuickAction =
  | "more_vibrant"
  | "different_angle"
  | "more_minimalist"
  | "bolder_text"
  | "softer_tone"
  | "more_professional"
  | "more_playful"
  | "different_color";

export async function getEditChatHistory(postId: string): Promise<ChatMsg[]> {
  const data = await apiCall<ChatMsg[]>(`/posts/${postId}/edit-chat`);
  return data;
}

export async function sendEditMessage(
  postId: string,
  input: { user_message: string } | { quick_action: QuickAction },
): Promise<EditChatResponse> {
  return apiCall<EditChatResponse>(`/posts/${postId}/edit-chat`, {
    method: "POST",
    body: input,
  });
}

export async function getVersions(postId: string): Promise<PostVersion[]> {
  const data = await apiCall<PostVersion[]>(`/posts/${postId}/versions`);
  return data;
}

export async function restoreVersion(
  postId: string,
  versionId: string,
): Promise<{ versions: PostVersion[] }> {
  return apiCall<{ versions: PostVersion[] }>(`/posts/${postId}/versions/${versionId}/restore`, {
    method: "POST",
  });
}

export interface VideoGenerateRequest {
  duration?: 5 | 10;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
}

export interface VideoStatusResponse {
  video_status: "pending" | "generating" | "success" | "error" | null;
  video_url: string | null;
  motion_prompt: string | null;
  video_error: string | null;
}

export async function generateVideo(
  postId: string,
  request?: VideoGenerateRequest,
): Promise<{ post_id: string; video_status: string }> {
  return apiCall<{ post_id: string; video_status: string }>(`/posts/${postId}/video`, {
    method: "POST",
    body: request ?? {},
  });
}

export async function getVideoStatus(postId: string): Promise<VideoStatusResponse> {
  return apiCall<VideoStatusResponse>(`/posts/${postId}/video/status`);
}
