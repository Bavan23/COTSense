import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  label?: string;
}

export function ScoreBadge({ score, label = "Score" }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-chart-2/20 text-chart-2 border-chart-2/30";
    if (score >= 70) return "bg-chart-3/20 text-chart-3 border-chart-3/30";
    return "bg-chart-4/20 text-chart-4 border-chart-4/30";
  };

  return (
    <Badge variant="outline" className={cn("font-mono font-medium", getScoreColor(score))} data-testid={`badge-score-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      {label}: {score.toFixed(1)}
    </Badge>
  );
}
