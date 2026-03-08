import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  empresa: z.string().trim().min(1, "Campo requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255),
});

type ModalState = "form" | "loading" | "success";

interface EarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
}

const EarlyAccessModal = ({ open, onClose }: EarlyAccessModalProps) => {
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ empresa?: string; email?: string }>({});
  const [state, setState] = useState<ModalState>("form");

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setState("form");
      setEmpresa("");
      setEmail("");
      setErrors({});
    }, 300);
  };

  const handleSubmit = async () => {
    const result = schema.safeParse({ empresa, email });
    if (!result.success) {
      const fieldErrors: { empresa?: string; email?: string } = {};
      result.error.errors.forEach((e) => {
        const key = e.path[0] as "empresa" | "email";
        fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setState("loading");

    try {
      const res = await fetch(
        "https://webhook.site/b80d309d-86be-445b-9bf5-4f678639f781",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empresa: result.data.empresa,
            email: result.data.email,
            origen: "Landing Page NexusAI",
          }),
        }
      );
      if (res.ok) {
        setState("success");
      } else {
        setState("form");
      }
    } catch {
      setState("form");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-8 border border-border"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            {state === "success" ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
                  <CheckCircle2 size={32} className="text-accent icon-neon" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">
                  ¡Sistema inicializado!
                </h3>
                <p className="text-muted-foreground mb-8">
                  Te hemos añadido a la lista de espera prioritaria.
                </p>
                <button
                  onClick={handleClose}
                  className="glass-strong rounded-full px-8 py-3 text-sm font-semibold hover:glow-cyan transition-all duration-300"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold tracking-tight mb-2">
                  Únete a la Agencia del Futuro
                </h3>
                <p className="text-muted-foreground text-sm mb-8">
                  Déjanos tus datos y nuestro Agente Entrevistador se pondrá en
                  contacto contigo para tu primer brief.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                      Nombre de tu Agencia/Empresa
                    </label>
                    <input
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full rounded-xl border border-border bg-card/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                      disabled={state === "loading"}
                      maxLength={100}
                    />
                    {errors.empresa && (
                      <p className="text-destructive text-xs mt-1">{errors.empresa}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      className="w-full rounded-xl border border-border bg-card/50 backdrop-blur-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                      disabled={state === "loading"}
                      maxLength={255}
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={state === "loading"}
                    className="w-full glass-strong rounded-full py-3.5 text-sm font-semibold hover:glow-cyan transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {state === "loading" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Conectando agentes...
                      </>
                    ) : (
                      "Solicitar Acceso Temprano"
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EarlyAccessModal;
