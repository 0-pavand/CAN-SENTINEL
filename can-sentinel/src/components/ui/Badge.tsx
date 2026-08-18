import * as React from "react"
import { cn } from "../../utils"
import { Severity } from "../../types"

export interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  severity?: Severity;
}

function Badge({ className, variant = "default", severity, ...props }: BadgeProps) {
  let severityClasses = "";
  if (severity) {
    switch (severity) {
      case 'Critical':
        severityClasses = "border-rose-500/50 bg-rose-500/20 text-rose-500";
        break;
      case 'High':
        severityClasses = "border-amber-500/50 bg-amber-500/20 text-amber-500";
        break;
      case 'Medium':
        severityClasses = "border-[#38bdf8]/50 bg-[#38bdf8]/20 text-[#38bdf8]";
        break;
      case 'Low':
        severityClasses = "border-slate-500/50 bg-slate-500/20 text-slate-500 dark:text-slate-400";
        break;
    }
  } else {
    severityClasses = {
      default: "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#1e2128] text-slate-900 dark:text-white",
      secondary: "border-transparent bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
      outline: "text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700",
    }[variant] || "";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors",
        severityClasses,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
