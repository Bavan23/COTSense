import { useState } from "react";
import { Component } from "@shared/schema";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { ScoreBadge } from "./score-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComponentTableProps {
  components: Component[];
  onExplain?: (componentId: string) => void;
  explanations?: Record<string, string>;
}

type SortField = "partNumber" | "manufacturer" | "specMatch" | "totalScore" | "price";
type SortDirection = "asc" | "desc";

export function ComponentTable({ components, onExplain, explanations = {} }: ComponentTableProps) {
  const [sortField, setSortField] = useState<SortField>("totalScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedComponents = [...components].sort((a, b) => {
    const aVal = a[sortField] ?? "";
    const bVal = b[sortField] ?? "";
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * multiplier;
    }
    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      if (onExplain && !explanations[id]) {
        onExplain(id);
      }
    }
    setExpandedRows(newExpanded);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card border-b">
            <tr>
              <th className="w-12"></th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover-elevate" 
                onClick={() => handleSort("partNumber")}
                data-testid="header-part-number"
              >
                <div className="flex items-center gap-2">
                  Part Number
                  <SortIcon field="partNumber" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover-elevate"
                onClick={() => handleSort("manufacturer")}
                data-testid="header-manufacturer"
              >
                <div className="flex items-center gap-2">
                  Manufacturer
                  <SortIcon field="manufacturer" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover-elevate"
                onClick={() => handleSort("specMatch")}
                data-testid="header-spec-match"
              >
                <div className="flex items-center gap-2">
                  Spec Match
                  <SortIcon field="specMatch" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover-elevate"
                onClick={() => handleSort("totalScore")}
                data-testid="header-total-score"
              >
                <div className="flex items-center gap-2">
                  Total Score
                  <SortIcon field="totalScore" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover-elevate"
                onClick={() => handleSort("price")}
                data-testid="header-price"
              >
                <div className="flex items-center gap-2">
                  Price
                  <SortIcon field="price" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
            </tr>
          </thead>
          <tbody>
            {sortedComponents.map((component) => (
              <>
                <tr 
                  key={component.id}
                  className={cn(
                    "border-b hover-elevate cursor-pointer transition-colors",
                    expandedRows.has(component.id) && "border-l-4 border-l-primary"
                  )}
                  onClick={() => toggleRow(component.id)}
                  data-testid={`row-component-${component.id}`}
                >
                  <td className="px-4 py-4 text-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      {expandedRows.has(component.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-medium" data-testid={`text-part-${component.id}`}>
                    {component.partNumber}
                  </td>
                  <td className="px-6 py-4 text-sm">{component.manufacturer}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{component.category}</td>
                  <td className="px-6 py-4">
                    {component.specMatch !== null && component.specMatch !== undefined && (
                      <ScoreBadge score={component.specMatch} label="Match" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {component.totalScore !== null && component.totalScore !== undefined && (
                      <ScoreBadge score={component.totalScore} label="Total" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-medium">
                    ${component.price?.toFixed(2) ?? "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={component.stock || "Unknown"} />
                  </td>
                </tr>
                {expandedRows.has(component.id) && (
                  <tr className="bg-muted/30 border-b">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="space-y-3 border-l-4 border-l-primary pl-4">
                        {component.description && (
                          <div>
                            <p className="text-sm font-medium mb-1">Description</p>
                            <p className="text-sm text-muted-foreground">{component.description}</p>
                          </div>
                        )}
                        {component.specifications && (
                          <div>
                            <p className="text-sm font-medium mb-1">Specifications</p>
                            <p className="text-sm text-muted-foreground font-mono">{component.specifications}</p>
                          </div>
                        )}
                        {explanations[component.id] && (
                          <div>
                            <p className="text-sm font-medium mb-1">AI Explanation</p>
                            <p className="text-sm text-muted-foreground">{explanations[component.id]}</p>
                          </div>
                        )}
                        {onExplain && !explanations[component.id] && (
                          <p className="text-sm text-muted-foreground italic">Loading explanation...</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
