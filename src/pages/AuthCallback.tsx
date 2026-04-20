import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase JS handles the URL hash automatically. We just wait for session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Asegurar profile existe
        supabase
          .from("profiles")
          .upsert(
            {
              id: session.user.id,
              full_name:
                (session.user.user_metadata?.full_name as string) ||
                (session.user.user_metadata?.name as string) ||
                null,
              avatar_url:
                (session.user.user_metadata?.avatar_url as string) || null,
            },
            { onConflict: "id" }
          )
          .then(() => navigate("/dashboard", { replace: true }));
      } else if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });

    // Si ya hay sesión al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="text-primary animate-spin mx-auto mb-3" size={28} />
        <p className="text-sm text-muted-foreground">Conectando tu cuenta...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
