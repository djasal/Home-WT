import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/16 text-amber-700 dark:text-amber-300",
  danger: "bg-rose-500/14 text-rose-700 dark:text-rose-300"
};

export const Badge = ({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) => (
  <span
    className={cn(
      "inline-flex min-h-7 items-center rounded-lg px-2.5 text-xs font-medium",
      toneClasses[tone],
      className
    )}
    {...props}
  />
);
