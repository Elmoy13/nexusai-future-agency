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
 * Lista todos los canales conectados de una agencia.
 */
export async function listChannelsByAgency(
  agencyId: string,
): Promise<Channel[]> {
  return apiCall<Channel[]>(
    `/api/v1/channels/by-agency/${encodeURIComponent(agencyId)}`,
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
