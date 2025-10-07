import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ComponentTable } from "@/components/component-table";
import { SearchBar } from "@/components/search-bar";
import { ExportButton } from "@/components/export-button";
import { Component } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const query = searchParams.get("q") || "";

  const [, setLocation] = useLocation();
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  // Mock search - TODO: remove mock functionality and integrate with FastAPI backend
  useEffect(() => {
    if (query) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const mockResults: Component[] = [
          {
            id: "1",
            partNumber: "LM7805",
            manufacturer: "Texas Instruments",
            category: "Voltage Regulator",
            description: "5V 1A linear voltage regulator with thermal shutdown",
            specMatch: 95.5,
            totalScore: 92.3,
            price: 1.25,
            stock: "In Stock",
            specifications: "Vin: 7-35V, Vout: 5V, Iout: 1A, Package: TO-220"
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
            specifications: "Vin: 3-40V, Vout: 1.2-37V, Iout: 1.5A, Package: TO-220"
          },
          {
            id: "3",
            partNumber: "AMS1117-5.0",
            manufacturer: "Advanced Monolithic Systems",
            category: "Voltage Regulator",
            description: "Low dropout 5V regulator, SOT-223 package",
            specMatch: 82.7,
            totalScore: 78.9,
            price: 0.45,
            stock: "In Stock",
            specifications: "Vin: 6.5-15V, Vout: 5V, Iout: 1A, Dropout: 1.3V, Package: SOT-223"
          },
          {
            id: "4",
            partNumber: "MC7805",
            manufacturer: "ON Semiconductor",
            category: "Voltage Regulator",
            description: "Fixed 5V positive voltage regulator",
            specMatch: 90.1,
            totalScore: 87.2,
            price: 0.85,
            stock: "In Stock",
            specifications: "Vin: 7-25V, Vout: 5V, Iout: 1A, Package: TO-220"
          },
          {
            id: "5",
            partNumber: "L7805CV",
            manufacturer: "STMicroelectronics",
            category: "Voltage Regulator",
            description: "5V voltage regulator with overcurrent protection",
            specMatch: 86.5,
            totalScore: 83.1,
            price: 0.72,
            stock: "In Stock",
            specifications: "Vin: 7-35V, Vout: 5V, Iout: 1.5A, Package: TO-220"
          }
        ];
        
        setComponents(mockResults);
        setIsLoading(false);
      }, 800);
    }
  }, [query]);

  const handleSearch = (newQuery: string) => {
    setLocation(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  const handleExplain = (componentId: string) => {
    // Mock explanation - TODO: remove mock functionality and integrate with Gemini API
    setTimeout(() => {
      setExplanations(prev => ({
        ...prev,
        [componentId]: "This component is highly recommended due to its excellent voltage regulation characteristics, wide availability, and competitive pricing. It matches your specifications with 95% accuracy and is currently in stock from multiple distributors."
      }));
    }, 500);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-6">Search Results</h1>
        <SearchBar 
          onSearch={handleSearch} 
          defaultValue={query}
          isLoading={isLoading}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-search" />
          <span className="ml-3 text-muted-foreground">Searching components...</span>
        </div>
      ) : components.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground" data-testid="text-results-count">
              Found {components.length} components matching "{query}"
            </p>
            <ExportButton components={components} filename={`search-${query.replace(/\s+/g, '-')}`} />
          </div>

          <ComponentTable 
            components={components}
            onExplain={handleExplain}
            explanations={explanations}
          />
        </>
      ) : query ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No components found for "{query}"</p>
          <p className="text-sm text-muted-foreground mt-2">Try a different search query</p>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Enter a search query to find components</p>
        </div>
      )}
    </div>
  );
}
