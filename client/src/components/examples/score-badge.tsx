import { ScoreBadge } from "../score-badge";

export default function ScoreBadgeExample() {
  return (
    <div className="flex flex-wrap gap-3 p-8">
      <ScoreBadge score={95.5} label="Match" />
      <ScoreBadge score={82.3} label="Total" />
      <ScoreBadge score={68.7} label="Spec" />
    </div>
  );
}
