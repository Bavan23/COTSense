import React, { useState } from "react";
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
    // Map camelCase to snake_case for backend data
    const fieldMap: Record<SortField, string> = {
      partNumber: 'part_number',
      manufacturer: 'manufacturer',
      specMatch: 'spec_match',
      totalScore: 'total_score',
      price: 'price'
    };
    
    const backendField = fieldMap[sortField];
    const aVal = (a as any)[backendField] ?? a[sortField] ?? "";
    const bVal = (b as any)[backendField] ?? b[sortField] ?? "";
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * multiplier;
    }
    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });

  const toggleRow = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    const newExpanded = new Set(expandedRows);
    
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
      if (onExplain && !explanations[componentId] && component) {
        console.log('[ComponentTable] 👆 User clicked on component:', {
          id: component.id,
          part_number: (component as any).part_number || component.partNumber,
          manufacturer: component.manufacturer,
          category: component.category,
          spec_match: (component as any).spec_match,
          total_score: (component as any).total_score
        });
        onExplain(componentId);
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
              <React.Fragment key={component.id}>
                <tr 
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
                    {(component as any).part_number || component.partNumber}
                  </td>
                  <td className="px-6 py-4 text-sm">{component.manufacturer}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{component.category}</td>
                  <td className="px-6 py-4">
                    {((component as any).spec_match !== null && (component as any).spec_match !== undefined) && (
                      <ScoreBadge score={(component as any).spec_match} label="Match" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {((component as any).total_score !== null && (component as any).total_score !== undefined) && (
                      <ScoreBadge score={(component as any).total_score} label="Total" />
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
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
                                <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                  🤖 AI Recommendation Analysis
                                </h4>
                                <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                  {explanations[component.id].split('\n').map((line, index) => (
                                    <p key={index} className={index > 0 ? 'mt-2' : ''}>
                                      {line.trim()}
                                    </p>
                                  ))}
                                </div>
                                
                                {/* Score Display */}
                                {(((component as any).spec_match !== null && (component as any).spec_match !== undefined) || 
                                 ((component as any).total_score !== null && (component as any).total_score !== undefined)) && (
                                  <div className="mt-3 flex items-center gap-3 p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
                                    {(component as any).spec_match !== null && (component as any).spec_match !== undefined && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Spec Match:</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                          {(component as any).spec_match.toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                    {(component as any).total_score !== null && (component as any).total_score !== undefined && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Score:</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                          {(component as any).total_score.toFixed(1)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                  <span className="inline-flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    AI-Powered Match
                                  </span>
                                  <span>•</span>
                                  <span>Based on specifications & compatibility</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {onExplain && !explanations[component.id] && (
                          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="font-medium">AI is analyzing this component...</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Generating personalized recommendation based on your search query
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
