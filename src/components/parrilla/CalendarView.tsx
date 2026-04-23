import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PlatformIcon from "@/components/parrilla/PlatformIcon";
import type { PostCard } from "@/types/parrilla";

/* ── Mini Card for Calendar ── */
const MiniPostCard = ({ post }: { post: PostCard }) => {
  const platformColors: Record<string, string> = {
    instagram: "from-pink-500 via-red-500 to-yellow-500",
    tiktok: "from-slate-900 to-slate-700",
    linkedin: "from-blue-600 to-blue-700",
    twitter: "from-slate-800 to-slate-900",
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="w-8 h-8 rounded-md overflow-hidden bg-secondary shrink-0"><img src={post.image} alt="" className="w-full h-full object-cover" /></div>
      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${platformColors[post.platform] || "from-slate-700 to-slate-800"} flex items-center justify-center`}><PlatformIcon platform={post.platform} size={10} /></div>
    </motion.div>
  );
};

/* ── Calendar View ── */
const CalendarView = ({ posts }: { posts: PostCard[] }) => {
  const daysInMonth = 31;
  const firstDayOfWeek = 1;
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const postsByDay = useMemo(() => {
    const map: Record<number, PostCard[]> = {};
    posts.forEach((p) => { if (p.calendarDay) { if (!map[p.calendarDay]) map[p.calendarDay] = []; map[p.calendarDay].push(p); } });
    return map;
  }, [posts]);
  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><ChevronLeft size={18} /></Button>
          <h2 className="text-xl font-bold text-foreground">Julio 2025</h2>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><ChevronRight size={18} /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((d) => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => (
          <motion.div key={i} whileHover={{ scale: day ? 1.02 : 1 }}
            className={`min-h-[120px] rounded-xl border transition-all ${day ? "bg-card border-border hover:border-primary/30 hover:shadow-md cursor-pointer" : "bg-secondary/30 border-transparent"}`}
          >
            {day && (
              <div className="p-2 h-full flex flex-col">
                <span className={`text-sm font-semibold mb-2 ${postsByDay[day]?.length ? "text-foreground" : "text-muted-foreground"}`}>{day}</span>
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {postsByDay[day]?.slice(0, 2).map((post) => <MiniPostCard key={post.id} post={post} />)}
                  {postsByDay[day]?.length > 2 && <p className="text-[10px] text-muted-foreground font-medium">+{postsByDay[day].length - 2} más</p>}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
