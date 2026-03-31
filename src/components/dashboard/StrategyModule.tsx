import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles, Target, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = "https://homework-carroll-pillow-independently.trycloudflare.com";

interface StrategyResult {
  tone?: string;
  audience?: string;
  posts?: any[];
  [key: string]: any;
}

interface Props {
  onPostsGenerated: (posts: any[]) => void;
}

const StrategyModule = ({ onPostsGenerated }: Props) => {
  const [brief, setBrief] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BASE_URL}/api/strategy/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: "28b1c920-f35c-4a62-b510-bd41620d9dcd",
          brief,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setResult(data);
      if (data.posts) onPostsGenerated(data.posts);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <BrainCircuit className="inline icon-neon text-cyan-glow mr-2" size={24} />
          Estrategia Autónoma
        </h2>
        <p className="text-muted-foreground mt-1">Ingresa un brief y deja que el motor IA genere la estrategia completa.</p>
      </div>

      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe el brief de la campaña... Ej: Lanzamiento de producto tech para Gen Z en LATAM, tono disruptivo."
          className="w-full min-h-[120px] bg-muted/20 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none font-display"
        />

        <button
          onClick={handleGenerate}
          disabled={isLoading || !brief.trim()}
          className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 hover:glow-cyan disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Llama 3.3 Analizando...
            </>
          ) : (
            <>
              <Sparkles size={16} className="icon-neon" />
              Generar Estrategia Multimodal
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-destructive/30 text-destructive text-sm">
          ⚠️ {error}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="glass-strong rounded-2xl p-6 glow-border">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="icon-neon text-cyan-glow" />
                <h3 className="font-semibold text-sm">Tono de Comunicación</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {result.tone || result.tono || JSON.stringify(result).slice(0, 200)}
              </p>
            </div>

            <div className="glass-strong rounded-2xl p-6 glow-border">
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="icon-neon text-cyan-glow" />
                <h3 className="font-semibold text-sm">Audiencia Target</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {result.audience || result.audiencia || "Datos procesados correctamente"}
              </p>
            </div>

            {result.posts && result.posts.length > 0 && (
              <div className="col-span-full glass rounded-xl p-4 border border-emerald-accent/20">
                <p className="text-emerald-accent text-sm font-mono">
                  ✓ {result.posts.length} posts generados — Ve a Parrilla para revisarlos
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StrategyModule;
