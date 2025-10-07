import { ExportButton } from "../export-button";
import { Component } from "@shared/schema";

const mockComponents: Component[] = [
  {
    id: "1",
    partNumber: "LM7805",
    manufacturer: "Texas Instruments",
    category: "Voltage Regulator",
    specMatch: 95.5,
    totalScore: 92.3,
    price: 1.25,
    stock: "In Stock",
    specifications: null,
    description: null
  }
];

export default function ExportButtonExample() {
  return (
    <div className="p-8">
      <ExportButton components={mockComponents} filename="search-results" />
    </div>
  );
}
