import { supabase } from "@/integrations/supabase/client";

export const INBOX_RAG_PLATFORM = "inbox-rag";

export interface InboxMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "agent" | string;
  content: string;
  sent_at: string;
}

export async function getOrCreateInboxChannel(agencyId: string): Promise<string> {
  const { data: existing, error: selErr } = await supabase
    .from("channels")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("platform", INBOX_RAG_PLATFORM)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from("channels")
    .insert({ agency_id: agencyId, platform: INBOX_RAG_PLATFORM })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created.id;
}

export async function getOrCreateConversation(params: {
  userId: string;
  brandId: string;
  channelId: string;
  agencyId: string;
}): Promise<string> {
  const { userId, brandId, channelId, agencyId } = params;

  const { data: existing, error: selErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("brand_id", brandId)
    .eq("channel_id", channelId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      brand_id: brandId,
      channel_id: channelId,
      agency_id: agencyId,
      mode: "ai",
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created.id;
}

export async function loadMessages(conversationId: string): Promise<InboxMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender, content, sent_at")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as InboxMessage[];
}

export async function insertMessage(
  conversationId: string,
  sender: "user" | "agent",
  content: string
): Promise<InboxMessage> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender,
      content,
      sent_at: nowIso,
    })
    .select("id, conversation_id, sender, content, sent_at")
    .single();
  if (error) throw error;

  // Bump last_message_at — best-effort
  await supabase
    .from("conversations")
    .update({ last_message_at: nowIso })
    .eq("id", conversationId)
    .then(undefined, () => undefined);

  return data as InboxMessage;
}
