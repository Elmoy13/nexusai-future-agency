import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Check, Bell, Loader2, ArrowDown, AlertTriangle, Settings2, Tag,
  MessageCircle, Facebook, Instagram, Phone, Mail,
  Globe, Send, Video, MessageSquare, Plug, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAgency } from "@/contexts/AgencyContext";
import { supabase } from "@/integrations/supabase/client";
import {
  listChannelsByAgency,
  listPlatforms,
  type PlatformOption,
} from "@/lib/channelService";
import { ConnectFacebookButton } from "@/components/channels/ConnectFacebookButton";
import type { Channel } from "@/types/channels";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManageBrandsModal } from "@/components/channels/ManageBrandsModal";

interface BrandOption {
  id: string;
  name: string;
}

const NOTIFY_STORAGE_KEY = "notify_channels";

/** Fallback platforms when backend endpoint is not available yet */
const FALLBACK_PLATFORMS: PlatformOption[] = [
  { id: "facebook_messenger", display_name: "Facebook Messenger", category: "social", status: "active", icon_name: "Facebook", brand_color: "#1877F2", description: "Responde mensajes de tus páginas de Facebook con IA", order: 1 },
  { id: "instagram_dms", display_name: "Instagram DMs", category: "social", status: "coming_soon", icon_name: "Instagram", brand_color: "#E1306C", description: "Gestiona mensajes directos de Instagram automáticamente", order: 2 },
  { id: "whatsapp_business", display_name: "WhatsApp Business", category: "messaging", status: "coming_soon", icon_name: "Phone", brand_color: "#25D366", description: "Atiende clientes por WhatsApp Business API", order: 3 },
  { id: "telegram", display_name: "Telegram", category: "messaging", status: "coming_soon", icon_name: "Send", brand_color: "#0088cc", description: "Conecta tu bot de Telegram para atención automática", order: 4 },
  { id: "tiktok", display_name: "TikTok Messages", category: "social", status: "coming_soon", icon_name: "Video", brand_color: "#000000", description: "Responde comentarios y mensajes de TikTok", order: 5 },
  { id: "web_chat", display_name: "Web Chat", category: "web", status: "coming_soon", icon_name: "Globe", brand_color: "#6366f1", description: "Widget de chat para tu sitio web con IA integrada", order: 6 },
  { id: "email", display_name: "Email", category: "traditional", status: "coming_soon", icon_name: "Mail", brand_color: "#EA4335", description: "Gestiona correos entrantes con respuestas inteligentes", order: 7 },
  { id: "google_business", display_name: "Google Business Messages", category: "web", status: "coming_soon", icon_name: "MessageSquare", brand_color: "#4285F4", description: "Responde mensajes desde Google Maps y Search", order: 8 },
  { id: "sms", display_name: "SMS / MMS", category: "traditional", status: "coming_soon", icon_name: "MessageCircle", brand_color: "#8B5CF6", description: "Envía y recibe mensajes de texto con clientes", order: 9 },
];

function getPlatformIcon(iconName: string, size = 24) {
  const iconMap: Record<string, React.ElementType> = {
    Facebook,
    Instagram,
    Phone,
    Send,
    Video,
    Globe,
    Mail,
    MessageSquare,
    MessageCircle,
  };
  const Icon = iconMap[iconName] ?? Plug;
  return <Icon size={size} />;
}

