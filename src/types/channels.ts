export interface Channel {
  id: string;
  platform: "facebook" | "instagram" | "whatsapp";
  page_id: string;
  page_name: string | null;
  created_at: string | null;
  brands: ChannelBrandInfo[];
}

export interface ChannelBrandInfo {
  brand_id: string;
  is_primary: boolean;
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
