import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import CreativeAgentChat from "@/components/dashboard/CreativeAgentChat";
import {
  ArrowLeft, Download, CheckCircle2, Upload, Sparkles, Loader2, X,
  Instagram, Linkedin, Play, Music, Calendar, Send, Clock, Eye,
  GripVertical, Image as ImageIcon, Video, FileText, Zap, Target, Users,
  TrendingUp, MessageSquare, Heart, Share2, Bookmark, MoreHorizontal,
  Check, MessageCircle, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight,
  Wand2, Home, Hexagon, FileText as BriefIcon, Twitter, Palette, Type,
  MoreVertical, Edit3, RefreshCw, Layers, Camera, Plus, ClipboardCopy
} from "lucide-react";

/* ── Types ── */
type Platform = "instagram" | "tiktok" | "linkedin";
type PostStatus = "draft" | "scheduled" | "published";
type ViewMode = "kanban" | "calendar";

interface FormatOption {
  id: string;
  platform: string;
  label: string;
  width: number;
  height: number;
  icon: string; // □ ▯ ▬
}

const ALL_FORMATS: FormatOption[] = [
  { id: "instagram_feed", platform: "instagram", label: "Feed", width: 1080, height: 1080, icon: "□" },
  { id: "instagram_story", platform: "instagram", label: "Story", width: 1080, height: 1920, icon: "▯" },
  { id: "instagram_reel", platform: "instagram", label: "Reel", width: 1080, height: 1920, icon: "▯" },
  { id: "tiktok_video", platform: "tiktok", label: "Video", width: 1080, height: 1920, icon: "▯" },
  { id: "linkedin_post", platform: "linkedin", label: "Post", width: 1200, height: 627, icon: "▬" },
  { id: "linkedin_story", platform: "linkedin", label: "Story", width: 1080, height: 1920, icon: "▯" },
  { id: "twitter_post", platform: "twitter", label: "Post", width: 1200, height: 630, icon: "▬" },
];

interface PostCard {
  id: string;
  platform: Platform;
  format: string;
  status: PostStatus;
  image?: string;
  caption?: string;
  audio?: string;
  title?: string;
  hashtags?: string[];
  scheduledAt?: string;
  calendarDay?: number;
  headline?: string;
  body?: string;
  cta?: string;
  imagePrompt?: string;
  styleDescription?: string;
  isRendering?: boolean;
  error?: string | null;
  video_url?: string;
  video_status?: "idle" | "generating" | "completed" | "success" | "processing" | "error";
  video_error?: string;
}

interface BrandProfile {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  palette: string[];
  contrast_color: string;
  font_family: string;
  suggested_fonts: string[];
  background_suggestion: string;
}

const getBrandStorageKey = (parrillaId?: string) => `brand_profile_${parrillaId || "default"}`;
const getLogoStorageKey = (parrillaId?: string) => `brand_logo_${parrillaId || "default"}`;
const getBrandNameStorageKey = (parrillaId?: string) => `brand_name_${parrillaId || "default"}`;

const DEFAULT_BRAND: BrandProfile = {
  primary_color: "#FF6B35",
  secondary_color: "#004E89",
  accent_color: "#F1FAEE",
  palette: ["#FF6B35", "#004E89", "#F1FAEE", "#A8DADC", "#457B9D"],
  contrast_color: "#FFFFFF",
  font_family: "Montserrat",
  suggested_fonts: ["Montserrat", "Poppins", "Inter"],
  background_suggestion: "dark",
};

function loadBrand(parrillaId?: string): BrandProfile {
  try {
    const saved = localStorage.getItem(getBrandStorageKey(parrillaId));
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_BRAND, ...parsed };
    }
  } catch {}
  return DEFAULT_BRAND;
}

function saveBrand(b: BrandProfile, parrillaId?: string) {
  localStorage.setItem(getBrandStorageKey(parrillaId), JSON.stringify(b));
}

const API_URL = import.meta.env.VITE_API_URL || "https://steady-potential-drug-advances.trycloudflare.com";

function getDimensionsFromFormat(format: string): { w: number; h: number } {
  const f = ALL_FORMATS.find(f => f.id === format);
  if (f) return { w: f.width, h: f.height };
  return { w: 1080, h: 1080 };
}

/* ── TikTok Icon ── */
const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

/* ── Checkerboard Pattern ── */
const CheckerboardBg = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}
    style={{
      backgroundImage: `linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)`,
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      backgroundColor: "hsl(var(--card))",
    }}
  >{children}</div>
);

/* ── Platform Icon Helper ── */
const PlatformIcon = ({ platform, size = 16 }: { platform: string; size?: number }) => {
  if (platform === "instagram") return <Instagram size={size} />;
  if (platform === "tiktok") return <TikTokIcon size={size} />;
  if (platform === "twitter") return <Twitter size={size} />;
  return <Linkedin size={size} />;
};

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: PostStatus }) => {
  const config = {
    draft: { label: "Draft", bg: "bg-muted text-muted-foreground border-border" },
    scheduled: { label: "Aprobado", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    published: { label: "Published", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  };
  const c = config[status];
  return <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${c.bg}`}>{c.label}</Badge>;
};

/* ── Shimmer Skeleton ── */
const ShimmerSkeleton = ({ aspectClass }: { aspectClass: string }) => (
  <div className={`${aspectClass} bg-secondary rounded-xl overflow-hidden relative`}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/5 to-transparent animate-pulse" />
    <motion.div
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <Loader2 size={20} className="animate-spin text-muted-foreground" />
      <p className="text-[11px] text-muted-foreground font-medium">Generando diseño...</p>
    </div>
  </div>
);

/* ── Aspect class helper ── */
function getAspectClass(format: string) {
  const dims = getDimensionsFromFormat(format);
  if (dims.w === dims.h) return "aspect-square";
  if (dims.h > dims.w) return "aspect-[9/16]";
  return "aspect-[1.91/1]";
}

/* ── Post Card ── */
const RenderedPostCard = ({ post, onEdit, onRegenerate, onDownload, onApproveStatus, isClientView, onClickImage, onGenerateVideo }: {
  post: PostCard; onEdit: (post: PostCard) => void; onRegenerate: (post: PostCard) => void;
  onDownload: (post: PostCard) => void; onApproveStatus: (id: string) => void;
  isClientView?: boolean; onClickImage?: (post: PostCard) => void;
  onGenerateVideo?: (post: PostCard) => void;
}) => {
  const [isHoveringMedia, setIsHoveringMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const platformGradients: Record<string, string> = {
    instagram: "from-pink-500 via-red-500 to-yellow-500",
    tiktok: "from-slate-900 to-slate-700",
    linkedin: "from-blue-600 to-blue-700",
    twitter: "from-slate-800 to-slate-900",
  };
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
          {hasVideo ? (
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
          <button onClick={() => onApproveStatus(post.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-emerald-400 hover:bg-secondary transition-colors ml-auto" title="Aprobar">
            <CheckCircle2 size={12} /> Aprobar
          </button>
        </div>
      )}
    </motion.div>
  );
};

/* ── Mini Card for Calendar ── */
const MiniPostCard = ({ post }: { post: PostCard }) => {
  const platformColors = { instagram: "from-pink-500 via-red-500 to-yellow-500", tiktok: "from-slate-900 to-slate-700", linkedin: "from-blue-600 to-blue-700", twitter: "from-slate-800 to-slate-900" };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-md overflow-hidden bg-secondary shrink-0"><img src={post.image} alt="" className="w-full h-full object-cover" /></div>
      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${platformColors[post.platform] || "from-slate-700 to-slate-800"} flex items-center justify-center`}><PlatformIcon platform={post.platform} size={10} /></div>
    </motion.div>
  );
};

