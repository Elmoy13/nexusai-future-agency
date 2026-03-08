import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenModal?: () => void;
}

const Navbar = ({ onOpenModal }: NavbarProps) => {
  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-2"
    >
      <div className="glass-strong rounded-full px-6 py-3 flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-accent pulse-dot" />
          <span className="text-foreground font-bold text-lg tracking-tight">
            NexusAI
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {["Producto", "Agentes", "Precios", "Docs"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onOpenModal}
          className="border-gradient-animated rounded-full px-5 py-2 text-sm font-medium text-foreground hover:glow-cyan transition-all duration-300 flex items-center gap-2"
        >
          <Sparkles size={14} className="icon-neon text-cyan-glow" />
          Acceder al Sistema
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
