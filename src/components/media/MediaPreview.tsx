// ABOUTME: Full-screen lightbox preview for media files with zoom, navigation, and metadata display
// ABOUTME: Supports images, videos, audio, and documents with keyboard shortcuts

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  Info,
  Tag,
  Copy,
  Share2,
  FileImage,
  RotateCw,
  Sparkles,
  Clock,
  Settings,
  BarChart,
  Palette,
  Shield,
  CheckCircle,
} from 'lucide-react';
import type { MediaFile } from '@/types/media';
import { toast } from 'sonner';
import { MediaUserLink } from '@/components/media/MediaUserLink';

interface MediaPreviewProps {
  file: MediaFile | null;
  files?: MediaFile[];
  open: boolean;
  onClose: () => void;
  onDelete?: (file: MediaFile) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onUpdate?: () => void;
}

export function MediaPreview({
  file,
  files = [],
  open,
  onClose,
  onDelete,
  onNavigate,
}: MediaPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [showMetadata, setShowMetadata] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [promptDetailsOpen, setPromptDetailsOpen] = useState(false);
  const [synthIdInfoOpen, setSynthIdInfoOpen] = useState(false);
  const [synthIdDetectionFailureOpen, setSynthIdDetectionFailureOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<MediaFile | null>(file);

  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentFile?.id]);

  useEffect(() => {
    if (file?.custom_metadata?.generation_type === 'headshot') {
      setShowMetadata(true);
    }
  }, [file?.id, file?.custom_metadata?.generation_type]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onNavigate?.('prev');
          break;
        case 'ArrowRight':
          onNavigate?.('next');
          break;
        case 'i':
          setShowMetadata((prev) => !prev);
          break;
        case '+':
        case '=':
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case '-':
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case 'r':
          setRotation((prev) => (prev + 90) % 360);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, onNavigate]);

  // Must be declared before early returns to satisfy Rules of Hooks
  const handleCopyUrl = useCallback(() => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.url);
    toast.success('URL copied to clipboard');
  }, [currentFile]);

  if (!file) return null;

  const handleDownload = () => {
    if (!currentFile) return;
    const link = document.createElement('a');
    link.href = currentFile.url;
    link.download = currentFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentFile) return null;

  const currentIndex = files.findIndex((f) => f.id === currentFile.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 gap-0 bg-black/95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium truncate">{currentFile.filename}</h3>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <span className="capitalize">{currentFile.file_type}</span>
                <span>{formatFileSize(currentFile.size_bytes)}</span>
                {currentFile.width && currentFile.height && (
                  <span>
                    {currentFile.width} × {currentFile.height}
                  </span>
                )}
                {currentFile.duration_seconds && (
                  <span>{Math.round(currentFile.duration_seconds)}s</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="text-white hover:bg-white/10"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle metadata panel (I)</p>
              </TooltipContent>
            </Tooltip>
            {currentFile.file_type === 'image' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="text-white hover:bg-white/10"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rotate 90° (R)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
                      className="text-white hover:bg-white/10"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom in (+)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
                      className="text-white hover:bg-white/10"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Zoom out (-)</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="text-white hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy URL</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download file</p>
              </TooltipContent>
            </Tooltip>
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDelete(file);
                      onClose();
                    }}
                    className="text-white hover:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete file</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close (ESC)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Viewer */}
          <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            {onNavigate && hasPrev && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            {onNavigate && hasNext && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {currentFile.file_type === 'image' ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={currentFile.url}
                  alt={currentFile.filename}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-out',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                  className="select-none"
                />
              </div>
            ) : currentFile.file_type === 'video' ? (
              <video
                src={currentFile.url}
                controls
                className="max-w-full max-h-full"
                style={{ maxHeight: 'calc(95vh - 100px)' }}
              >
                Your browser does not support video playback.
              </video>
            ) : currentFile.file_type === 'audio' ? (
              <div className="flex flex-col items-center gap-6">
                <FileImage className="h-24 w-24 text-white/40" />
                <div className="text-center">
                  <p className="text-white font-medium mb-2">{currentFile.filename}</p>
                  <audio src={currentFile.url} controls className="w-96">
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </div>
            ) : currentFile.file_type === 'document' && currentFile.mime_type === 'application/pdf' ? (
              <iframe
                src={currentFile.url}
                className="w-full h-full border-0"
                style={{ minHeight: '600px' }}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/60">
                <FileImage className="h-24 w-24" />
                <p>Preview not available for this file type</p>
                <Button onClick={handleDownload} variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Download to View
                </Button>
              </div>
            )}
          </div>

          {/* Metadata Sidebar */}
          {showMetadata && (
            <div className="w-96 bg-black/90 backdrop-blur border-l border-white/20 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* File Information Section */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                    <FileImage className="h-4 w-4 text-blue-400" />
                    <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                      File Information
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <span className="text-white/60 text-xs uppercase tracking-wide">Name</span>
                      <p className="text-white mt-1 font-medium break-all">{currentFile.filename}</p>
                    </div>
                    {currentFile.title && (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Title</span>
                        <p className="text-white mt-1 font-medium">{currentFile.title}</p>
                      </div>
                    )}
                    {currentFile.description && (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Description</span>
                        <p className="text-white mt-1">{currentFile.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Type</span>
                        <p className="text-white mt-1 font-medium capitalize">{currentFile.file_type}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Size</span>
                        <p className="text-white mt-1 font-medium">{formatFileSize(currentFile.size_bytes)}</p>
                      </div>
                    </div>
                    {currentFile.mime_type && (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">MIME Type</span>
                        <p className="text-white mt-1 text-xs font-mono break-all">{currentFile.mime_type}</p>
                      </div>
                    )}
                    {currentFile.duration_seconds && (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Duration</span>
                        <p className="text-white mt-1 font-medium">
                          {Math.floor(currentFile.duration_seconds / 60)}:
                          {Math.floor(currentFile.duration_seconds % 60)
                            .toString()
                            .padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Details Section */}
                {currentFile.width && currentFile.height && (
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                      <Settings className="h-4 w-4 text-purple-400" />
                      <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                        Technical Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Dimensions</span>
                        <p className="text-white mt-1 font-medium">
                          {currentFile.width} × {currentFile.height}
                        </p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Megapixels</span>
                        <p className="text-white mt-1 font-medium">
                          {((currentFile.width * currentFile.height) / 1000000).toFixed(2)} MP
                        </p>
                      </div>
                      <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Aspect Ratio</span>
                        <p className="text-white mt-1 font-medium">
                          {(currentFile.width / currentFile.height).toFixed(2)} : 1
                          {Math.abs(currentFile.width / currentFile.height - 16 / 9) < 0.01 && ' (16:9)'}
                          {Math.abs(currentFile.width / currentFile.height - 4 / 3) < 0.01 && ' (4:3)'}
                          {Math.abs(currentFile.width / currentFile.height - 1) < 0.01 && ' (Square)'}
                          {Math.abs(currentFile.width / currentFile.height - 21 / 9) < 0.01 && ' (21:9)'}
                        </p>
                      </div>
                      {currentFile.file_type === 'image' && (
                        <div className="col-span-2 bg-white/5 p-3 rounded-lg border border-white/10">
                          <span className="text-white/60 text-xs uppercase tracking-wide">Orientation</span>
                          <p className="text-white mt-1 font-medium">
                            {currentFile.width > currentFile.height ? 'Landscape' : currentFile.width < currentFile.height ? 'Portrait' : 'Square'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata Section */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                    <Clock className="h-4 w-4 text-green-400" />
                    <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                      Metadata
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {currentFile.created_by && (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Uploaded By</span>
                        <p className="text-white mt-1 font-medium">
                          <MediaUserLink
                            userId={currentFile.created_by}
                            userName={currentFile.creator_profile?.full_name}
                            className="text-white hover:text-white/80"
                            showIcon={true}
                          />
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Uploaded</span>
                        <p className="text-white mt-1 text-sm">{formatDate(currentFile.created_at)}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-white/60 text-xs uppercase tracking-wide">Modified</span>
                        <p className="text-white mt-1 text-sm">{formatDate(currentFile.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Stats Section */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                    <BarChart className="h-4 w-4 text-orange-400" />
                    <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                      Usage Stats
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 rounded-lg border border-blue-500/20 text-center">
                      <p className="text-blue-400 text-xs uppercase tracking-wide mb-1">Views</p>
                      <p className="text-white text-2xl font-bold">{currentFile.view_count}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 rounded-lg border border-green-500/20 text-center">
                      <p className="text-green-400 text-xs uppercase tracking-wide mb-1">Downloads</p>
                      <p className="text-white text-2xl font-bold">{currentFile.download_count}</p>
                    </div>
                  </div>
                </div>

                {/* Direct URL Section */}
                <div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-white/60 text-xs uppercase tracking-wide">Direct URL</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={currentFile.url}
                        readOnly
                        className="flex-1 text-xs bg-white/5 text-white border border-white/10 rounded px-2 py-1 font-mono"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(currentFile.url);
                          toast.success('URL copied to clipboard');
                        }}
                        className="h-7 px-2 text-white hover:bg-white/10"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Analysis Section (shows stored results if available) */}
                {((currentFile.auto_tags && currentFile.auto_tags.length > 0) || (currentFile.detected_objects && currentFile.detected_objects.length > 0)) && (
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                        AI Analysis
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {currentFile.auto_tags && currentFile.auto_tags.length > 0 && (
                        <div>
                          <span className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            <Tag className="h-3 w-3 inline mr-1" />
                            AI Tags
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentFile.auto_tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {currentFile.detected_objects && currentFile.detected_objects.length > 0 && (
                        <div>
                          <span className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
                            Detected Objects
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentFile.detected_objects.map((obj, i) => (
                              <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30">
                                {obj}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentFile.custom_metadata?.generation_type === 'headshot' && (
                  <div>
                    <h4 className="text-white font-medium mb-3">AI Headshot Generation</h4>
                    <p className="text-white/40 text-xs mb-3">Powered by Google Gemini 3 Pro Image</p>
                    <div className="space-y-3 text-sm">
                      {currentFile.custom_metadata.prompt_name && (
                        <div>
                          <span className="text-white/60">Prompt Used:</span>
                          <p className="text-white mt-1 font-medium">
                            {currentFile.custom_metadata.prompt_name}
                          </p>
                        </div>
                      )}
                      {currentFile.custom_metadata.prompt_category && (
                        <div>
                          <span className="text-white/60">Category:</span>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {currentFile.custom_metadata.prompt_category}
                          </Badge>
                        </div>
                      )}
                      {currentFile.custom_metadata.source_type && (
                        <div>
                          <span className="text-white/60">Source:</span>
                          <p className="text-white mt-1 capitalize">
                            {currentFile.custom_metadata.source_type === 'avatar' ? 'Profile Avatar' : 'Uploaded Photo'}
                          </p>
                        </div>
                      )}
                      {currentFile.custom_metadata.prompt_text && (
                        <Collapsible open={promptDetailsOpen} onOpenChange={setPromptDetailsOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-white hover:bg-white/10 p-0 h-auto"
                            >
                              <span className="text-white/60 text-sm">Full Prompt</span>
                              {promptDetailsOpen ? (
                                <ChevronUp className="h-4 w-4 text-white/60" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-white/60" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="bg-white/5 p-3 rounded-md border border-white/10">
                              <p className="text-white/80 text-xs font-mono whitespace-pre-wrap">
                                {currentFile.custom_metadata.prompt_text}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      {currentFile.custom_metadata.generation_id && (
                        <div>
                          <span className="text-white/60 text-xs">
                            Generation ID: {currentFile.custom_metadata.generation_id.slice(0, 8)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentFile.custom_metadata?.ai_analysis && (
                  <div>
                    <h4 className="text-white font-medium mb-3">AI Analysis</h4>
                    <div className="space-y-3 text-sm">
                      {currentFile.custom_metadata.ai_analysis.content_type && (
                        <div>
                          <span className="text-white/60">Content Type:</span>
                          <p className="text-white mt-1 capitalize">
                            {currentFile.custom_metadata.ai_analysis.content_type}
                          </p>
                        </div>
                      )}
                      {currentFile.custom_metadata.ai_analysis.use_cases && currentFile.custom_metadata.ai_analysis.use_cases.length > 0 && (
                        <div>
                          <span className="text-white/60">Suggested Use Cases:</span>
                          <div className="mt-2 space-y-1">
                            {currentFile.custom_metadata.ai_analysis.use_cases.map((useCase: string, i: number) => (
                              <div key={i} className="text-white text-xs bg-white/5 px-2 py-1 rounded">
                                • {useCase}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {currentFile.custom_metadata.ai_analysis.confidence && (
                        <div>
                          <span className="text-white/60">AI Confidence:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${currentFile.custom_metadata.ai_analysis.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-xs">
                              {Math.round(currentFile.custom_metadata.ai_analysis.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                      {currentFile.ai_analysis_cost !== null && currentFile.ai_analysis_cost !== undefined && (
                        <div>
                          <span className="text-white/60">Analysis Cost:</span>
                          <p className="text-white mt-1 font-mono text-sm">
                            ${currentFile.ai_analysis_cost.toFixed(4)}
                          </p>
                        </div>
                      )}
                      {currentFile.ai_analysis_model && (
                        <div>
                          <span className="text-white/60">Model:</span>
                          <p className="text-white mt-1 text-sm">
                            {currentFile.ai_analysis_model}
                          </p>
                        </div>
                      )}
                      {currentFile.custom_metadata.ai_analysis.analyzed_at && (
                        <div>
                          <span className="text-white/60 text-xs">
                            Analyzed: {formatDate(currentFile.custom_metadata.ai_analysis.analyzed_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SynthID Watermark Detection Section */}
                {currentFile.synthid_detected !== null && (
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                        SynthID Watermark Detection
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                          currentFile.synthid_detected
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-gray-500/10 border border-gray-500/20'
                        }`}>
                          {currentFile.synthid_detected ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Shield className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-semibold ${
                            currentFile.synthid_detected ? 'text-green-300' : 'text-gray-300'
                          }`}>
                            {currentFile.synthid_detected ? 'Watermark Detected' : 'No Watermark Detected'}
                          </span>
                        </div>
                      </div>

                      {!currentFile.synthid_detected && currentFile.custom_metadata?.generation_type === 'headshot' && (
                        <Collapsible open={synthIdDetectionFailureOpen} onOpenChange={setSynthIdDetectionFailureOpen}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between text-amber-300 hover:bg-amber-500/10 p-3 h-auto rounded-lg border border-amber-500/30 bg-amber-500/5"
                            >
                              <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-amber-400" />
                                <span className="text-sm font-medium">Why wasn't the watermark detected?</span>
                              </div>
                              {synthIdDetectionFailureOpen ? (
                                <ChevronUp className="h-4 w-4 text-amber-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-amber-400" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 rounded-lg border border-amber-500/20 space-y-3">
                              <div>
                                <h5 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-amber-400" />
                                  SynthID Watermark Should Be Present
                                </h5>
                                <p className="text-white/80 text-xs leading-relaxed mb-3">
                                  This headshot was generated by Gemini, which automatically embeds an invisible SynthID watermark in all generated images. The watermark is likely present, but our detection failed to find it.
                                </p>
                              </div>
                              <div>
                                <h6 className="text-amber-300 font-semibold text-xs mb-2 uppercase tracking-wide">
                                  Why Detection May Fail:
                                </h6>
                                <ul className="space-y-2 text-white/70 text-xs">
                                  <li className="flex gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>Image transformations (compression, resizing, format conversion) can weaken the watermark signal</span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>Detection is probabilistic and can produce false negatives even when watermarks exist</span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>Storage processing and multiple encode/decode cycles can degrade the watermark</span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>Google does not yet provide a definitive SynthID detection API - we're using Gemini's vision model which has limitations</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="bg-white/5 p-3 rounded border border-white/10 mt-3">
                                <p className="text-white/60 text-xs italic">
                                  <strong className="text-white font-semibold">Note:</strong> The absence of detection does not mean the watermark is missing. SynthID watermarks are designed to survive transformations and remain embedded in the image data.
                                </p>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {currentFile.synthid_confidence !== null && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-white/60 text-xs uppercase tracking-wide">
                              Confidence
                            </span>
                            <span className="text-white font-medium text-sm">
                              {Math.round(currentFile.synthid_confidence * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${currentFile.synthid_confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {currentFile.synthid_generated_by && (
                        <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                          <span className="text-white/60 text-xs uppercase tracking-wide block mb-1">
                            Generated By
                          </span>
                          <span className="text-white font-medium text-sm">
                            {currentFile.synthid_generated_by}
                          </span>
                        </div>
                      )}

                      {currentFile.synthid_details && (
                        <div className="bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                          <span className="text-white/60 text-xs uppercase tracking-wide block mb-1">
                            Details
                          </span>
                          <p className="text-white/80 text-xs leading-relaxed">
                            {currentFile.synthid_details}
                          </p>
                        </div>
                      )}

                      <Collapsible open={synthIdInfoOpen} onOpenChange={setSynthIdInfoOpen}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between text-white hover:bg-white/10 p-3 h-auto rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-cyan-400" />
                              <span className="text-sm font-medium">What is SynthID?</span>
                            </div>
                            {synthIdInfoOpen ? (
                              <ChevronUp className="h-4 w-4 text-white/60" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-white/60" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-4 rounded-lg border border-cyan-500/20 space-y-3">
                            <div>
                              <h5 className="text-white font-semibold text-sm mb-2">
                                Invisible Watermark Technology
                              </h5>
                              <p className="text-white/80 text-xs leading-relaxed">
                                SynthID is Google DeepMind's innovative watermarking technology that embeds
                                invisible digital signatures directly into AI-generated images.
                              </p>
                            </div>
                            <Separator className="bg-white/10" />
                            <div>
                              <h5 className="text-white font-semibold text-sm mb-2">
                                Where It's Used
                              </h5>
                              <ul className="mt-2 space-y-1 text-white/70 text-xs">
                                <li className="flex items-start gap-2">
                                  <span className="text-cyan-400 mt-0.5">•</span>
                                  <span>Google Imagen 3</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-cyan-400 mt-0.5">•</span>
                                  <span>Gemini image generation models</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                )}

                {/* Color Palette Section */}
                {currentFile.dominant_colors && currentFile.dominant_colors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                      <Palette className="h-4 w-4 text-pink-400" />
                      <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                        Color Palette
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      {currentFile.dominant_colors.slice(0, 6).map((color, i) => (
                        <div key={i} className="flex-1">
                          <div
                            className="w-full h-14 rounded-lg border-2 border-white/20 shadow-lg"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-[10px] text-white/70 mt-1.5 text-center font-mono uppercase tracking-wider">
                            {color}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXIF Data Section */}
                {currentFile.exif_data && Object.keys(currentFile.exif_data).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-4">
                      <Info className="h-4 w-4 text-gray-400" />
                      <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                        EXIF Data
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(currentFile.exif_data).slice(0, 10).map(([key, value]) => (
                        <div key={key} className="bg-white/5 p-2 rounded border border-white/10">
                          <span className="text-white/60 text-xs uppercase tracking-wide capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <p className="text-white mt-1 text-sm break-all font-mono">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className="px-4 py-2 bg-black/50 backdrop-blur border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span>ESC to close</span>
              <span>← → to navigate</span>
              {currentFile.file_type === 'image' && (
                <>
                  <span>+/- to zoom</span>
                  <span>R to rotate</span>
                </>
              )}
              <span>I for info</span>
            </div>
            {files.length > 0 && (
              <span>
                {currentIndex + 1} / {files.length}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}
