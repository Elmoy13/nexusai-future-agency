import slideDroneImg from "@/assets/slide-drone-x10.jpg";
import slideAeroImg from "@/assets/slide-aero-pro.jpg";
import slideStrategyImg from "@/assets/slide-strategy-2024.jpg";
import slideRrssImg from "@/assets/slide-rrss-mayo.jpg";
import slidePersonaImg from "@/assets/slide-target-persona.jpg";
import slideMoodboardImg from "@/assets/slide-moodboard.jpg";

export type SlideStatus = "approved" | "in-progress" | "sent" | "draft";

export interface SlideData {
  id: string;
  type: "cover" | "content" | "art";
  title: string;
  body?: string;
  image?: string;
  bullets?: string[];
  colors?: { name: string; hex: string }[];
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  status: SlideStatus;
  slides: SlideData[];
}

export const statusConfig: Record<SlideStatus, { label: string; dot: string; bg: string }> = {
  approved:      { label: "Approved",       dot: "bg-emerald-500", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  "in-progress": { label: "In Progress",    dot: "bg-amber-500",   bg: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  sent:          { label: "Sent to Client", dot: "bg-sky-500",     bg: "bg-sky-500/10 text-sky-600 border-sky-500/25" },
  draft:         { label: "Draft",          dot: "bg-muted-foreground", bg: "bg-muted/60 text-muted-foreground border-border/40" },
};

export const allStatuses: SlideStatus[] = ["approved", "in-progress", "sent", "draft"];

export const initialCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Lanzamiento Drone X10",
    subtitle: "Campaña de producto · Q1 2025",
    image: slideDroneImg,
    status: "approved",
    slides: [
      { id: "1-1", type: "cover", title: "Campaña Lanzamiento Q1 2025", body: "Estrategia integral de go-to-market para el segmento enterprise. Generado con IA Estratégica.", image: slideDroneImg },
      { id: "1-2", type: "content", title: "Público Objetivo", body: "Ejecutivos C-Level en empresas de tecnología", image: slidePersonaImg, bullets: ["Eficiencia Operativa: Reducir tiempos de inspección aérea en un 60%", "Integración Tecnológica: Soluciones compatibles con IoT existente", "ROI Demostrable: Métricas claras, ciclo de decisión 45 días", "Escalabilidad: Opera en 3 países sin infraestructura adicional"] },
      { id: "1-3", type: "art", title: "Dirección de Arte", body: "Moodboard & Identidad Visual", image: slideMoodboardImg, colors: [{ name: "Cyan Primary", hex: "#06B6D4" }, { name: "Deep Navy", hex: "#0F172A" }, { name: "Soft Slate", hex: "#E2E8F0" }, { name: "Accent Teal", hex: "#14B8A6" }] },
    ],
  },
  {
    id: "2",
    title: "Campaña 'Aero Pro' Verano",
    subtitle: "Brand awareness · Summer '25",
    image: slideAeroImg,
    status: "in-progress",
    slides: [
      { id: "2-1", type: "cover", title: "Aero Pro · Summer Campaign", body: "Posicionamiento de marca lifestyle para atletas de élite. Activación multi-canal.", image: slideAeroImg },
      { id: "2-2", type: "content", title: "Audiencia Target", body: "Atletas profesionales y entusiastas fitness 25-40", image: slidePersonaImg, bullets: ["Performance: Buscan tecnología que mejore su rendimiento", "Comunidad: Valoran marcas con propósito y comunidad activa", "Premium: Dispuestos a pagar más por calidad comprobada", "Digital-first: Descubren productos en redes sociales"] },
      { id: "2-3", type: "art", title: "Identidad Visual", body: "Estética deportiva y futurista", image: slideMoodboardImg, colors: [{ name: "Electric Blue", hex: "#3B82F6" }, { name: "Carbon Black", hex: "#171717" }, { name: "Neon Green", hex: "#22C55E" }, { name: "Platinum", hex: "#F5F5F5" }] },
    ],
  },
  {
    id: "3",
    title: "Estrategia Anual 2024",
    subtitle: "Planificación estratégica · FY24",
    image: slideStrategyImg,
    status: "sent",
    slides: [
      { id: "3-1", type: "cover", title: "Estrategia Anual FY2024", body: "Roadmap completo de comunicación, posicionamiento y growth para el año fiscal.", image: slideStrategyImg },
      { id: "3-2", type: "content", title: "Objetivos Clave", body: "Métricas de crecimiento y KPIs principales", image: slidePersonaImg, bullets: ["Crecimiento de revenue: +35% YoY en segmento B2B", "Brand Awareness: Alcanzar 85% de reconocimiento en mercado target", "Customer Acquisition Cost: Reducir CAC en un 20%", "NPS: Mantener score superior a 72 puntos"] },
      { id: "3-3", type: "art", title: "Guidelines Visuales", body: "Sistema de diseño corporativo 2024", image: slideMoodboardImg, colors: [{ name: "Corporate Blue", hex: "#1E40AF" }, { name: "Trust Gray", hex: "#6B7280" }, { name: "Success", hex: "#059669" }, { name: "Clean White", hex: "#FAFAFA" }] },
    ],
  },
  {
    id: "4",
    title: "Brief de RRSS Mayo",
    subtitle: "Social media · Mayo 2025",
    image: slideRrssImg,
    status: "draft",
    slides: [
      { id: "4-1", type: "cover", title: "Social Media Brief · Mayo 2025", body: "Calendario editorial y estrategia de contenido para todas las plataformas sociales.", image: slideRrssImg },
      { id: "4-2", type: "content", title: "Pilares de Contenido", body: "Distribución temática del mes", image: slidePersonaImg, bullets: ["Educativo (40%): Tutoriales, tips y how-tos de producto", "Inspiracional (25%): Casos de éxito y testimoniales", "Promocional (20%): Lanzamientos y ofertas especiales", "Engagement (15%): Encuestas, Q&A y contenido UGC"] },
      { id: "4-3", type: "art", title: "Guía Visual RRSS", body: "Templates y assets para social media", image: slideMoodboardImg, colors: [{ name: "Instagram Pink", hex: "#E1306C" }, { name: "Story Violet", hex: "#833AB4" }, { name: "Feed Blue", hex: "#405DE6" }, { name: "Clean BG", hex: "#FAFAFA" }] },
    ],
  },
];
