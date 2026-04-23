import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { connectChannel } from "@/lib/channelService";
import type { AvailablePage } from "@/types/channels";

/**
 * Post-OAuth page selection.
 * The backend redirects here after successful OAuth:
 *   /settings/channels/select?agency_id=X&brand_id=Y&pages=ENCODED_JSON
 *
 * If opened in a popup, after connecting it notifies the opener and closes.
 * If opened as a full page, it navigates to /settings/channels.
 */
export default function ChannelSelect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const agencyId = searchParams.get("agency_id") ?? "";
  const brandId = searchParams.get("brand_id") ?? "";
  const pagesParam = searchParams.get("pages") ?? "[]";
  const oauthError = searchParams.get("oauth_error");

  const [pages, setPages] = useState<AvailablePage[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const isPopup = !!window.opener;

  const goBack = () => {
    if (isPopup) {
      // Notify the opener to refresh channels list then close
      try {
        window.opener?.postMessage({ type: "channel-connected" }, window.location.origin);
      } catch {
        // opener might be on a different origin — ignore
      }
      window.close();
    } else {
      navigate("/settings/channels");
    }
  };

  useEffect(() => {
    if (oauthError) {
      toast.error("Autorización cancelada o fallida", {
        description: oauthError,
      });
      goBack();
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(pagesParam)) as AvailablePage[];
      setPages(parsed);
    } catch (err) {
      console.error("[channel-select] failed to parse pages:", err);
      toast.error("Error cargando páginas");
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (page: AvailablePage) => {
    setConnectingId(page.id);
    try {
      await connectChannel({
        page_id: page.id,
        agency_id: agencyId,
        brand_id: brandId,
      });
      toast.success(`${page.name} conectada correctamente`);
      goBack();
    } catch (err) {
      console.error("[connect-channel] failed:", err);
      toast.error("Error conectando página", {
        description: err instanceof Error ? err.message : undefined,
      });
      setConnectingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-16 px-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Elige qué página conectar
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecciona la página de Facebook que quieres gestionar.
            Vas a poder responder mensajes automáticamente con IA adaptada a tu marca.
          </p>
        </div>

        {pages.length === 0 ? (
          <div className="bg-muted/30 rounded-xl p-8 text-center border border-border">
            <p className="text-sm text-muted-foreground">
              No encontramos páginas en tu cuenta. Asegúrate de ser admin de al menos
              una Facebook Page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page)}
                disabled={connectingId !== null}
                className="w-full flex items-center gap-4 p-4 bg-card hover:bg-accent/50 rounded-xl border border-border transition text-left disabled:opacity-50 group"
              >
                <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{page.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {page.category && <span>{page.category}</span>}
                    {page.has_instagram && (
                      <span className="flex items-center gap-1">
                        <Instagram className="w-3 h-3" />
                        Instagram conectado
                      </span>
                    )}
                  </div>
                </div>

                {connectingId === page.id && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
