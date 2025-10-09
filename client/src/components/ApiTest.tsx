import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface ApiTestProps {}

export const ApiTest: React.FC<ApiTestProps> = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('3.3V voltage regulator');
  const [recommendations, setRecommendations] = useState<any>(null);

  const testHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const health = await api.health();
      const status = await api.status();
      setHealthStatus(health);
      setApiStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testRecommendation = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.recommend({
        query,
        top_k: 5
      });
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testHealth();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">API Connection Test</h1>
      
      {/* Health Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Backend Health Status</h2>
        <button
          onClick={testHealth}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        {healthStatus && (
          <div className="space-y-2">
            <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
              healthStatus.status === 'healthy' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              Status: {healthStatus.status}
            </div>
            <div className="text-sm text-gray-600">
              ML Models: {healthStatus.ml_models_loaded ? '✅ Loaded' : '❌ Not Loaded'}
            </div>
            <div className="text-sm text-gray-600">
              Database: {healthStatus.database_connected ? '✅ Connected' : '❌ Disconnected'}
            </div>
          </div>
        )}
      </div>

      {/* API Status */}
      {apiStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Status Details</h2>
          <div className="space-y-2 text-sm">
            <div>API Version: {apiStatus.api?.version}</div>
            <div>ML Service: {apiStatus.ml_service?.status}</div>
            <div>Components Count: {apiStatus.ml_service?.components_count}</div>
            <div>Embedding Dimension: {apiStatus.configuration?.embedding_dimension}</div>
          </div>
        </div>
      )}

      {/* Recommendation Test */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Recommendations</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query:
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter component search query..."
            />
          </div>
          <button
            onClick={testRecommendation}
            disabled={loading || !query.trim()}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Get Recommendations'}
          </button>
        </div>

        {recommendations && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">
              Results ({recommendations.total} components found)
            </h3>
            <div className="space-y-3">
              {recommendations.components?.slice(0, 3).map((component: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <div className="font-medium">{component.part_number}</div>
                  <div className="text-sm text-gray-600">{component.manufacturer}</div>
                  <div className="text-sm text-gray-500">{component.description}</div>
                  <div className="text-sm text-blue-600">
                    Similarity: {(component.similarity_score * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Processing time: {recommendations.processing_time_ms}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
