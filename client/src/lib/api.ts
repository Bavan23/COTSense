import type { RecommendRequest, RecommendResponse, ExplainResponse } from "@shared/schema";

// API configuration with proper base URL handling
const getApiBaseUrl = () => {
  // In development, use empty string to use Vite proxy
  // In production, use the environment variable or fallback
  if (import.meta.env.DEV) {
    console.log('[API] Using Vite proxy for development');
    return ''; // Empty string to use relative paths with Vite proxy
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  console.log('[API] Using base URL:', baseUrl);
  return baseUrl;
};

const FASTAPI_BASE_URL = getApiBaseUrl();

// Helper function to build URL with proper path handling
const buildUrl = (path: string): string => {
  // Ensure path starts with /api for backend routes
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  const fullUrl = FASTAPI_BASE_URL ? `${FASTAPI_BASE_URL}${apiPath}` : apiPath;
  console.log('[API] Request URL:', fullUrl);
  return fullUrl;
};

// Helper function for better error handling
const handleResponse = async <T>(response: Response, operation: string): Promise<T> => {
  console.log(`[API] ${operation} response:`, response.status, response.statusText);
  
  if (!response.ok) {
    let errorMessage = `${operation} failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = `${operation} failed: ${errorData.detail}`;
      }
    } catch {
      // If response is not JSON, use default message
    }
    console.error(`[API] ${errorMessage}`);
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log(`[API] ${operation} successful:`, data);
  return data;
};

export const api = {
  async recommend(request: RecommendRequest): Promise<RecommendResponse> {
    console.log('[API] Sending recommendation request:', request);
    
    try {
      const response = await fetch(buildUrl('/recommend'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      return await handleResponse<RecommendResponse>(response, 'Recommendation');
    } catch (error) {
      console.error('[API] Recommendation error:', error);
      throw error;
    }
  },

  async explain(componentId: string, query: string): Promise<ExplainResponse> {
    console.log('[API] 🔍 Sending explain request:', { 
      componentId, 
      query,
      requestBody: { component_id: componentId, query }
    });
    
    try {
      const response = await fetch(buildUrl('/explain'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ component_id: componentId, query })
      });
      
      const result = await handleResponse<ExplainResponse>(response, 'Explanation');
      console.log('[API] 🤖 Explain response received:', {
        requested_component_id: componentId,
        response_component_id: result.component_id,
        explanation_preview: result.explanation.substring(0, 100) + '...'
      });
      
      return result;
    } catch (error) {
      console.error('[API] Explanation error:', error);
      throw error;
    }
  },

  async health(): Promise<any> {
    console.log('[API] Checking health');
    
    try {
      // Health endpoint is at root /health, not under /api
      const healthUrl = FASTAPI_BASE_URL ? `${FASTAPI_BASE_URL}/health` : '/health';
      console.log('[API] Health check URL:', healthUrl);
      
      const response = await fetch(healthUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      return await handleResponse(response, 'Health check');
    } catch (error) {
      console.error('[API] Health check error:', error);
      throw error;
    }
  },

  async status(): Promise<any> {
    console.log('[API] Checking status');
    
    try {
      const response = await fetch(buildUrl('/status'), {
        headers: { 'Accept': 'application/json' }
      });
      
      return await handleResponse(response, 'Status check');
    } catch (error) {
      console.error('[API] Status check error:', error);
      throw error;
    }
  },

  // Debug helper to test the connection
  async testConnection(): Promise<void> {
    console.log('[API] Testing connection to backend...');
    console.log('[API] Environment:', import.meta.env.MODE);
    console.log('[API] Is Development:', import.meta.env.DEV);
    console.log('[API] Base URL:', FASTAPI_BASE_URL || 'Using Vite proxy');
    
    try {
      const health = await this.health();
      console.log('[API] ✅ Backend is healthy:', health);
      
      const status = await this.status();
      console.log('[API] ✅ Backend status:', status);
      
      console.log('[API] Connection test successful!');
    } catch (error) {
      console.error('[API] ❌ Connection test failed:', error);
      throw error;
    }
  }
};

// Expose API to window for debugging in development mode
if (import.meta.env.DEV) {
  (window as any).api = api;
  console.log('[API] Debug mode: API exposed to window.api');
  console.log('[API] You can now test with: await api.testConnection()');
}
