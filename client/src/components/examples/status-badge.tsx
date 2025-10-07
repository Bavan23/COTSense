import { StatusBadge } from "../status-badge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-3 p-8">
      <StatusBadge status="In Stock" />
      <StatusBadge status="Low Stock" />
      <StatusBadge status="Out of Stock" />
    </div>
  );
}
