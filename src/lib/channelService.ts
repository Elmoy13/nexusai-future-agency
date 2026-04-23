import { apiCall } from "./apiClient";
import type {
  Channel,
  ConnectChannelRequest,
  ConnectChannelResponse,
} from "@/types/channels";

export interface OAuthStartResponse {
  authorize_url: string;
  state: string;
}

/**
 * Inicia el flujo OAuth con Meta. Retorna la URL a la que el frontend debe
 * redirigir (o abrir en popup) para que el usuario autorice.
 */
export async function startMetaOAuth(
  agencyId: string,
  brandId: string,
): Promise<OAuthStartResponse> {
  return apiCall<OAuthStartResponse>(
    `/api/v1/oauth/meta/start?agency_id=${encodeURIComponent(agencyId)}&brand_id=${encodeURIComponent(brandId)}`,
  );
}

/**
 * Después del OAuth, conecta una página específica a una marca.
 * El backend tiene cached los tokens, solo necesita saber qué page_id elegir.
 */
export async function connectChannel(
  request: ConnectChannelRequest,
): Promise<ConnectChannelResponse> {
  return apiCall<ConnectChannelResponse>("/api/v1/oauth/meta/connect", {
    method: "POST",
    body: request,
  });
}

/**
 * Lista los canales conectados de una agencia, filtrados por marca.
 */
export async function listChannelsByAgency(
  agencyId: string,
  brandId?: string,
): Promise<Channel[]> {
  const params = new URLSearchParams();
  if (brandId) params.set("brand_id", brandId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiCall<Channel[]>(
    `/api/v1/channels/by-agency/${encodeURIComponent(agencyId)}${qs}`,
  );
}

/**
 * Desconecta (soft delete) un canal. Esto también lo desuscribe del webhook
 * de Meta.
 */
export async function deleteChannel(
  channelId: string,
  agencyId: string,
): Promise<void> {
  await apiCall(
    `/api/v1/channels/${encodeURIComponent(channelId)}?agency_id=${encodeURIComponent(agencyId)}`,
    { method: "DELETE" },
  );
}

export interface PlatformOption {
  id: string;
  display_name: string;
  category: string;
  status: "active" | "beta" | "coming_soon";
  icon_name: string;
  brand_color: string;
  description: string;
  order: number;
}

/**
 * Lista las plataformas disponibles (Facebook, Instagram, WhatsApp, etc.)
 * con su estado (active, beta, coming_soon).
 */
export async function listPlatforms(): Promise<PlatformOption[]> {
  return apiCall<PlatformOption[]>("/api/v1/channels/platforms");
}
