import { useMemo } from "react";
import { mulberry32 } from "@/lib/market";
import { cn } from "@/lib/utils";

// ── Deterministic generative NFT art ───────────────────────────────────────
// Pure SVG, seeded per item. No external images, always instant.

interface Props {
  seed: number;
  accent: string;
  className?: string;
  rounded?: boolean;
}

export function NftArt({ seed, accent, className, rounded = true }: Props) {
  const art = useMemo(() => {
    const rnd = mulberry32(seed);
    const bgHue = Math.floor(rnd() * 360);
    const bg = `hsl(${bgHue} ${18 + rnd() * 26}% ${6 + rnd() * 9}%)`;
    const shapes: React.ReactNode[] = [];
    const kind = Math.floor(rnd() * 4);
    const count = 5 + Math.floor(rnd() * 7);
    for (let i = 0; i < count; i++) {
      const x = rnd() * 100;
      const y = rnd() * 100;
      const s = 8 + rnd() * 34;
      const o = 0.14 + rnd() * 0.55;
      const mix = rnd() > 0.72;
      const fill = mix ? `hsl(${(bgHue + 120 + rnd() * 120) % 360} 70% 60%)` : accent;
      if (kind === 0) {
        shapes.push(<circle key={i} cx={x} cy={y} r={s / 2} fill={fill} opacity={o} />);
      } else if (kind === 1) {
        shapes.push(<rect key={i} x={x} y={y} width={s} height={s} fill={fill} opacity={o} transform={`rotate(${rnd() * 90} ${x} ${y})`} />);
      } else if (kind === 2) {
        shapes.push(<polygon key={i} points={`${x},${y} ${x + s},${y + s * 0.4} ${x + s * 0.5},${y + s}`} fill={fill} opacity={o} />);
      } else {
        shapes.push(<path key={i} d={`M${x} ${y} q ${s / 2} ${-s * (0.4 + rnd())} ${s} 0`} stroke={fill} strokeWidth={1 + rnd() * 3} fill="none" opacity={o} />);
      }
    }
    const grid = rnd() > 0.5;
    return { bg, shapes, grid };
  }, [seed, accent]);

  return (
    <div className={cn("relative overflow-hidden bg-muted", rounded && "rounded-lg", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <rect width="100" height="100" fill={art.bg} />
        {art.grid && (
          <g opacity={0.18}>
            {Array.from({ length: 7 }, (_, i) => (
              <line key={i} x1="0" y1={i * 15 + 5} x2="100" y2={i * 15 + 5} stroke={accent} strokeWidth="0.3" />
            ))}
          </g>
        )}
        {art.shapes}
        <rect width="100" height="100" fill="url(#vign)" opacity="0.5" />
        <defs>
          <radialGradient id="vign" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.9" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
