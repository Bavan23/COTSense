import { useState } from "react";
import { useLocation } from "wouter";
import { SearchBar } from "@/components/search-bar";
import { StatsCard } from "@/components/stats-card";
import { Package, TrendingUp, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@assets/generated_images/Circuit_board_hero_background_f5e62af4.png";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  // Mock recent searches - TODO: remove mock functionality
  const recentSearches = [
    "5V regulator 3A",
    "USB-C connector",
    "10kΩ resistor",
    "ESP32 module",
    "Li-Po charger"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-background/40" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-6xl font-semibold tracking-tight">COTSense</h1>
          </div>
          <p className="text-xl text-foreground/90 mb-8 max-w-2xl mx-auto">
            Find the perfect COTS components instantly
          </p>
          <p className="text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
            ML-powered recommendations for commercial off-the-shelf electronic components
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Recent Searches */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Recent:</span>
            {recentSearches.map((search) => (
              <Badge 
                key={search} 
                variant="secondary" 
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => handleSearch(search)}
                data-testid={`badge-recent-${search.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {search}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Components" 
            value="12,453" 
            icon={Package}
            description="+125 this week"
          />
          <StatsCard 
            title="Categories" 
            value="24" 
            icon={TrendingUp}
            description="Semiconductors, Passive, etc."
          />
          <StatsCard 
            title="Avg Response" 
            value="0.3s" 
            icon={Clock}
            description="ML search time"
          />
          <StatsCard 
            title="Match Accuracy" 
            value="94%" 
            icon={Zap}
            description="Specification matching"
          />
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="container mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold mb-6">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Semiconductors", "Passive Components", "Connectors", "Power Supply", "Sensors", "Microcontrollers", "Memory", "RF Modules"].map((category) => (
            <button
              key={category}
              onClick={() => handleSearch(category)}
              className="p-6 rounded-lg border bg-card hover-elevate active-elevate-2 text-left"
              data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <p className="font-medium">{category}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
