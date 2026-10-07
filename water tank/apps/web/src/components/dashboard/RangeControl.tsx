import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RangeKey = "hour" | "today" | "7d" | "30d";

const getRanges = (t: any): Array<{ key: RangeKey; label: string }> => [
  { key: "hour", label: t("dashboard.lastHour") },
  { key: "today", label: t("dashboard.today") },
  { key: "7d", label: t("dashboard.7days") },
  { key: "30d", label: t("dashboard.30days") }
];

export const RangeControl = ({
  value,
  onChange
}: {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}) => {
  const { t } = useTranslation();
  const ranges = getRanges(t);
  
  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
      <Button
        key={range.key}
        type="button"
        variant={value === range.key ? "default" : "secondary"}
        size="sm"
        onClick={() => onChange(range.key)}
        className={cn(value !== range.key && "text-muted-foreground")}
      >
        {range.label}
      </Button>
    ))}
  </div>
  );
};
