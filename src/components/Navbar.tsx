import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface NavbarProps {
  onOpenModal?: () => void;
}

const Navbar = ({ onOpenModal }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogoClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDocsClick = () => {
    toast("Documentación encriptada", {
      description: "Acceso disponible en la v1.0",
      icon: <Lock size={16} />,
    });
  };

  const navItems = [
    { label: "Producto", action: () => scrollToSection("onboarding-chat") },
    { label: "Agentes", action: () => scrollToSection("bento-features") },
    { label: "Precios", action: () => scrollToSection("pricing") },
    { label: "Docs", action: handleDocsClick },
  ];

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-2"
    >
      <div className="glass-strong rounded-full px-6 py-3 flex items-center gap-8">
        <button onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
          <span className="text-foreground font-bold text-lg tracking-tight">
            NexusAI
          </span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-none cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="border-gradient-animated rounded-full px-5 py-2 text-sm font-medium text-foreground hover:glow-cyan transition-all duration-300 flex items-center gap-2"
        >
          <Sparkles size={14} className="icon-neon text-primary" />
          Acceder al Sistema
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
