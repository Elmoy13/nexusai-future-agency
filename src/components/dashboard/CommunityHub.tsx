import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Users, Hexagon, Sparkles, MessageCircle, Plus, Upload, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BrandData {
  id: string;
  name: string;
  campaigns: { id: string; name: string; unreadCount: number; aiResponses: number; humanRequired: number }[];
}

const sectors = ["Tecnología", "Salud", "Alimentos", "Retail", "Finanzas", "Educación", "Entretenimiento", "Logística"];

const CommunityHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [brands, setBrands] = useState<BrandData[]>([
    {
      id: "aero-dynamics",
      name: "Aero Dynamics",
      campaigns: [
        { id: "drone-x10", name: "Lanzamiento Drone X10", unreadCount: 12, aiResponses: 47, humanRequired: 3 },
      ],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSector, setNewSector] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, "-");
    setBrands((prev) => [
      { id: slug, name: newName.trim(), campaigns: [] },
      ...prev,
    ]);
    setShowModal(false);
    setNewName("");
    setNewSector("");
    toast({
      title: "✅ Cliente registrado",
      description: `El entorno de "${newName.trim()}" ha sido creado. Ahora puedes configurar su Inbox.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="text-primary" size={28} />
            Community & Social
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona la comunicación omnicanal con IA autónoma y base de conocimiento RAG.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          variant="outline"
          className="gap-2 h-11 px-5 font-semibold border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
        >
          <Plus size={16} /> Nuevo Cliente
        </Button>
      </div>

      {/* Brands Grid */}
      <div className="grid gap-6">
        {brands.map((brand) => (
          <Card
            key={brand.id}
            className="bg-card/50 border-border/30 hover:border-primary/30 transition-all duration-300"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center border border-primary/30">
                    <Hexagon className="text-primary" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {brand.campaigns.length > 0 ? "Inbox activo" : "Nuevo — Configura su Inbox"}
                    </p>
                  </div>
                </div>
                {brand.campaigns.length > 0 && (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    <Users size={12} className="mr-1" />
                    {brand.campaigns.reduce((acc, c) => acc + c.unreadCount, 0)} sin leer
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {brand.campaigns.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic py-3">Sin campañas aún — Crea un Brief para activar el Inbox.</p>
              )}
              {brand.campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-xl bg-muted/20 border border-border/20 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="text-cyan-400" size={18} />
                      <span className="font-medium">{campaign.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {campaign.aiResponses} respuestas IA
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        🧑‍💻 {campaign.humanRequired} requiere humano
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => navigate(`/community/${campaign.id}`)}
                      className="bg-gradient-to-r from-primary/80 to-cyan-500/80 hover:from-primary hover:to-cyan-500 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <Sparkles size={14} className="mr-2" />
                      💬 Abrir Omnichannel Inbox
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre de la Empresa</label>
              <Input placeholder="Ej. Nexus Corp" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-muted/20 border-border/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sector / Industria</label>
              <Select value={newSector} onValueChange={setNewSector}>
                <SelectTrigger className="bg-muted/20 border-border/30"><SelectValue placeholder="Selecciona un sector" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logo (Opcional)</label>
              <div className="border border-dashed border-border/30 rounded-xl p-5 text-center hover:border-primary/30 transition-colors cursor-pointer">
                <Upload size={20} className="mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Arrastra o haz clic para subir</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-muted-foreground">Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 gap-2">
              <Plus size={14} /> Crear Espacio de Trabajo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityHub;
