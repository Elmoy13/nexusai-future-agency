import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Palette } from "lucide-react";
import { useThemeAccent, AccentTheme } from "@/contexts/ThemeAccentContext";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const themeOptions: { id: AccentTheme; label: string; color: string; description: string }[] = [
  { id: "cyan", label: "Nexus Cyan", color: "hsl(187 100% 50%)", description: "El estilo original — tecnológico y vibrante." },
  { id: "purple", label: "Deep Purple", color: "hsl(270 100% 65%)", description: "Vibra Cyberpunk, intenso y futurista." },
  { id: "green", label: "Matrix Green", color: "hsl(142 80% 50%)", description: "Esmeralda vibrante, energía pura." },
  { id: "solar", label: "Solar Flare", color: "hsl(32 100% 55%)", description: "Ámbar encendido, cálido y dinámico." },
];

const SettingsModal = ({ open, onClose }: Props) => {
  const { accent, setAccent } = useThemeAccent();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass-strong rounded-2xl border border-border/30 w-full max-w-lg pointer-events-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Palette size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Configuración del Entorno</h2>
                    <p className="text-xs text-muted-foreground">Personaliza la apariencia de tu dashboard.</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 pt-4 space-y-6">
                {/* Section title */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Apariencia y Acentos</h3>
                  <p className="text-xs text-muted-foreground">Elige un tema de color. El cambio se aplica en tiempo real a toda la plataforma.</p>
                </div>

                {/* Theme Swatches */}
                <div className="grid grid-cols-2 gap-3">
                  {themeOptions.map((theme) => {
                    const isActive = accent === theme.id;
                    return (
                      <motion.button
                        key={theme.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setAccent(theme.id)}
                        className={cn(
                          "relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 text-left cursor-pointer bg-transparent",
                          isActive
                            ? "border-primary/50 bg-primary/5 glow-border"
                            : "border-border/20 hover:border-border/40 hover:bg-secondary/30"
                        )}
                      >
                        {/* Color swatch */}
                        <div className="relative shrink-0 mt-0.5">
                          <div
                            className="w-10 h-10 rounded-full border-2 transition-all duration-300"
                            style={{
                              backgroundColor: theme.color,
                              borderColor: isActive ? theme.color : "transparent",
                              boxShadow: isActive ? `0 0 20px ${theme.color}40, 0 0 40px ${theme.color}20` : "none",
                            }}
                          />
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check size={16} className="text-primary-foreground drop-shadow-md" strokeWidth={3} />
                            </motion.div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="min-w-0">
                          <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>
                            {theme.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{theme.description}</p>
                          {isActive && (
                            <span className="inline-block mt-1.5 text-[10px] font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              ACTIVO
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
