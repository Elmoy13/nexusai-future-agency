import { motion } from "framer-motion";
import { Zap, Rocket, Shield, Check } from "lucide-react";

interface PricingSectionProps {
  onOpenModal?: () => void;
}

const tiers = [
  {
    name: "Piloto",
    description: "Para probar el sistema",
    price: "$499",
    period: "/mes",
    icon: Zap,
    features: [
      "1 Agente activo",
      "5 campañas/mes",
      "Soporte por email",
      "Dashboard básico",
    ],
    cta: "Comenzar Prueba",
    featured: false,
  },
  {
    name: "Agencia Autónoma",
    description: "El ecosistema completo",
    price: "$1,499",
    period: "/mes",
    icon: Rocket,
    features: [
      "3 Agentes en sincronía",
      "Campañas ilimitadas",
      "Integración de Webhooks",
      "Soporte prioritario 24/7",
      "Analytics avanzados",
    ],
    cta: "Iniciar Despliegue",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "Para corporativos",
    price: "Custom",
    period: "",
    icon: Shield,
    features: [
      "Modelos LLM privados (Llama 3 local)",
      "SLA 99.9%",
      "Agentes ilimitados",
      "Infraestructura dedicada",
      "Onboarding personalizado",
    ],
    cta: "Agendar Llamada",
    featured: false,
  },
];

const PricingSection = ({ onOpenModal }: PricingSectionProps) => {
  return (
    <section id="pricing" className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-mono tracking-widest uppercase">
            Planes & Precios
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-4">
            Escala tu agencia.{" "}
            <span className="text-gradient-cyan">Sin fricción.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Elige el plan que se adapte a tu operación. Sin contratos largos, cancela cuando quieras.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-center">
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
                  tier.featured
                    ? "md:-mt-4 md:mb-4 glass-strong glow-border scale-[1.02]"
                    : "glass"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full tracking-wide">
                      MÁS POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${tier.featured ? "bg-primary/20" : "bg-secondary"}`}>
                    <Icon size={20} className={tier.featured ? "text-primary icon-neon" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className={`text-4xl font-black ${tier.featured ? "text-gradient-cyan" : "text-foreground"}`}>
                    {tier.price}
                  </span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
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
