import { apiCall } from "./apiClient";

export interface ConversationListItem {
  id: string;
  status: "open" | "closed" | "archived";
  mode: "ai" | "manual";
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: "customer" | "ai" | "agent" | null;
  unread_count: number;
  contact: {
    id: string;
    platform: string;
    platform_user_id: string;
    name: string | null;
    profile_picture_url: string | null;
  };
  channel: {
    id: string;
    platform: string;
    page_name: string | null;
  };
  active_brand: { id: string; name: string } | null;
  tags: string[];
}

export interface ConversationDetail {
  id: string;
  status: string;
  mode: string;
  contact: ConversationListItem["contact"];
  channel: ConversationListItem["channel"];
  active_brand: ConversationListItem["active_brand"];
  messages: MessageItem[];
  total_messages: number;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  sender: "customer" | "ai" | "agent";
  content: string;
  sent_at: string;
  metadata: Record<string, unknown> | null;
}

export async function listConversationsByAgency(
  agencyId: string,
  opts?: {
    status?: string;
    brand_id?: string;
    channel_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ConversationListItem[]> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.brand_id) params.set("brand_id", opts.brand_id);
  if (opts?.channel_id) params.set("channel_id", opts.channel_id);
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));

  const qs = params.toString() ? `?${params.toString()}` : "";
  return await apiCall(`/api/v1/conversations/by-agency/${agencyId}${qs}`);
}

export async function getConversation(
  conversationId: string,
  opts?: { limit?: number; before?: string }
): Promise<ConversationDetail> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.before) params.set("before", opts.before);

  const qs = params.toString() ? `?${params.toString()}` : "";
  return await apiCall(`/api/v1/conversations/${conversationId}/messages${qs}`);
}

export async function sendAgentMessage(
  conversationId: string,
  content: string,
  switchToManual = true
): Promise<MessageItem> {
  return await apiCall(`/api/v1/conversations/${conversationId}/send`, {
    method: "POST",
    body: { content, switch_to_manual: switchToManual },
  });
}

export async function updateConversationMode(
  conversationId: string,
  mode: "ai" | "manual"
): Promise<void> {
  await apiCall(`/api/v1/conversations/${conversationId}/mode`, {
    method: "PATCH",
    body: { mode },
  });
}
