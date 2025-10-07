import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

export default function Admin() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    console.log("File selected:", file.name);
  };

  const handleRebuildIndex = () => {
    setIsProcessing(true);
    // Mock rebuild - TODO: remove mock functionality and integrate with FastAPI backend
    setTimeout(() => {
      setIsProcessing(false);
      console.log("Index rebuilt successfully");
    }, 2000);
  };

  // Mock upload history - TODO: remove mock functionality
  const uploadHistory = [
    {
      id: "1",
      filename: "components_batch_2024.csv",
      timestamp: "2024-01-15 14:30",
      status: "success",
      components: 1250
    },
    {
      id: "2",
      filename: "new_semiconductors.parquet",
      timestamp: "2024-01-14 09:15",
      status: "success",
      components: 485
    },
    {
      id: "3",
      filename: "passive_components.csv",
      timestamp: "2024-01-13 16:45",
      status: "failed",
      components: 0
    }
  ];

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
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-8">Admin Dashboard</h1>

      {/* Upload Section */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Component Data</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload CSV or Parquet files containing component data. The system will automatically process and index the components.
        </p>
        
        <FileUpload onFileSelect={handleFileSelect} />

        {uploadedFile && (
          <div className="mt-6 flex gap-3">
            <Button className="flex-1" data-testid="button-process">
              Process File
            </Button>
            <Button variant="outline" onClick={() => setUploadedFile(null)} data-testid="button-cancel">
              Cancel
            </Button>
          </div>
        )}
      </Card>

      {/* FAISS Index Control */}
      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">FAISS Index</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Rebuild the search index to include newly uploaded components
            </p>
          </div>
          <Badge variant="outline" className="bg-chart-2/20 text-chart-2 border-chart-2/30">
            Active
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-lg bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Last Rebuilt</p>
            <p className="font-medium">2 hours ago</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Vectors</p>
            <p className="font-medium">12,453</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Index Size</p>
            <p className="font-medium">248 MB</p>
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
        <h2 className="text-xl font-semibold mb-4">Upload History</h2>
        <div className="space-y-3">
          {uploadHistory.map((upload) => (
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
                </div>
              </div>
              <div className="flex items-center gap-3">
                {upload.status === "success" && (
                  <span className="text-sm text-muted-foreground">
                    {upload.components} components
                  </span>
                )}
                {getStatusBadge(upload.status)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
