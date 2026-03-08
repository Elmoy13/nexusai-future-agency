import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, UserCircle, Bot, Plug, Check, Moon, Sun, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeAccent, AccentTheme, ThemeMode } from "@/contexts/ThemeAccentContext";
import { cn } from "@/lib/utils";

type SettingsTab = "appearance" | "account" | "agents" | "integrations";

const menuItems: { id: SettingsTab; label: string; icon: React.ElementType; soon?: boolean }[] = [
  { id: "appearance", label: "Apariencia", icon: Palette },
  { id: "account", label: "Cuenta", icon: UserCircle },
  { id: "agents", label: "Agentes", icon: Bot, soon: true },
  { id: "integrations", label: "Integraciones", icon: Plug, soon: true },
];

const accentOptions: { id: AccentTheme; label: string; hsl: string; hex: string }[] = [
  { id: "cyan", label: "Nexus Cyan", hsl: "187 100% 50%", hex: "#00d4ff" },
  { id: "purple", label: "Deep Purple", hsl: "270 100% 65%", hex: "#a855f7" },
  { id: "green", label: "Matrix Green", hsl: "142 80% 50%", hex: "#22c55e" },
  { id: "solar", label: "Solar Flare", hsl: "32 100% 55%", hex: "#f59e0b" },
];

// --- Live Preview mini-dashboard tokens ---
const previewAccents: Record<AccentTheme, string> = {
  cyan: "#00d4ff",
  purple: "#a855f7",
  green: "#22c55e",
  solar: "#f59e0b",
};

