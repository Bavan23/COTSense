import type { RecommendRequest, RecommendResponse, ExplainResponse } from "@shared/schema";

const FASTAPI_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  async recommend(request: RecommendRequest): Promise<RecommendResponse> {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Recommendation failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  async explain(componentId: string, query: string): Promise<ExplainResponse> {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ component_id: componentId, query }),
    });
    
    if (!response.ok) {
      throw new Error(`Explanation failed: ${response.statusText}`);
    }
    
    return response.json();
  },
};
