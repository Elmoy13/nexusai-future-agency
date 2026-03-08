import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Zap } from "lucide-react";

const metrics = [
  { icon: Zap, value: "x10", label: "Productividad del equipo" },
  { icon: DollarSign, value: "80%", label: "Ahorro en costos operativos" },
  { icon: TrendingUp, value: "+42%", label: "ROI promedio en campañas" },
];

const ROIMetrics = () => {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong rounded-2xl border border-cyan-glow/10 p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="text-center"
                >
                  <Icon size={24} className="icon-neon text-cyan-glow mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-5xl md:text-6xl font-black tracking-tight text-gradient-cyan mb-2">
                    {m.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROIMetrics;
