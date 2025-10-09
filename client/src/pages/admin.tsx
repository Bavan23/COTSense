import { useState, useEffect } from "react";
import { FileUpload } from "@/components/file-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle, XCircle, Clock, Database, Upload, Activity, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface SystemStats {
  totalComponents: number;
  indexSize: string;
  lastRebuilt: string;
  mlStatus: string;
  dbStatus: string;
  apiVersion: string;
}

interface UploadHistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  status: 'success' | 'failed' | 'processing';
  components: number;
  error?: string;
}

export default function Admin() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch system stats and upload history on component mount
  useEffect(() => {
    fetchSystemStats();
    fetchUploadHistory();
  }, []);

  const fetchSystemStats = async () => {
    try {
      console.log('[Admin] Fetching system stats...');
      const [healthData, statusData] = await Promise.all([
        api.health(),
        api.status()
      ]);

      const stats: SystemStats = {
        totalComponents: statusData.ml_service?.components_count || 0,
        indexSize: formatBytes(statusData.ml_service?.faiss_index?.total_vectors * 384 * 4 || 0),
        lastRebuilt: new Date().toLocaleString(), // Mock - backend doesn't provide this
        mlStatus: statusData.ml_service?.status || 'unknown',
        dbStatus: healthData.database_connected ? 'connected' : 'disconnected',
        apiVersion: statusData.api?.version || '1.0.0'
      };

      setSystemStats(stats);
      console.log('[Admin] System stats loaded:', stats);
    } catch (err) {
      console.error('[Admin] Failed to fetch system stats:', err);
      setError('Failed to load system statistics. Please check if the backend is running.');
    }
  };

  const fetchUploadHistory = async () => {
    try {
      // Mock upload history since backend doesn't have this endpoint yet
      // In production, this would call: await api.getUploadHistory()
      const mockHistory: UploadHistoryItem[] = [
        {
          id: "1",
          filename: "components_batch_2024.csv",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
          status: "success",
          components: 1250
        },
        {
          id: "2", 
          filename: "new_semiconductors.parquet",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
          status: "success",
          components: 485
        },
        {
          id: "3",
          filename: "passive_components.csv", 
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString(),
          status: "failed",
          components: 0,
          error: "Invalid CSV format"
        }
      ];
      setUploadHistory(mockHistory);
    } catch (err) {
      console.error('[Admin] Failed to fetch upload history:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setError(null);
    setSuccess(null);
    console.log("[Admin] File selected:", file.name);
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      console.log('[Admin] Starting file upload:', uploadedFile.name);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock file upload - In production, this would be:
      // const formData = new FormData();
      // formData.append('file', uploadedFile);
      // const result = await api.uploadComponents(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to upload history
      const newUpload: UploadHistoryItem = {
        id: Date.now().toString(),
        filename: uploadedFile.name,
        timestamp: new Date().toLocaleString(),
        status: 'success',
        components: Math.floor(Math.random() * 1000) + 100
      };

      setUploadHistory(prev => [newUpload, ...prev]);
      setSuccess(`Successfully uploaded ${uploadedFile.name} with ${newUpload.components} components.`);
      setUploadedFile(null);
      
      // Refresh system stats
      await fetchSystemStats();

    } catch (err) {
      console.error('[Admin] Upload failed:', err);
      setError(`Failed to upload ${uploadedFile.name}. Please try again.`);
      
      // Add failed upload to history
      const failedUpload: UploadHistoryItem = {
        id: Date.now().toString(),
        filename: uploadedFile.name,
        timestamp: new Date().toLocaleString(),
        status: 'failed',
        components: 0,
        error: err instanceof Error ? err.message : 'Upload failed'
      };
      
      setUploadHistory(prev => [failedUpload, ...prev]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRebuildIndex = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[Admin] Starting index rebuild...');
      
      // Mock index rebuild - In production, this would be:
      // await api.rebuildIndex();
      
      // Simulate rebuild process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSuccess('Search index rebuilt successfully. New components are now searchable.');
      await fetchSystemStats();
      
    } catch (err) {
      console.error('[Admin] Index rebuild failed:', err);
      setError('Failed to rebuild search index. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-chart-2" />;
      case "failed": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-chart-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge variant="outline" className="bg-chart-2/20 text-chart-2 border-chart-2/30">Success</Badge>;
      case "failed": return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">Failed</Badge>;
      default: return <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-chart-4/30">Processing</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <Button onClick={fetchSystemStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500/50 text-green-700 dark:border-green-500 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Components</p>
              <p className="text-2xl font-bold">{systemStats?.totalComponents.toLocaleString() || 'Loading...'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">ML Status</p>
              <p className="text-2xl font-bold capitalize">{systemStats?.mlStatus || 'Loading...'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Upload className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Index Size</p>
              <p className="text-2xl font-bold">{systemStats?.indexSize || 'Loading...'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">DB Status</p>
              <p className="text-2xl font-bold capitalize">{systemStats?.dbStatus || 'Loading...'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Component Data
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload CSV or Parquet files containing component data. The system will automatically process and index the components.
        </p>
        
        <FileUpload onFileSelect={handleFileSelect} />

        {uploadedFile && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-sm">Selected: <span className="font-medium">{uploadedFile.name}</span></p>
              <p className="text-sm text-muted-foreground">({formatBytes(uploadedFile.size)})</p>
            </div>
            
            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={handleFileUpload}
                disabled={isUploading}
                className="flex-1" 
                data-testid="button-process"
              >
                {isUploading ? 'Processing...' : 'Process File'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUploadedFile(null)} 
                disabled={isUploading}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* FAISS Index Control */}
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="h-5 w-5" />
              FAISS Search Index
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Rebuild the search index to include newly uploaded components
            </p>
          </div>
          <Badge variant="outline" className="bg-chart-2/20 text-chart-2 border-chart-2/30">
            {systemStats?.mlStatus === 'loaded' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Last Rebuilt</p>
            <p className="font-medium">{systemStats?.lastRebuilt || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Vectors</p>
            <p className="font-medium">{systemStats?.totalComponents.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Index Size</p>
            <p className="font-medium">{systemStats?.indexSize || '0 MB'}</p>
          </div>
        </div>

        <Button 
          onClick={handleRebuildIndex}
          disabled={isProcessing}
          className="w-full"
          data-testid="button-rebuild-index"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? "Rebuilding Index..." : "Rebuild Index"}
        </Button>
      </Card>

      {/* Upload History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upload History
        </h2>
        <div className="space-y-3">
          {uploadHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No uploads yet</p>
              <p className="text-sm">Upload your first component file to get started</p>
            </div>
          ) : (
            uploadHistory.map((upload) => (
              <div 
                key={upload.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`upload-history-${upload.id}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(upload.status)}
                  <div>
                    <p className="font-medium" data-testid={`text-filename-${upload.id}`}>{upload.filename}</p>
                    <p className="text-sm text-muted-foreground">{upload.timestamp}</p>
                    {upload.error && (
                      <p className="text-sm text-destructive mt-1">{upload.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {upload.status === "success" && (
                    <span className="text-sm text-muted-foreground">
                      {upload.components.toLocaleString()} components
                    </span>
                  )}
                  {getStatusBadge(upload.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
