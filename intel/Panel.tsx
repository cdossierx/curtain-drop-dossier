import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "violet" | "amber" | "rose" | "none";
};

const glowMap = {
  cyan: "before:bg-cyan-500/20",
  violet: "before:bg-violet-500/20",
  amber: "before:bg-amber-500/15",
  rose: "before:bg-rose-500/15",
  none: "before:bg-transparent",
};

export function Panel({ title, subtitle, action, children, className, glow = "none" }: PanelProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        "before:pointer-events-none before:absolute before:inset-0 before:opacity-60",
        glowMap[glow],
        className,
      )}
    >
      <div className="relative border-b border-white/[0.06] px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-zinc-100">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="relative p-5">{children}</div>
    </section>
  );
}
