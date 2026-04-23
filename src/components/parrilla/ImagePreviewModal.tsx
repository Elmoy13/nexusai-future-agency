import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { X, ChevronLeft, ChevronRight, Download, Edit3, CheckCircle2 } from "lucide-react";
import type { PostCard } from "@/types/parrilla";
import { ALL_FORMATS } from "@/types/parrilla";

interface ImagePreviewModalProps {
  posts: PostCard[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDownload: (post: PostCard) => void;
}

const ImagePreviewModal = ({ posts, initialIndex, open, onClose, onApprove, onDownload }: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex(i => Math.min(posts.length - 1, i + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, posts.length, onClose]);

  if (!open || posts.length === 0) return null;
  const post = posts[currentIndex];
  if (!post) return null;
  const fmt = ALL_FORMATS.find(f => f.id === post.format);
  const platformLabels: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", twitter: "X" };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={20} className="text-white" />
          </button>

          {currentIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronLeft size={24} className="text-white" />
            </button>
          )}
          {currentIndex < posts.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <ChevronRight size={24} className="text-white" />
            </button>
          )}

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
            className="max-w-[85vw] max-h-[70vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {post.video_url && (post.video_status === "completed" || post.video_status === "success") ? (
              <video src={post.video_url} controls autoPlay loop className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
            ) : (
              <img src={post.image || "/placeholder.svg"} alt={post.headline || ""} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" />
            )}
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="mt-4 px-6 py-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-xl flex flex-col sm:flex-row items-center gap-3 max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 text-center sm:text-left">
              {post.headline && <p className="text-sm font-semibold text-foreground">{post.headline}</p>}
              <p className="text-xs text-muted-foreground">
                {platformLabels[post.platform] || post.platform}
                {fmt && ` • ${fmt.label} ${fmt.width}×${fmt.height}`}
                {` • ${currentIndex + 1} de ${posts.length}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onDownload(post)} className="gap-1.5 text-xs border-border">
                <Download size={14} /> Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Próximamente", description: "La edición inline estará disponible pronto." })} className="gap-1.5 text-xs border-border">
                <Edit3 size={14} /> Editar
              </Button>
              <Button size="sm" onClick={() => { onApprove(post.id); }} className="gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle2 size={14} /> Aprobar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
