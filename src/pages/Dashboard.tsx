import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Plus, Settings, Sparkles, ArrowRight, Loader2, Building2, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface Brand {
  id: string;
  name: string;
  brief: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_colors: string[] | null;
  font_family: string | null;
  created_at: string;
  posts_count?: number;
}

interface Job {
  id: string;
  campaign_description: string | null;
  status: string;
  created_at: string;
  brand: { id: string; name: string } | null;
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, memberships, currentAgencyId, setCurrentAgencyId, signOut } = useAuth();

  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [showNewBrand, setShowNewBrand] = useState(false);

  const currentAgency = useMemo(
    () => memberships.find((m) => m.agency_id === currentAgencyId)?.agency,
    [memberships, currentAgencyId]
  );

  const firstName = (profile?.full_name || user?.email || "").split(" ")[0] || "👋";

  useEffect(() => {
    if (!currentAgencyId) return;
    let cancelled = false;

    (async () => {
      setBrands(null);
      setJobs(null);

      const { data: bs } = await supabase
        .from("brands")
        .select("id, name, brief, logo_url, primary_color, secondary_color, accent_colors, font_family, created_at")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false });

      const { data: js } = await supabase
        .from("generation_jobs")
        .select("id, campaign_description, status, created_at, brand:brands(id, name)")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false })
        .limit(8);

      if (cancelled) return;
      setBrands((bs as Brand[]) ?? []);
      setJobs((js as unknown as Job[]) ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentAgencyId]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
            <span className="font-bold tracking-tight text-foreground">NexusAI</span>
          </button>

          {/* Agency switcher */}
          {memberships.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 border border-border/40 text-sm text-foreground transition">
                <Building2 size={14} className="text-primary" />
                <span className="font-medium truncate max-w-[180px]">{currentAgency?.name ?? "Selecciona agencia"}</span>
                <ChevronDown size={12} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                <DropdownMenuLabel>Tus agencias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {memberships.map((m) => (
                  <DropdownMenuItem
                    key={m.agency_id}
                    onClick={() => setCurrentAgencyId(m.agency_id)}
                    className={m.agency_id === currentAgencyId ? "bg-primary/10 text-primary" : ""}
                  >
                    <Building2 size={14} className="mr-2 opacity-70" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.agency.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-secondary/40 hover:bg-secondary/70 border border-border/40 transition">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                    {initialsOf(profile?.full_name || user?.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown size={12} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium text-foreground">{profile?.full_name || "Sin nombre"}</p>
                  <p className="text-[11px] text-muted-foreground font-normal truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings size={14} className="mr-2" /> Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut size={14} className="mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <p className="text-sm text-muted-foreground">Hola, {firstName} 👋</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">Tus marcas</h1>
        </motion.div>

        {/* Brands grid */}
        <section className="mb-14">
          {brands === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <EmptyBrands onCreate={() => setShowNewBrand(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {brands.map((b) => (
                <BrandCard key={b.id} brand={b} onClick={() => navigate(`/brand/${b.id}`)} />
              ))}
              <NewBrandCard onClick={() => setShowNewBrand(true)} />
            </div>
          )}
        </section>

        {/* Recent parrillas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Parrillas recientes</h2>
          </div>

          {jobs === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
              Aún no has generado parrillas. Entra a una marca y dale a “Nueva parrilla”.
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => navigate(`/parrilla/${j.id}`)}
                  className="w-full glass hover:bg-secondary/30 rounded-xl p-4 flex items-center gap-4 text-left border border-border/30 transition group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Folder size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {j.campaign_description || "Parrilla sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {j.brand?.name ?? "Sin marca"} · {relativeTime(j.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={j.status} />
                  <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {showNewBrand && (
        <NewBrandModal
          agencyId={currentAgencyId!}
          onClose={() => setShowNewBrand(false)}
          onCreated={(b) => {
            setBrands((prev) => (prev ? [b, ...prev] : [b]));
            setShowNewBrand(false);
            toast({ title: "Marca creada", description: b.name });
          }}
        />
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "En cola", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    processing: { label: "Generando", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    completed: { label: "Lista", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    failed: { label: "Error", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const conf = map[status] ?? map.processing;
  return (
    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${conf.className}`}>
      {conf.label}
    </span>
  );
};

const BrandCard = ({ brand, onClick }: { brand: Brand; onClick: () => void }) => (
  <motion.button
    whileHover={{ y: -2 }}
    onClick={onClick}
    className="glass rounded-2xl p-5 text-left border border-border/30 hover:border-primary/40 transition group bg-transparent cursor-pointer"
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-border/30 flex items-center justify-center mb-4 overflow-hidden">
      {brand.logo_url ? (
        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-primary">{initialsOf(brand.name)}</span>
      )}
    </div>
    <p className="text-base font-semibold text-foreground truncate group-hover:text-primary transition">{brand.name}</p>
    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
      {brand.brief || "Sin brief"}
    </p>
  </motion.button>
);

const NewBrandCard = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-2xl p-5 border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition flex flex-col items-center justify-center min-h-[160px] gap-2 group cursor-pointer bg-transparent"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
      <Plus size={20} className="text-primary" />
    </div>
    <span className="text-sm font-medium text-foreground">Nueva marca</span>
  </button>
);

const EmptyBrands = ({ onCreate }: { onCreate: () => void }) => (
  <div className="glass-strong rounded-2xl p-12 text-center border border-border/30">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
      <Sparkles size={24} className="text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">Crea tu primera marca</h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
      Empieza añadiendo una marca para generar parrillas, briefs y campañas con IA.
    </p>
    <button
      onClick={onCreate}
      className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-semibold hover:glow-cyan transition"
    >
      <Plus size={14} /> Crear marca
    </button>
  </div>
);

const NewBrandModal = ({
  agencyId,
  onClose,
  onCreated,
}: {
  agencyId: string;
  onClose: () => void;
  onCreated: (b: Brand) => void;
}) => {
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setError("");
    setSaving(true);
    const { data, error: err } = await supabase
      .from("brands")
      .insert({ name: name.trim(), brief: brief.trim() || null, agency_id: agencyId })
      .select("id, name, brief, logo_url, created_at")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onCreated(data as Brand);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-strong rounded-2xl p-6 border border-border/40"
      >
        <h3 className="text-lg font-bold text-foreground mb-1">Nueva marca</h3>
        <p className="text-xs text-muted-foreground mb-5">Añade los datos básicos. Podrás editar todo después.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Nombre</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bacardi MX"
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono mb-1.5 block">Brief breve (opcional)</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="Marca premium de spirits enfocada en celebraciones..."
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:glow-cyan flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Creando...</> : "Crear marca"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
