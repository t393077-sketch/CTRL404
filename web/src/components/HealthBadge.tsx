import React from "react";

interface HealthBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function HealthBadge({ status, className = "", showDot = true }: HealthBadgeProps) {
  const norm = (status || "").toLowerCase();

  let colorClasses = "bg-slate-900/60 text-slate-400 border-slate-700";
  let dotColor = "bg-slate-500";

  if (norm === "excellent") {
    colorClasses = "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    dotColor = "bg-emerald-400";
  } else if (norm === "good") {
    colorClasses = "bg-cyan-950/60 text-cyan-400 border-cyan-800/60";
    dotColor = "bg-cyan-400";
  } else if (norm === "fair") {
    colorClasses = "bg-amber-950/60 text-amber-400 border-amber-800/60";
    dotColor = "bg-amber-400";
  } else if (norm === "poor") {
    colorClasses = "bg-red-950/60 text-red-400 border-red-800/60";
    dotColor = "bg-red-400";
  } else if (norm === "offline") {
    colorClasses = "bg-rose-950/40 text-rose-400/80 border-rose-900/40";
    dotColor = "bg-rose-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />}
      {status}
    </span>
  );
}
