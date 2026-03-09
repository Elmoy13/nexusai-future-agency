import { useEffect, useMemo, useRef, useState } from "react";
import type { SlideElement } from "@/components/dashboard/briefs/campaignData";

const CANVAS_W = 1920;
const CANVAS_H = 1080;

function buildTransform(el: SlideElement): string {
  const parts: string[] = [];
  if (typeof (el as any).rotation === "number") parts.push(`rotate(${(el as any).rotation}deg)`);
  if ((el as any).flipH) parts.push("scaleX(-1)");
  if ((el as any).flipV) parts.push("scaleY(-1)");
  return parts.length ? parts.join(" ") : "none";
}

const ReadOnlyElement = ({ el }: { el: SlideElement }) => {
  const transform = buildTransform(el);

  if (el.type === "image" || el.type === "gif") {
    return (
      <div
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width ?? 400,
          height: el.height ?? 400,
          opacity: (el as any).opacity ?? 1,
          zIndex: el.zIndex ?? 0,
          transform,
        }}
      >
        <img src={el.content} alt="" className="w-full h-full object-cover" draggable={false} />
      </div>
    );
  }

  if (el.type === "shape") {
    const w = el.width ?? 160;
    const h = el.height ?? 160;
    const color = el.content || "hsl(var(--primary))";

    return (
      <div
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: w,
          height: h,
          zIndex: el.zIndex ?? 0,
          transform,
          background: color,
          borderRadius: 16,
        }}
      />
    );
  }

  // text (default)
  return (
    <div
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: typeof el.width === "number" ? el.width : 600,
        height: typeof el.height === "number" ? el.height : "auto",
        fontSize: (el as any).fontSize ?? 28,
        fontWeight: (el as any).fontWeight ?? "400",
        color: (el as any).color ?? "hsl(var(--foreground))",
        lineHeight: 1.3,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        fontFamily: (el as any).fontFamily ?? "Inter",
        textAlign: ((el as any).textAlign ?? "left") as any,
        zIndex: el.zIndex ?? 0,
        transform,
      }}
    >
      {el.content}
    </div>
  );
};

export const ScaledSlidePreview = ({
  elements,
  bgImage,
  backgroundColor,
  className,
}: {
  elements: SlideElement[];
  bgImage?: string;
  backgroundColor?: string;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  const sorted = useMemo(() => {
    return [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }, [elements]);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const recalc = () => {
      const rect = el.getBoundingClientRect();
      const sx = rect.width / CANVAS_W;
      const sy = rect.height / CANVAS_H;
      setScale(Math.min(sx, sy));
    };

    recalc();

    const ro = new ResizeObserver(() => recalc());
    ro.observe(el);
    window.addEventListener("resize", recalc);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div className="absolute left-1/2 top-1/2" style={{ width: CANVAS_W, height: CANVAS_H, marginLeft: -CANVAS_W / 2, marginTop: -CANVAS_H / 2, transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <div
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            position: "relative",
            overflow: "hidden",
            background: backgroundColor ?? "hsl(var(--background))",
          }}
        >
          {bgImage ? (
            <>
              <img
                src={bgImage}
                alt=""
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
            </>
          ) : null}

          <div className="absolute inset-0">
            {sorted.map((el) => (
              <ReadOnlyElement key={el.id} el={el} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
