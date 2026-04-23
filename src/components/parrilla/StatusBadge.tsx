import { Badge } from "@/components/ui/badge";
import type { PostStatus } from "@/types/parrilla";

const statusConfig = {
  draft: { label: "Draft", bg: "bg-muted text-muted-foreground border-border" },
  scheduled: { label: "Aprobado", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  published: { label: "Published", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

const StatusBadge = ({ status }: { status: PostStatus }) => {
  const c = statusConfig[status];
  return <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${c.bg}`}>{c.label}</Badge>;
};

export default StatusBadge;
