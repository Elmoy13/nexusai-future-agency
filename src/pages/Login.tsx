import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));

    if (email === "admin@admin.com" && password === "admin") {
      navigate("/dashboard");
      return;
    }

    setLoading(false);
    setError("Credenciales inválidas o Agente inactivo.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl p-8 glow-border">
          <div className="text-center mb-8">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 mb-4 cursor-pointer bg-transparent border-none"
            >
              <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
              <span className="text-foreground font-bold text-xl tracking-tight">NexusAI</span>
            </button>
            <p className="text-sm text-muted-foreground font-mono tracking-wide">
              Autenticación de Agentes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1.5 block">
                ID de Agencia / Correo
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@nexus.ai"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1.5 block">
                Llave de Acceso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-full py-3 text-sm font-semibold hover:glow-cyan transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando red neuronal...
                </>
              ) : (
                "Inicializar Conexión"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          ¿No tienes acceso?{" "}
          <button onClick={() => navigate("/")} className="text-primary/60 hover:text-primary transition bg-transparent border-none cursor-pointer">
            Únete a la lista de espera
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
