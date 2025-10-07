import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | string;

interface StatusBadgeProps {
  status: StockStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes("in stock")) return "bg-chart-2/20 text-chart-2 border-chart-2/30";
    if (normalized.includes("low")) return "bg-chart-4/20 text-chart-4 border-chart-4/30";
    if (normalized.includes("out")) return "bg-destructive/20 text-destructive border-destructive/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Badge variant="outline" className={cn("font-medium", getStatusColor(status))} data-testid={`badge-status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className={cn(
        "mr-1.5 h-1.5 w-1.5 rounded-full",
        status.toLowerCase().includes("in stock") && "bg-chart-2",
        status.toLowerCase().includes("low") && "bg-chart-4",
        status.toLowerCase().includes("out") && "bg-destructive"
      )} />
      {status}
    </Badge>
  );
}