/* ── Calendar View ── */
const CalendarView = ({ posts }: { posts: PostCard[] }) => {
  const daysInMonth = 31;
  const firstDayOfWeek = 1;
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const postsByDay = useMemo(() => {
    const map: Record<number, PostCard[]> = {};
    posts.forEach((p) => { if (p.calendarDay) { if (!map[p.calendarDay]) map[p.calendarDay] = []; map[p.calendarDay].push(p); } });
    return map;
  }, [posts]);
  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><ChevronLeft size={18} /></Button>
          <h2 className="text-xl font-bold text-foreground">Julio 2025</h2>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><ChevronRight size={18} /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((d) => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => (
          <motion.div key={i} whileHover={{ scale: day ? 1.02 : 1 }}
            className={`min-h-[120px] rounded-xl border transition-all ${day ? "bg-card border-border hover:border-primary/30 hover:shadow-md cursor-pointer" : "bg-secondary/30 border-transparent"}`}
          >
            {day && (
              <div className="p-2 h-full flex flex-col">
                <span className={`text-sm font-semibold mb-2 ${postsByDay[day]?.length ? "text-foreground" : "text-muted-foreground"}`}>{day}</span>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {postsByDay[day]?.slice(0, 2).map((post) => <MiniPostCard key={post.id} post={post} />)}
                  {postsByDay[day]?.length > 2 && <p className="text-[10px] text-muted-foreground font-medium">+{postsByDay[day].length - 2} más</p>}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ── Fullscreen Image Preview Modal ── */
const ImagePreviewModal = ({ posts, initialIndex, open, onClose, onApprove, onDownload }: {
  posts: PostCard[]; initialIndex: number; open: boolean; onClose: () => void;
  onApprove: (id: string) => void; onDownload: (post: PostCard) => void;
}) => {
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
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={20} className="text-white" />
          </button>

          {/* Navigation arrows */}
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

          {/* Image */}
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

          {/* Bottom bar */}
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

/* ── Edit Post Modal ── */
const EditPostModal = ({ post, open, onClose, onSave, brand }: {
  post: PostCard | null; open: boolean; onClose: () => void;
  onSave: (updatedPost: PostCard) => void;
  brand: BrandProfile;
}) => {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [format, setFormat] = useState("instagram_feed");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setHeadline(post.headline || post.title || "");
      setBody(post.body || post.caption || "");
      setCta(post.cta || "");
      setImagePrompt(post.imagePrompt || "");
      setStyleDescription(post.styleDescription || "profesional y moderno");
      setFormat(post.format || "instagram_feed");
      setPreviewImage(post.image || null);
    }
  }, [post]);

  const handleRegenerate = async () => {
    if (!post) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/posts/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          brand: {
            logo_b64: undefined,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
            accent_color: brand.accent_color,
            font_family: brand.font_family,
          },
          copy: { headline, body, cta },
          image_prompt: imagePrompt || "",
          style_description: styleDescription || "profesional y moderno",
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPreviewImage(data.rendered_post || data.image || null);
    } catch (err) {
      console.error("Error regenerating:", err);
      toast({ title: "⚠️ Error al regenerar", description: "No se pudo conectar con el servidor.", variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    if (!post) return;
    onSave({
      ...post,
      headline, body, cta, imagePrompt, styleDescription, format,
      image: previewImage || post.image,
    });
    onClose();
  };

  if (!post) return null;

  const formatLabel: Record<string, string> = {};
  ALL_FORMATS.forEach(f => { formatLabel[f.id] = `${f.width} × ${f.height} — ${f.label}`; });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl bg-card border-border p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] min-h-[600px]">
          <div className="p-6 space-y-4 overflow-y-auto border-r border-border">
            <DialogHeader className="pb-0">
              <DialogTitle className="text-foreground text-base">Editar Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contenido</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Headline</label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60} className="bg-secondary/50 border-border" />
                <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{headline.length}/60</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={150} rows={2} className="bg-secondary/50 border-border resize-none" />
                <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{body.length}/150</span>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA</label>
                <Input value={cta} onChange={(e) => setCta(e.target.value)} maxLength={30} className="bg-secondary/50 border-border" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Imagen</p>
              <Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={3} className="bg-secondary/50 border-border resize-none" placeholder="Describe la imagen de fondo..." />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estilo</p>
              <Input value={styleDescription} onChange={(e) => setStyleDescription(e.target.value)} className="bg-secondary/50 border-border" placeholder="ej: elegante, premium" />
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_FORMATS.map(f => <SelectItem key={f.id} value={f.id}>{f.icon} {f.label} ({f.width}×{f.height})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRegenerate} disabled={isRegenerating} className="w-full h-11 bg-gradient-to-r from-violet-600 to-primary text-white font-semibold">
              {isRegenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Regenerando...</> : <><Sparkles size={16} className="mr-2" /> ✨ Regenerar Post</>}
            </Button>
          </div>
          <div className="bg-secondary/30 p-6 flex flex-col items-center justify-center">
            <div className={`w-full max-w-md rounded-xl overflow-hidden border border-border bg-secondary ${getAspectClass(format)} ${format.includes("story") || format.includes("reel") || format.includes("tiktok") ? "max-h-[480px]" : ""}`}>
              {isRegenerating ? (
                <div className="w-full h-full relative overflow-hidden">
                  <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={28} className="animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Generando diseño...</p>
                  </div>
                </div>
              ) : (
                <img src={previewImage || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{formatLabel[format] || format}</p>
            <div className="flex gap-3 mt-6 w-full max-w-md">
              <Button variant="outline" onClick={onClose} className="flex-1 border-border text-muted-foreground">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground font-semibold">Guardar cambios</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


/* ── Main Page ── */
const Parrilla = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activePlatform, setActivePlatform] = useState<string>("instagram");
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isClientView, setIsClientView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const isNewParrilla = id === "nueva" || !id;
  const [brandAssets, setBrandAssets] = useState<string[]>(() => {
    if (isNewParrilla) return [];
    try {
      const savedLogo = localStorage.getItem(getLogoStorageKey(id));
      return savedLogo ? [savedLogo] : [];
    } catch { return []; }
  });
  const [brandAssetBlobs, setBrandAssetBlobs] = useState<Blob[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const [platforms, setPlatforms] = useState({ instagram: true, tiktok: true, linkedin: false, twitter: false });
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["instagram_feed", "tiktok_video"]));
  const [frequency, setFrequency] = useState("3-week");
  const [objective, setObjective] = useState("engagement");
  const [optionsPerPost, setOptionsPerPost] = useState(2);

  const [generatingStatus, setGeneratingStatus] = useState("");
  const [brand, setBrand] = useState<BrandProfile>(() => isNewParrilla ? DEFAULT_BRAND : loadBrand(id));

  // Chat state (real AI)
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**.\n\n📸 **Sube tu logo** y **fotos de tu producto** en el panel de Brand Assets para que pueda analizar tu marca con IA visual. 👈\n\nDespués hablamos sobre tu campaña. 🚀" }
  ]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [brandVision, setBrandVision] = useState<any>(null);
  const [productVision, setProductVision] = useState<any>(null);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [brandName, setBrandName] = useState<string>(() => {
    if (isNewParrilla) return "";
    try { return localStorage.getItem(getBrandNameStorageKey(id)) || ""; } catch { return ""; }
  });
  const [editingPost, setEditingPost] = useState<PostCard | null>(null);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const parrillaGridRef = useRef<HTMLDivElement>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandDetected, setBrandDetected] = useState(() => {
    if (isNewParrilla) return false;
    try {
      const hasLogo = !!localStorage.getItem(getLogoStorageKey(id));
      const hasBrand = !!localStorage.getItem(getBrandStorageKey(id));
      return hasLogo && hasBrand;
    } catch { return false; }
  });
  const [includeLogoInImage, setIncludeLogoInImage] = useState(false);

  // Available formats based on selected platforms
  const availableFormats = useMemo(() => {
    return ALL_FORMATS.filter(f => platforms[f.platform as keyof typeof platforms]);
  }, [platforms]);

  // Sync selected formats when platforms change
  useEffect(() => {
    setSelectedFormats(prev => {
      const newSet = new Set<string>();
      const activePlatformKeys = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
      // Keep existing selections that are still valid
      prev.forEach(fId => {
        const fmt = ALL_FORMATS.find(f => f.id === fId);
        if (fmt && platforms[fmt.platform as keyof typeof platforms]) newSet.add(fId);
      });
      // Auto-select first format of newly enabled platforms
      activePlatformKeys.forEach(pk => {
        const platformFormats = ALL_FORMATS.filter(f => f.platform === pk);
        const hasAny = platformFormats.some(f => newSet.has(f.id));
        if (!hasAny && platformFormats.length > 0) newSet.add(platformFormats[0].id);
      });
      return newSet;
    });
  }, [platforms]);

  const getFrequencyCount = (f: string) => ({ "3-week": 3, "5-week": 5, "daily": 7 }[f] || 3);
  const totalPosts = selectedFormats.size * getFrequencyCount(frequency) * optionsPerPost;

  // Load Google Font dynamically
  useEffect(() => {
    const fontName = brand.font_family.replace(/ /g, "+");
    const linkId = "dynamic-brand-font";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700;900&display=swap`;
  }, [brand.font_family]);

  useEffect(() => { saveBrand(brand, id); }, [brand, id]);

  // Send chat message to AI
  const sendChatMessage = useCallback(async (userMessage: string) => {
    const newMessages = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newMessages);
    setIsChatThinking(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          brand_context: brandVision,
          product_context: productVision,
          brand_colors: brand,
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages([...newMessages, { role: "assistant", content: "⚠️ Error al conectar con el agente. Intenta de nuevo." }]);
    } finally {
      setIsChatThinking(false);
    }
  }, [chatMessages, brandVision, productVision, brand]);

  // Trigger intro message when brand + product are both analyzed
  const introSentRef = useRef(false);
  useEffect(() => {
    if (brandVision && productVision && !introSentRef.current) {
      introSentRef.current = true;
      (async () => {
        setIsChatThinking(true);
        try {
          const introMessages = [{ role: "user" as const, content: "Hola, acabo de subir mi logo y una foto de mi producto. Analízalos y preséntate." }];
          const res = await fetch(`${API_URL}/api/v1/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: introMessages,
              brand_context: brandVision,
              product_context: productVision,
              brand_colors: brand,
            }),
          });
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const data = await res.json();
          setChatMessages([{ role: "assistant", content: data.reply }]);
        } catch {
          setChatMessages([{ role: "assistant", content: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**. Ya analicé tu marca y producto. Cuéntame sobre tu campaña." }]);
        } finally {
          setIsChatThinking(false);
        }
      })();
    }
  }, [brandVision, productVision, brand]);

  // Trigger intro for brand-only (no product yet)
  const brandIntroSentRef = useRef(false);
  useEffect(() => {
    if (brandVision && !productVision && !brandIntroSentRef.current && !introSentRef.current) {
      brandIntroSentRef.current = true;
      (async () => {
        setIsChatThinking(true);
        try {
          const introMessages = [{ role: "user" as const, content: "Hola, acabo de subir mi logo. Analízalo y preséntate." }];
          const res = await fetch(`${API_URL}/api/v1/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: introMessages,
              brand_context: brandVision,
              product_context: null,
              brand_colors: brand,
            }),
          });
          if (!res.ok) throw new Error(`Error ${res.status}`);
          const data = await res.json();
          setChatMessages([{ role: "assistant", content: data.reply }]);
        } catch {
          setChatMessages([{ role: "assistant", content: "¡Hola! 👋 Soy tu **Nano Banano Content Agent**. Ya analicé tu logo. Sube fotos de tu producto y cuéntame sobre tu campaña." }]);
        } finally {
          setIsChatThinking(false);
        }
      })();
    }
  }, [brandVision, productVision, brand]);

  // Brand analysis — real API call with vision
  const analyzeBrand = useCallback(async (logoB64: string) => {
    setIsAnalyzingBrand(true);
    setBrandDetected(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/brand/analyze-vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_b64: logoB64 }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (!data.palette || !data.primary_color) throw new Error("Respuesta incompleta de la API");
      const newBrand: BrandProfile = {
        primary_color: data.primary_color,
        secondary_color: data.secondary_color || data.palette[1] || "#333333",
        accent_color: data.accent_color || data.palette[2] || "#666666",
        palette: data.palette,
        contrast_color: data.contrast_color || "#FFFFFF",
        font_family: data.suggested_fonts?.[0] || "Montserrat",
        suggested_fonts: data.suggested_fonts || ["Montserrat", "Poppins", "Inter"],
        background_suggestion: data.background_suggestion || "dark",
      };
      setBrand(newBrand);
      setBrandDetected(true);
      setIsAnalyzingBrand(false);
      // Save vision analysis
      if (data.vision_analysis) {
        setBrandVision(data.vision_analysis);
        if (data.vision_analysis.brand_name_detected && !brandName) {
          setBrandName(data.vision_analysis.brand_name_detected);
          try { localStorage.setItem(getBrandNameStorageKey(id), data.vision_analysis.brand_name_detected); } catch {}
        }
      }
      toast({ title: "✨ Marca analizada con IA visual", description: "Colores, tipografía y personalidad detectados." });
    } catch (error) {
      console.error("Error analyzing brand:", error);
      setIsAnalyzingBrand(false);
      setBrandDetected(false);
      toast({ title: "⚠️ No se pudo analizar el logo", description: "Configura los colores manualmente o intenta de nuevo.", variant: "destructive" });
    }
  }, [brandName, id]);

  // Product analysis
  const analyzeProduct = useCallback(async (productB64: string) => {
    setIsAnalyzingProduct(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/product/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_b64: productB64 }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setProductVision(data);
      toast({ title: "🧠 Producto analizado", description: data.product_description || "Análisis visual completado." });
    } catch (err) {
      console.error("Error analyzing product:", err);
      toast({ title: "⚠️ No se pudo analizar el producto", variant: "destructive" });
    } finally {
      setIsAnalyzingProduct(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Máximo 10MB.", variant: "destructive" });
      return;
    }
    e.target.value = "";
    const previewUrl = URL.createObjectURL(file);
    setBrandAssets((prev) => [...prev, previewUrl]);
    setBrandAssetBlobs((prev) => [...prev, file]);
    toast({ title: "✅ Logo cargado", description: "Analizando identidad de marca..." });
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      try { localStorage.setItem(getLogoStorageKey(id), b64); } catch {}
      analyzeBrand(b64);
    };
    reader.readAsDataURL(file);
  }, [analyzeBrand]);

  const handleProductImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    const remaining = 4 - productImages.length;
    const toProcess = files.slice(0, remaining);
    let firstProductB64: string | null = null;
    toProcess.forEach((file, idx) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Archivo demasiado grande", description: "Máximo 10MB por imagen.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setProductImages(prev => {
          if (prev.length >= 4) return prev;
          return [...prev, b64];
        });
        // Analyze the first product image
        if (idx === 0 && !productVision) {
          analyzeProduct(b64);
        }
      };
      reader.readAsDataURL(file);
    });
    toast({ title: "📸 Foto(s) cargada(s)", description: `${toProcess.length} foto(s) de producto añadida(s).` });
  }, [productImages.length, productVision, analyzeProduct]);

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const renderPost = useCallback(async (post: PostCard, logoB64: string | undefined): Promise<string> => {
    const res = await fetch(`${API_URL}/api/v1/posts/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: post.format,
        brand: {
          name: brandName || "Mi Marca",
          logo_b64: logoB64 || undefined,
          primary_color: brand.primary_color,
          secondary_color: brand.secondary_color,
          accent_color: brand.accent_color,
          font_family: brand.font_family,
        },
        copy: {
          headline: post.headline || post.title || "",
          body: post.body || post.caption || "",
          cta: post.cta || "",
        },
        image_prompt: post.imagePrompt || "",
        style_description: post.styleDescription || "profesional y moderno",
        product_images: productImages,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (data.rendered_post) return data.rendered_post;
    if (data.image) return data.image;
    throw new Error("No image returned from API");
  }, [brand, brandName, productImages]);

  const handleGenerateParrilla = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(null);
    setGeneratingStatus("⚡ Preparando parrilla...");

    const activeFormats = Array.from(selectedFormats);
    const postsPerFormat = getFrequencyCount(frequency) * optionsPerPost;

    // Build posts_config
    const postsConfig: { platform: string; format: string }[] = [];
    for (const formatId of activeFormats) {
      const fmt = ALL_FORMATS.find(f => f.id === formatId)!;
      for (let j = 0; j < postsPerFormat; j++) {
        postsConfig.push({ platform: fmt.platform, format: fmt.id });
      }
    }

    // Get logo b64
    let logoB64: string | undefined;
    try { logoB64 = localStorage.getItem(getLogoStorageKey(id)) || undefined; } catch {}
    if (!logoB64 && brandAssetBlobs.length > 0) {
      logoB64 = await blobToBase64(brandAssetBlobs[0]);
    }

    // Show skeletons
    const skeletonPosts: PostCard[] = postsConfig.map((pc, idx) => ({
      id: `skeleton-${idx}`,
      platform: pc.platform as Platform,
      format: pc.format,
      status: "draft" as PostStatus,
      calendarDay: (idx * 2) + 1,
      isRendering: true,
    }));
    setPosts(skeletonPosts);
    setHasGenerated(true);
    setGenerationProgress({ completed: 0, total: postsConfig.length });
    setTimeout(() => {
      parrillaGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    // Extract campaign context from chat messages
    const userMessages = chatMessages.filter(m => m.role === "user").map(m => m.content);
    const campaignDescription = userMessages.join("\n");

    const requestBody = {
      brand: {
        name: brandVision?.brand_name_detected || brandName || "Mi Marca",
        logo_b64: logoB64 || undefined,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        accent_color: brand.accent_color,
        font_family: brand.font_family,
      },
      campaign: {
        description: campaignDescription,
        tone: "",
        extras: "",
      },
      brand_vision: brandVision || null,
      product_vision: productVision || null,
      product_images: productImages,
      posts_config: postsConfig,
      include_logo_in_image: includeLogoInImage,
    };

    const motivationalMessages = [
      "🎨 Creando escenas con tu producto...",
      "✨ Diseñando templates personalizados...",
      "🎯 Aplicando tu identidad de marca...",
      "📐 Ajustando composición y tipografía...",
      "🖌️ Refinando los detalles visuales...",
      "🚀 Casi listo, finalizando los últimos posts...",
    ];

    const startTime = Date.now();
    const secsPerPost = includeLogoInImage ? 60 : 30;
    const estimatedMins = Math.ceil((postsConfig.length * secsPerPost) / 60);
    const estimateLabel = includeLogoInImage
      ? `⏳ Tiempo estimado: ~${estimatedMins} min (integración de logo activada)`
      : `⏳ Tiempo estimado: ~${estimatedMins} min`;
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      const msgIndex = Math.floor(elapsed / 15) % motivationalMessages.length;
      setGeneratingStatus(
        `⚡ Generando posts con IA...\n${motivationalMessages[msgIndex]}\n${estimateLabel}\n⏱️ ${mins}:${secs.toString().padStart(2, "0")}`
      );
    }, 1000);

    try {
      // Step 1: Start generation (returns immediately)
      const startRes = await fetch(`${API_URL}/api/v1/posts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!startRes.ok) {
        const errText = await startRes.text().catch(() => "");
        throw new Error(`Error ${startRes.status}: ${errText}`);
      }

      const { job_id, total_posts } = await startRes.json();

      // Update skeleton count if server says different
      if (total_posts && total_posts !== postsConfig.length) {
        setGenerationProgress({ completed: 0, total: total_posts });
      }

      // Step 2: Polling every 5 seconds
      let isComplete = false;
      while (!isComplete) {
        await new Promise(r => setTimeout(r, 5000));

        const pollRes = await fetch(`${API_URL}/api/v1/posts/job/${job_id}`);
        if (!pollRes.ok) {
          console.warn("Poll error, retrying...", pollRes.status);
          continue;
        }

        const { job, posts: serverPosts } = await pollRes.json();

        // Update posts progressively
        setPosts(prevPosts => {
          const updated = [...prevPosts];
          (serverPosts || []).forEach((sp: any) => {
            const idx = sp.index != null ? sp.index : undefined;
            if (idx == null || idx >= updated.length) return;

            if (sp.status === "success" && sp.rendered_image_url) {
              updated[idx] = {
                id: sp.id || `post-${job_id}-${idx}`,
                platform: (sp.platform || postsConfig[idx]?.platform || "instagram") as Platform,
                format: sp.format || postsConfig[idx]?.format || "instagram_feed",
                status: "draft" as PostStatus,
                calendarDay: (idx * 2) + 1,
                image: sp.rendered_image_url,
                headline: sp.headline || "",
                body: sp.body || "",
                cta: sp.cta || "",
                imagePrompt: sp.image_prompt || "",
                isRendering: false,
                error: null,
              };
            } else if (sp.status === "error") {
              updated[idx] = {
                ...updated[idx],
                isRendering: false,
                error: sp.error_message || "Error al generar este post",
              };
            }
          });
          return updated;
        });

        // Update progress
        const completedCount = job?.completed_posts ?? 0;
        const totalCount = job?.total_posts ?? postsConfig.length;
        setGenerationProgress({ completed: completedCount, total: totalCount });

        // Check if done
        if (job?.status === "completed" || job?.status === "failed") {
          isComplete = true;
        }
      }

      // Final toast
      const finalPosts = await new Promise<PostCard[]>(resolve => {
        setPosts(prev => { resolve(prev); return prev; });
      });
      const errorCount = finalPosts.filter(p => p.error).length;
      if (errorCount > 0) {
        toast({ title: "⚠️ Parrilla con errores", description: `${finalPosts.length - errorCount} OK, ${errorCount} fallidos. Reintenta los fallidos.`, variant: "destructive" });
      } else {
        toast({ title: "🚀 Parrilla generada", description: `${finalPosts.length} posts generados exitosamente.` });
      }
    } catch (error: any) {
      console.error("Error generating posts:", error);
      setPosts([]);
      setHasGenerated(false);
      setGenerationProgress(null);
      toast({
        title: "⚠️ No se pudo generar la parrilla",
        description: error.message || "No se pudo conectar con el servidor de generación.",
        variant: "destructive",
      });
    } finally {
      clearInterval(timerInterval);
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  }, [selectedFormats, frequency, optionsPerPost, brandAssetBlobs, blobToBase64, chatMessages, brand, brandName, brandVision, productVision, id, productImages, includeLogoInImage]);

  const hasUserChatMessage = chatMessages.some(m => m.role === "user");
  const canGenerate = brandDetected && productImages.length > 0 && selectedFormats.size > 0 && hasUserChatMessage;
  const getDisabledReason = () => {
    if (!brandDetected) return "Sube tu logo primero";
    if (productImages.length === 0) return "Sube al menos una foto de tu producto";
    if (!hasUserChatMessage) return "Conversa con Nano Banano sobre tu campaña";
    if (selectedFormats.size === 0) return "Selecciona al menos una plataforma y formato";
    return "";
  };

  const togglePlatform = (key: keyof typeof platforms) => setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(formatId)) next.delete(formatId);
      else next.add(formatId);
      return next;
    });
  };

  const handleApprovePost = useCallback((id: string) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "scheduled" as PostStatus } : p)); toast({ title: "✅ Post aprobado" }); }, []);
  const handleApproveAll = () => { setPosts(prev => prev.map(p => ({ ...p, status: "scheduled" as PostStatus }))); toast({ title: "✅ Todo aprobado" }); };

  const platformPosts = posts.filter((p) => p.platform === activePlatform);

  const handleEditPost = useCallback((post: PostCard) => { setEditingPost(post); }, []);
  const handleClickImage = useCallback((post: PostCard) => {
    const idx = platformPosts.findIndex(p => p.id === post.id);
    setPreviewIndex(idx >= 0 ? idx : 0);
    setIsPreviewOpen(true);
  }, [platformPosts]);
  const handleSavePost = useCallback((updatedPost: PostCard) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    toast({ title: "💾 Post actualizado" });
  }, []);

  const handleRegenerateSingle = useCallback(async (post: PostCard) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: true, error: null } : p));
    try {
      let logoB64: string | undefined;
      try { logoB64 = localStorage.getItem(getLogoStorageKey(id)) || undefined; } catch {}
      if (!logoB64 && brandAssetBlobs.length > 0) logoB64 = await blobToBase64(brandAssetBlobs[0]);
      const newImage = await renderPost(post, logoB64);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, image: newImage, isRendering: false, error: null } : p));
      toast({ title: "✨ Post regenerado" });
    } catch (err: any) {
      console.error("Error regenerating post:", err);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: false, error: "Error al regenerar" } : p));
      toast({ title: "⚠️ Error al regenerar", description: "No se pudo conectar con el servidor.", variant: "destructive" });
    }
  }, [brandAssetBlobs, blobToBase64, renderPost, id]);

  const handleDownloadPost = useCallback(async (post: PostCard) => {
    const hasVideo = post.video_url && (post.video_status === "completed" || post.video_status === "success");
    const url = hasVideo ? post.video_url! : post.image;
    if (!url) return;
    const ext = hasVideo ? "mp4" : "png";
    try {
      if (url.startsWith("http")) {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `post-${post.id}.${ext}`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `post-${post.id}.${ext}`;
        a.click();
      }
    } catch {
      toast({ title: "⚠️ Error al descargar", description: `No se pudo descargar el ${hasVideo ? "video" : "imagen"}.`, variant: "destructive" });
    }
  }, []);

  const handleGenerateVideo = useCallback(async (post: PostCard) => {
    // Set status to generating
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_status: "generating" as const } : p));
    toast({ title: "🎬 Generando video...", description: "Esto toma ~1-2 minutos." });

    try {
      await fetch(`${API_URL}/api/v1/posts/${post.id}/video`, { method: "POST" });

      // Poll every 5 seconds
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/posts/${post.id}/video/status`);
          if (!res.ok) return;
          const data = await res.json();

          if (data.video_status === "completed" || data.video_status === "success") {
            clearInterval(poll);
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_url: data.video_url, video_status: "completed" as const } : p));
            toast({ title: "🎬 Video listo ✅" });
          } else if (data.video_status === "error") {
            clearInterval(poll);
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_status: "error" as const, video_error: data.video_error } : p));
            toast({ title: "⚠️ Error al generar video", description: data.video_error || "Intenta de nuevo.", variant: "destructive" });
          }
        } catch {
          // Ignore polling errors, will retry
        }
      }, 5000);
    } catch {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, video_status: "error" as const } : p));
      toast({ title: "⚠️ Error al iniciar video", variant: "destructive" });
    }
  }, []);

  // Group formats by platform for display
  const formatsByPlatform = useMemo(() => {
    const groups: Record<string, FormatOption[]> = {};
    availableFormats.forEach(f => {
      if (!groups[f.platform]) groups[f.platform] = [];
      groups[f.platform].push(f);
    });
    return groups;
  }, [availableFormats]);


  const platformConfig = [
    { key: "instagram" as const, label: "Instagram", icon: Instagram, gradient: "from-pink-500 via-red-500 to-yellow-500", emoji: "📸" },
    { key: "tiktok" as const, label: "TikTok", icon: TikTokIcon, gradient: "from-slate-900 to-slate-700", emoji: "🎵" },
    { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, gradient: "from-blue-600 to-blue-700", emoji: "💼" },
    { key: "twitter" as const, label: "X / Twitter", icon: Twitter, gradient: "from-slate-800 to-slate-900", emoji: "🐦" },
  ];

  const platformLabelsMap: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", twitter: "X / Twitter" };

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col px-6 py-3">
          {!isClientView && (
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 hover:text-foreground transition-colors"><Home size={12} /> Directorio</button>
              <span>/</span>
              <button className="flex items-center gap-1 hover:text-foreground transition-colors"><Hexagon size={12} /> Aero Dynamics</button>
              <span>/</span>
              <span className="flex items-center gap-1 text-foreground font-medium"><CalendarDays size={12} /> Parrilla</span>
            </nav>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Parrilla de Contenido</h1>
                <p className="text-xs text-muted-foreground">Lanzamiento Drone X10 · Aero Dynamics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleApproveAll}
                disabled={posts.length === 0}
                className="gap-2 text-sm h-9 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40"
              >
                <CheckCircle2 size={14} /> Aprobar Todo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-start">
        {/* Left Panel - Brand Assets */}
        <AnimatePresence>
          {!isClientView && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }}
              className="sticky top-[73px] self-start max-h-[calc(100vh-73px)] bg-card border-r border-border p-5 flex flex-col overflow-y-auto shrink-0"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <ImageIcon size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">Brand Assets</h2>
                  <p className="text-[10px] text-muted-foreground">Inteligencia visual de marca</p>
                </div>
              </div>

              {/* Brand Name */}
              <div className="mb-4 space-y-1.5">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Nombre de tu marca</label>
                <Input
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value);
                    try { localStorage.setItem(getBrandNameStorageKey(id), e.target.value); } catch {}
                  }}
                  placeholder="Ej: Bacachito Feliz"
                  className="bg-secondary/50 border-border h-9 text-sm"
                />
              </div>

              {/* Upload / Logo Preview */}
              {brandAssets.length === 0 ? (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary bg-secondary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group mb-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                    <Upload size={24} className="text-primary-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Subir Logo de Marca</p>
                    <p className="text-[11px] text-muted-foreground">PNG, JPG hasta 10MB</p>
                  </div>
                </button>
              ) : (
                <div className="mb-4 space-y-3">
                  <div className="relative group/logo">
                    <CheckerboardBg className="aspect-square rounded-xl overflow-hidden border border-border shadow-sm">
                      <img src={brandAssets[brandAssets.length - 1]} alt="Logo" className="w-full h-full object-contain p-2" />
                    </CheckerboardBg>
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs gap-1.5 bg-secondary/90 hover:bg-secondary"
                      >
                        <Upload size={13} /> Cambiar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setBrandAssets([]);
                          setBrandAssetBlobs([]);
                          setBrandDetected(false);
                          setBrandVision(null);
                          setBrand(DEFAULT_BRAND);
                          try {
                            localStorage.removeItem(getLogoStorageKey(id));
                            localStorage.removeItem(getBrandStorageKey(id));
                          } catch {}
                          toast({ title: "Logo eliminado" });
                        }}
                        className="h-8 text-xs gap-1.5 bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30"
                      >
                        <X size={13} /> Quitar
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-1">
                    <label htmlFor="logo-integrate" className="text-[11px] font-medium text-foreground cursor-pointer">
                      ✨ Integrar logo en la imagen
                    </label>
                    <Switch id="logo-integrate" checked={includeLogoInImage} onCheckedChange={setIncludeLogoInImage} />
                  </div>
                  <p className="text-[10px] px-1 leading-relaxed" style={{ color: includeLogoInImage ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                    {includeLogoInImage
                      ? "La IA integrará tu logo dentro de la escena (tarda un poco más)"
                      : "El logo aparecerá como marca de agua en la esquina"}
                  </p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              {brandAssets.length === 0 && !isAnalyzingBrand && !brandDetected && (
                <p className="text-xs text-muted-foreground text-center py-4 px-2 italic">
                  Sube tu logo para detectar automáticamente los colores de tu marca
                </p>
              )}

              {isAnalyzingBrand && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <p className="text-xs text-primary font-medium">🔍 Analizando tu marca...</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="w-8 h-8 rounded-full bg-secondary animate-pulse border border-border"
                      />
                    ))}
                  </div>
                  <div className="h-9 bg-secondary rounded-lg animate-pulse" />
                </motion.div>
              )}

              {brandDetected && !isAnalyzingBrand && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-4 space-y-4">
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">✨ Paleta Detectada</p>
                    <div className="flex items-center gap-2 justify-center">
                      {brand.palette.map((color, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08, type: "spring" }}
                          className="flex flex-col items-center gap-1"
                        >
                          <label className="cursor-pointer group/swatch">
                            <input type="color" value={color} onChange={(e) => {
                              const newPalette = [...brand.palette];
                              newPalette[i] = e.target.value;
                              const updates: Partial<BrandProfile> = { palette: newPalette };
                              if (i === 0) updates.primary_color = e.target.value;
                              if (i === 1) updates.secondary_color = e.target.value;
                              if (i === 2) updates.accent_color = e.target.value;
                              setBrand(prev => ({ ...prev, ...updates }));
                            }} className="sr-only" />
                            <div
                              className="w-8 h-8 rounded-full border border-white/20 shadow-sm group-hover/swatch:scale-110 group-hover/swatch:ring-2 group-hover/swatch:ring-primary transition-all"
                              style={{ backgroundColor: color }}
                            />
                          </label>
                          {i < 3 && (
                            <>
                              <p className="text-[8px] text-muted-foreground font-medium">
                                {["Primario", "Secundario", "Acento"][i]}
                              </p>
                              <p className="text-[8px] text-muted-foreground font-mono">{color}</p>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center">Puedes editar cualquier color</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">🔤 Tipografía Sugerida</p>
                    <Select value={brand.font_family} onValueChange={(v) => setBrand(prev => ({ ...prev, font_family: v }))}>
                      <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {brand.suggested_fonts.map(f => <SelectItem key={f} value={f}>{f} ⭐</SelectItem>)}
                        <SelectSeparator />
                        {["Inter", "Poppins", "Montserrat", "Playfair Display", "Roboto", "Space Grotesk"]
                          .filter(f => !brand.suggested_fonts.includes(f))
                          .map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                    <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border">
                      <p className="text-lg text-foreground" style={{ fontFamily: brand.font_family }}>Aa Bb Cc 123</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{brand.font_family}</p>
                    </div>
                  </div>
                  {/* Brand Vision Analysis */}
                  {brandVision && (
                    <div className="space-y-1.5 px-1">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        🧠 {brandVision.logo_description || "Marca analizada"}
                      </p>
                      {brandVision.brand_name_detected && (
                        <p className="text-[10px] text-muted-foreground">
                          📛 Nombre detectado: <span className="text-foreground font-medium">{brandVision.brand_name_detected}</span>
                        </p>
                      )}
                      {brandVision.personality && (
                        <p className="text-[10px] text-muted-foreground">
                          ✨ Personalidad: <span className="text-foreground font-medium">{brandVision.personality}</span>
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 📸 Product Photos */}
              <div className="mb-4 space-y-2.5">
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">📸 Fotos del Producto</p>
                {productImages.length === 0 ? (
                  <button onClick={() => productFileInputRef.current?.click()}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-primary bg-secondary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Camera size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <p className="text-xs font-medium text-foreground">Sube fotos de tu producto</p>
                    <p className="text-[10px] text-muted-foreground">La IA usará estas fotos para crear tus posts</p>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {productImages.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-lg border border-border overflow-hidden group/thumb">
                          <img src={img} alt={`Producto ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ))}
                      {productImages.length < 4 && (
                        <button onClick={() => productFileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary bg-secondary/30 hover:bg-primary/5 transition-all flex items-center justify-center"
                        >
                          <Plus size={20} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-emerald-400 font-medium">✅ {productImages.length} foto(s) lista(s) — La IA usará estas como referencia</p>
                    {isAnalyzingProduct && (
                      <p className="text-[10px] text-muted-foreground animate-pulse">🧠 Analizando producto con IA...</p>
                    )}
                    {productVision && !isAnalyzingProduct && (
                      <p className="text-[10px] text-muted-foreground">
                        🧠 {productVision.product_type ? `${productVision.product_type} — ` : ""}{productVision.product_description || "Producto analizado"}
                      </p>
                    )}
                  </div>
                )}
                <input ref={productFileInputRef} type="file" accept="image/png,image/jpeg" multiple className="hidden" onChange={handleProductImageUpload} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Agent Section */}
          <AnimatePresence>
            {!isClientView && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                className="bg-card border-b border-border p-5 overflow-hidden"
              >
                <div className="max-w-6xl mx-auto space-y-5">
                  {/* Agent header + chat */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-primary flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground">Nano Banano Content Agent ✨</h2>
                      <p className="text-xs text-muted-foreground">IA generativa para parrillas de contenido social media</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <CreativeAgentChat
                      messages={chatMessages}
                      onSendMessage={sendChatMessage}
                      isThinking={isChatThinking}
                      isGenerating={isGenerating}
                      generatingStatus={generatingStatus}
                      brandDetected={brandDetected}
                    />
                  </div>

                  {/* Row 1: Platforms */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plataformas</p>
                    <div className="flex flex-wrap gap-2">
                      {platformConfig.map((p) => (
                        <button key={p.key} onClick={() => togglePlatform(p.key)}
                          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                            platforms[p.key] ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-md`}>
                            <p.icon size={14} className="text-white" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{p.emoji} {p.label}</span>
                          {platforms[p.key] && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check size={12} className="text-primary-foreground" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Formats (dynamic) */}
                  <AnimatePresence>
                    {Object.keys(formatsByPlatform).length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formatos</p>
                        <div className="space-y-2.5">
                          {Object.entries(formatsByPlatform).map(([platform, formats]) => (
                            <div key={platform} className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-20 shrink-0">{platformLabelsMap[platform]}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {formats.map(fmt => (
                                  <button key={fmt.id} onClick={() => toggleFormat(fmt.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                                      selectedFormats.has(fmt.id)
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground/40"
                                    }`}
                                  >
                                    <span className="text-sm">{fmt.icon}</span>
                                    <span>{fmt.label}</span>
                                    <span className="text-[9px] text-muted-foreground">{fmt.width}×{fmt.height}</span>
                                    {selectedFormats.has(fmt.id) && <Check size={10} className="text-primary" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Row 3: Config + Generate */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Frecuencia</span>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-secondary/50 border-border h-9 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-week">3/semana</SelectItem>
                          <SelectItem value="5-week">5/semana</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Objetivo</span>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger className="bg-secondary/50 border-border h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement"><div className="flex items-center gap-2"><Heart size={14} className="text-pink-500" /> Engagement</div></SelectItem>
                          <SelectItem value="conversion"><div className="flex items-center gap-2"><Target size={14} className="text-emerald-500" /> Conversión</div></SelectItem>
                          <SelectItem value="awareness"><div className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> Awareness</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 relative group/var">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Variantes</span>
                      <Select value={String(optionsPerPost)} onValueChange={(v) => setOptionsPerPost(Number(v))}>
                        <SelectTrigger className="bg-secondary/50 border-border h-9 w-16 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-card border border-border text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/var:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        Número de variaciones de diseño por cada post
                      </div>
                    </div>

                    <div className="w-px h-8 bg-border" />

                    {selectedFormats.size > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Se generarán <span className="text-foreground font-bold">{totalPosts}</span> posts
                      </span>
                    )}

                    <div className="relative group/gen ml-auto">
                      <Button onClick={handleGenerateParrilla}
                        disabled={isGenerating || !canGenerate}
                        className={`h-11 px-6 text-sm font-semibold shadow-lg text-white transition-all ${
                          canGenerate && !isGenerating
                            ? "bg-gradient-to-r from-violet-600 via-purple-600 to-primary hover:from-violet-700 hover:via-purple-700 hover:to-primary/80 shadow-primary/25 animate-pulse"
                            : "bg-gradient-to-r from-violet-600 via-purple-600 to-primary opacity-50"
                        }`}
                      >
                        {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> {generatingStatus || "Generando..."}</> : <><Zap size={16} className="mr-2" /> Generar 🚀</>}
                      </Button>
                      {!canGenerate && !isGenerating && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/gen:opacity-100 transition-opacity pointer-events-none shadow-lg">
                          {getDisabledReason()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <AnimatePresence>
            {isGenerating && generationProgress && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="px-6 pt-5"
              >
                <div className="max-w-2xl mx-auto space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">
                      ⚡ Generando posts... {generationProgress.completed} de {generationProgress.total}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {Math.round((generationProgress.completed / generationProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(generationProgress.completed / generationProgress.total) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Grid */}
          <section ref={parrillaGridRef} className="px-6 py-5" id="parrilla-grid">
            {hasGenerated ? (
              <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v)} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList className="h-11 p-1 bg-secondary">
                    {Object.entries(platforms).filter(([_, v]) => v).map(([key]) => (
                      <TabsTrigger key={key} value={key} className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <PlatformIcon platform={key} size={14} /> {platformLabelsMap[key]}
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter(p => p.platform === key).length}</Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="flex items-center p-1 rounded-xl bg-secondary">
                    <button onClick={() => setViewMode("kanban")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "kanban" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    ><LayoutGrid size={16} /> Grid</button>
                    <button onClick={() => setViewMode("calendar")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "calendar" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                    ><CalendarDays size={16} /> Mensual</button>
                  </div>
                </div>

                {viewMode === "kanban" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence>
                      {platformPosts.map((post) => (
                        <RenderedPostCard key={post.id} post={post}
                          onEdit={handleEditPost} onRegenerate={handleRegenerateSingle}
                          onDownload={handleDownloadPost} onApproveStatus={handleApprovePost}
                          isClientView={isClientView} onClickImage={handleClickImage}
                          onGenerateVideo={handleGenerateVideo}
                        />
                      ))}
                    </AnimatePresence>
                    {platformPosts.length === 0 && (
                      <div className="col-span-full py-20 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                        Sin posts para esta plataforma
                      </div>
                    )}
                  </div>
                ) : (
                  <div><CalendarView posts={posts} /></div>
                )}
              </Tabs>
            ) : (
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Sparkles size={36} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Tu parrilla está vacía</h3>
                  <p className="text-sm mb-6 text-muted-foreground">
                    {isClientView ? "Espera a que el equipo creativo genere el contenido." : "Sube tu logo, configura la marca y haz clic en \"Generar\" para crear contenido con IA."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Edit Modal */}
      <EditPostModal post={editingPost} open={!!editingPost} onClose={() => setEditingPost(null)} onSave={handleSavePost} brand={brand} />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        posts={platformPosts}
        initialIndex={previewIndex}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onApprove={handleApprovePost}
        onDownload={handleDownloadPost}
      />
    </div>
  );
};

export default Parrilla;
