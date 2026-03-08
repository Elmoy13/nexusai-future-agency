import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, FileDown, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
}

const stages = [
  { at: 15, msg: "Compilando assets..." },
  { at: 40, msg: "Generando tipografías..." },
  { at: 65, msg: "Renderizando diapositivas..." },
  { at: 85, msg: "Optimizando resolución..." },
  { at: 100, msg: "PDF Listo" },
];

const ExportPdfModal = ({ open, title, onClose }: Props) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(stages[0].msg);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setMessage(stages[0].msg);
    setDone(false);
  }, []);

  useEffect(() => {
    if (!open) { reset(); return; }

    let frame: number;
    const start = Date.now();
    const duration = 3000;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      const stage = [...stages].reverse().find((s) => pct >= s.at);
      if (stage) setMessage(stage.msg);

      if (pct >= 100) { setDone(true); return; }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, reset]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border/40 shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pr-4">
            <h3 className="text-sm font-bold text-foreground">Exportar a PDF</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">
            <p className="text-xs text-muted-foreground truncate">{title}</p>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2.5 bg-secondary/60" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{message}</span>
                <span className="text-xs font-bold text-foreground tabular-nums">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Done state */}
            <AnimatePresence>
              {done && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 pt-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Archivo generado exitosamente</p>
                  <Button onClick={onClose} className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold text-sm">
                    <FileDown size={15} /> Descargar Archivo
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportPdfModal;
