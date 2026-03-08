import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";

interface HeroSectionProps {
  onOpenModal: () => void;
}

const HeroSection = ({ onOpenModal }: HeroSectionProps) => {
  const scrollToBento = () => {
    document.getElementById("bento-features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-background/80" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, hsl(210 50% 5%) 80%)",
        }}
      />

      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(var(--teal-deep))] opacity-60 blur-[120px] animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(var(--cyan-glow))] opacity-20 blur-[120px] animate-float-slower" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6"
        >
          La Agencia del Futuro.
          <br />
          <span className="text-gradient-cyan">Totalmente Autónoma.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          El primer sistema operativo multi-agente que transforma un brief en una
          estrategia de marca, genera la parrilla de contenidos y gestiona tus
          comunidades. 24/7. Sin errores humanos.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onOpenModal}
            className="group glass-strong rounded-full px-8 py-4 text-base font-semibold text-foreground hover:glow-cyan transition-all duration-500 flex items-center gap-3"
          >
            Iniciar Demostración
            <ArrowRight
              size={18}
              className="icon-neon text-cyan-glow group-hover:translate-x-1 transition-transform"
            />
          </button>
          <button
            onClick={scrollToBento}
            className="rounded-full px-8 py-4 text-base font-medium text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30 transition-all duration-300 flex items-center gap-3"
          >
            <Eye size={18} />
            Ver el Flujo de Trabajo
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
