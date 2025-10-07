import { ComponentTable } from "../component-table";
import { Component } from "@shared/schema";

const mockComponents: Component[] = [
  {
    id: "1",
    partNumber: "LM7805",
    manufacturer: "Texas Instruments",
    category: "Voltage Regulator",
    description: "5V 1A linear voltage regulator",
    specMatch: 95.5,
    totalScore: 92.3,
    price: 1.25,
    stock: "In Stock",
    specifications: "Vin: 7-35V, Vout: 5V, Iout: 1A"
  },
  {
    id: "2",
    partNumber: "LM317",
    manufacturer: "STMicroelectronics",
    category: "Voltage Regulator",
    description: "Adjustable voltage regulator 1.2V-37V",
    specMatch: 88.2,
    totalScore: 85.6,
    price: 0.95,
    stock: "Low Stock",
    specifications: "Vin: 3-40V, Vout: 1.2-37V, Iout: 1.5A"
  },
  {
    id: "3",
    partNumber: "AMS1117-5.0",
    manufacturer: "Advanced Monolithic Systems",
    category: "Voltage Regulator",
    description: "Low dropout 5V regulator",
    specMatch: 82.7,
    totalScore: 78.9,
    price: 0.45,
    stock: "In Stock",
    specifications: "Vin: 6.5-15V, Vout: 5V, Iout: 1A"
  }
];

export default function ComponentTableExample() {
  return (
    <div className="w-full p-8">
      <ComponentTable 
        components={mockComponents}
        onExplain={(id) => console.log("Explain component:", id)}
        explanations={{
          "1": "This component is highly recommended due to its excellent voltage regulation characteristics and wide availability."
        }}
      />
    </div>
  );
}
