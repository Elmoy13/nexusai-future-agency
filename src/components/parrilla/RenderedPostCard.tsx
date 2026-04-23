import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import PlatformIcon from "@/components/parrilla/PlatformIcon";
import StatusBadge from "@/components/parrilla/StatusBadge";
import ShimmerSkeleton from "@/components/parrilla/ShimmerSkeleton";
import { ALL_FORMATS, getAspectClass } from "@/types/parrilla";
import type { PostCard } from "@/types/parrilla";
import {
  X, RefreshCw, Download, Edit3, Play, Video, Calendar,
  CheckCircle2, ClipboardCopy, Loader2, AlertCircle,
} from "lucide-react";

interface RenderedPostCardProps {
  post: PostCard;
  onEdit: (post: PostCard) => void;
  onRegenerate: (post: PostCard) => void;
  onDownload: (post: PostCard) => void;
  onApproveStatus: (id: string) => void;
  onRejectStatus?: (id: string) => void;
  isClientView?: boolean;
  onClickImage?: (post: PostCard) => void;
  onGenerateVideo?: (post: PostCard) => void;
}

const platformGradients: Record<string, string> = {
  instagram: "from-pink-500 via-red-500 to-yellow-500",
  tiktok: "from-slate-900 to-slate-700",
  linkedin: "from-blue-600 to-blue-700",
  twitter: "from-slate-800 to-slate-900",
};

const RenderedPostCard = ({ post, onEdit, onRegenerate, onDownload, onApproveStatus, onRejectStatus, isClientView, onClickImage, onGenerateVideo }: RenderedPostCardProps) => {
  const [isHoveringMedia, setIsHoveringMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const aspectClass = getAspectClass(post.format || "instagram_feed");
  const fmt = ALL_FORMATS.find(f => f.id === post.format);
  const hasVideo = post.video_url && (post.video_status === "completed" || post.video_status === "success");

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] transition-all overflow-hidden group relative"
    >
      {post.isRendering ? (
        <ShimmerSkeleton aspectClass={aspectClass} />
      ) : post.error ? (
        <div className={`${aspectClass} bg-destructive/10 border border-destructive/30 rounded-t-xl flex flex-col items-center justify-center gap-2`}>
          <X size={24} className="text-destructive" />
          <p className="text-xs font-medium text-destructive">Error al generar este post</p>
          <button onClick={() => onRegenerate(post)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center gap-1">
            <RefreshCw size={12} /> Reintentar
          </button>
        </div>
      ) : (
        <div
          className={`${aspectClass} bg-secondary relative overflow-hidden cursor-pointer`}
          onClick={() => onClickImage?.(post)}
          onMouseEnter={() => setIsHoveringMedia(true)}
          onMouseLeave={() => setIsHoveringMedia(false)}
        >
          {/* ── Image status-aware rendering ── */}
          {post.image_status === "pending" && !post.image ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-muted">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Generando imagen...
              </p>
            </div>
          ) : post.image_status === "generating" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-muted">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Generando imagen...</p>
            </div>
          ) : post.image_status === "error" && !post.image ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive mb-2" />
              <p className="text-sm text-destructive">Error al generar imagen</p>
              <button onClick={(e) => { e.stopPropagation(); onRegenerate(post); }} className="mt-2 text-xs underline text-destructive">
                Reintentar
              </button>
            </div>
          ) : hasVideo ? (
            <>
              <video
                ref={videoRef}
                src={post.video_url}
                autoPlay loop muted playsInline
                className="w-full h-full object-cover"
              />
              <AnimatePresence>
                {isHoveringMedia && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play size={20} className="text-white ml-0.5" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <img src={post.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${platformGradients[post.platform]} flex items-center justify-center shadow-md`}>
              <PlatformIcon platform={post.platform} size={14} />
            </div>
            {hasVideo ? (
              <Badge className="text-[9px] bg-purple-500/80 backdrop-blur-sm border-purple-400/30 text-white hover:bg-purple-500/90">
                🎬 Video
              </Badge>
            ) : post.image && (
              <Badge variant="outline" className="text-[9px] bg-card/60 backdrop-blur-sm border-border/50 text-muted-foreground">
                📷 Imagen
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3"><StatusBadge status={post.status} /></div>
          {fmt && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="text-[9px] bg-card/70 backdrop-blur-sm border-border/50 text-muted-foreground">
                {fmt.label} {fmt.width}×{fmt.height}
              </Badge>
            </div>
          )}
        </div>
      )}
      {/* Caption section */}
      {(post.headline || post.body || post.cta) && !post.isRendering && !post.error && (
        <div className="p-3 space-y-2 bg-secondary/30 border-t border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">📝 Caption</span>
            <button
              onClick={() => {
                const parts = [post.headline, post.body, post.cta].filter(Boolean);
                navigator.clipboard.writeText(parts.join("\n\n"));
                toast({ title: "Caption copiado ✅" });
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Copiar caption"
            >
              <ClipboardCopy size={11} /> Copiar
            </button>
          </div>
          {post.headline && <p className="text-sm font-semibold text-foreground leading-snug">{post.headline}</p>}
          {post.body && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{post.body}</p>}
          {post.cta && (
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20">
              {post.cta}
            </span>
          )}
        </div>
      )}
      {post.scheduledAt && (
        <div className="px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-400 font-medium"><Calendar size={12} /> {post.scheduledAt}</div>
      )}
      {!isClientView && !post.isRendering && (
        <div className="flex items-center gap-1 px-3 py-2 border-t border-border/50">
          <button onClick={() => onEdit(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Editar">
            <Edit3 size={12} /> Editar
          </button>
          <button onClick={() => onRegenerate(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Regenerar">
            <RefreshCw size={12} />
          </button>
          <button onClick={() => onDownload(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Descargar">
            <Download size={12} />
          </button>
          {/* Video button */}
          {post.video_status === "generating" ? (
            <button disabled className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground opacity-60 cursor-not-allowed" title="Generando video...">
              <Loader2 size={12} className="animate-spin" /> Generando...
            </button>
          ) : post.video_status === "error" ? (
            <button onClick={() => onGenerateVideo?.(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-destructive hover:bg-destructive/10 transition-colors" title="Reintentar video">
              <Video size={12} /> Error — Reintentar
            </button>
          ) : hasVideo ? (
            <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-emerald-400" title="Video listo">
              <Video size={12} /> ✅
            </button>
          ) : post.image ? (
            <button onClick={() => onGenerateVideo?.(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Convertir a video">
              <Video size={12} /> Video
            </button>
          ) : null}
          {/* ── Contextual approval/rejection ── */}
          {post.approval_status === "approved" ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 ml-auto">
              <CheckCircle2 size={11} /> Aprobado
            </span>
          ) : post.approval_status === "rejected" ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-500 border border-red-500/20 ml-auto">
              Rechazado
            </span>
          ) : (
            <div className="flex items-center gap-1 ml-auto">
              {onRejectStatus && (
                <button onClick={() => onRejectStatus(post.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-red-400 hover:bg-red-500/10 transition-colors" title="Rechazar">
                  <X size={12} /> Rechazar
                </button>
              )}
              <button onClick={() => onApproveStatus(post.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-emerald-400 hover:bg-secondary transition-colors" title="Aprobar">
                <CheckCircle2 size={12} /> Aprobar
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default RenderedPostCard;
