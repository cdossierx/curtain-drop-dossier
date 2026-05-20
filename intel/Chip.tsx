import { cn } from "@/lib/utils";

type ChipProps = {
  children: React.ReactNode;
  tone?: "neutral" | "cyan" | "violet" | "amber" | "rose";
  className?: string;
};

const toneStyles = {
  neutral: "border-zinc-600/40 bg-zinc-800/50 text-zinc-300",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

export function Chip({ children, tone = "neutral", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
