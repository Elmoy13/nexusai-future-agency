import { Layers, CheckCircle2, Image } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  posts: any[];
}

const ParrillaModule = ({ posts }: Props) => {
  const [approved, setApproved] = useState<Set<number>>(new Set());

  const handleApprove = (index: number) => {
    setApproved((prev) => new Set(prev).add(index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <Layers className="inline icon-neon text-cyan-glow mr-2" size={24} />
          Parrilla de Contenido
        </h2>
        <p className="text-muted-foreground mt-1">Revisa y aprueba el contenido generado por el motor IA.</p>
      </div>

      {posts.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <Image size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No hay posts generados aún.</p>
          <p className="text-muted-foreground/50 text-sm mt-1">Ve a Estrategia y genera contenido primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-strong rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200 glow-border"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-glow bg-cyan-glow/10 px-2 py-0.5 rounded-full">
                  {post.platform || post.red_social || `Post ${i + 1}`}
                </span>
                {approved.has(i) && (
                  <span className="text-emerald-accent text-[10px] flex items-center gap-1">
                    <CheckCircle2 size={12} /> Aprobado
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-sm line-clamp-2">
                {post.title || post.titulo || `Contenido #${i + 1}`}
              </h4>

              <p className="text-muted-foreground text-xs leading-relaxed line-clamp-4 flex-1">
                {post.content || post.contenido || post.copy || JSON.stringify(post).slice(0, 200)}
              </p>

              {!approved.has(i) && (
                <button
                  onClick={() => handleApprove(i)}
                  className="mt-auto flex items-center justify-center gap-2 bg-emerald-accent/15 hover:bg-emerald-accent/25 text-emerald-accent border border-emerald-accent/30 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200"
                >
                  <CheckCircle2 size={14} />
                  Aprobar Contenido
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParrillaModule;
