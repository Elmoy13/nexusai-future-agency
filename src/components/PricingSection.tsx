import { motion } from "framer-motion";
import { Rocket, Shield, Check } from "lucide-react";

interface PricingSectionProps {
  onOpenModal?: () => void;
}

const tiers = [
  {
    name: "Despliegue de Agentes",
    description: "Para agencias que quieren escalar su operación con IA.",
    icon: Rocket,
    features: [
      "Auditoría completa de tu marca",
      "Entrenamiento de IA con tu Look & Feel",
      "Automatización de parrillas de contenido",
      "Agentes de moderación 24/7",
      "Soporte prioritario dedicado",
    ],
    cta: "Agendar Llamada de Viabilidad",
    featured: true,
  },
  {
    name: "Enterprise & Custom",
    description: "Para corporativos con necesidades a medida.",
    icon: Shield,
    features: [
      "Modelos LLM privados (Llama 3 local)",
      "SLA 99.9% garantizado",
      "Infraestructura dedicada",
      "Agentes ilimitados",
      "Onboarding personalizado",
    ],
    cta: "Contactar Equipo",
    featured: false,
  },
];

const PricingSection = ({ onOpenModal }: PricingSectionProps) => {
  return (
    <section id="pricing" className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-mono tracking-widest uppercase">
            Planes
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
            Soluciones a la Medida{" "}
            <span className="text-gradient-cyan">de tu Agencia</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Cada despliegue se adapta a tu operación. Sin planes genéricos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  tier.featured ? "glass-strong glow-border" : "glass"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                      RECOMENDADO
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${tier.featured ? "bg-primary/20" : "bg-secondary"}`}>
                    <Icon size={20} className={tier.featured ? "text-primary icon-neon" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <Check size={14} className="text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onOpenModal}
                  className={`w-full rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
                    tier.featured
                      ? "bg-primary text-primary-foreground hover:glow-cyan"
                      : "border border-border hover:border-primary/50 text-foreground hover:text-primary"
                  }`}
                >
                  {tier.cta}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
