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
  MoreVertical, Edit3, RefreshCw, Layers
} from "lucide-react";

/* ── Types ── */
type Platform = "instagram" | "tiktok" | "linkedin";
type PostStatus = "draft" | "scheduled" | "published";
type ViewMode = "kanban" | "calendar";
type TemplateId = "auto" | "bold-center" | "split-left" | "minimal-bottom" | "card-overlay";

interface PostCard {
  id: string;
  platform: Platform;
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
  templateId?: TemplateId;
  styleDescription?: string;
  isRendering?: boolean;
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

const TEMPLATES: { id: TemplateId; name: string; icon: string; description: string }[] = [
  { id: "auto", name: "Auto", icon: "🎯", description: "Elige automáticamente" },
  { id: "bold-center", name: "Bold Center", icon: "⬛", description: "Headline centrado" },
  { id: "split-left", name: "Split Left", icon: "◧", description: "Panel izquierdo" },
  { id: "minimal-bottom", name: "Minimal Bottom", icon: "▬", description: "Barra inferior" },
  { id: "card-overlay", name: "Card Overlay", icon: "▣", description: "Card flotante" },
];

const getBrandStorageKey = (parrillaId?: string) => `brand_profile_${parrillaId || "default"}`;

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

const API_URL = import.meta.env.VITE_API_URL || "https://loaded-roles-behavior-mystery.trycloudflare.com";

function getFormatFromPlatform(platform: string) {
  const map: Record<string, string> = {
    instagram: "instagram_feed",
    tiktok: "instagram_story",
    linkedin: "linkedin_post",
    twitter: "facebook_post",
  };
  return map[platform] || "instagram_feed";
}

function getDimensionsFromFormat(format: string): { w: number; h: number } {
  const map: Record<string, { w: number; h: number }> = {
    instagram_feed: { w: 1080, h: 1080 },
    instagram_story: { w: 1080, h: 1920 },
    facebook_post: { w: 1200, h: 630 },
    linkedin_post: { w: 1200, h: 627 },
  };
  return map[format] || { w: 1080, h: 1080 };
}

/* ── Mock Data ── */
const MOCK_POSTS: PostCard[] = [
  { id: "ig-1", platform: "instagram", status: "draft", caption: "Libertad sin límites. El Drone X10 redefine lo que significa volar. ✈️", hashtags: ["DroneX10", "Innovation"], calendarDay: 3, headline: "Libertad sin límites", body: "El Drone X10 redefine lo que significa volar.", cta: "Descúbrelo ahora", imagePrompt: "Drone flying over mountains at sunset", styleDescription: "épico, cinematográfico" },
  { id: "ig-2", platform: "instagram", status: "draft", caption: "Captura momentos imposibles con precisión milimétrica. 📸", hashtags: ["Drones", "Photography"], calendarDay: 8, headline: "Momentos imposibles", body: "Precisión milimétrica.", cta: "Comprar", imagePrompt: "Aerial photography drone over city", styleDescription: "moderno, limpio" },
  { id: "ig-3", platform: "instagram", status: "draft", caption: "El futuro de la fotografía aérea ya llegó. 🚀", hashtags: ["AeroX10"], calendarDay: 12, headline: "El futuro llegó", body: "Fotografía aérea de nueva generación.", imagePrompt: "Futuristic drone technology lab", styleDescription: "futurista, premium" },
  { id: "tt-1", platform: "tiktok", status: "draft", title: "POV: Tu dron vuela solo 🤯", audio: "Trending Sound - Epic Reveal", caption: "El modo autónomo del X10 es de otro nivel...", calendarDay: 5, headline: "Tu dron vuela solo", imagePrompt: "Autonomous drone POV shot", styleDescription: "dinámico, viral" },
  { id: "tt-2", platform: "tiktok", status: "draft", title: "Unboxing Drone X10 ✨", audio: "Original Sound - AeroDynamics", calendarDay: 10, headline: "Unboxing X10", imagePrompt: "Unboxing tech product dramatic lighting", styleDescription: "lifestyle, trendy" },
  { id: "li-1", platform: "linkedin", status: "draft", caption: "La tecnología del Drone X10 está redefiniendo la logística empresarial.", hashtags: ["Innovation", "Logistics"], calendarDay: 7, headline: "Redefiniendo la logística", body: "Alcance de 15km y autonomía de 45 minutos.", cta: "Solicitar demo", imagePrompt: "Enterprise logistics drone warehouse", styleDescription: "profesional, corporativo" },
  { id: "li-2", platform: "linkedin", status: "draft", caption: "Caso de éxito: Reducción de costos del 40%.", hashtags: ["CaseStudy", "ROI"], calendarDay: 14, headline: "Caso de éxito", body: "Reducción de costos operativos en un 40%.", imagePrompt: "Business infographic modern style", styleDescription: "data-driven, ejecutivo" },
];

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
const PlatformIcon = ({ platform, size = 16 }: { platform: Platform; size?: number }) => {
  if (platform === "instagram") return <Instagram size={size} />;
  if (platform === "tiktok") return <TikTokIcon size={size} />;
  return <Linkedin size={size} />;
};

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: PostStatus }) => {
  const config = {
    draft: { label: "Draft", bg: "bg-muted text-muted-foreground border-border" },
    scheduled: { label: "Scheduled", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
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
function getAspectClass(platform: string) {
  if (platform === "tiktok") return "aspect-[9/16]";
  if (platform === "linkedin") return "aspect-[1.91/1]";
  return "aspect-square";
}

/* ── Post Card ── */
const RenderedPostCard = ({ post, onEdit, onRegenerate, onDownload, onApproveStatus, isClientView }: {
  post: PostCard; onEdit: (post: PostCard) => void; onRegenerate: (post: PostCard) => void;
  onDownload: (post: PostCard) => void; onApproveStatus: (id: string) => void;
  isClientView?: boolean;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const platformGradients: Record<string, string> = {
    instagram: "from-pink-500 via-red-500 to-yellow-500",
    tiktok: "from-slate-900 to-slate-700",
    linkedin: "from-blue-600 to-blue-700",
  };
  const platformLabels: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn" };
  const aspectClass = getAspectClass(post.platform);

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] transition-all overflow-hidden group relative"
    >
      {post.isRendering ? (
        <ShimmerSkeleton aspectClass={aspectClass} />
      ) : (
        <div className={`${aspectClass} bg-secondary relative overflow-hidden`}>
          <img src={post.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          {/* Platform badge */}
          <div className="absolute top-3 left-3">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${platformGradients[post.platform]} flex items-center justify-center shadow-md`}>
              <PlatformIcon platform={post.platform} size={14} />
            </div>
          </div>
          {/* Status badge */}
          <div className="absolute top-3 right-3"><StatusBadge status={post.status} /></div>
        </div>
      )}
      {/* Info */}
      <div className="p-3 space-y-1.5">
        {post.headline && <p className="text-sm font-semibold text-foreground truncate">{post.headline}</p>}
        {(post.body || post.caption) && <p className="text-xs text-muted-foreground line-clamp-2">{post.body || post.caption}</p>}
        {post.scheduledAt && <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium"><Calendar size={12} /> {post.scheduledAt}</div>}
        {/* Action bar */}
        {!isClientView && !post.isRendering && (
          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
            <button onClick={() => onEdit(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Editar">
              <Edit3 size={12} /> Editar
            </button>
            <button onClick={() => onRegenerate(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Regenerar">
              <RefreshCw size={12} /> Regenerar
            </button>
            <button onClick={() => onDownload(post)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Descargar">
              <Download size={12} />
            </button>
            <button onClick={() => onApproveStatus(post.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-emerald-400 hover:bg-secondary transition-colors ml-auto" title="Aprobar">
              <CheckCircle2 size={12} /> Aprobar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Mini Card for Calendar ── */
const MiniPostCard = ({ post }: { post: PostCard }) => {
  const platformColors = { instagram: "from-pink-500 via-red-500 to-yellow-500", tiktok: "from-slate-900 to-slate-700", linkedin: "from-blue-600 to-blue-700" };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-md overflow-hidden bg-secondary shrink-0"><img src={post.image} alt="" className="w-full h-full object-cover" /></div>
      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${platformColors[post.platform]} flex items-center justify-center`}><PlatformIcon platform={post.platform} size={10} /></div>
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
      setFormat(getFormatFromPlatform(post.platform));
      setPreviewImage(post.image || null);
    }
  }, [post]);

  const handleRegenerate = async () => {
    if (!post) return;
    setIsRegenerating(true);
    // Mock render
    const dims = getDimensionsFromFormat(format);
    const color = brand.primary_color.replace("#", "");
    await new Promise(r => setTimeout(r, 4000));
    const newImage = `https://placehold.co/${dims.w}x${dims.h}/${color}/white?text=${encodeURIComponent(headline || "Post")}`;
    setPreviewImage(newImage);
    setIsRegenerating(false);
  };

  const handleSave = () => {
    if (!post) return;
    onSave({
      ...post,
      headline, body, cta, imagePrompt, styleDescription,
      image: previewImage || post.image,
    });
    onClose();
  };

  if (!post) return null;

  const formatLabel: Record<string, string> = {
    instagram_feed: "1080 × 1080 — Instagram Feed",
    instagram_story: "1080 × 1920 — Instagram Story",
    facebook_post: "1200 × 630 — Facebook Post",
    linkedin_post: "1200 × 627 — LinkedIn Post",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl bg-card border-border p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] min-h-[600px]">
          {/* Left - Edit */}
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
                  <SelectItem value="instagram_feed">Instagram Feed</SelectItem>
                  <SelectItem value="instagram_story">Instagram Story</SelectItem>
                  <SelectItem value="facebook_post">Facebook Post</SelectItem>
                  <SelectItem value="linkedin_post">LinkedIn Post</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleRegenerate} disabled={isRegenerating} className="w-full h-11 bg-gradient-to-r from-violet-600 to-primary text-white font-semibold">
              {isRegenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Regenerando...</> : <><Sparkles size={16} className="mr-2" /> ✨ Regenerar Post</>}
            </Button>
          </div>

          {/* Right - Preview */}
          <div className="bg-secondary/30 p-6 flex flex-col items-center justify-center">
            <div className={`w-full max-w-md rounded-xl overflow-hidden border border-border bg-secondary ${
              format === "instagram_story" ? "aspect-[9/16] max-h-[480px]" : format.includes("linkedin") || format.includes("facebook") ? "aspect-[1.91/1]" : "aspect-square"
            }`}>
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

  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isClientView, setIsClientView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [brandAssetBlobs, setBrandAssetBlobs] = useState<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platforms, setPlatforms] = useState({ instagram: true, tiktok: true, linkedin: false, twitter: false });
  const [frequency, setFrequency] = useState("3-week");
  const [objective, setObjective] = useState("engagement");
  const [optionsPerPost, setOptionsPerPost] = useState(2);
  
  const [adFormat, setAdFormat] = useState<"mobile_screen" | "watermark" | "merch">("merch");
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("auto");
  const [campaignBrief, setCampaignBrief] = useState<{ description: string; tone: string; extras: string; isComplete: boolean }>({ description: "", tone: "", extras: "", isComplete: false });
  const [brand, setBrand] = useState<BrandProfile>(() => loadBrand(id));
  const [editingPost, setEditingPost] = useState<PostCard | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [brandDetected, setBrandDetected] = useState(() => {
    try { return !!localStorage.getItem(getBrandStorageKey(id)); } catch { return false; }
  });

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

  // Brand analysis — real API call
  const analyzeBrand = useCallback(async (logoB64: string) => {
    setIsAnalyzingBrand(true);
    setBrandDetected(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/brand/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_b64: logoB64 }),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      if (!data.palette || !data.primary_color) {
        throw new Error("Respuesta incompleta de la API");
      }
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
      toast({ title: "✨ Marca analizada", description: "Colores y tipografía detectados desde tu logo." });
    } catch (error) {
      console.error("Error analyzing brand:", error);
      setIsAnalyzingBrand(false);
      setBrandDetected(false);
      toast({
        title: "⚠️ No se pudo analizar el logo",
        description: "Configura los colores manualmente o intenta de nuevo.",
        variant: "destructive",
      });
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

    // Auto-analyze brand from logo
    const reader = new FileReader();
    reader.onloadend = () => { analyzeBrand(reader.result as string); };
    reader.readAsDataURL(file);
  }, [analyzeBrand]);

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // Mock render for a single post
  const mockRenderPost = useCallback(async (post: PostCard): Promise<string> => {
    const format = getFormatFromPlatform(post.platform);
    const dims = getDimensionsFromFormat(format);
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
    const color = brand.primary_color.replace("#", "");
    return `https://placehold.co/${dims.w}x${dims.h}/${color}/white?text=${encodeURIComponent(post.headline || "Post")}`;
  }, [brand]);

  // Real render (with fallback to mock)
  const renderPost = useCallback(async (post: PostCard, logoB64: string | undefined): Promise<string> => {
    try {
      const res = await fetch("https://loaded-roles-behavior-mystery.trycloudflare.com/api/v1/posts/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: getFormatFromPlatform(post.platform),
          brand: {
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
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rendered_post) return data.rendered_post;
        if (data.image) return data.image;
      }
    } catch {}
    return mockRenderPost(post);
  }, [brand, mockRenderPost]);

  // Mock copy generators
  const mockHeadlines = ["Descubre lo nuevo", "Tu próxima obsesión", "Hecho para ti", "Eleva tu estilo", "Sin límites", "Empieza hoy", "Lo que esperabas", "Nuevo lanzamiento", "Solo por tiempo limitado", "Transforma tu día", "Más que un producto", "Vive diferente"];
  const mockBodies = ["Una experiencia que no te puedes perder", "Diseñado con pasión, creado para ti", "Calidad que se nota desde el primer momento", "Porque mereces lo mejor, siempre"];
  const mockCtas = ["Compra ahora →", "Descúbrelo →", "Ver más →", "Reserva el tuyo →", "Shop now →", "Explora →"];

  const getFrequencyCount = (f: string) => ({ "3-week": 3, "5-week": 5, "daily": 7 }[f] || 3);

  const handleGenerateParrilla = useCallback(async () => {
    setIsGenerating(true);
    setGeneratingStatus("⚡ Preparando parrilla...");

    const activePlatforms = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
    const postsPerPlatform = getFrequencyCount(frequency) * optionsPerPost;
    const totalPosts = activePlatforms.length * postsPerPlatform;

    let contextImage: string | undefined;
    if (brandAssetBlobs.length > 0) {
      contextImage = await blobToBase64(brandAssetBlobs[0]);
    }

    // Create skeleton posts immediately
    const skeletonPosts: PostCard[] = [];
    for (let i = 0; i < totalPosts; i++) {
      const platIdx = i % activePlatforms.length;
      const platform = activePlatforms[platIdx] as Platform;
      skeletonPosts.push({
        id: `gen-${Date.now()}-${i}`,
        platform,
        status: "draft",
        headline: mockHeadlines[i % mockHeadlines.length],
        body: mockBodies[i % mockBodies.length],
        cta: mockCtas[i % mockCtas.length],
        imagePrompt: `${campaignBrief.description}, ${campaignBrief.tone} style`,
        styleDescription: campaignBrief.tone || "profesional y moderno",
        templateId: selectedTemplate,
        calendarDay: (i * 2) + 1,
        isRendering: true,
      });
    }

    setPosts(skeletonPosts);
    setHasGenerated(true);

    // Render sequentially
    for (let i = 0; i < skeletonPosts.length; i++) {
      setGeneratingStatus(`🎨 Generando post ${i + 1} de ${totalPosts}...`);
      const renderedImage = await renderPost(skeletonPosts[i], contextImage);
      setPosts(prev => prev.map(p =>
        p.id === skeletonPosts[i].id ? { ...p, image: renderedImage, isRendering: false } : p
      ));
    }

    toast({ title: "🚀 Parrilla generada", description: `${totalPosts} posts generados exitosamente.` });
    setIsGenerating(false);
    setGeneratingStatus("");
  }, [platforms, frequency, optionsPerPost, brandAssetBlobs, blobToBase64, selectedTemplate, campaignBrief, renderPost]);

  const handleBriefComplete = useCallback((brief: { description: string; tone: string; extras: string; isComplete: boolean }) => {
    setCampaignBrief(brief);
  }, []);

  const canGenerate = brandDetected && campaignBrief.isComplete && Object.values(platforms).some(v => v);

  const togglePlatform = (key: keyof typeof platforms) => setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleApprovePost = useCallback((id: string) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "scheduled" as PostStatus } : p)); toast({ title: "✅ Post aprobado" }); }, []);
  const handleRequestChanges = useCallback((id: string) => { toast({ title: "📝 Cambios solicitados" }); }, []);
  const handleExportCSV = () => { toast({ title: "📊 CSV Exportado" }); };
  const handleApproveAll = () => { setPosts(prev => prev.map(p => ({ ...p, status: "scheduled" as PostStatus }))); toast({ title: "✅ Todo aprobado" }); };

  const handleEditPost = useCallback((post: PostCard) => { setEditingPost(post); }, []);

  const handleSavePost = useCallback((updatedPost: PostCard) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    toast({ title: "💾 Post actualizado" });
  }, []);

  const handleRegenerateSingle = useCallback(async (post: PostCard) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isRendering: true } : p));
    let logoB64: string | undefined;
    if (brandAssetBlobs.length > 0) logoB64 = await blobToBase64(brandAssetBlobs[0]);
    const newImage = await renderPost(post, logoB64);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, image: newImage, isRendering: false } : p));
    toast({ title: "✨ Post regenerado" });
  }, [brandAssetBlobs, blobToBase64, renderPost]);

  const handleDownloadPost = useCallback((post: PostCard) => {
    if (!post.image) return;
    const a = document.createElement("a");
    a.href = post.image;
    a.download = `post-${post.id}.png`;
    a.click();
  }, []);

  const platformPosts = posts.filter((p) => p.platform === activePlatform);

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
              <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${isClientView ? "bg-violet-500/20 border-violet-500/40" : "bg-secondary border-border"}`}>
                <Eye size={16} className={isClientView ? "text-violet-400" : "text-muted-foreground"} />
                <span className={`text-sm font-medium ${isClientView ? "text-violet-300" : "text-muted-foreground"}`}>Modo Cliente</span>
                <Switch checked={isClientView} onCheckedChange={setIsClientView} className="data-[state=checked]:bg-violet-500" />
              </div>
              <div className="w-px h-8 bg-border" />
              <Button variant="outline" onClick={handleExportCSV} className="gap-2 text-sm h-9 border-border text-muted-foreground hover:text-foreground"><Download size={14} /> CSV</Button>
              <Button onClick={handleApproveAll} className="gap-2 text-sm h-9 bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 size={14} /> Aprobar Todo</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Brand Assets */}
        <AnimatePresence>
          {!isClientView && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }}
              className="bg-card border-r border-border p-5 flex flex-col overflow-y-auto shrink-0"
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

              {/* Upload */}
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
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />


              {/* ── Brand Intelligence: 3-State Flow ── */}

              {/* State 1: No logo — hint */}
              {brandAssets.length === 0 && !isAnalyzingBrand && !brandDetected && (
                <p className="text-xs text-muted-foreground text-center py-4 px-2 italic">
                  Sube tu logo para detectar automáticamente los colores de tu marca
                </p>
              )}

              {/* State 2: Analyzing */}
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

              {/* State 3: Detection complete */}
              {brandDetected && !isAnalyzingBrand && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-4 space-y-4">
                  {/* Palette */}
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

                  {/* Typography */}
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
                </motion.div>
              )}

              {/* Ad Format */}
              {brandAssets.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formato de Anuncio</p>
                  <Select value={adFormat} onValueChange={(v) => setAdFormat(v as any)}>
                    <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merch">👕 Mercancía</SelectItem>
                      <SelectItem value="watermark">💧 Marca de Agua</SelectItem>
                      <SelectItem value="mobile_screen">📱 Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Processed assets */}
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assets procesados</p>
                <div className="grid grid-cols-2 gap-3">
                  {brandAssets.map((src, i) => (
                    <div key={i} className="relative group">
                      <CheckerboardBg className="aspect-square rounded-xl overflow-hidden border border-border shadow-sm">
                        <img src={src} alt="" className="w-full h-full object-contain p-2" />
                      </CheckerboardBg>
                      <a href={src} download={`asset-${i}.png`}
                        className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                      ><Download size={12} className="text-foreground" /></a>
                    </div>
                  ))}
                  {brandAssets.length === 0 && <p className="col-span-2 text-xs text-muted-foreground text-center py-6">Sin assets aún</p>}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Agent Section */}
          <AnimatePresence>
            {!isClientView && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                className="bg-card border-b border-border p-5 overflow-hidden"
              >
                <div className="max-w-6xl mx-auto">
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
                    <CreativeAgentChat onBriefComplete={handleBriefComplete} isGenerating={isGenerating} brandDetected={brandDetected} brandPalette={brand.palette} brandFont={brand.font_family} platforms={platforms} frequency={frequency} objective={objective} generatingStatus={generatingStatus} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Platforms */}
                    <div className="lg:col-span-4 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plataformas</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: "instagram" as const, label: "Instagram", icon: Instagram, gradient: "from-pink-500 via-red-500 to-yellow-500", emoji: "📸" },
                          { key: "tiktok" as const, label: "TikTok", icon: TikTokIcon, gradient: "from-slate-900 to-slate-700", emoji: "🎵" },
                          { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, gradient: "from-blue-600 to-blue-700", emoji: "💼" },
                          { key: "twitter" as const, label: "X / Twitter", icon: Twitter, gradient: "from-slate-800 to-slate-900", emoji: "🐦" },
                        ].map((p) => (
                          <button key={p.key} onClick={() => togglePlatform(p.key)}
                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              platforms[p.key] ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-md`}>
                              <p.icon size={16} className="text-white" />
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

                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Frecuencia</p>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-secondary/50 border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-week">3/semana</SelectItem>
                          <SelectItem value="5-week">5/semana</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Objetivo</p>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger className="bg-secondary/50 border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement"><div className="flex items-center gap-2"><Heart size={14} className="text-pink-500" /> Engagement</div></SelectItem>
                          <SelectItem value="conversion"><div className="flex items-center gap-2"><Target size={14} className="text-emerald-500" /> Conversión</div></SelectItem>
                          <SelectItem value="awareness"><div className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> Awareness</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Template</p>
                      <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateId)}>
                        <SelectTrigger className="bg-secondary/50 border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}><div className="flex items-center gap-2">{t.icon} {t.name}</div></SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Opciones</p>
                      <div className="flex items-center gap-2">
                        <Select value={String(optionsPerPost)} onValueChange={(v) => setOptionsPerPost(Number(v))}>
                          <SelectTrigger className="bg-secondary/50 border-border h-11 w-16"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="relative group/gen">
                          <Button onClick={handleGenerateParrilla}
                            disabled={isGenerating || !canGenerate}
                            className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-primary hover:from-violet-700 hover:via-purple-700 hover:to-primary/80 shadow-lg shadow-primary/25 disabled:opacity-50 text-white"
                          >
                            {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> {generatingStatus || "Generando..."}</> : <><Zap size={16} className="mr-2" /> Generar 🚀</>}
                          </Button>
                          {!canGenerate && !isGenerating && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover/gen:opacity-100 transition-opacity pointer-events-none shadow-lg">
                              {!brandDetected ? "Sube tu logo primero" : !campaignBrief.isComplete ? "Completa el brief con Nano Banano" : "Selecciona al menos 1 plataforma"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {hasGenerated ? (
              <>
                <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)} className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                    <TabsList className="h-11 p-1 bg-secondary">
                      <TabsTrigger value="instagram" className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <Instagram size={14} /> Instagram
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter(p => p.platform === "instagram").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="tiktok" className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <TikTokIcon size={14} /> TikTok
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter(p => p.platform === "tiktok").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <Linkedin size={14} /> LinkedIn
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter(p => p.platform === "linkedin").length}</Badge>
                      </TabsTrigger>
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
                    <>
                      {(["instagram", "tiktok", "linkedin"] as Platform[]).map((plat) => (
                        <TabsContent key={plat} value={plat} className="flex-1 overflow-auto p-6 mt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <AnimatePresence>
                              {platformPosts.map((post) => (
                                <RenderedPostCard key={post.id} post={post}
                                  onEdit={handleEditPost} onRegenerate={handleRegenerateSingle}
                                  onDownload={handleDownloadPost} onApproveStatus={handleApprovePost}
                                  isClientView={isClientView}
                                />
                              ))}
                            </AnimatePresence>
                            {platformPosts.length === 0 && (
                              <div className="col-span-full py-20 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                                Sin posts para esta plataforma
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      ))}
                    </>
                  ) : (
                    <div className="flex-1 overflow-auto"><CalendarView posts={posts} /></div>
                  )}
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
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
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      <EditPostModal post={editingPost} open={!!editingPost} onClose={() => setEditingPost(null)} onSave={handleSavePost} brand={brand} />

    </div>
  );
};

export default Parrilla;
