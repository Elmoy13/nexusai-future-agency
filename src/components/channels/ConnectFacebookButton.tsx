import { useState } from "react";
import { Facebook, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { startMetaOAuth } from "@/lib/channelService";

interface ConnectFacebookButtonProps {
  agencyId: string;
  brandId: string;
  onConnectStart?: () => void;
  onConnectCancel?: () => void;
  className?: string;
}

const POLL_INTERVAL_MS = 500;

/**
 * Botón que inicia el flujo OAuth de Facebook.
 * Abre un popup con la URL de autorización de Meta.
 * Después que el usuario autoriza, Meta redirige al backend (callback),
 * y el backend redirige al frontend a /settings/channels/select.
 */
export function ConnectFacebookButton({
  agencyId,
  brandId,
  onConnectStart,
  onConnectCancel,
  className = "",
}: ConnectFacebookButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    onConnectStart?.();
    try {
      const { authorize_url } = await startMetaOAuth(agencyId, brandId);

      // Abrir popup de OAuth (Meta bloquea iframes)
      const width = 600;
      const height = 750;
      const left = Math.round((window.screen.width - width) / 2);
      const top = Math.round((window.screen.height - height) / 2);

      const popup = window.open(
        authorize_url,
        "meta_oauth",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`,
      );

      if (!popup) {
        throw new Error("Popup bloqueado. Habilita popups para este sitio.");
      }

      // Poll para detectar si el usuario cerró el popup sin autorizar
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          setLoading(false);
          onConnectCancel?.();
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      console.error("[oauth-start] failed:", err);
      toast.error("Error iniciando conexión con Facebook", {
        description: err instanceof Error ? err.message : undefined,
      });
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Facebook className="w-5 h-5" />
      )}
      {loading ? "Conectando..." : "Conectar Facebook"}
    </button>
  );
}
