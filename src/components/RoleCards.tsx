import { motion } from "framer-motion";
import { Radar, CalendarDays, Wand2, MessageCircle } from "lucide-react";

const roles = [
  {
    icon: Radar,
    title: "Planner / Estratega",
    description: "Análisis de competencia y mapeo del Performance Code en tiempo real.",
  },
  {
    icon: CalendarDays,
    title: "Content Manager",
    description: "Estrategia de tópicos y parrillas de contenido masivas.",
  },
  {
    icon: Wand2,
    title: "Diseñador & Animador",
    description: "Generación visual alineada al look & feel, y assets para Reels.",
  },
  {
    icon: MessageCircle,
    title: "Community Manager",
    description: "Moderación, publicación y engagement 24/7.",
  },
];

const RoleCards = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-mono tracking-widest uppercase">
            La Evolución del Equipo
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
            Automatización a{" "}
            <span className="text-gradient-cyan">Nivel de Rol</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Cada rol crítico de tu agencia, potenciado por un agente de IA especializado.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, i) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative glass rounded-2xl p-6 cursor-default overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.35)]"
              >
                {/* hover glow overlay */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/[0.08] to-transparent" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary icon-neon" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.description}
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

export default RoleCards;
