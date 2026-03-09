import { useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, CheckCircle2, Upload, Sparkles, Loader2, X,
  Instagram, Linkedin, Play, Music, Calendar, Send, Clock, Eye,
  GripVertical, Image as ImageIcon, Video, FileText, Zap, Target, Users,
  TrendingUp, MessageSquare, Heart, Share2, Bookmark, MoreHorizontal,
  Check, MessageCircle, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight,
  Wand2, Home, Hexagon, FileText as BriefIcon, Twitter
} from "lucide-react";

/* ── Types ── */
type Platform = "instagram" | "tiktok" | "linkedin";
type PostStatus = "draft" | "scheduled" | "published";
type ViewMode = "kanban" | "calendar";

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
}

/* ── Mock Data ── */
const MOCK_POSTS: PostCard[] = [
  // Instagram
  { id: "ig-1", platform: "instagram", status: "draft", image: "/placeholder.svg", caption: "Libertad sin límites. El Drone X10 redefine lo que significa volar. ✈️ #DroneX10 #AeroDynamics #Innovation", hashtags: ["DroneX10", "AeroDynamics", "Innovation", "Tech"], calendarDay: 3 },
  { id: "ig-2", platform: "instagram", status: "scheduled", image: "/placeholder.svg", caption: "Captura momentos imposibles con precisión milimétrica. 📸 #Drones #Photography", scheduledAt: "2025-07-15 10:00", hashtags: ["Drones", "Photography"], calendarDay: 8 },
  { id: "ig-3", platform: "instagram", status: "published", image: "/placeholder.svg", caption: "El futuro de la fotografía aérea ya llegó. 🚀 #AeroX10", hashtags: ["AeroX10"], calendarDay: 12 },
  // TikTok
  { id: "tt-1", platform: "tiktok", status: "draft", image: "/placeholder.svg", title: "POV: Tu dron vuela solo 🤯", audio: "Trending Sound - Epic Reveal", caption: "El modo autónomo del X10 es de otro nivel...", calendarDay: 5 },
  { id: "tt-2", platform: "tiktok", status: "scheduled", image: "/placeholder.svg", title: "Unboxing Drone X10 ✨", audio: "Original Sound - AeroDynamics", scheduledAt: "2025-07-16 18:00", calendarDay: 10 },
  { id: "tt-3", platform: "tiktok", status: "published", image: "/placeholder.svg", title: "3 trucos PRO con tu X10", audio: "Viral Beat 2025", calendarDay: 17 },
  // LinkedIn
  { id: "li-1", platform: "linkedin", status: "draft", image: "/placeholder.svg", caption: "La tecnología del Drone X10 está redefiniendo la logística empresarial. Con un alcance de 15km y autonomía de 45 minutos, las posibilidades son infinitas para inspecciones industriales, mapeo agrícola y delivery de última milla.\n\n¿Tu empresa ya está explorando soluciones con drones?", hashtags: ["Innovation", "Logistics", "Technology", "FutureOfWork"], calendarDay: 7 },
  { id: "li-2", platform: "linkedin", status: "scheduled", image: "/placeholder.svg", caption: "Caso de éxito: Cómo el Drone X10 redujo costos operativos en un 40% para una empresa de energía renovable.", scheduledAt: "2025-07-17 09:00", hashtags: ["CaseStudy", "ROI", "Drones"], calendarDay: 14 },
  { id: "li-3", platform: "linkedin", status: "published", image: "/placeholder.svg", caption: "Orgullosos de anunciar nuestra alianza estratégica con TechCorp para llevar el X10 a nuevos mercados.", hashtags: ["Partnership", "Growth"], calendarDay: 21 },
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
      backgroundImage: `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`,
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      backgroundColor: "#fff",
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
    draft: { label: "Borrador", bg: "bg-slate-100 text-slate-600 border-slate-200" },
    scheduled: { label: "Agendado", bg: "bg-amber-50 text-amber-600 border-amber-200" },
    published: { label: "Publicado", bg: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  };
  const c = config[status];
  return <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${c.bg}`}>{c.label}</Badge>;
};

/* ── Client Approval Buttons ── */
const ClientApprovalButtons = ({ postId, onApprove, onRequestChanges }: { postId: string; onApprove: (id: string) => void; onRequestChanges: (id: string) => void }) => (
  <div className="flex gap-2 pt-3 border-t border-slate-100">
    <Button
      onClick={() => onApprove(postId)}
      size="sm"
      className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-semibold"
    >
      <Check size={16} /> Aprobar
    </Button>
    <Button
      onClick={() => onRequestChanges(postId)}
      size="sm"
      variant="outline"
      className="flex-1 h-10 border-slate-300 text-slate-600 hover:bg-slate-50 gap-2 font-semibold"
    >
      <MessageCircle size={16} /> Cambios
    </Button>
  </div>
);

/* ── Instagram Card ── */
const InstagramCard = ({ post, onUpdate, isClientView, onApprove, onRequestChanges }: { post: PostCard; onUpdate: (id: string, patch: Partial<PostCard>) => void; isClientView?: boolean; onApprove?: (id: string) => void; onRequestChanges?: (id: string) => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
  >
    {/* Image Preview 1:1 */}
    <div className="aspect-square bg-gradient-to-br from-pink-100 via-purple-50 to-orange-50 relative overflow-hidden">
      <img src={post.image} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
          <Instagram size={14} className="text-white" />
        </div>
      </div>
      <div className="absolute top-3 right-3">
        <StatusBadge status={post.status} />
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white/90">
          <Heart size={16} /><MessageSquare size={16} /><Send size={16} />
        </div>
        <Bookmark size={16} className="text-white/90" />
      </div>
    </div>
    {/* Caption */}
    <div className="p-4 space-y-3">
      {isClientView ? (
        <p className="text-sm text-slate-700 leading-relaxed">{post.caption}</p>
      ) : (
        <Textarea
          value={post.caption}
          onChange={(e) => onUpdate(post.id, { caption: e.target.value })}
          placeholder="Escribe tu caption..."
          className="text-sm border-0 p-0 resize-none focus-visible:ring-0 min-h-[60px] text-slate-700 placeholder:text-slate-400"
        />
      )}
      {post.hashtags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((h) => (
            <span key={h} className="text-[11px] text-blue-500 font-medium">#{h}</span>
          ))}
        </div>
      ) : null}
      {post.scheduledAt && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
          <Calendar size={12} /> {post.scheduledAt}
        </div>
      )}
      {isClientView && onApprove && onRequestChanges && (
        <ClientApprovalButtons postId={post.id} onApprove={onApprove} onRequestChanges={onRequestChanges} />
      )}
    </div>
  </motion.div>
);

/* ── TikTok Card ── */
const TikTokCard = ({ post, onUpdate, isClientView, onApprove, onRequestChanges }: { post: PostCard; onUpdate: (id: string, patch: Partial<PostCard>) => void; isClientView?: boolean; onApprove?: (id: string) => void; onRequestChanges?: (id: string) => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
  >
    {/* Video Preview 9:16 */}
    <div className="aspect-[9/16] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden max-h-[280px]">
      <img src={post.image} alt="" className="w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
          <Play size={24} className="text-white ml-1" fill="white" />
        </div>
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
          <TikTokIcon size={14} className="text-white" />
        </div>
      </div>
      <div className="absolute top-3 right-3">
        <StatusBadge status={post.status} />
      </div>
      {/* Side Actions */}
      <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4 text-white/80">
        <div className="flex flex-col items-center"><Heart size={20} /><span className="text-[10px] mt-0.5">12.4K</span></div>
        <div className="flex flex-col items-center"><MessageSquare size={20} /><span className="text-[10px] mt-0.5">342</span></div>
        <div className="flex flex-col items-center"><Share2 size={20} /><span className="text-[10px] mt-0.5">89</span></div>
      </div>
      {/* Title overlay */}
      <div className="absolute bottom-3 left-3 right-12">
        <p className="text-white font-bold text-sm drop-shadow-lg">{post.title}</p>
      </div>
    </div>
    {/* Audio & Meta */}
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Music size={12} className="text-slate-400" />
        <span className="truncate">{post.audio}</span>
      </div>
      {post.scheduledAt && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
          <Calendar size={12} /> {post.scheduledAt}
        </div>
      )}
      {isClientView && onApprove && onRequestChanges && (
        <ClientApprovalButtons postId={post.id} onApprove={onApprove} onRequestChanges={onRequestChanges} />
      )}
    </div>
  </motion.div>
);

/* ── LinkedIn Card ── */
const LinkedInCard = ({ post, onUpdate, isClientView, onApprove, onRequestChanges }: { post: PostCard; onUpdate: (id: string, patch: Partial<PostCard>) => void; isClientView?: boolean; onApprove?: (id: string) => void; onRequestChanges?: (id: string) => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-shadow overflow-hidden group"
  >
    {/* Header */}
    <div className="p-4 pb-3 flex items-start gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0">A</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">Aero Dynamics</p>
        <p className="text-[11px] text-slate-500">15,234 seguidores · Patrocinado</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={post.status} />
        <MoreHorizontal size={16} className="text-slate-400" />
      </div>
    </div>
    {/* Content */}
    <div className="px-4 pb-3">
      {isClientView ? (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
      ) : (
        <Textarea
          value={post.caption}
          onChange={(e) => onUpdate(post.id, { caption: e.target.value })}
          placeholder="Escribe tu post..."
          className="text-sm border-0 p-0 resize-none focus-visible:ring-0 min-h-[80px] text-slate-700 placeholder:text-slate-400"
        />
      )}
    </div>
    {/* Image */}
    <div className="aspect-[1.91/1] bg-gradient-to-br from-blue-50 to-slate-100 relative overflow-hidden">
      <img src={post.image} alt="" className="w-full h-full object-cover" />
    </div>
    {/* Hashtags & Actions */}
    <div className="p-4 space-y-3">
      {post.hashtags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((h) => (
            <span key={h} className="text-[11px] text-blue-600 font-medium">#{h}</span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500 text-xs">
        <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"><Heart size={14} /> Me gusta</button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"><MessageSquare size={14} /> Comentar</button>
        <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"><Share2 size={14} /> Compartir</button>
      </div>
      {post.scheduledAt && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium pt-1">
          <Calendar size={12} /> {post.scheduledAt}
        </div>
      )}
      {isClientView && onApprove && onRequestChanges && (
        <ClientApprovalButtons postId={post.id} onApprove={onApprove} onRequestChanges={onRequestChanges} />
      )}
    </div>
  </motion.div>
);

/* ── Mini Card for Calendar ── */
const MiniPostCard = ({ post }: { post: PostCard }) => {
  const platformColors = {
    instagram: "from-pink-500 via-red-500 to-yellow-500",
    tiktok: "from-slate-900 to-slate-700",
    linkedin: "from-blue-600 to-blue-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 shrink-0">
        <img src={post.image} alt="" className="w-full h-full object-cover" />
      </div>
      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${platformColors[post.platform]} flex items-center justify-center`}>
        <PlatformIcon platform={post.platform} size={10} />
      </div>
    </motion.div>
  );
};

