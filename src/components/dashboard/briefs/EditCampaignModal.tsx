import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, ImagePlus } from "lucide-react";
import type { Campaign } from "./campaignData";

interface Props {
  campaign: Campaign | null;
  onClose: () => void;
  onSave: (id: string, title: string, subtitle: string) => void;
}

const EditCampaignModal = ({ campaign, onClose, onSave }: Props) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title);
      setSubtitle(campaign.subtitle);
    }
  }, [campaign]);

  if (!campaign) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />

      {/* Slide-over panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border/40 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
          <h2 className="text-lg font-bold text-foreground">Editar Campaña</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cover preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border/30 shadow-sm">
            <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/15 text-white/80 text-xs font-medium hover:bg-black/70 transition-colors">
              <ImagePlus size={13} /> Cambiar portada
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Título de la Campaña</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtítulo / Descripción</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="h-11 text-sm"
              />
            </div>
          </div>

          {/* Slide count info */}
          <div className="bg-secondary/40 rounded-xl p-4 border border-border/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Diapositivas</p>
            <p className="text-sm text-foreground">{campaign.slides.length} slides en esta presentación</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancelar</Button>
          <Button
            onClick={() => {
              onSave(campaign.id, title, subtitle);
              onClose();
            }}
            className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold"
          >
            <Save size={15} /> Guardar Cambios
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditCampaignModal;
