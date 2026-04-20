import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, CheckCircle2, Building2, Mail, Lock, User as UserIcon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  agencyName: z.string().trim().min(2, "El nombre de la agencia es muy corto").max(80),
  fullName: z.string().trim().min(2, "Tu nombre es requerido").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

const passwordStrength = (pwd: string) => {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};

const Signup = () => {
  const navigate = useNavigate();
  const [agencyName, setAgencyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthLabel = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = schema.safeParse({ agencyName, fullName, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!terms) {
      setError("Debes aceptar los términos");
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { agency_name: agencyName, full_name: fullName },
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Crear profile (el trigger de Supabase ya creó la agencia + agency_member)
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
      });
    }

    setLoading(false);

    if (data.session) {
      // Email confirmation desactivado: ya hay sesión
      navigate("/dashboard", { replace: true });
    } else {
      setSuccess(true);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-10 max-w-md text-center glow-border"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Revisa tu inbox</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Te enviamos un link de confirmación a <span className="text-foreground font-medium">{email}</span>.
            Confírmalo para entrar a tu agencia.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl p-8 glow-border">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
              <span className="text-foreground font-bold text-xl tracking-tight">NexusAI</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">Crea tu agencia</h1>
            <p className="text-xs text-muted-foreground mt-1">Configura tu workspace en segundos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Field icon={<Building2 size={14} />} label="Nombre de tu agencia">
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Creative Studio MX"
                required
                className="auth-input"
              />
            </Field>

            <Field icon={<UserIcon size={14} />} label="Tu nombre">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Carlos Pérez"
                required
                className="auth-input"
              />
            </Field>

            <Field icon={<Mail size={14} />} label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@agencia.com"
                required
                className="auth-input"
              />
            </Field>

            <Field icon={<Lock size={14} />} label="Contraseña">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="auth-input"
              />
              {password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength <= 1 ? "bg-destructive" : strength === 2 ? "bg-amber-500" : strength === 3 ? "bg-cyan-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${(strength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{strengthLabel}</span>
                </div>
              )}
            </Field>

            <Field icon={<Lock size={14} />} label="Confirmar contraseña">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className="auth-input"
              />
            </Field>

            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span>
                Acepto los <a href="#" className="text-primary/80 hover:underline">términos</a> y la{" "}
                <a href="#" className="text-primary/80 hover:underline">política de privacidad</a>
              </span>
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
              >
                <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-full py-3 text-sm font-semibold hover:glow-cyan transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" />Creando agencia...</> : "Crear cuenta"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">o</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-secondary/40 hover:bg-secondary/70 border border-border/50 text-foreground rounded-full py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

const Field = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs text-muted-foreground font-mono mb-1.5 block">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-3 text-muted-foreground/60">{icon}</span>
      <div className="[&_input]:w-full [&_input]:bg-secondary/50 [&_input]:border [&_input]:border-border [&_input]:rounded-xl [&_input]:pl-9 [&_input]:pr-4 [&_input]:py-3 [&_input]:text-sm [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground/50 [&_input]:focus:outline-none [&_input]:focus:ring-1 [&_input]:focus:ring-primary/50 [&_input]:transition">
        {children}
      </div>
    </div>
  </div>
);

export default Signup;
