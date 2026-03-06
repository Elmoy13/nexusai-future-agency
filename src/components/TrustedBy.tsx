import { motion } from "framer-motion";
import { Hexagon, Triangle, Diamond, Pentagon, Circle, Square } from "lucide-react";

const logos = [
  { icon: Hexagon, name: "Acme Corp" },
  { icon: Triangle, name: "Global Media" },
  { icon: Diamond, name: "Vertex Labs" },
  { icon: Pentagon, name: "Synth Digital" },
  { icon: Circle, name: "Orbit Agency" },
  { icon: Square, name: "Forma Studio" },
];

const TrustedBy = () => {
  const doubled = [...logos, ...logos];

  return (
    <section className="relative py-20 overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-xs tracking-[0.3em] uppercase text-muted-foreground/50 mb-12"
      >
        Potenciando a las agencias más disruptivas
      </motion.p>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex marquee">
          {doubled.map((logo, i) => {
            const Icon = logo.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 mx-10 shrink-0 opacity-30 hover:opacity-60 transition-opacity"
              >
                <Icon size={22} strokeWidth={1.5} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {logo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
