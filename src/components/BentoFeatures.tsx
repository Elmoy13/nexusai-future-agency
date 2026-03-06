import { motion } from "framer-motion";
import { BrainCircuit, Layers, MessageSquareWarning } from "lucide-react";

const cards = [
  {
    icon: BrainCircuit,
    title: "El Cerebro",
    subtitle: "Estrategia Autónoma",
    description:
      "Ingesta de briefs con razonamiento avanzado. Analiza mercados, audiencias y competencia en tiempo real.",
    span: "md:col-span-2 md:row-span-2",
    large: true,
  },
  {
    icon: Layers,
    title: "El Motor",
    subtitle: "Parrillas Multimodales",
    description: "Copy y diseño en un clic. Contenido optimizado para cada plataforma.",
    span: "md:col-span-1",
    large: false,
  },
  {
    icon: MessageSquareWarning,
    title: "El CM",
    subtitle: "RAG Omnicanal",
    description: "Resolución de crisis en milisegundos. Moderación inteligente 24/7.",
    span: "md:col-span-1",
    large: false,
  },
];

const BentoFeatures = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Arquitectura de{" "}
            <span className="text-gradient-cyan">Agentes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tres módulos autónomos que trabajan en sincronía perfecta.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`group relative overflow-hidden rounded-2xl border border-cyan-glow/10 hover:border-cyan-glow/30 transition-all duration-500 hover:scale-[1.02] hover:glow-border ${card.span}`}
              >
                {/* BG texture */}
                <div
                  className="absolute inset-0 opacity-[0.03] mix-blend-luminosity bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1000&auto=format&fit=crop')",
                  }}
                />
                <div className="absolute inset-0 bg-card/90 backdrop-blur-3xl" />

                <div
                  className={`relative z-10 p-8 ${card.large ? "md:p-12" : ""} flex flex-col justify-end h-full min-h-[240px] ${card.large ? "md:min-h-[500px]" : ""}`}
                >
                  <Icon
                    size={card.large ? 48 : 32}
                    className="icon-neon text-cyan-glow mb-6"
                    strokeWidth={1.5}
                  />
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {card.subtitle}
                  </p>
                  <h3
                    className={`font-bold tracking-tight mb-3 ${card.large ? "text-3xl md:text-4xl" : "text-xl"}`}
                  >
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-md">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BentoFeatures;
