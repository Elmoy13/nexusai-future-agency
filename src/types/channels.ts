export interface Channel {
  id: string;
  agency_id: string;
  brand_id: string;
  brand: { id: string; name: string };
  platform: "facebook" | "instagram" | "whatsapp";
  page_id: string;
  page_name: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface AvailablePage {
  id: string;
  name: string;
  category: string | null;
  has_instagram: boolean;
}

export interface ConnectChannelRequest {
  page_id: string;
  agency_id: string;
  brand_id: string;
}

export interface ConnectChannelResponse {
  channel_id: string;
  page_id: string;
  page_name: string;
  brand_id: string;
  subscribed: boolean;
}
