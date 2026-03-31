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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

interface BrandProfile {
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

const TEMPLATES: { id: TemplateId; name: string; icon: string; description: string }[] = [
  { id: "auto", name: "Auto", icon: "🎯", description: "Elige automáticamente" },
  { id: "bold-center", name: "Bold Center", icon: "⬛", description: "Headline centrado" },
  { id: "split-left", name: "Split Left", icon: "◧", description: "Panel izquierdo" },
  { id: "minimal-bottom", name: "Minimal Bottom", icon: "▬", description: "Barra inferior" },
  { id: "card-overlay", name: "Card Overlay", icon: "▣", description: "Card flotante" },
];

const FONT_OPTIONS = ["Montserrat", "Inter", "Poppins", "Playfair Display", "Roboto"];

const BRAND_STORAGE_KEY = "nexus_parrilla_brand";

function loadBrand(): BrandProfile {
  try {
    const saved = localStorage.getItem(BRAND_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { primary_color: "#FF6B35", secondary_color: "#004E89", font_family: "Montserrat" };
}

function saveBrand(b: BrandProfile) {
  localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(b));
}

function getFormatFromPlatform(platform: string) {
  const map: Record<string, string> = {
    instagram: "instagram_feed",
    tiktok: "instagram_story",
    linkedin: "linkedin_post",
    twitter: "facebook_post",
  };
  return map[platform] || "instagram_feed";
}

function getDimensionsFromPlatform(platform: string): [number, number] {
  const map: Record<string, [number, number]> = {
    instagram: [1080, 1080],
    tiktok: [1080, 1920],
    linkedin: [1200, 627],
    twitter: [1200, 630],
  };
  return map[platform] || [1080, 1080];
}

/* ── Mock Data ── */
const MOCK_POSTS: PostCard[] = [
  { id: "ig-1", platform: "instagram", status: "draft", image: "/placeholder.svg", caption: "Libertad sin límites. El Drone X10 redefine lo que significa volar. ✈️ #DroneX10 #AeroDynamics #Innovation", hashtags: ["DroneX10", "AeroDynamics", "Innovation", "Tech"], calendarDay: 3, headline: "Libertad sin límites", body: "El Drone X10 redefine lo que significa volar.", cta: "Descúbrelo ahora", imagePrompt: "Drone flying over mountains at sunset" },
  { id: "ig-2", platform: "instagram", status: "scheduled", image: "/placeholder.svg", caption: "Captura momentos imposibles con precisión milimétrica. 📸 #Drones #Photography", scheduledAt: "2025-07-15 10:00", hashtags: ["Drones", "Photography"], calendarDay: 8, headline: "Momentos imposibles", body: "Precisión milimétrica.", cta: "Comprar", imagePrompt: "Aerial photography drone" },
  { id: "ig-3", platform: "instagram", status: "published", image: "/placeholder.svg", caption: "El futuro de la fotografía aérea ya llegó. 🚀 #AeroX10", hashtags: ["AeroX10"], calendarDay: 12, headline: "El futuro llegó", body: "Fotografía aérea de nueva generación.", imagePrompt: "Futuristic drone technology" },
  { id: "tt-1", platform: "tiktok", status: "draft", image: "/placeholder.svg", title: "POV: Tu dron vuela solo 🤯", audio: "Trending Sound - Epic Reveal", caption: "El modo autónomo del X10 es de otro nivel...", calendarDay: 5, headline: "Tu dron vuela solo", imagePrompt: "Autonomous drone POV" },
  { id: "tt-2", platform: "tiktok", status: "scheduled", image: "/placeholder.svg", title: "Unboxing Drone X10 ✨", audio: "Original Sound - AeroDynamics", scheduledAt: "2025-07-16 18:00", calendarDay: 10, headline: "Unboxing X10", imagePrompt: "Unboxing tech product" },
  { id: "tt-3", platform: "tiktok", status: "published", image: "/placeholder.svg", title: "3 trucos PRO con tu X10", audio: "Viral Beat 2025", calendarDay: 17, headline: "Trucos PRO", imagePrompt: "Drone tricks compilation" },
  { id: "li-1", platform: "linkedin", status: "draft", image: "/placeholder.svg", caption: "La tecnología del Drone X10 está redefiniendo la logística empresarial.", hashtags: ["Innovation", "Logistics", "Technology", "FutureOfWork"], calendarDay: 7, headline: "Redefiniendo la logística", body: "Alcance de 15km y autonomía de 45 minutos.", cta: "Solicitar demo", imagePrompt: "Enterprise logistics drone" },
  { id: "li-2", platform: "linkedin", status: "scheduled", image: "/placeholder.svg", caption: "Caso de éxito: Cómo el Drone X10 redujo costos operativos en un 40%.", scheduledAt: "2025-07-17 09:00", hashtags: ["CaseStudy", "ROI", "Drones"], calendarDay: 14, headline: "Caso de éxito", body: "Reducción de costos del 40%.", imagePrompt: "Business case study infographic" },
  { id: "li-3", platform: "linkedin", status: "published", image: "/placeholder.svg", caption: "Orgullosos de anunciar nuestra alianza estratégica con TechCorp.", hashtags: ["Partnership", "Growth"], calendarDay: 21, headline: "Alianza estratégica", body: "TechCorp + AeroDynamics.", imagePrompt: "Corporate partnership handshake" },
];

/* ── TikTok Icon ── */
const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

/* ── Checkerboard Pattern for Transparent PNG ── */
const CheckerboardBg = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`relative ${className}`}
    style={{
      backgroundImage: `linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)`,
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      backgroundColor: "hsl(var(--card))",
    }}
  >
    {children}
  </div>
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
    draft: { label: "Borrador", bg: "bg-muted text-muted-foreground border-border" },
    scheduled: { label: "Agendado", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    published: { label: "Publicado", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  };
  const c = config[status];
  return <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${c.bg}`}>{c.label}</Badge>;
};

/* ── Client Approval Buttons ── */
const ClientApprovalButtons = ({ postId, onApprove, onRequestChanges }: { postId: string; onApprove: (id: string) => void; onRequestChanges: (id: string) => void }) => (
  <div className="flex gap-2 pt-3 border-t border-border">
    <Button onClick={() => onApprove(postId)} size="sm" className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-semibold">
      <Check size={16} /> Aprobar
    </Button>
    <Button onClick={() => onRequestChanges(postId)} size="sm" variant="outline" className="flex-1 h-10 border-border text-muted-foreground hover:bg-secondary gap-2 font-semibold">
      <MessageCircle size={16} /> Cambios
    </Button>
  </div>
);

/* ── Post Card with Actions ── */
const RenderedPostCard = ({ post, onEdit, onChangeTemplate, onDownload, onApproveStatus, isClientView, onApprove, onRequestChanges }: {
  post: PostCard; onEdit: (post: PostCard) => void; onChangeTemplate: (post: PostCard, templateId: TemplateId) => void;
  onDownload: (post: PostCard) => void; onApproveStatus: (id: string) => void;
  isClientView?: boolean; onApprove?: (id: string) => void; onRequestChanges?: (id: string) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const platformColors: Record<string, string> = {
    instagram: "from-pink-500 via-red-500 to-yellow-500",
    tiktok: "from-slate-900 to-slate-700",
    linkedin: "from-blue-600 to-blue-700",
  };
  const platformLabels: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn" };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-shadow overflow-hidden group relative"
    >
      {/* Image */}
      <div className={`${post.platform === "tiktok" ? "aspect-[9/16] max-h-[280px]" : post.platform === "linkedin" ? "aspect-[1.91/1]" : "aspect-square"} bg-secondary relative overflow-hidden`}>
        <img src={post.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${platformColors[post.platform]} flex items-center justify-center`}>
            <PlatformIcon platform={post.platform} size={14} />
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <StatusBadge status={post.status} />
          {!isClientView && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={14} className="text-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-50 py-1">
                  <button onClick={() => { onEdit(post); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                    <Edit3 size={14} /> Editar
                  </button>
                  <div className="relative group/template">
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                      <Layers size={14} /> Cambiar template
                    </button>
                    <div className="absolute left-full top-0 w-44 bg-card border border-border rounded-xl shadow-xl py-1 hidden group-hover/template:block">
                      {TEMPLATES.filter(t => t.id !== "auto").map(t => (
                        <button key={t.id} onClick={() => { onChangeTemplate(post, t.id); setShowMenu(false); }}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary transition-colors ${post.templateId === t.id ? "text-primary" : "text-foreground"}`}>
                          {t.icon} {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { onDownload(post); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                    <Download size={14} /> Descargar
                  </button>
                  <button onClick={() => { onApproveStatus(post.id); setShowMenu(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-400 hover:bg-secondary transition-colors">
                    <CheckCircle2 size={14} /> Aprobar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Info */}
      <div className="p-4 space-y-2">
        {post.headline && <p className="text-sm font-semibold text-foreground truncate">{post.headline}</p>}
        {(post.body || post.caption) && <p className="text-xs text-muted-foreground line-clamp-2">{post.body || post.caption}</p>}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{platformLabels[post.platform]}</Badge>
          {post.templateId && post.templateId !== "auto" && (
            <Badge variant="secondary" className="text-[10px]">{TEMPLATES.find(t => t.id === post.templateId)?.name}</Badge>
          )}
        </div>
        {post.scheduledAt && <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium"><Calendar size={12} /> {post.scheduledAt}</div>}
        {isClientView && onApprove && onRequestChanges && <ClientApprovalButtons postId={post.id} onApprove={onApprove} onRequestChanges={onRequestChanges} />}
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-500" /> Instagram</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400" /> TikTok</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /> LinkedIn</div>
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

/* ── Kanban Column ── */
const KanbanColumn = ({ title, status, posts, onEdit, onChangeTemplate, onDownload, onApproveStatus, icon: Icon, accentColor, isClientView, onApprove, onRequestChanges }: {
  title: string; status: PostStatus; posts: PostCard[];
  onEdit: (post: PostCard) => void; onChangeTemplate: (post: PostCard, t: TemplateId) => void;
  onDownload: (post: PostCard) => void; onApproveStatus: (id: string) => void;
  icon: React.ElementType; accentColor: string; isClientView?: boolean; onApprove?: (id: string) => void; onRequestChanges?: (id: string) => void;
}) => {
  const filtered = posts.filter((p) => p.status === status);

  return (
    <div className="flex-1 min-w-[320px] max-w-[400px]">
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${accentColor}`}>
        <Icon size={16} className="text-muted-foreground" />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-secondary text-muted-foreground">{filtered.length}</Badge>
      </div>
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((post) => (
            <RenderedPostCard key={post.id} post={post}
              onEdit={onEdit} onChangeTemplate={onChangeTemplate} onDownload={onDownload} onApproveStatus={onApproveStatus}
              isClientView={isClientView} onApprove={onApprove} onRequestChanges={onRequestChanges}
            />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">Sin posts aquí</div>}
      </div>
    </div>
  );
};

/* ── Edit Post Modal ── */
const EditPostModal = ({ post, open, onClose, onRegenerate }: {
  post: PostCard | null; open: boolean; onClose: () => void;
  onRegenerate: (post: PostCard) => void;
}) => {
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("auto");
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (post) {
      setHeadline(post.headline || post.title || "");
      setBody(post.body || post.caption || "");
      setCta(post.cta || "");
      setImagePrompt(post.imagePrompt || "");
      setTemplateId(post.templateId || "auto");
    }
  }, [post]);

  const handleRegenerate = async () => {
    if (!post) return;
    setIsRegenerating(true);
    const updated: PostCard = { ...post, headline, body, cta, imagePrompt, templateId };
    await onRegenerate(updated);
    setIsRegenerating(false);
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Post</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left - Edit fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Headline</label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60}
                className="bg-secondary/50 border-border" placeholder="Título principal..." />
              <span className="text-[10px] text-muted-foreground mt-1 block text-right">{headline.length}/60</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Body</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={150} rows={2}
                className="bg-secondary/50 border-border resize-none" placeholder="Texto secundario..." />
              <span className="text-[10px] text-muted-foreground mt-1 block text-right">{body.length}/150</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CTA</label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} maxLength={30}
                className="bg-secondary/50 border-border" placeholder="Call to action..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prompt de imagen</label>
              <Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={3}
                className="bg-secondary/50 border-border resize-none" placeholder="Describe la imagen de fondo..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Template</label>
              <Select value={templateId} onValueChange={(v) => setTemplateId(v as TemplateId)}>
                <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRegenerate} disabled={isRegenerating} className="w-full h-11 bg-gradient-to-r from-violet-600 to-primary text-white font-semibold">
              {isRegenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> Regenerando...</> : <><RefreshCw size={16} className="mr-2" /> Regenerar Post</>}
            </Button>
          </div>
          {/* Right - Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className={`w-full rounded-xl overflow-hidden border border-border bg-secondary ${
              post.platform === "tiktok" ? "aspect-[9/16] max-h-[400px]" : post.platform === "linkedin" ? "aspect-[1.91/1]" : "aspect-square"
            }`}>
              {isRegenerating ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Regenerando...</p>
                  </div>
                </div>
              ) : (
                <img src={post.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              )}
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
  const [brand, setBrand] = useState<BrandProfile>(loadBrand);
  const [editingPost, setEditingPost] = useState<PostCard | null>(null);

  // Persist brand to localStorage
  useEffect(() => { saveBrand(brand); }, [brand]);

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

    try {
      if (autoRemoveBg) {
        const resultBlob = await removeBackground(file);
        const resultUrl = URL.createObjectURL(resultBlob);
        setBrandAssets((prev) => [...prev, resultUrl]);
        setBrandAssetBlobs((prev) => [...prev, resultBlob]);
        toast({ title: "✨ ¡Producto aislado con éxito!", description: "Fondo removido exitosamente." });
      } else {
        setBrandAssets((prev) => [...prev, previewUrl]);
        setBrandAssetBlobs((prev) => [...prev, file]);
        toast({ title: "✅ Asset cargado", description: "Imagen agregada sin procesar." });
      }
    } catch (err: any) {
      console.error("background-removal error:", err);
      setBrandAssets((prev) => [...prev, previewUrl]);
      setBrandAssetBlobs((prev) => [...prev, file]);
      toast({
        title: "Error al procesar imagen",
        description: err?.message?.includes("WebGL")
          ? "Tu navegador no soporta WebGL. Intenta con Chrome o Edge."
          : "No se pudo remover el fondo. La imagen original fue conservada.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingImage(null);
    }
  }, [autoRemoveBg]);

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const renderPost = useCallback(async (post: PostCard, logoB64: string | undefined) => {
    const [w, h] = getDimensionsFromPlatform(post.platform);
    const tId = post.templateId || selectedTemplate;

    try {
      const res = await fetch("https://loaded-roles-behavior-mystery.trycloudflare.com/api/v1/posts/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: tId,
          format: getFormatFromPlatform(post.platform),
          brand: {
            logo_b64: logoB64 || undefined,
            primary_color: brand.primary_color,
            secondary_color: brand.secondary_color,
            font_family: brand.font_family,
          },
          copy: {
            headline: post.headline || post.title || "",
            body: post.body || post.caption || "",
            cta: post.cta || "",
          },
          image_prompt: post.imagePrompt || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rendered_post) return data.rendered_post;
        if (data.image) return data.image;
      }
    } catch (err) {
      console.warn("Backend render failed, using placeholder:", err);
    }

    // Fallback placeholder
    const color = brand.primary_color.replace("#", "");
    await new Promise(r => setTimeout(r, 800));
    return `https://placehold.co/${w}x${h}/${color}/white?text=${encodeURIComponent(post.headline || "Post")}`;
  }, [brand, selectedTemplate]);

  const handleGenerateWithPrompt = useCallback(async (promptOverride?: string) => {
    setIsGenerating(true);
    setGeneratingStatus("🔗 Conectando con Vertex AI...");

    const activePlatforms = Object.entries(platforms)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    const finalPrompt = promptOverride || agentPrompt || customPrompt.trim() || `Genera contenido para ${activePlatforms.join(", ")}. Frecuencia: ${frequency}. Objetivo: ${objective}.`;

    let contextImage: string | undefined;
    if (brandAssetBlobs.length > 0) {
      contextImage = await blobToBase64(brandAssetBlobs[0]);
    }

    try {
      const payload = {
        prompt: finalPrompt,
        context_image: contextImage || undefined,
        ad_format: adFormat,
        platform: activePlatforms,
        objective,
        opciones: optionsPerPost,
        frequency,
      };
      console.log("📦 Payload enviado:", JSON.stringify({ ...payload, context_image: payload.context_image ? `${payload.context_image.substring(0, 60)}...` : null }, null, 2));

      setGeneratingStatus("🧠 Enviando prompt a Vertex AI...");
      const res = await fetch("https://loaded-roles-behavior-mystery.trycloudflare.com/api/v1/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: payload.prompt, context_image: payload.context_image || undefined }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setGeneratingStatus("🎨 Renderizando posts con Template Engine...");

      let rawPosts: PostCard[] = [];

      if (data?.images && Array.isArray(data.images)) {
        rawPosts = data.images.map((img: any, idx: number) => ({
          id: `gen-${Date.now()}-${idx}`,
          platform: activePlatforms[idx % activePlatforms.length] as Platform,
          status: "draft" as PostStatus,
          image: img.url || img,
          caption: img.caption || data.captions?.[idx] || "",
          title: img.title || "",
          headline: img.headline || img.title || "",
          body: img.body || img.caption || "",
          cta: img.cta || "",
          imagePrompt: img.image_prompt || finalPrompt,
          templateId: selectedTemplate,
          hashtags: img.hashtags || [],
          calendarDay: (idx * 3) + 1,
        }));
      } else if (data?.posts && Array.isArray(data.posts)) {
        rawPosts = data.posts.map((post: any, idx: number) => ({
          id: `gen-${Date.now()}-${idx}`,
          platform: post.platform || activePlatforms[idx % activePlatforms.length] as Platform,
          status: "draft" as PostStatus,
          image: post.image || "/placeholder.svg",
          caption: post.caption || post.content || "",
          title: post.title || "",
          headline: post.headline || post.title || "",
          body: post.body || post.caption || "",
          cta: post.cta || "",
          imagePrompt: post.image_prompt || finalPrompt,
          templateId: selectedTemplate,
          hashtags: post.hashtags || [],
          calendarDay: post.calendarDay || (idx * 3) + 1,
        }));
      } else {
        rawPosts = MOCK_POSTS.filter((p) => platforms[p.platform as keyof typeof platforms]).map(p => ({ ...p, templateId: selectedTemplate }));
      }

      // Render each post through the template engine
      const logoB64 = contextImage;
      const renderedPosts = await Promise.all(
        rawPosts.map(async (post) => {
          const renderedImage = await renderPost(post, logoB64);
          return { ...post, image: renderedImage };
        })
      );

      setPosts(renderedPosts);
      setHasGenerated(true);
      toast({ title: "🚀 Parrilla generada", description: "Contenido generado y renderizado exitosamente." });
    } catch (err: any) {
      console.error("Generation error:", err);
      // Fallback with mock data + template rendering
      const fallbackPosts = MOCK_POSTS.filter((p) => platforms[p.platform as keyof typeof platforms]).map(p => ({ ...p, templateId: selectedTemplate }));
      const logoB64 = contextImage;
      const rendered = await Promise.all(
        fallbackPosts.map(async (post) => {
          const img = await renderPost(post, logoB64);
          return { ...post, image: img };
        })
      );
      setPosts(rendered);
      setHasGenerated(true);
      toast({ title: "⚠️ Error de API", description: `${err?.message || "Error desconocido"}\nSe cargaron datos de demostración.`, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGeneratingStatus("");
    }
  }, [platforms, optionsPerPost, customPrompt, agentPrompt, frequency, objective, brandAssetBlobs, adFormat, selectedTemplate, brand, renderPost, blobToBase64]);

  const handleAgentReady = useCallback((payload: { prompt: string; brandContext: string; audience: string; style: string }) => {
    setAgentPrompt(payload.prompt);
    handleGenerateWithPrompt(payload.prompt);
  }, [handleGenerateWithPrompt]);

  const handleEnhancePrompt = useCallback(() => {
    if (!customPrompt.trim()) { toast({ title: "✏️ Escribe algo primero", description: "Ingresa una idea básica para mejorarla." }); return; }
    setIsEnhancing(true);
    setTimeout(() => {
      setCustomPrompt(`Actúa como un Copywriter Senior especializado en marketing digital. Crea una secuencia de contenido para el producto destacando sus características diferenciadoras y propuesta de valor única.`);
      setIsEnhancing(false);
      toast({ title: "✨ Prompt mejorado", description: "Tu idea ha sido transformada en un mega-prompt profesional." });
    }, 1200);
  }, [customPrompt]);

  const togglePlatform = (key: keyof typeof platforms) => setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleApprovePost = useCallback((id: string) => { setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "scheduled" as PostStatus } : p))); toast({ title: "✅ Post aprobado" }); }, []);
  const handleRequestChanges = useCallback((id: string) => { toast({ title: "📝 Cambios solicitados" }); }, []);
  const handleExportCSV = () => { toast({ title: "📊 CSV Exportado" }); };
  const handleApproveAll = () => { setPosts((prev) => prev.map((p) => ({ ...p, status: "scheduled" as PostStatus }))); toast({ title: "✅ Todo aprobado" }); };

  const handleEditPost = useCallback((post: PostCard) => { setEditingPost(post); }, []);
  const handleChangeTemplate = useCallback(async (post: PostCard, newTemplateId: TemplateId) => {
    const updated = { ...post, templateId: newTemplateId };
    let logoB64: string | undefined;
    if (brandAssetBlobs.length > 0) logoB64 = await blobToBase64(brandAssetBlobs[0]);
    const newImage = await renderPost(updated, logoB64);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...updated, image: newImage } : p));
    toast({ title: "🔄 Template actualizado" });
  }, [brandAssetBlobs, blobToBase64, renderPost]);

  const handleDownloadPost = useCallback((post: PostCard) => {
    if (!post.image) return;
    const a = document.createElement("a");
    a.href = post.image;
    a.download = `post-${post.id}.png`;
    a.click();
  }, []);

  const handleRegeneratePost = useCallback(async (updatedPost: PostCard) => {
    let logoB64: string | undefined;
    if (brandAssetBlobs.length > 0) logoB64 = await blobToBase64(brandAssetBlobs[0]);
    const newImage = await renderPost(updatedPost, logoB64);
    const finalPost = { ...updatedPost, image: newImage };
    setPosts(prev => prev.map(p => p.id === finalPost.id ? finalPost : p));
    setEditingPost(finalPost);
    toast({ title: "✨ Post regenerado" });
  }, [brandAssetBlobs, blobToBase64, renderPost]);

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
              <button className="flex items-center gap-1 hover:text-foreground transition-colors"><BriefIcon size={12} /> Brief: Drone X10</button>
              <span>/</span>
              <span className="flex items-center gap-1 text-foreground font-medium"><CalendarDays size={12} /> Parrilla</span>
            </nav>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Parrilla de Contenido</h1>
                <p className="text-xs text-muted-foreground">Lanzamiento Drone X10 · Aero Dynamics</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${
                isClientView ? "bg-violet-500/20 border-violet-500/40" : "bg-secondary border-border"
              }`}>
                <Eye size={16} className={isClientView ? "text-violet-400" : "text-muted-foreground"} />
                <span className={`text-sm font-medium ${isClientView ? "text-violet-300" : "text-muted-foreground"}`}>Modo Cliente</span>
                <Switch checked={isClientView} onCheckedChange={setIsClientView} className="data-[state=checked]:bg-violet-500" />
              </div>
              <div className="w-px h-8 bg-border" />
              <Button variant="outline" onClick={handleExportCSV} className="gap-2 text-sm h-9 border-border text-muted-foreground hover:text-foreground">
                <Download size={14} /> Exportar CSV
              </Button>
              <Button onClick={handleApproveAll} className="gap-2 text-sm h-9 bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle2 size={14} /> Aprobar Todo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Brand Assets */}
        <AnimatePresence>
          {!isClientView && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 288, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }}
              className="bg-card border-r border-border p-5 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <ImageIcon size={16} className="text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-sm">Brand Assets</h2>
                  <p className="text-[10px] text-muted-foreground">Logos y recursos visuales</p>
                </div>
              </div>

              <button onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary bg-secondary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group mb-5"
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

              <div className="flex items-center justify-between mb-5 px-1">
                <label htmlFor="auto-remove-bg" className="text-xs font-medium text-muted-foreground cursor-pointer">Remover Fondo Automatizado</label>
                <Switch id="auto-remove-bg" checked={autoRemoveBg} onCheckedChange={setAutoRemoveBg} className="data-[state=checked]:bg-primary" />
              </div>

              {/* Brand Colors */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Palette size={14} className="text-muted-foreground" />
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Colores de Marca</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] text-muted-foreground">Primario</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brand.primary_color} onChange={(e) => setBrand(prev => ({ ...prev, primary_color: e.target.value }))}
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                      <span className="text-[10px] text-muted-foreground font-mono">{brand.primary_color}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] text-muted-foreground">Secundario</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={brand.secondary_color} onChange={(e) => setBrand(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent" />
                      <span className="text-[10px] text-muted-foreground font-mono">{brand.secondary_color}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Family */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Type size={14} className="text-muted-foreground" />
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tipografía</p>
                </div>
                <Select value={brand.font_family} onValueChange={(v) => setBrand(prev => ({ ...prev, font_family: v }))}>
                  <SelectTrigger className="bg-secondary/50 border-border h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {brandAssets.length > 0 && (
                <div className="mb-5 space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Formato de Anuncio</p>
                  <Select value={adFormat} onValueChange={(v) => setAdFormat(v as "mobile_screen" | "watermark" | "merch")}>
                    <SelectTrigger className="bg-secondary/50 border-border h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merch">👕 Mercancía / Ropa</SelectItem>
                      <SelectItem value="watermark">💧 Anuncio con Marca de Agua</SelectItem>
                      <SelectItem value="mobile_screen">📱 Pantalla de Celular (Lifestyle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                        title="Descargar"
                      >
                        <Download size={12} className="text-foreground" />
                      </a>
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
          {/* Nano Banano Agent */}
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

                  {/* Creative Agent Chat */}
                  <div className="mb-5">
                    <CreativeAgentChat
                      onPromptReady={handleAgentReady}
                      isGenerating={isGenerating}
                      hasContextImage={brandAssetBlobs.length > 0}
                      generatingStatus={generatingStatus}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Platform Cards */}
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

