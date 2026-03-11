// ABOUTME: Modal dialog for uploading files to media library with drag-and-drop support
// ABOUTME: Provides visual upload progress and file type indicators

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileImage, Film, Music, FileText, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MediaUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  currentFolderName?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function MediaUploadDialog({
  open,
  onClose,
  onUpload,
  currentFolderName,
}: MediaUploadDialogProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);

    setUploadingFiles(
      acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }))
    );

    try {
      await onUpload(acceptedFiles);

      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, progress: 100, status: 'completed' as const }))
      );

      setTimeout(() => {
        onClose();
        setUploadingFiles([]);
        setIsUploading(false);
      }, 1000);
    } catch (error: any) {
      setUploadingFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          error: error.message,
        }))
      );
      setIsUploading(false);
    }
  }, [onUpload, onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled: isUploading,
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            {currentFolderName
              ? `Uploading to ${currentFolderName}`
              : 'Uploading to root folder'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {uploadingFiles.length === 0 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : isUploading
                  ? 'border-muted-foreground/20 bg-muted/50 cursor-not-allowed'
                  : 'border-muted-foreground/20 hover:border-primary hover:bg-accent/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-3">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-base font-medium">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    or click to browse your computer
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Supported: Images, Videos, Audio, Documents
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadingFiles.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {uploadingFiles.map((uploadFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex-shrink-0">
                    {uploadFile.status === 'completed' ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <span className="text-green-500 text-lg">✓</span>
                      </div>
                    ) : uploadFile.status === 'error' ? (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <X className="h-4 w-4 text-red-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getFileIcon(uploadFile.file)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFileSize(uploadFile.file.size)}
                      </span>
                    </div>

                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-500">{uploadFile.error}</p>
                    )}

                    {(uploadFile.status === 'pending' || uploadFile.status === 'uploading') && (
                      <div className="flex items-center gap-2">
                        <Progress value={uploadFile.progress} className="h-1" />
                        {uploadFile.status === 'uploading' && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                      </div>
                    )}

                    {uploadFile.status === 'completed' && (
                      <p className="text-xs text-green-500">Upload complete</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
