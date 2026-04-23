import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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

export default ShimmerSkeleton;
