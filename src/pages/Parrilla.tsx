import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { removeBackground } from "@imgly/background-removal";
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

const mockBrandAnalysis = {
  primary_color: "#E63946",
  secondary_color: "#1D3557",
  accent_color: "#F1FAEE",
  palette: ["#E63946", "#1D3557", "#F1FAEE", "#A8DADC", "#457B9D"],
  background_suggestion: "dark",
  contrast_color: "#FFFFFF",
  suggested_fonts: ["Montserrat", "Poppins", "Inter"],
};

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platforms, setPlatforms] = useState({ instagram: true, tiktok: true, linkedin: false, twitter: false });
  const [frequency, setFrequency] = useState("3-week");
  const [objective, setObjective] = useState("engagement");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [optionsPerPost, setOptionsPerPost] = useState(2);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [adFormat, setAdFormat] = useState<"mobile_screen" | "watermark" | "merch">("merch");
  const [agentPrompt, setAgentPrompt] = useState<string | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("auto");
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

  // Brand analysis (mock or real)
  const analyzeBrand = useCallback(async (logoB64: string) => {
    setIsAnalyzingBrand(true);
    try {
      // Try real API first
      const res = await fetch("https://loaded-roles-behavior-mystery.trycloudflare.com/api/v1/brand/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_b64: logoB64 }),
      });
      if (res.ok) {
        const data = await res.json();
        const newBrand: BrandProfile = {
          primary_color: data.primary_color || mockBrandAnalysis.primary_color,
          secondary_color: data.secondary_color || mockBrandAnalysis.secondary_color,
          accent_color: data.accent_color || mockBrandAnalysis.accent_color,
          palette: data.palette || mockBrandAnalysis.palette,
          contrast_color: data.contrast_color || mockBrandAnalysis.contrast_color,
          font_family: data.suggested_fonts?.[0] || brand.font_family,
          suggested_fonts: data.suggested_fonts || mockBrandAnalysis.suggested_fonts,
          background_suggestion: data.background_suggestion || "dark",
        };
        setBrand(newBrand);
        setBrandDetected(true);
        toast({ title: "✨ Marca analizada", description: "Colores y tipografía detectados desde tu logo." });
        return;
      }
    } catch {}
    // Fallback: mock
    await new Promise(r => setTimeout(r, 2000));
    const newBrand: BrandProfile = {
      ...DEFAULT_BRAND,
      ...mockBrandAnalysis,
      font_family: mockBrandAnalysis.suggested_fonts[0],
    };
    setBrand(newBrand);
    setBrandDetected(true);
    toast({ title: "✨ Marca analizada", description: "Colores y tipografía detectados desde tu logo." });
    setIsAnalyzingBrand(false);
  }, [brand.font_family]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Máximo 10MB.", variant: "destructive" });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProcessingImage(previewUrl);
    setIsProcessing(true);
    e.target.value = "";

    let processedBlob: Blob = file;
    let processedUrl = previewUrl;

    try {
      if (autoRemoveBg) {
        const resultBlob = await removeBackground(file);
        processedUrl = URL.createObjectURL(resultBlob);
        processedBlob = resultBlob;
        toast({ title: "✨ ¡Producto aislado con éxito!", description: "Fondo removido exitosamente." });
      } else {
        toast({ title: "✅ Asset cargado", description: "Imagen agregada sin procesar." });
      }
    } catch (err: any) {
      console.error("background-removal error:", err);
      toast({ title: "Error al procesar imagen", description: "La imagen original fue conservada.", variant: "destructive" });
    } finally {
      setBrandAssets((prev) => [...prev, processedUrl]);
      setBrandAssetBlobs((prev) => [...prev, processedBlob]);
      setIsProcessing(false);
      setProcessingImage(null);
    }

    // Auto-analyze brand from logo
    const reader = new FileReader();
    reader.onloadend = () => { analyzeBrand(reader.result as string); };
    reader.readAsDataURL(processedBlob);
  }, [autoRemoveBg, analyzeBrand]);

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

  const handleGenerateWithPrompt = useCallback(async (promptOverride?: string) => {
    setIsGenerating(true);
    setGeneratingStatus("🔗 Conectando con Vertex AI...");

    const activePlatforms = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
    const finalPrompt = promptOverride || agentPrompt || customPrompt.trim() || `Genera contenido para ${activePlatforms.join(", ")}. Frecuencia: ${frequency}. Objetivo: ${objective}.`;

    let contextImage: string | undefined;
    if (brandAssetBlobs.length > 0) {
      contextImage = await blobToBase64(brandAssetBlobs[0]);
    }

    try {
      setGeneratingStatus("🧠 Enviando prompt a Vertex AI...");
      const res = await fetch("https://loaded-roles-behavior-mystery.trycloudflare.com/api/v1/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, context_image: contextImage || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setGeneratingStatus("🎨 Renderizando posts...");

      let rawPosts: PostCard[] = [];
      if (data?.posts && Array.isArray(data.posts)) {
        rawPosts = data.posts.map((post: any, idx: number) => ({
          id: `gen-${Date.now()}-${idx}`,
          platform: post.platform || activePlatforms[idx % activePlatforms.length] as Platform,
          status: "draft" as PostStatus,
          headline: post.headline || post.title || "",
          body: post.body || post.caption || "",
          cta: post.cta || "",
          caption: post.caption || "",
          imagePrompt: post.image_prompt || finalPrompt,
          styleDescription: post.style || "profesional y moderno",
          templateId: selectedTemplate,
          hashtags: post.hashtags || [],
          calendarDay: post.calendarDay || (idx * 3) + 1,
          isRendering: true,
        }));
      } else {
        rawPosts = MOCK_POSTS.filter((p) => platforms[p.platform as keyof typeof platforms]).map((p, idx) => ({
          ...p,
          id: `gen-${Date.now()}-${idx}`,
          templateId: selectedTemplate,
          isRendering: true,
        }));
      }

      // Show cards immediately with rendering state
      setPosts(rawPosts);
      setHasGenerated(true);

      // Render posts sequentially
      const logoB64 = contextImage;
      for (let i = 0; i < rawPosts.length; i++) {
        setGeneratingStatus(`🎨 Renderizando post ${i + 1} de ${rawPosts.length}...`);
        const renderedImage = await renderPost(rawPosts[i], logoB64);
        setPosts(prev => prev.map((p, idx) =>
          p.id === rawPosts[i].id ? { ...p, image: renderedImage, isRendering: false } : p
        ));
      }

      toast({ title: "🚀 Parrilla generada", description: "Contenido generado y renderizado exitosamente." });
    } catch (err: any) {
      console.error("Generation error:", err);
      const fallbackPosts = MOCK_POSTS.filter((p) => platforms[p.platform as keyof typeof platforms]).map((p, idx) => ({
        ...p,
        id: `gen-${Date.now()}-${idx}`,
        templateId: selectedTemplate,
        isRendering: true,
      }));
      setPosts(fallbackPosts);
      setHasGenerated(true);

      const logoB64 = contextImage;
      for (let i = 0; i < fallbackPosts.length; i++) {
        const img = await renderPost(fallbackPosts[i], logoB64);
        setPosts(prev => prev.map(p => p.id === fallbackPosts[i].id ? { ...p, image: img, isRendering: false } : p));
      }
      toast({ title: "⚠️ Error de API", description: `${err?.message || "Error desconocido"} — Datos demo cargados.`, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  }, [platforms, optionsPerPost, customPrompt, agentPrompt, frequency, objective, brandAssetBlobs, adFormat, selectedTemplate, brand, renderPost, blobToBase64]);

  const handleAgentReady = useCallback((payload: { prompt: string; brandContext: string; audience: string; style: string }) => {
    setAgentPrompt(payload.prompt);
    handleGenerateWithPrompt(payload.prompt);
  }, [handleGenerateWithPrompt]);

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

              <div className="flex items-center justify-between mb-4 px-1">
                <label htmlFor="auto-remove-bg" className="text-xs font-medium text-muted-foreground cursor-pointer">Remover Fondo</label>
                <Switch id="auto-remove-bg" checked={autoRemoveBg} onCheckedChange={setAutoRemoveBg} className="data-[state=checked]:bg-primary" />
              </div>

              {/* Brand Analysis Results */}
              {isAnalyzingBrand && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Analizando tu marca...</p>
                  </div>
                  {/* Shimmer placeholders */}
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
                    ))}
                  </div>
                  <div className="h-9 bg-secondary rounded-lg animate-pulse" />
                </motion.div>
              )}

              {brandDetected && !isAnalyzingBrand && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-4">
                  {/* Detected Colors */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette size={14} className="text-muted-foreground" />
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Colores detectados</p>
                      </div>
                      <p className="text-[9px] text-primary">Detectados desde tu logo ✨</p>
                    </div>
                    {/* Palette row */}
                    <div className="flex items-center gap-2">
                      {brand.palette.map((color, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }} className="relative group/color">
                          <label className="cursor-pointer">
                            <input type="color" value={color} onChange={(e) => {
                              const newPalette = [...brand.palette];
                              newPalette[i] = e.target.value;
                              const updates: Partial<BrandProfile> = { palette: newPalette };
                              if (i === 0) updates.primary_color = e.target.value;
                              if (i === 1) updates.secondary_color = e.target.value;
                              if (i === 2) updates.accent_color = e.target.value;
                              setBrand(prev => ({ ...prev, ...updates }));
                            }} className="sr-only" />
                            <div className="w-8 h-8 rounded-full border-2 border-border hover:border-primary transition-colors shadow-sm hover:scale-110"
                              style={{ backgroundColor: color }} />
                          </label>
                        </motion.div>
                      ))}
                    </div>
                    {/* Labels for first 3 */}
                    <div className="flex gap-2">
                      {["Primario", "Secundario", "Acento"].map((label, i) => (
                        <div key={label} className="flex-1 text-center">
                          <div className="w-4 h-4 rounded-full mx-auto mb-0.5 border border-border" style={{ backgroundColor: brand.palette[i] }} />
                          <p className="text-[9px] text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Font */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Type size={14} className="text-muted-foreground" />
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tipografía sugerida</p>
                    </div>
                    <Select value={brand.font_family} onValueChange={(v) => setBrand(prev => ({ ...prev, font_family: v }))}>
                      <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {brand.suggested_fonts.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {/* Font preview */}
                    <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border">
                      <p className="text-lg text-foreground" style={{ fontFamily: brand.font_family }}>Aa Bb Cc</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{brand.font_family}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Manual colors if no detection yet */}
              {!brandDetected && !isAnalyzingBrand && (
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-muted-foreground" />
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Colores de Marca</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-muted-foreground">Primario</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={brand.primary_color} onChange={(e) => setBrand(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                        <span className="text-[10px] text-muted-foreground font-mono">{brand.primary_color}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-muted-foreground">Secundario</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={brand.secondary_color} onChange={(e) => setBrand(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                        <span className="text-[10px] text-muted-foreground font-mono">{brand.secondary_color}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Type size={14} className="text-muted-foreground" />
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tipografía</p>
                    </div>
                    <Select value={brand.font_family} onValueChange={(v) => setBrand(prev => ({ ...prev, font_family: v }))}>
                      <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Montserrat", "Inter", "Poppins", "Playfair Display", "Roboto"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                    <CreativeAgentChat onPromptReady={handleAgentReady} isGenerating={isGenerating} hasContextImage={brandAssetBlobs.length > 0} generatingStatus={generatingStatus} />
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
                        <Button onClick={() => handleGenerateWithPrompt()}
                          disabled={isGenerating || (!platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.twitter)}
                          className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-primary hover:from-violet-700 hover:via-purple-700 hover:to-primary/80 shadow-lg shadow-primary/25 disabled:opacity-50 text-white"
                        >
                          {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Procesando...</> : <><Zap size={16} className="mr-2" /> Generar 🚀</>}
                        </Button>
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

      {/* Processing Modal */}
      <AnimatePresence>
        {isProcessing && processingImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl border border-border"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-secondary">
                <img src={processingImage} alt="" className="w-full h-full object-cover" />
                <motion.div initial={{ top: 0 }} animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-lg shadow-primary/50"
                  style={{ boxShadow: "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)" }}
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <Loader2 size={20} className="animate-spin text-primary" />
                <p className="text-foreground font-semibold">✨ Aislando producto con IA local...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Parrilla;
