import { Upload, File, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({ onFileSelect, accept = ".csv,.parquet", maxSizeMB = 10 }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        alert(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [maxSizeMB, onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        alert(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-8 transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        "hover-elevate"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      data-testid="dropzone-file-upload"
    >
      {selectedFile ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium" data-testid="text-filename">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearFile} data-testid="button-clear-file">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-lg bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Drop file here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports CSV, Parquet files (max {maxSizeMB}MB)
            </p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
            data-testid="input-file"
          />
        </div>
      )}
    </div>
  );
}