/* ── Calendar View ── */
const CalendarView = ({ posts }: { posts: PostCard[] }) => {
  const [currentMonth] = useState(new Date(2025, 6, 1)); // July 2025
  const daysInMonth = 31;
  const firstDayOfWeek = 1; // Tuesday (0 = Monday)
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const postsByDay = useMemo(() => {
    const map: Record<number, PostCard[]> = {};
    posts.forEach((p) => {
      if (p.calendarDay) {
        if (!map[p.calendarDay]) map[p.calendarDay] = [];
        map[p.calendarDay].push(p);
      }
    });
    return map;
  }, [posts]);

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    // Empty cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    // Fill remaining cells to complete the grid
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, []);

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ChevronLeft size={18} />
          </Button>
          <h2 className="text-xl font-bold text-slate-800">Julio 2025</h2>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ChevronRight size={18} />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-500" /> Instagram</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-900" /> TikTok</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600" /> LinkedIn</div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: day ? 1.02 : 1 }}
            className={`min-h-[120px] rounded-xl border transition-all ${
              day
                ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer"
                : "bg-slate-50/50 border-transparent"
            }`}
          >
            {day && (
              <div className="p-2 h-full flex flex-col">
                <span className={`text-sm font-semibold mb-2 ${
                  postsByDay[day]?.length ? "text-slate-800" : "text-slate-400"
                }`}>
                  {day}
                </span>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {postsByDay[day]?.slice(0, 2).map((post) => (
                    <MiniPostCard key={post.id} post={post} />
                  ))}
                  {postsByDay[day]?.length > 2 && (
                    <p className="text-[10px] text-slate-400 font-medium">+{postsByDay[day].length - 2} más</p>
                  )}
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
const KanbanColumn = ({
  title,
  status,
  posts,
  platform,
  onUpdate,
  icon: Icon,
  accentColor,
  isClientView,
  onApprove,
  onRequestChanges,
}: {
  title: string;
  status: PostStatus;
  posts: PostCard[];
  platform: Platform;
  onUpdate: (id: string, patch: Partial<PostCard>) => void;
  icon: React.ElementType;
  accentColor: string;
  isClientView?: boolean;
  onApprove?: (id: string) => void;
  onRequestChanges?: (id: string) => void;
}) => {
  const filtered = posts.filter((p) => p.status === status);

  const CardComponent = platform === "instagram" ? InstagramCard : platform === "tiktok" ? TikTokCard : LinkedInCard;

  return (
    <div className="flex-1 min-w-[320px] max-w-[400px]">
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${accentColor}`}>
        <Icon size={16} className="text-slate-600" />
        <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-[10px] bg-slate-100 text-slate-500">{filtered.length}</Badge>
      </div>
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map((post) => (
            <CardComponent
              key={post.id}
              post={post}
              onUpdate={onUpdate}
              isClientView={isClientView}
              onApprove={onApprove}
              onRequestChanges={onRequestChanges}
            />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
            Sin posts aquí
          </div>
        )}
      </div>
    </div>
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

  // Client Mode
  const [isClientView, setIsClientView] = useState(false);

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Brand Assets
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent Controls
  const [platforms, setPlatforms] = useState({ instagram: true, tiktok: true, linkedin: false, twitter: false });
  const [frequency, setFrequency] = useState("3-week");
  const [objective, setObjective] = useState("engagement");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [optionsPerPost, setOptionsPerPost] = useState(2);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setProcessingImage(url);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setProcessingImage(null);
      setBrandAssets((prev) => [...prev, url]);
      toast({ title: "✨ Fondo eliminado", description: "PNG transparente creado exitosamente." });
    }, 3000);

    e.target.value = "";
  }, []);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);

    setTimeout(() => {
      setPosts(MOCK_POSTS.filter((p) => platforms[p.platform as keyof typeof platforms]));
      setHasGenerated(true);
      setIsGenerating(false);
      toast({ title: "🚀 Parrilla generada", description: `${optionsPerPost * 9} variantes de posts listos para revisar.` });
    }, 2000);
  }, [platforms, optionsPerPost]);

  const handleEnhancePrompt = useCallback(() => {
    if (!customPrompt.trim()) {
      toast({ title: "✏️ Escribe algo primero", description: "Ingresa una idea básica para mejorarla." });
      return;
    }
    setIsEnhancing(true);
    setTimeout(() => {
      setCustomPrompt(`Actúa como un Copywriter Senior especializado en marketing de tecnología. Crea una secuencia de contenido para el Drone X10 destacando su certificación IP68 y resistencia extrema. Usa un tono épico y aspiracional, orientado a cineastas profesionales y creadores de contenido aventureros. Incluye:\n\n• Ganchos (hooks) de alta retención en los primeros 3 segundos\n• Storytelling visual con transiciones cinematográficas\n• CTA claro hacia la landing page de pre-orden\n• Hashtags estratégicos para máximo alcance orgánico`);
      setIsEnhancing(false);
      toast({ title: "✨ Prompt mejorado", description: "Tu idea ha sido transformada en un mega-prompt profesional." });
    }, 1200);
  }, [customPrompt]);

  const togglePlatform = (key: keyof typeof platforms) => {
    setPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePost = useCallback((id: string, patch: Partial<PostCard>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const handleApprovePost = useCallback((id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: "scheduled" as PostStatus } : p)));
    toast({ title: "✅ Post aprobado", description: "El contenido ha sido agendado." });
  }, []);

  const handleRequestChanges = useCallback((id: string) => {
    toast({ title: "📝 Cambios solicitados", description: "Se ha notificado al equipo creativo." });
  }, []);

  const handleExportCSV = () => {
    toast({ title: "📊 CSV Exportado", description: "Descargando parrilla en formato CSV..." });
  };

  const handleApproveAll = () => {
    setPosts((prev) => prev.map((p) => ({ ...p, status: "scheduled" as PostStatus })));
    toast({ title: "✅ Todo aprobado", description: "Todos los posts han sido agendados." });
  };

  const platformPosts = posts.filter((p) => p.platform === activePlatform);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isClientView ? "bg-slate-900" : "bg-slate-50"}`}>
      {/* Top Bar */}
      <header className={`sticky top-0 z-50 border-b shadow-sm transition-colors duration-500 ${
        isClientView ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col px-6 py-3">
          {/* Breadcrumbs */}
          {!isClientView && (
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                <Home size={12} /> Directorio
              </button>
              <span>/</span>
              <button className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                <Hexagon size={12} /> Aero Dynamics
              </button>
              <span>/</span>
              <button className="flex items-center gap-1 hover:text-slate-700 transition-colors">
                <BriefIcon size={12} /> Brief: Drone X10
              </button>
              <span>/</span>
              <span className="flex items-center gap-1 text-slate-800 font-medium">
                <CalendarDays size={12} /> Parrilla
              </span>
            </nav>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className={isClientView ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}>
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className={`text-lg font-bold ${isClientView ? "text-white" : "text-slate-800"}`}>Parrilla de Contenido</h1>
                <p className={`text-xs ${isClientView ? "text-slate-400" : "text-slate-500"}`}>Lanzamiento Drone X10 · Aero Dynamics</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Client Mode Toggle */}
              <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${
                isClientView ? "bg-violet-500/20 border-violet-500/40" : "bg-slate-100 border-slate-200"
              }`}>
                <Eye size={16} className={isClientView ? "text-violet-400" : "text-slate-500"} />
                <span className={`text-sm font-medium ${isClientView ? "text-violet-300" : "text-slate-600"}`}>Modo Cliente</span>
                <Switch
                  checked={isClientView}
                  onCheckedChange={setIsClientView}
                  className="data-[state=checked]:bg-violet-500"
                />
              </div>

              <div className={`w-px h-8 ${isClientView ? "bg-slate-700" : "bg-slate-200"}`} />

              <Button variant="outline" onClick={handleExportCSV} className={`gap-2 text-sm h-9 ${isClientView ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300"}`}>
                <Download size={14} /> Exportar CSV
              </Button>
              <Button onClick={handleApproveAll} className="gap-2 text-sm h-9 bg-emerald-500 hover:bg-emerald-600">
                <CheckCircle2 size={14} /> Aprobar Todo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Brand Assets (Hidden in Client Mode) */}
        <AnimatePresence>
          {!isClientView && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-r border-slate-200 p-5 flex flex-col overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <ImageIcon size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Brand Assets</h2>
                  <p className="text-[10px] text-slate-500">Logos y recursos visuales</p>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/50 transition-all flex flex-col items-center justify-center gap-3 group mb-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                  <Upload size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700">Subir Logo de Marca</p>
                  <p className="text-[11px] text-slate-500">PNG, JPG hasta 10MB</p>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              {/* Assets Grid */}
              <div className="flex-1 overflow-y-auto">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Assets procesados</p>
                <div className="grid grid-cols-2 gap-3">
                  {brandAssets.map((src, i) => (
                    <CheckerboardBg key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img src={src} alt="" className="w-full h-full object-contain p-2" />
                    </CheckerboardBg>
                  ))}
                  {brandAssets.length === 0 && (
                    <p className="col-span-2 text-xs text-slate-400 text-center py-6">Sin assets aún</p>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Nano Banano Agent (Hidden in Client Mode) */}
          <AnimatePresence>
            {!isClientView && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border-b border-slate-200 p-5 overflow-hidden"
              >
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800">Nano Banano Content Agent ✨</h2>
                      <p className="text-xs text-slate-500">IA generativa para parrillas de contenido social media</p>
                    </div>
                  </div>

                  {/* Custom Prompt Textarea with Enhancer */}
                  <div className="mb-5">
                    <div className="relative">
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ej: Quiero 3 posts sobre cómo el dron resiste la lluvia, tono épico, enfocado en cineastas aventureros..."
                        className="min-h-[100px] pr-36 bg-slate-50 border-slate-200 text-sm resize-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                      />
                      <button
                        onClick={handleEnhancePrompt}
                        disabled={isEnhancing}
                        className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-cyan-600 transition-all disabled:opacity-70"
                      >
                        {isEnhancing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Wand2 size={14} />
                        )}
                        {isEnhancing ? "Mejorando..." : "✨ Mejorar Prompt"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                      Escribe una idea básica y la IA la transformará en un mega-prompt profesional
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Platform Selectable Cards */}
                    <div className="lg:col-span-5 space-y-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plataformas</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: "instagram" as const, label: "Instagram", icon: Instagram, gradient: "from-pink-500 via-red-500 to-yellow-500", emoji: "📸" },
                          { key: "tiktok" as const, label: "TikTok", icon: TikTokIcon, gradient: "from-slate-900 to-slate-700", emoji: "🎵" },
                          { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, gradient: "from-blue-600 to-blue-700", emoji: "💼" },
                          { key: "twitter" as const, label: "X / Twitter", icon: Twitter, gradient: "from-slate-800 to-slate-900", emoji: "🐦" },
                        ].map((p) => (
                          <button
                            key={p.key}
                            onClick={() => togglePlatform(p.key)}
                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              platforms[p.key]
                                ? "border-violet-400 bg-violet-50 shadow-md shadow-violet-500/10"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-md`}>
                              <p.icon size={16} className="text-white" />
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{p.emoji} {p.label}</span>
                            {platforms[p.key] && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"
                              >
                                <Check size={12} className="text-white" />
                              </motion.div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frequency */}
                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Frecuencia</p>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-week">3 posts/semana</SelectItem>
                          <SelectItem value="5-week">5 posts/semana</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Objective */}
                    <div className="lg:col-span-2 space-y-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Objetivo</p>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engagement"><div className="flex items-center gap-2"><Heart size={14} className="text-pink-500" /> Engagement</div></SelectItem>
                          <SelectItem value="conversion"><div className="flex items-center gap-2"><Target size={14} className="text-emerald-500" /> Conversión</div></SelectItem>
                          <SelectItem value="awareness"><div className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> Brand Awareness</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Output Options + Generate */}
                    <div className="lg:col-span-3 space-y-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Opciones por post</p>
                      <div className="flex items-center gap-3">
                        <Select value={String(optionsPerPost)} onValueChange={(v) => setOptionsPerPost(Number(v))}>
                          <SelectTrigger className="bg-slate-50 border-slate-200 h-11 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleGenerate}
                          disabled={isGenerating || (!platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.twitter)}
                          className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-700 hover:via-purple-700 hover:to-cyan-600 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <><Loader2 size={16} className="animate-spin mr-2" /> Generando...</>
                          ) : (
                            <><Zap size={16} className="mr-2" /> Generar Parrilla 🚀</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Grid */}
          <div className={`flex-1 overflow-hidden flex flex-col ${isClientView ? "bg-slate-900" : ""}`}>
            {hasGenerated ? (
              <>
                {/* Platform Tabs + View Toggle */}
                <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)} className="flex-1 flex flex-col overflow-hidden">
                  <div className={`px-6 pt-5 pb-0 flex items-center justify-between ${isClientView ? "bg-slate-800/50" : ""}`}>
                    <TabsList className={`h-11 p-1 ${isClientView ? "bg-slate-700" : "bg-slate-100"}`}>
                      <TabsTrigger value="instagram" className={`gap-2 px-5 ${isClientView ? "data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400" : "data-[state=active]:bg-white"}`}>
                        <Instagram size={14} /> Instagram
                        <Badge variant="secondary" className={`text-[10px] ${isClientView ? "bg-slate-600" : "bg-slate-200/60"}`}>{posts.filter((p) => p.platform === "instagram").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="tiktok" className={`gap-2 px-5 ${isClientView ? "data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400" : "data-[state=active]:bg-white"}`}>
                        <TikTokIcon size={14} /> TikTok
                        <Badge variant="secondary" className={`text-[10px] ${isClientView ? "bg-slate-600" : "bg-slate-200/60"}`}>{posts.filter((p) => p.platform === "tiktok").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className={`gap-2 px-5 ${isClientView ? "data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400" : "data-[state=active]:bg-white"}`}>
                        <Linkedin size={14} /> LinkedIn
                        <Badge variant="secondary" className={`text-[10px] ${isClientView ? "bg-slate-600" : "bg-slate-200/60"}`}>{posts.filter((p) => p.platform === "linkedin").length}</Badge>
                      </TabsTrigger>
                    </TabsList>

                    {/* View Mode Toggle */}
                    <div className={`flex items-center p-1 rounded-xl ${isClientView ? "bg-slate-700" : "bg-slate-100"}`}>
                      <button
                        onClick={() => setViewMode("kanban")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewMode === "kanban"
                            ? isClientView ? "bg-slate-600 text-white shadow-md" : "bg-white text-slate-800 shadow-md"
                            : isClientView ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <LayoutGrid size={16} /> Kanban
                      </button>
                      <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          viewMode === "calendar"
                            ? isClientView ? "bg-slate-600 text-white shadow-md" : "bg-white text-slate-800 shadow-md"
                            : isClientView ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <CalendarDays size={16} /> Mensual
                      </button>
                    </div>
                  </div>

                  {viewMode === "kanban" ? (
                    <>
                      <TabsContent value="instagram" className="flex-1 overflow-auto p-6 mt-0">
                        <div className="flex gap-6">
                          <KanbanColumn title="Borrador" status="draft" posts={platformPosts} platform="instagram" onUpdate={updatePost} icon={FileText} accentColor="border-slate-300" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts} platform="instagram" onUpdate={updatePost} icon={Clock} accentColor="border-amber-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          <KanbanColumn title="Publicado" status="published" posts={platformPosts} platform="instagram" onUpdate={updatePost} icon={CheckCircle2} accentColor="border-emerald-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                        </div>
                      </TabsContent>

                      <TabsContent value="tiktok" className="flex-1 overflow-auto p-6 mt-0">
                        <div className="flex gap-6">
                          <KanbanColumn title="Borrador" status="draft" posts={platformPosts} platform="tiktok" onUpdate={updatePost} icon={FileText} accentColor="border-slate-300" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts} platform="tiktok" onUpdate={updatePost} icon={Clock} accentColor="border-amber-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          <KanbanColumn title="Publicado" status="published" posts={platformPosts} platform="tiktok" onUpdate={updatePost} icon={CheckCircle2} accentColor="border-emerald-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                        </div>
                      </TabsContent>

                      <TabsContent value="linkedin" className="flex-1 overflow-auto p-6 mt-0">
                        <div className="flex gap-6">
                          <KanbanColumn title="Borrador" status="draft" posts={platformPosts} platform="linkedin" onUpdate={updatePost} icon={FileText} accentColor="border-slate-300" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts} platform="linkedin" onUpdate={updatePost} icon={Clock} accentColor="border-amber-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                          <KanbanColumn title="Publicado" status="published" posts={platformPosts} platform="linkedin" onUpdate={updatePost} icon={CheckCircle2} accentColor="border-emerald-400" isClientView={isClientView} onApprove={handleApprovePost} onRequestChanges={handleRequestChanges} />
                        </div>
                      </TabsContent>
                    </>
                  ) : (
                    <div className={`flex-1 overflow-auto ${isClientView ? "bg-slate-800/30" : ""}`}>
                      <CalendarView posts={posts} />
                    </div>
                  )}
                </Tabs>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
                    isClientView ? "bg-slate-700" : "bg-gradient-to-br from-violet-100 to-cyan-100"
                  }`}>
                    <Sparkles size={36} className={isClientView ? "text-violet-400" : "text-violet-500"} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isClientView ? "text-white" : "text-slate-800"}`}>Tu parrilla está vacía</h3>
                  <p className={`text-sm mb-6 ${isClientView ? "text-slate-400" : "text-slate-500"}`}>
                    {isClientView
                      ? "Espera a que el equipo creativo genere el contenido."
                      : "Configura las plataformas y objetivos arriba, luego haz clic en \"Generar Parrilla Completa\" para crear contenido con IA."}
                  </p>
                  <div className={`flex items-center justify-center gap-3 text-xs ${isClientView ? "text-slate-500" : "text-slate-400"}`}>
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

      {/* Processing Modal */}
      <AnimatePresence>
        {isProcessing && processingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              {/* Image with Laser Scan Effect */}
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-slate-100">
                <img src={processingImage} alt="" className="w-full h-full object-contain" />
                {/* Laser Scan Line */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                {/* Corner Brackets */}
                <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-400" />
                <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-400" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-400" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-400" />
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Loader2 size={20} className="animate-spin text-cyan-500" />
                  <span className="text-lg font-bold text-slate-800">Procesando...</span>
                </div>
                <p className="text-sm text-slate-600">✨ IA Nexus analizando y creando PNG transparente...</p>
                <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.8, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Parrilla;
