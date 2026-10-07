import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "rose" | "blue";
};

const toneClasses = {
  teal: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  amber: "bg-amber-500/16 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/14 text-rose-700 dark:text-rose-300",
  blue: "bg-sky-500/14 text-sky-700 dark:text-sky-300"
};

export const MetricCard = ({ title, value, detail, icon: Icon, tone = "teal" }: MetricCardProps) => (
  <Card>
    <CardContent className="flex items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
    </CardContent>
  </Card>
);
