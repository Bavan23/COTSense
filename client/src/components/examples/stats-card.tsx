import { StatsCard } from "../stats-card";
import { Package, DollarSign, Clock } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
      <StatsCard title="Total Components" value="12,453" icon={Package} description="+125 this week" />
      <StatsCard title="Avg Price" value="$24.50" icon={DollarSign} description="Across all categories" />
      <StatsCard title="Avg Response" value="0.3s" icon={Clock} description="ML search time" />
    </div>
  );
}