const Settings = () => {
  const navigate = useNavigate();
  const { accent, mode, setAccent, setMode } = useThemeAccent();
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  // Local preview state (mirrors global but used for the mini preview)
  const [previewAccent, setPreviewAccent] = useState<AccentTheme>(accent);
  const [previewMode, setPreviewMode] = useState<ThemeMode>(mode);

  const handleAccent = (a: AccentTheme) => {
    setPreviewAccent(a);
    setAccent(a);
  };

  const handleMode = (m: ThemeMode) => {
    setPreviewMode(m);
    setMode(m);
  };

  const accentColor = previewAccents[previewAccent];
  const isDark = previewMode === "dark";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left column — Settings menu */}
      <aside className="w-64 lg:w-72 shrink-0 h-screen sticky top-0 glass-strong border-r border-border/30 flex flex-col py-6 px-4">
        {/* Back to dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 bg-transparent border-none cursor-pointer px-3"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </button>

        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-4">Configuración</h2>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.soon && setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 border-none cursor-pointer px-3 py-2.5",
                activeTab === item.id
                  ? "bg-primary/10 text-primary glow-border"
                  : item.soon
                  ? "text-muted-foreground/40 cursor-not-allowed bg-transparent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 bg-transparent"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", activeTab === item.id && "icon-neon text-primary")} />
              {item.label}
              {item.soon && (
                <span className="ml-auto text-[9px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">PRONTO</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Right column — Content area */}
      <main className="flex-1 min-h-screen overflow-y-auto p-6 md:p-10 lg:p-12">
        {activeTab === "appearance" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl space-y-10"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Personalización del Entorno
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                Adapta el sistema operativo NexusAI a la identidad de tu agencia.
              </p>
            </div>

            {/* Mode selector */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Modo de Interfaz</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dark */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleMode("dark")}
                  className={cn(
                    "relative flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300 cursor-pointer bg-transparent text-center",
                    previewMode === "dark"
                      ? "border-primary/50 glow-border"
                      : "border-border/20 hover:border-border/40"
                  )}
                >
                  <div className="w-full h-24 rounded-xl bg-[hsl(210_50%_5%)] border border-[hsl(200_30%_15%)] flex items-center justify-center relative overflow-hidden">
                    <Moon size={28} className="text-[hsl(187_100%_50%)] opacity-60" />
                    <div className="absolute bottom-2 left-3 w-12 h-1.5 rounded-full bg-[hsl(187_100%_50%/0.3)]" />
                    <div className="absolute bottom-2 right-3 w-8 h-1.5 rounded-full bg-[hsl(200_30%_15%)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Modo Terminal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Fondo oscuro premium, acentos neón.</p>
                  </div>
                  {previewMode === "dark" && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check size={14} className="text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>

                {/* Light */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleMode("light")}
                  className={cn(
                    "relative flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300 cursor-pointer bg-transparent text-center",
                    previewMode === "light"
                      ? "border-primary/50 glow-border"
                      : "border-border/20 hover:border-border/40"
                  )}
                >
                  <div className="w-full h-24 rounded-xl bg-[hsl(210_20%_96%)] border border-[hsl(214_18%_85%)] flex items-center justify-center relative overflow-hidden">
                    <Sun size={28} className="text-[hsl(32_100%_55%)] opacity-60" />
                    <div className="absolute bottom-2 left-3 w-12 h-1.5 rounded-full bg-[hsl(214_18%_85%)]" />
                    <div className="absolute bottom-2 right-3 w-8 h-1.5 rounded-full bg-[hsl(214_18%_88%)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Modo Agencia</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Fondo claro, elegante y profesional.</p>
                  </div>
                  {previewMode === "light" && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check size={14} className="text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              </div>
            </section>

            {/* Accent selector */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Color de Acento</h3>
              <div className="flex flex-wrap gap-4">
                {accentOptions.map((opt) => {
                  const isActive = previewAccent === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAccent(opt.id)}
                      className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group"
                    >
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-full border-2 transition-all duration-300"
                          style={{
                            backgroundColor: opt.hex,
                            borderColor: isActive ? opt.hex : "transparent",
                            boxShadow: isActive ? `0 0 24px ${opt.hex}50, 0 0 48px ${opt.hex}25` : "none",
                          }}
                        />
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Check size={20} className="drop-shadow-lg" style={{ color: "#fff" }} strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {opt.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* Live Preview */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Vista Previa en Vivo</h3>

              {/* Browser chrome */}
              <div className="rounded-2xl border border-border/30 overflow-hidden shadow-2xl">
                {/* Title bar */}
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b"
                  style={{
                    backgroundColor: isDark ? "hsl(200 40% 8%)" : "hsl(214 20% 94%)",
                    borderColor: isDark ? "hsl(200 30% 15%)" : "hsl(214 18% 88%)",
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
                  </div>
                  <div
                    className="flex-1 mx-8 h-6 rounded-md text-center text-[10px] font-mono leading-6"
                    style={{
                      backgroundColor: isDark ? "hsl(210 50% 5%)" : "hsl(210 20% 96%)",
                      color: isDark ? "hsl(210 10% 55%)" : "hsl(215 12% 50%)",
                    }}
                  >
                    app.nexusai.com/dashboard
                  </div>
                </div>

                {/* Mini dashboard */}
                <div
                  className="p-6 md:p-8 space-y-5 transition-colors duration-500"
                  style={{
                    backgroundColor: isDark ? "hsl(210 50% 5%)" : "hsl(210 20% 96%)",
                  }}
                >
                  {/* Mini header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-base font-bold"
                        style={{ color: isDark ? "hsl(180 10% 92%)" : "hsl(215 25% 15%)" }}
                      >
                        Vista General
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: isDark ? "hsl(210 10% 55%)" : "hsl(215 12% 50%)" }}
                      >
                        Resumen de producción
                      </p>
                    </div>
                    <div
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-300"
                      style={{
                        backgroundColor: accentColor,
                        color: isDark ? "hsl(210 50% 5%)" : "#fff",
                        boxShadow: isDark ? `0 0 20px ${accentColor}40` : `0 4px 12px ${accentColor}30`,
                      }}
                    >
                      + Nuevo Brief
                    </div>
                  </div>

                  {/* Mini KPI cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Marcas Activas", value: "4" },
                      { label: "Posts Pendientes", value: "12" },
                      { label: "Horas Ahorradas", value: "180" },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-xl p-3 border transition-colors duration-500"
                        style={{
                          backgroundColor: isDark ? "hsl(200 40% 8%)" : "hsl(210 20% 99%)",
                          borderColor: isDark ? "hsl(200 30% 15% / 0.5)" : "hsl(214 18% 88%)",
                        }}
                      >
                        <p
                          className="text-xl font-black leading-none"
                          style={{ color: isDark ? "hsl(180 10% 92%)" : "hsl(215 25% 15%)" }}
                        >
                          {kpi.value}
                        </p>
                        <p
                          className="text-[10px] mt-1"
                          style={{ color: isDark ? "hsl(210 10% 55%)" : "hsl(215 12% 50%)" }}
                        >
                          {kpi.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mini campaign pipeline */}
                  <div
                    className="rounded-xl p-4 border transition-colors duration-500"
                    style={{
                      backgroundColor: isDark ? "hsl(200 40% 8%)" : "hsl(210 20% 99%)",
                      borderColor: isDark ? "hsl(200 30% 15% / 0.5)" : "hsl(214 18% 88%)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold mb-3"
                      style={{ color: isDark ? "hsl(180 10% 92%)" : "hsl(215 25% 15%)" }}
                    >
                      Campaña Lanzamiento Verano
                    </p>
                    <div className="flex items-center gap-2">
                      {["Brief", "Look & Feel", "Producción", "Revisión"].map((step, i) => (
                        <div key={step} className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
                              style={{
                                backgroundColor: i < 2 ? `${accentColor}20` : i === 2 ? `${accentColor}30` : isDark ? "hsl(200 30% 12%)" : "hsl(214 20% 92%)",
                                color: i <= 2 ? accentColor : isDark ? "hsl(210 10% 55%)" : "hsl(215 12% 50%)",
                                boxShadow: i === 2 ? `0 0 12px ${accentColor}40` : "none",
                              }}
                            >
                              {i < 2 ? <Check size={12} strokeWidth={3} /> : i === 2 ? <Loader2 size={12} className="animate-spin" /> : (i + 1)}
                            </div>
                            <span
                              className="text-[9px] mt-1 text-center leading-tight"
                              style={{ color: isDark ? "hsl(210 10% 55%)" : "hsl(215 12% 50%)" }}
                            >
                              {step}
                            </span>
                          </div>
                          {i < 3 && (
                            <div
                              className="h-px w-full -mt-3"
                              style={{
                                backgroundColor: i < 2 ? `${accentColor}40` : isDark ? "hsl(200 30% 15%)" : "hsl(214 18% 88%)",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mini progress bar */}
                    <div
                      className="mt-3 h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: isDark ? "hsl(200 30% 12%)" : "hsl(214 20% 92%)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "62%" }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeTab === "account" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Cuenta</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Gestiona tu perfil y preferencias de cuenta.</p>
            <div className="mt-8 glass-strong rounded-2xl p-8">
              <p className="text-muted-foreground text-sm">Configuración de cuenta próximamente...</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Settings;
