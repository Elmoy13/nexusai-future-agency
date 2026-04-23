import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Building2, Megaphone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import { PRODUCT } from "@/config/product";

interface NavbarProps {
  onOpenModal?: () => void;
}

const Navbar = ({ onOpenModal }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  const openDropdown = () => {
    clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const closeDropdown = () => {
    timeoutRef.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  const useCases = [
    { icon: Building2, label: "Para Agencias de Marketing", sub: "Escala tus operaciones x10" },
    { icon: Megaphone, label: "Para Marcas Directas", sub: "Tu equipo in-house autónomo" },
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
          <span className="text-foreground font-bold text-lg tracking-tight">{PRODUCT.name}</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("onboarding-chat")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-none cursor-pointer"
          >
            El Sistema
          </button>
          <button
            onClick={() => scrollToSection("bento-features")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-none cursor-pointer"
          >
            Metodología
          </button>

          {/* Casos de Uso dropdown */}
          <div className="relative" onMouseEnter={openDropdown} onMouseLeave={closeDropdown}>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-none cursor-pointer flex items-center gap-1">
              Casos de Uso
              <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 backdrop-blur-md bg-[hsl(210_50%_8%/0.9)] rounded-xl border border-primary/20 overflow-hidden"
                >
                  {useCases.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { setDropdownOpen(false); onOpenModal?.(); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors duration-200 text-left border-none bg-transparent cursor-pointer"
                    >
                      <item.icon size={16} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => scrollToSection("pricing")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-none cursor-pointer"
          >
            Precios
          </button>
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