export default function Channels() {
  const navigate = useNavigate();
  const { currentAgencyId } = useAgency();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTIFY_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Connect modal state
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [connectingPlatform, setConnectingPlatform] = useState<PlatformOption | null>(null);

  // Manage brands modal state
  const [manageBrandsOpen, setManageBrandsOpen] = useState(false);
  const [manageBrandsChannel, setManageBrandsChannel] = useState<Channel | null>(null);

  const loadData = useCallback(async () => {
    if (!currentAgencyId) return;
    setLoading(true);

    // Load channels + platforms + brands in parallel
    const [channelsResult, brandsResult, platformsResult] = await Promise.allSettled([
      listChannelsByAgency(currentAgencyId),
      supabase.from("brands").select("id, name").eq("agency_id", currentAgencyId).order("name"),
      listPlatforms(),
    ]);

    setChannels(channelsResult.status === "fulfilled" ? channelsResult.value : []);
    if (brandsResult.status === "fulfilled" && brandsResult.value.data) {
      const list = brandsResult.value.data as BrandOption[];
      setBrands(list);
      if (list.length === 1) setSelectedBrandId(list[0].id);
    }
    setPlatforms(platformsResult.status === "fulfilled" ? platformsResult.value : FALLBACK_PLATFORMS);

    setLoading(false);
  }, [currentAgencyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for popup postMessage after OAuth completes
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "channel-connected") {
        loadData();
        setConnectModalOpen(false);
        toast.success("¡Canal conectado exitosamente!");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [loadData]);

  const connectedPlatforms = new Set(channels.map((c) => c.platform));

  const handleNotify = (platformId: string, displayName: string) => {
    const updated = [...new Set([...notified, platformId])];
    setNotified(updated);
    localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(updated));
    toast.success(`Te avisaremos cuando ${displayName} esté disponible 🚀`);
  };

  const handleConnect = (platform: PlatformOption) => {
    setConnectingPlatform(platform);
    setConnectModalOpen(true);
  };

  const isPlatformConnected = (platform: PlatformOption) => {
    // A platform is fully connected only if ALL brands have it linked
    const platformKey =
      platform.id === "facebook_messenger" ? "facebook" :
      platform.id === "instagram_dms" ? "instagram" :
      platform.id === "whatsapp_business" ? "whatsapp" : null;
    if (!platformKey) return false;
    if (brands.length === 0) return false;
    const brandsWithPlatform = new Set(
      channels
        .filter((c) => c.platform === platformKey)
        .flatMap((c) => c.brands.map((b) => b.brand_id)),
    );
    return brands.every((b) => brandsWithPlatform.has(b.id));
  };

  const statusBadge = (status: PlatformOption["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">Disponible</Badge>;
      case "beta":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px]">Beta</Badge>;
      case "coming_soon":
        return <Badge className="bg-muted text-muted-foreground border-border/40 text-[10px]">Próximamente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Canales
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Conecta las plataformas donde quieres responder mensajes con IA.
          </p>
        </motion.div>

        {/* Section A — Connected channels */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Canales conectados
          </h2>

          {channels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-dashed border-border/40 p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plug size={28} className="text-primary/60" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Aún no tienes canales conectados
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Conecta tu primer canal abajo y empieza a responder con IA
              </p>
              <ArrowDown size={20} className="mx-auto text-muted-foreground/40 animate-bounce" />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => {
                const matchedPlatform = platforms.find(
                  (p) => p.id === "facebook_messenger" && channel.platform === "facebook"
                ) || platforms.find(
                  (p) => p.id === "instagram_dms" && channel.platform === "instagram"
                ) || platforms.find(
                  (p) => p.id === "whatsapp_business" && channel.platform === "whatsapp"
                );

                const brandNames = channel.brands
                  .map((cb) => brands.find((b) => b.id === cb.brand_id)?.name)
                  .filter(Boolean) as string[];

                const hasBrands = brandNames.length > 0;

                return (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-card rounded-xl border border-emerald-500/30 p-5 hover:border-emerald-500/50 transition flex flex-col"
                  >
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">
                        Activo
                      </Badge>
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-white"
                      style={{ backgroundColor: matchedPlatform?.brand_color || "#1877F2" }}
                    >
                      {getPlatformIcon(matchedPlatform?.icon_name || "Plug", 22)}
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {channel.page_name || matchedPlatform?.display_name || channel.platform}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {channel.platform}
                    </p>

                    {/* Brand assignments */}
                    <div className="mt-3 flex-1">
                      {hasBrands ? (
                        <>
                          <p className="text-[10px] text-muted-foreground font-medium mb-1.5">
                            Marcas asignadas:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {brandNames.map((name) => (
                              <Badge
                                key={name}
                                variant="secondary"
                                className="text-[10px] gap-1"
                              >
                                <Tag size={9} />
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] text-amber-300 font-medium">
                              Sin marca asignada
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Esta página no responderá hasta que asignes una marca
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[11px] gap-1.5"
                        onClick={() => {
                          setManageBrandsChannel(channel);
                          setManageBrandsOpen(true);
                        }}
                      >
                        <Settings2 size={12} />
                        {hasBrands ? "Gestionar marcas" : "Asignar ahora"}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section B — Available platforms */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Disponibles
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms
              .sort((a, b) => a.order - b.order)
              .map((platform) => {
                const connected = isPlatformConnected(platform);
                const isComingSoon = platform.status === "coming_soon";
                const isNotified = notified.includes(platform.id);

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={!isComingSoon ? { y: -2 } : undefined}
                    className={cn(
                      "relative bg-card rounded-xl border p-5 transition-all duration-200",
                      isComingSoon
                        ? "opacity-60 cursor-default border-border/20"
                        : connected
                        ? "border-emerald-500/30"
                        : "border-border/30 hover:border-[var(--brand-color)] cursor-pointer"
                    )}
                    style={
                      !isComingSoon && !connected
                        ? ({ "--brand-color": `${platform.brand_color}60` } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {connected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Check size={14} className="text-emerald-400" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white",
                          isComingSoon && "opacity-50"
                        )}
                        style={{ backgroundColor: platform.brand_color }}
                      >
                        {getPlatformIcon(platform.icon_name, 22)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {platform.display_name}
                          </p>
                        </div>
                        {statusBadge(platform.status)}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      {platform.description}
                    </p>

                    {/* Action button */}
                    {platform.status === "active" && !connected && (
                      <Button
                        onClick={() => handleConnect(platform)}
                        className="w-full text-white text-xs font-semibold"
                        style={{ backgroundColor: platform.brand_color }}
                      >
                        Conectar
                      </Button>
                    )}
                    {platform.status === "active" && connected && (
                      <Button disabled variant="outline" className="w-full text-xs">
                        <Check size={14} className="mr-1.5" /> Conectado
                      </Button>
                    )}
                    {isComingSoon && (
                      <Button
                        variant="outline"
                        className="w-full text-xs"
                        disabled={isNotified}
                        onClick={() => handleNotify(platform.id, platform.display_name)}
                      >
                        {isNotified ? (
                          <>
                            <Check size={14} className="mr-1.5" /> Notificación activa
                          </>
                        ) : (
                          <>
                            <Bell size={14} className="mr-1.5" /> Notificarme
                          </>
                        )}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
          </div>
        </section>
      </div>

      {/* Connect Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {connectingPlatform && (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: connectingPlatform.brand_color }}
                >
                  {getPlatformIcon(connectingPlatform.icon_name, 20)}
                </div>
              )}
              Conectar {connectingPlatform?.display_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Brand selector */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                Selecciona una marca
              </label>
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Primero crea una marca en el dashboard.
                </p>
              ) : (
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elige marca..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Permissions info */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm">Permisos que se solicitarán:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Leer y responder mensajes de la página</li>
                <li>Información básica de la página</li>
                <li>Gestión de conversaciones</li>
              </ul>
            </div>

            {/* OAuth button */}
            {currentAgencyId && selectedBrandId && (
              <ConnectFacebookButton
                agencyId={currentAgencyId}
                brandId={selectedBrandId}
                brandName={brands.find((b) => b.id === selectedBrandId)?.name}
                className="w-full justify-center text-base py-3"
                onConnectStart={() => {}}
              />
            )}

            {!selectedBrandId && brands.length > 0 && (
              <p className="text-xs text-amber-400 text-center">
                Selecciona una marca para continuar
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Brands Modal */}
      <ManageBrandsModal
        open={manageBrandsOpen}
        onOpenChange={setManageBrandsOpen}
        channel={manageBrandsChannel}
        brands={brands}
      />
    </div>
  );
}
