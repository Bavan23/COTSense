import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

export function ApiDebugger() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const tests = [
    {
      name: 'Health Check',
      endpoint: '/health',
      fn: () => api.health(),
      description: 'Tests basic backend connectivity'
    },
    {
      name: 'API Status',
      endpoint: '/api/status',
      fn: () => api.status(),
      description: 'Gets detailed API status information'
    },
    {
      name: 'Test Recommendation',
      endpoint: '/api/recommend',
      fn: () => api.recommend({ query: '5V voltage regulator', top_k: 5 }),
      description: 'Tests the ML recommendation endpoint'
    },
    {
      name: 'Full Connection Test',
      endpoint: 'Multiple',
      fn: () => api.testConnection(),
      description: 'Runs comprehensive connection tests'
    }
  ];

  const runTest = async (test: typeof tests[0]) => {
    setLoading(test.name);
    const startTime = Date.now();
    
    try {
      const result = await test.fn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [test.name]: {
          success: true,
          data: result,
          duration,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [test.name]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test);
    }
  };

  const clearResults = () => {
    setTestResults({});
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Connection Debugger</CardTitle>
          <CardDescription>
            Test and debug the connection between frontend and backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={loading !== null}
              variant="default"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={loading !== null}
            >
              Clear Results
            </Button>
          </div>

          <div className="space-y-4">
            {tests.map((test) => (
              <Card key={test.name} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {test.endpoint} - {test.description}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runTest(test)}
                      disabled={loading !== null}
                      variant={testResults[test.name]?.success ? 'outline' : 'default'}
                    >
                      {loading === test.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                {testResults[test.name] && (
                  <CardContent>
                    <Alert className={testResults[test.name].success ? 'border-green-500' : 'border-red-500'}>
                      <div className="flex items-start gap-2">
                        {testResults[test.name].success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="font-semibold mb-1">
                              {testResults[test.name].success ? 'Success' : 'Failed'}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({testResults[test.name].duration}ms)
                              </span>
                            </div>
                            {testResults[test.name].error ? (
                              <div className="text-sm text-red-600 dark:text-red-400">
                                {testResults[test.name].error}
                              </div>
                            ) : (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                  View Response
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                  {JSON.stringify(testResults[test.name].data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Console Commands:</strong>
              <pre className="mt-2 p-2 bg-muted rounded text-xs">
{`// Test connection from browser console:
await api.testConnection()

// Test individual endpoints:
await api.health()
await api.status()
await api.recommend({ query: "5V regulator", top_k: 5 })`}
              </pre>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
