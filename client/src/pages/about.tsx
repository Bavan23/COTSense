import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Search, Sparkles } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: Brain,
      title: "ML-Powered Embeddings",
      description: "Advanced machine learning models convert component specifications into high-dimensional embeddings for accurate similarity matching."
    },
    {
      icon: Search,
      title: "FAISS Vector Search",
      description: "Facebook AI Similarity Search enables lightning-fast nearest neighbor queries across millions of component embeddings."
    },
    {
      icon: Sparkles,
      title: "AI Explanations",
      description: "Google Gemini provides intelligent explanations for component recommendations, helping you understand why each part matches your requirements."
    },
    {
      icon: Zap,
      title: "Real-time Results",
      description: "Sub-second search responses with intelligent caching and optimized indexing for instant component discovery."
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold mb-4">About COTSense</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          An intelligent component recommendation system powered by machine learning and vector search
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="p-6 hover-elevate" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* How It Works */}
      <Card className="p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Natural Language Query</h3>
              <p className="text-sm text-muted-foreground">
                Enter your requirements in plain English (e.g., "5V regulator, 3A output, under $2"). The system understands technical specifications and context.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Embedding Generation</h3>
              <p className="text-sm text-muted-foreground">
                Your query is converted into a high-dimensional vector embedding using our ML models, capturing semantic meaning and technical requirements.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">FAISS Vector Search</h3>
              <p className="text-sm text-muted-foreground">
                The embedding is compared against our indexed component database using FAISS, finding the most similar parts based on cosine similarity.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
              4
            </div>
            <div>
              <h3 className="font-semibold mb-1">Ranked Results</h3>
              <p className="text-sm text-muted-foreground">
                Components are scored based on specification match, availability, and pricing. AI-powered explanations help you understand each recommendation.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* API Reference */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-6">API Reference</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="bg-chart-2/20 text-chart-2 border-chart-2/30 font-mono">POST</Badge>
              <code className="text-sm font-mono">/api/recommend</code>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Search for components based on natural language query
            </p>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground mb-2">Request Body:</p>
              <pre className="text-xs font-mono">
{`{
  "query": "5V regulator 3A",
  "top_k": 10
}`}
              </pre>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="bg-chart-2/20 text-chart-2 border-chart-2/30 font-mono">POST</Badge>
              <code className="text-sm font-mono">/api/explain</code>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Get AI-powered explanation for a component recommendation
            </p>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground mb-2">Request Body:</p>
              <pre className="text-xs font-mono">
{`{
  "component_id": "abc123",
  "query": "5V regulator 3A"
}`}
              </pre>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
