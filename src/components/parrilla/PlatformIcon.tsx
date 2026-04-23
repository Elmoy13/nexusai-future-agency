import { Instagram, Linkedin, Twitter } from "lucide-react";

/* ── TikTok Icon ── */
export const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

/* ── Platform Icon Helper ── */
const PlatformIcon = ({ platform, size = 16 }: { platform: string; size?: number }) => {
  if (platform === "instagram") return <Instagram size={size} />;
  if (platform === "tiktok") return <TikTokIcon size={size} />;
  if (platform === "twitter") return <Twitter size={size} />;
  return <Linkedin size={size} />;
};

export default PlatformIcon;
