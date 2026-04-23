import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Facebook,
  Instagram,
  MessageCircle,
  Phone,
  Trash2,
  Loader2,
  ArrowLeft,
  Plug,
} from "lucide-react";
import { toast } from "sonner";
import { useAgency } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import { listChannelsByAgency, deleteChannel } from "@/lib/channelService";
import { ConnectFacebookButton } from "@/components/channels/ConnectFacebookButton";
import type { Channel } from "@/types/channels";

interface BrandOption {
  id: string;
  name: string;
}

const platformIcon = (platform: Channel["platform"]) => {
  switch (platform) {
    case "facebook":
      return <Facebook className="w-6 h-6 text-white" />;
    case "instagram":
      return <Instagram className="w-6 h-6 text-white" />;
    case "whatsapp":
      return <Phone className="w-6 h-6 text-white" />;
  }
};

const platformColor = (platform: Channel["platform"]) => {
  switch (platform) {
    case "facebook":
      return "bg-[#1877F2]";
    case "instagram":
      return "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]";
    case "whatsapp":
      return "bg-[#25D366]";
  }
};

const platformLabel = (platform: Channel["platform"]) => {
  switch (platform) {
    case "facebook":
      return "Facebook Page";
    case "instagram":
      return "Instagram";
    case "whatsapp":
      return "WhatsApp";
  }
};

export default function ChannelsSettings() {
  const navigate = useNavigate();
  const { currentAgencyId } = useAgency();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    if (!currentAgencyId) return;
    setLoading(true);
    try {
      const data = await listChannelsByAgency(currentAgencyId);
      setChannels(data);
    } catch (err) {
      console.error("[list-channels] failed:", err);
      // Backend might not be ready yet — show empty state gracefully
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [currentAgencyId]);

  const loadBrands = useCallback(async () => {
    if (!currentAgencyId) return;
    const { data } = await supabase
      .from("brands")
      .select("id, name")
      .eq("agency_id", currentAgencyId)
      .order("name");
    const list = (data ?? []) as BrandOption[];
    setBrands(list);
    if (list.length === 1) {
      setSelectedBrandId(list[0].id);
    }
  }, [currentAgencyId]);

  useEffect(() => {
    loadChannels();
    loadBrands();
  }, [loadChannels, loadBrands]);

  // Listen for popup postMessage after OAuth completes
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "channel-connected") {
        loadChannels();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [loadChannels]);

  const handleDelete = async (channel: Channel) => {
    if (!currentAgencyId) return;
    const label = channel.page_name
      ? `${platformLabel(channel.platform)} — ${channel.page_name}`
      : `${platformLabel(channel.platform)} (${channel.page_id})`;

    const confirmed = window.confirm(
      `¿Desconectar ${label}? Dejarás de recibir mensajes de esta página.`,
    );
    if (!confirmed) return;

    setDeletingId(channel.id);
    try {
      await deleteChannel(channel.id, currentAgencyId);
      toast.success("Canal desconectado");
      await loadChannels();
    } catch (err) {
      console.error("[delete-channel] failed:", err);
      toast.error("Error desconectando canal", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={16} />
          Volver a Configuración
        </button>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Plug size={20} className="text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Canales Conectados
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Conecta tus páginas de Facebook e Instagram para que la IA responda mensajes automáticamente.
          </p>
        </div>

        {/* Connected channels list */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Canales activos
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : channels.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No tienes canales conectados todavía.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border transition-colors hover:border-border/60"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${platformColor(channel.platform)}`}
                  >
                    {platformIcon(channel.platform)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {channel.page_name ?? platformLabel(channel.platform)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {platformLabel(channel.platform)} · {channel.page_id}
                      {channel.brands.length > 0 && (
                        <> · {channel.brands.length} marca{channel.brands.length !== 1 ? "s" : ""}</>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(channel)}
                    disabled={deletingId === channel.id}
                    className="p-2.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition disabled:opacity-50"
                    title="Desconectar canal"
                  >
                    {deletingId === channel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Connect new channel */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Conectar nuevo canal
          </h2>

          <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
            <p className="text-sm text-muted-foreground">
              Conecta una página de Facebook para recibir y responder mensajes con IA.
            </p>

            {/* Brand selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Marca destino
              </label>
              {brands.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">
                  Crea una marca primero desde el Dashboard.
                </p>
              ) : (
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Selecciona una marca...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* OAuth button */}
            {currentAgencyId && selectedBrandId && (
              <ConnectFacebookButton
                agencyId={currentAgencyId}
                brandId={selectedBrandId}
                onConnectStart={() => {
                  /* loading is handled inside the button */
                }}
              />
            )}

            {/* WhatsApp + Instagram teasers */}
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <Instagram className="w-4 h-4" />
                Instagram Direct — Próximamente
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                <Phone className="w-4 h-4" />
                WhatsApp Business — Próximamente
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
