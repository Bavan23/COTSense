import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Component } from "@shared/schema";
import { saveAs } from "file-saver";

interface ExportButtonProps {
  components: Component[];
  filename?: string;
}

export function ExportButton({ components, filename = "components" }: ExportButtonProps) {
  const exportToCSV = () => {
    const headers = ["Part Number", "Manufacturer", "Category", "Spec Match", "Total Score", "Price", "Stock"];
    const rows = components.map(c => [
      (c as any).part_number || c.partNumber || "",
      c.manufacturer || "",
      c.category || "",
      ((c as any).spec_match || c.specMatch)?.toFixed(1) ?? "",
      ((c as any).total_score || c.totalScore)?.toFixed(1) ?? "",
      c.price?.toFixed(2) ?? "",
      c.stock ?? ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
  };

  return (
    <Button 
      variant="outline" 
      onClick={exportToCSV}
      disabled={components.length === 0}
      data-testid="button-export"
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