                    {/* Frequency */}
                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Frecuencia</p>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-secondary/50 border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-week">3 posts/semana</SelectItem>
                          <SelectItem value="5-week">5 posts/semana</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Objective */}
                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Objetivo</p>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger className="bg-secondary/50 border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement"><div className="flex items-center gap-2"><Heart size={14} className="text-pink-500" /> Engagement</div></SelectItem>
                          <SelectItem value="conversion"><div className="flex items-center gap-2"><Target size={14} className="text-emerald-500" /> Conversión</div></SelectItem>
                          <SelectItem value="awareness"><div className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> Brand Awareness</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template */}
                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Template</p>
                      <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateId)}>
                        <SelectTrigger className="bg-secondary/50 border-border h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TEMPLATES.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center gap-2">{t.icon} {t.name}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Output + Generate */}
                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Opciones</p>
                      <div className="flex items-center gap-3">
                        <Select value={String(optionsPerPost)} onValueChange={(v) => setOptionsPerPost(Number(v))}>
                          <SelectTrigger className="bg-secondary/50 border-border h-11 w-20"><SelectValue /></SelectTrigger>
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
                          {isGenerating ? <><Loader2 size={16} className="animate-spin mr-2" /> ✨ Procesando...</> : <><Zap size={16} className="mr-2" /> Generar 🚀</>}
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
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter((p) => p.platform === "instagram").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="tiktok" className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <TikTokIcon size={14} /> TikTok
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter((p) => p.platform === "tiktok").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="gap-2 px-5 data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                        <Linkedin size={14} /> LinkedIn
                        <Badge variant="secondary" className="text-[10px] bg-secondary">{posts.filter((p) => p.platform === "linkedin").length}</Badge>
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center p-1 rounded-xl bg-secondary">
                      <button onClick={() => setViewMode("kanban")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "kanban" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                      ><LayoutGrid size={16} /> Kanban</button>
                      <button onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "calendar" ? "bg-card text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                      ><CalendarDays size={16} /> Mensual</button>
                    </div>
                  </div>

                  {viewMode === "kanban" ? (
                    <>
                      {(["instagram", "tiktok", "linkedin"] as Platform[]).map((plat) => (
                        <TabsContent key={plat} value={plat} className="flex-1 overflow-auto p-6 mt-0">
                          <div className="flex gap-6">
                            <KanbanColumn title="Borrador" status="draft" posts={platformPosts}
                              onEdit={handleEditPost} onChangeTemplate={handleChangeTemplate} onDownload={handleDownloadPost} onApproveStatus={handleApprovePost}
                              icon={FileText} accentColor="border-border" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                            <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts}
                              onEdit={handleEditPost} onChangeTemplate={handleChangeTemplate} onDownload={handleDownloadPost} onApproveStatus={handleApprovePost}
                              icon={Clock} accentColor="border-amber-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                            <KanbanColumn title="Publicado" status="published" posts={platformPosts}
                              onEdit={handleEditPost} onChangeTemplate={handleChangeTemplate} onDownload={handleDownloadPost} onApproveStatus={handleApprovePost}
                              icon={CheckCircle2} accentColor="border-emerald-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          </div>
                        </TabsContent>
                      ))}
                    </>
                  ) : (
                    <div className="flex-1 overflow-auto">
                      <CalendarView posts={posts} />
                    </div>
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
                    {isClientView
                      ? "Espera a que el equipo creativo genere el contenido."
                      : "Configura las plataformas y objetivos arriba, luego haz clic en \"Generar Parrilla\" para crear contenido con IA."}
                  </p>
                  <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Instagram size={14} /> Instagram</div>
                    <div className="flex items-center gap-1.5"><TikTokIcon size={14} /> TikTok</div>
                    <div className="flex items-center gap-1.5"><Linkedin size={14} /> LinkedIn</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Post Modal */}
      <EditPostModal post={editingPost} open={!!editingPost} onClose={() => setEditingPost(null)} onRegenerate={handleRegeneratePost} />

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
                <motion.div
                  initial={{ top: 0 }} animate={{ top: ["0%", "100%", "0%"] }}
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
