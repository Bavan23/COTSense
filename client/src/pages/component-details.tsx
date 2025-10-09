import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Component } from "@shared/schema";
import { StatusBadge } from "@/components/status-badge";
import { ScoreBadge } from "@/components/score-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function ComponentDetails() {
  const [, params] = useRoute("/component/:id");
  const [component, setComponent] = useState<Component | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchComponentDetails(params.id);
    }
  }, [params?.id]);

  const fetchComponentDetails = async (componentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll use a mock component since we don't have a specific component details endpoint
      // In a real implementation, you would call: await api.getComponent(componentId)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock component data based on ID - in real implementation, this would come from the API
      const mockComponent: Component = {
        id: componentId,
        partNumber: componentId === "1" ? "LM7805" : `COMPONENT-${componentId}`,
        manufacturer: "Texas Instruments",
        category: "Voltage Regulator",
        description: "The LM78XX series of three-terminal positive regulators are available in the TO-220/D-PAK package and with several fixed output voltages, making them useful in a wide range of applications. Each type employs internal current limiting, thermal shut down and safe operating area protection, making it essentially indestructible.",
        specMatch: 95.5,
        totalScore: 92.3,
        price: 1.25,
        stock: "In Stock",
        specifications: "Input Voltage: 7-35V\nOutput Voltage: 5V ±4%\nOutput Current: 1A\nDropout Voltage: 2V @ 1A\nLine Regulation: 3mV typ\nLoad Regulation: 15mV typ\nPackage: TO-220\nOperating Temp: 0-125°C"
      };

      setComponent(mockComponent);
    } catch (err) {
      console.error("Failed to fetch component details:", err);
      setError(err instanceof Error ? err.message : "Failed to load component details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading component details...</span>
        </div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Link href="/search">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </Link>
        
        <div className="text-center py-16">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-destructive font-medium mb-2">Component Not Found</p>
            <p className="text-sm text-muted-foreground">
              {error || "The requested component could not be found."}
            </p>
            <Link href="/search">
              <Button className="mt-4">
                Return to Search
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const specifications = component.specifications?.split("\n") || [];

  return (
    <div className="container mx-auto px-6 py-8">
      <Link href="/search">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-semibold mb-2" data-testid="text-part-number">{component.partNumber}</h1>
            <p className="text-lg text-muted-foreground">{component.manufacturer}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ScoreBadge score={component.specMatch || 0} label="Spec Match" />
            <ScoreBadge score={component.totalScore || 0} label="Total Score" />
            <StatusBadge status={component.stock || "Unknown"} />
          </div>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{component.description}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="space-y-2">
              {specifications.map((spec, index) => {
                const [label, value] = spec.split(":");
                return (
                  <div key={index} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground font-mono text-sm">{value?.trim()}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pricing & Availability</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                <p className="text-3xl font-semibold" data-testid="text-price">${component.price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Stock Status</p>
                <StatusBadge status={component.stock || "Unknown"} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="font-medium">{component.category}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <Button className="w-full" data-testid="button-add-compare">
                Add to Compare
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-datasheet">
                View Datasheet
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
