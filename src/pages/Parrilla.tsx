import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
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
  TrendingUp, MessageSquare, Heart, Share2, Bookmark, MoreHorizontal
} from "lucide-react";

/* ── Types ── */
type Platform = "instagram" | "tiktok" | "linkedin";
type PostStatus = "draft" | "scheduled" | "published";

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
}

/* ── Mock Data ── */
const MOCK_POSTS: PostCard[] = [
  // Instagram
  { id: "ig-1", platform: "instagram", status: "draft", image: "/placeholder.svg", caption: "Libertad sin límites. El Drone X10 redefine lo que significa volar. ✈️ #DroneX10 #AeroDynamics #Innovation", hashtags: ["DroneX10", "AeroDynamics", "Innovation", "Tech"] },
  { id: "ig-2", platform: "instagram", status: "scheduled", image: "/placeholder.svg", caption: "Captura momentos imposibles con precisión milimétrica. 📸 #Drones #Photography", scheduledAt: "2025-07-15 10:00", hashtags: ["Drones", "Photography"] },
  { id: "ig-3", platform: "instagram", status: "published", image: "/placeholder.svg", caption: "El futuro de la fotografía aérea ya llegó. 🚀 #AeroX10", hashtags: ["AeroX10"] },
  // TikTok
  { id: "tt-1", platform: "tiktok", status: "draft", image: "/placeholder.svg", title: "POV: Tu dron vuela solo 🤯", audio: "Trending Sound - Epic Reveal", caption: "El modo autónomo del X10 es de otro nivel..." },
  { id: "tt-2", platform: "tiktok", status: "scheduled", image: "/placeholder.svg", title: "Unboxing Drone X10 ✨", audio: "Original Sound - AeroDynamics", scheduledAt: "2025-07-16 18:00" },
  { id: "tt-3", platform: "tiktok", status: "published", image: "/placeholder.svg", title: "3 trucos PRO con tu X10", audio: "Viral Beat 2025" },
  // LinkedIn
  { id: "li-1", platform: "linkedin", status: "draft", image: "/placeholder.svg", caption: "La tecnología del Drone X10 está redefiniendo la logística empresarial. Con un alcance de 15km y autonomía de 45 minutos, las posibilidades son infinitas para inspecciones industriales, mapeo agrícola y delivery de última milla.\n\n¿Tu empresa ya está explorando soluciones con drones?", hashtags: ["Innovation", "Logistics", "Technology", "FutureOfWork"] },
  { id: "li-2", platform: "linkedin", status: "scheduled", image: "/placeholder.svg", caption: "Caso de éxito: Cómo el Drone X10 redujo costos operativos en un 40% para una empresa de energía renovable.", scheduledAt: "2025-07-17 09:00", hashtags: ["CaseStudy", "ROI", "Drones"] },
  { id: "li-3", platform: "linkedin", status: "published", image: "/placeholder.svg", caption: "Orgullosos de anunciar nuestra alianza estratégica con TechCorp para llevar el X10 a nuevos mercados.", hashtags: ["Partnership", "Growth"] },
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

/* ── Instagram Card ── */
const InstagramCard = ({ post, onUpdate }: { post: PostCard; onUpdate: (id: string, patch: Partial<PostCard>) => void }) => (
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
      <Textarea
        value={post.caption}
        onChange={(e) => onUpdate(post.id, { caption: e.target.value })}
        placeholder="Escribe tu caption..."
        className="text-sm border-0 p-0 resize-none focus-visible:ring-0 min-h-[60px] text-slate-700 placeholder:text-slate-400"
      />
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
    </div>
  </motion.div>
);

/* ── TikTok Card ── */
const TikTokCard = ({ post, onUpdate }: { post: PostCard; onUpdate: (id: string, patch: Partial<PostCard>) => void }) => (
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
    </div>
  </motion.div>
);

/* ── LinkedIn Card ── */
const LinkedInCard = ({ post, onUpdate }: { post: PostCard; onUpdate: (id: string, patch: Partial<PostCard>) => void }) => (
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
      <Textarea
        value={post.caption}
        onChange={(e) => onUpdate(post.id, { caption: e.target.value })}
        placeholder="Escribe tu post..."
        className="text-sm border-0 p-0 resize-none focus-visible:ring-0 min-h-[80px] text-slate-700 placeholder:text-slate-400"
      />
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
    </div>
  </motion.div>
);

/* ── Kanban Column ── */
const KanbanColumn = ({
  title,
  status,
  posts,
  platform,
  onUpdate,
  icon: Icon,
  accentColor,
}: {
  title: string;
  status: PostStatus;
  posts: PostCard[];
  platform: Platform;
  onUpdate: (id: string, patch: Partial<PostCard>) => void;
  icon: React.ElementType;
  accentColor: string;
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
            <CardComponent key={post.id} post={post} onUpdate={onUpdate} />
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

  // Brand Assets
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent Controls
  const [platforms, setPlatforms] = useState({ instagram: true, tiktok: true, linkedin: false });
  const [frequency, setFrequency] = useState("3-week");
  const [objective, setObjective] = useState("engagement");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setProcessingImage(url);
    setIsProcessing(true);

    // Simulate AI processing
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
      setPosts(MOCK_POSTS.filter((p) => platforms[p.platform]));
      setHasGenerated(true);
      setIsGenerating(false);
      toast({ title: "🚀 Parrilla generada", description: "9 posts listos para revisar y programar." });
    }, 2000);
  }, [platforms]);

  const updatePost = useCallback((id: string, patch: Partial<PostCard>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
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
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-500 hover:text-slate-700">
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Parrilla de Contenido</h1>
              <p className="text-xs text-slate-500">Lanzamiento Drone X10 · Aero Dynamics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2 text-sm h-9 border-slate-300">
              <Download size={14} /> Exportar CSV
            </Button>
            <Button onClick={handleApproveAll} className="gap-2 text-sm h-9 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 size={14} /> Aprobar Todo
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Brand Assets */}
        <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Nano Banano Agent */}
          <div className="bg-white border-b border-slate-200 p-5">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Nano Banano Content Agent ✨</h2>
                  <p className="text-xs text-slate-500">IA generativa para parrillas de contenido social media</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* Platforms */}
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Plataformas</p>
                  <div className="space-y-2.5">
                    {[
                      { key: "instagram" as const, label: "Instagram", icon: Instagram, color: "text-pink-500" },
                      { key: "tiktok" as const, label: "TikTok", icon: TikTokIcon, color: "text-slate-900" },
                      { key: "linkedin" as const, label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <p.icon size={16} className={p.color} />
                          <span className="text-sm font-medium text-slate-700">{p.label}</span>
                        </div>
                        <Switch checked={platforms[p.key]} onCheckedChange={(v) => setPlatforms((prev) => ({ ...prev, [p.key]: v }))} />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-3">
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
                <div className="space-y-3">
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

                {/* Generate Button */}
                <div className="flex items-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!platforms.instagram && !platforms.tiktok && !platforms.linkedin)}
                    className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-700 hover:via-purple-700 hover:to-cyan-600 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Generando...</>
                    ) : (
                      <><Zap size={16} className="mr-2" /> Generar Parrilla Completa 🚀</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {hasGenerated ? (
              <>
                {/* Platform Tabs */}
                <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)} className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-6 pt-5 pb-0">
                    <TabsList className="bg-slate-100 h-11 p-1">
                      <TabsTrigger value="instagram" className="data-[state=active]:bg-white gap-2 px-5">
                        <Instagram size={14} /> Instagram
                        <Badge variant="secondary" className="text-[10px] bg-slate-200/60">{posts.filter((p) => p.platform === "instagram").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="tiktok" className="data-[state=active]:bg-white gap-2 px-5">
                        <TikTokIcon size={14} /> TikTok
                        <Badge variant="secondary" className="text-[10px] bg-slate-200/60">{posts.filter((p) => p.platform === "tiktok").length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="linkedin" className="data-[state=active]:bg-white gap-2 px-5">
                        <Linkedin size={14} /> LinkedIn
                        <Badge variant="secondary" className="text-[10px] bg-slate-200/60">{posts.filter((p) => p.platform === "linkedin").length}</Badge>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="instagram" className="flex-1 overflow-auto p-6 mt-0">
                    <div className="flex gap-6">
                      <KanbanColumn title="Borrador" status="draft" posts={platformPosts} platform="instagram" onUpdate={updatePost} icon={FileText} accentColor="border-slate-300" />
                      <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts} platform="instagram" onUpdate={updatePost} icon={Clock} accentColor="border-amber-400" />
                      <KanbanColumn title="Publicado" status="published" posts={platformPosts} platform="instagram" onUpdate={updatePost} icon={CheckCircle2} accentColor="border-emerald-400" />
                    </div>
                  </TabsContent>

                  <TabsContent value="tiktok" className="flex-1 overflow-auto p-6 mt-0">
                    <div className="flex gap-6">
                      <KanbanColumn title="Borrador" status="draft" posts={platformPosts} platform="tiktok" onUpdate={updatePost} icon={FileText} accentColor="border-slate-300" />
                      <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts} platform="tiktok" onUpdate={updatePost} icon={Clock} accentColor="border-amber-400" />
                      <KanbanColumn title="Publicado" status="published" posts={platformPosts} platform="tiktok" onUpdate={updatePost} icon={CheckCircle2} accentColor="border-emerald-400" />
                    </div>
                  </TabsContent>

                  <TabsContent value="linkedin" className="flex-1 overflow-auto p-6 mt-0">
                    <div className="flex gap-6">
                      <KanbanColumn title="Borrador" status="draft" posts={platformPosts} platform="linkedin" onUpdate={updatePost} icon={FileText} accentColor="border-slate-300" />
                      <KanbanColumn title="Agendado" status="scheduled" posts={platformPosts} platform="linkedin" onUpdate={updatePost} icon={Clock} accentColor="border-amber-400" />
                      <KanbanColumn title="Publicado" status="published" posts={platformPosts} platform="linkedin" onUpdate={updatePost} icon={CheckCircle2} accentColor="border-emerald-400" />
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mx-auto mb-6">
                    <Sparkles size={36} className="text-violet-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Tu parrilla está vacía</h3>
                  <p className="text-slate-500 text-sm mb-6">Configura las plataformas y objetivos arriba, luego haz clic en "Generar Parrilla Completa" para crear contenido con IA.</p>
                  <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
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
