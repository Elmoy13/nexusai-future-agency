import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles, Hexagon, Triangle, Diamond, Circle, Rocket, CalendarDays,
  FileText, ChevronRight, BarChart3, Layers, Plus, Upload, Building2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Brand {
  name: string;
  icon: React.ElementType;
  status: "healthy" | "needs-attention";
  campaigns: { emoji: React.ElementType; name: string }[];
  totalBriefs: number;
  accent: string;
}

const defaultBrands: Brand[] = [
  {
    name: "Aero Dynamics",
    icon: Hexagon,
    status: "healthy",
    campaigns: [
      { emoji: Rocket, name: "Lanzamiento Drone X" },
      { emoji: CalendarDays, name: "Parrilla Mensual Mayo" },
    ],
    totalBriefs: 7,
    accent: "hsl(var(--primary))",
  },
  {
    name: "Freshly Brewed",
    icon: Triangle,
    status: "healthy",
    campaigns: [
      { emoji: Rocket, name: "Cold Brew Summer '25" },
      { emoji: FileText, name: "Rebranding Orgánico" },
    ],
    totalBriefs: 5,
    accent: "hsl(160 100% 45%)",
  },
  {
    name: "UrbanPulse",
    icon: Diamond,
    status: "needs-attention",
    campaigns: [
      { emoji: Rocket, name: "Drop Streetwear Q3" },
      { emoji: CalendarDays, name: "TikTok Sprint Julio" },
      { emoji: FileText, name: "Manifiesto Gen-Z" },
    ],
    totalBriefs: 12,
    accent: "hsl(270 80% 60%)",
  },
  {
    name: "CloudNest",
    icon: Circle,
    status: "healthy",
    campaigns: [
      { emoji: Rocket, name: "Launch PLG Motion" },
    ],
    totalBriefs: 3,
    accent: "hsl(200 90% 55%)",
  },
];

const iconPool: React.ElementType[] = [Hexagon, Triangle, Diamond, Circle];
const sectors = ["Tecnología", "Salud", "Alimentos", "Retail", "Finanzas", "Educación", "Entretenimiento", "Logística"];

interface Props {
  onOpenBrand: (brandName: string) => void;
  onNewBrand: () => void;
}

const BrandPortfolioDirectory = ({ onOpenBrand, onNewBrand }: Props) => {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>(defaultBrands);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSector, setNewSector] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newBrand: Brand = {
      name: newName.trim(),
      icon: iconPool[brands.length % iconPool.length],
      status: "healthy",
      campaigns: [],
      totalBriefs: 0,
      accent: "hsl(var(--primary))",
    };
    setBrands((prev) => [newBrand, ...prev]);
    setShowModal(false);
    setNewName("");
    setNewSector("");
    toast({
      title: "✅ Cliente registrado",
      description: `El entorno de "${newBrand.name}" ha sido creado. Ahora puedes agregar Briefs, Parrillas e Inbox.`,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Estrategia y Briefs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona el cerebro y la identidad de todos tus clientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowModal(true)}
            variant="outline"
            className="gap-2 h-11 px-5 font-semibold border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
          >
            <Plus size={16} /> Nuevo Cliente
          </Button>
          <Button
            onClick={onNewBrand}
            className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 gap-2 h-11 px-6 font-semibold shadow-sm"
          >
            <Sparkles size={16} /> Entrenar Nueva Marca
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {brands.map((brand, i) => {
          const Icon = brand.icon;
          return (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <Card className="group bg-card/60 border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  {/* Brand header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                        <Icon size={22} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{brand.name}</h3>
                        <Badge
                          variant="secondary"
                          className={`mt-1 text-[10px] px-2 py-0 h-5 font-medium border ${
                            brand.status === "healthy"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/15"
                          }`}
                        >
                          {brand.status === "healthy" ? (brand.campaigns.length === 0 ? "Nuevo — Sin campañas" : "Portafolio Saludable") : "Requiere Atención"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 size={13} />
                      <span className="text-xs font-semibold">{brand.totalBriefs} briefs</span>
                    </div>
                  </div>

                  {/* Campaigns */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers size={12} className="text-primary/60" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Campañas Activas
                      </span>
                    </div>
                    {brand.campaigns.length === 0 && (
                      <p className="text-xs text-muted-foreground/50 italic py-2">Sin campañas aún — Entrena la marca o crea un Brief.</p>
                    )}
                    {brand.campaigns.map((c) => {
                      const CIcon = c.emoji;
                      return (
                        <div
                          key={c.name}
                          className="flex items-center gap-2.5 text-sm text-foreground/80 bg-secondary/30 rounded-lg px-3 py-2 border border-border/20"
                        >
                          <CIcon size={14} className="text-primary/70 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => onOpenBrand(brand.name)}
                    variant="ghost"
                    className="w-full h-10 text-xs text-primary/80 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 gap-1.5 font-semibold"
                  >
                    Abrir Portafolio Completo <ChevronRight size={14} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ NEW CLIENT MODAL ═══ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Building2 size={20} className="text-primary" />
              Agregar Nuevo Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nombre de la Empresa
              </label>
              <Input
                placeholder="Ej. Nexus Corp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-muted/20 border-border/30"
              />
            </div>

            {/* Sector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sector / Industria
              </label>
              <Select value={newSector} onValueChange={setNewSector}>
                <SelectTrigger className="bg-muted/20 border-border/30">
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Logo Dropzone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Logo (Opcional)
              </label>
              <div className="border border-dashed border-border/30 rounded-xl p-5 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <Upload size={20} className="mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Arrastra o haz clic para subir</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-muted-foreground">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 gap-2"
            >
              <Plus size={14} /> Crear Espacio de Trabajo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BrandPortfolioDirectory;
