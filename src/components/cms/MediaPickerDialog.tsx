// ABOUTME: Media library picker dialog with folder navigation, search, filtering, and drag-drop upload
// ABOUTME: Supports images, videos, audio, and documents with integrated Supabase storage

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Folder,
  Home,
  Upload
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface Media {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size: number;
  folder_id?: string;
  file_type?: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
}

interface MediaPickerDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (media: Media) => void;
  onClose?: () => void;
  mediaType?: 'all' | 'images' | 'videos' | 'audio' | 'documents';
  initialFolderPath?: string;
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  onClose,
  mediaType = 'all',
  initialFolderPath,
}: MediaPickerDialogProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(mediaType);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  useEffect(() => {
    setTypeFilter(mediaType);
  }, [mediaType]);

  // Resolve initialFolderPath to a folder ID when the dialog opens
  useEffect(() => {
    if (!open || !initialFolderPath) return;

    const resolveFolderPath = async () => {
      const { data } = await supabase
        .from('media_folders')
        .select('id')
        .eq('path', initialFolderPath)
        .single();

      if (data) {
        setCurrentFolderId(data.id);
      }
    };

    resolveFolderPath();
  }, [open, initialFolderPath]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [currentFolderId, open]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by folder
      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId);
      } else {
        query = query.is('folder_id', null);
      }

      // Filter by media type if specified
      if (typeFilter !== 'all') {
        if (typeFilter === 'images') {
          query = query.ilike('mime_type', 'image%');
        } else if (typeFilter === 'videos') {
          query = query.ilike('mime_type', 'video%');
        } else if (typeFilter === 'audio') {
          query = query.ilike('mime_type', 'audio%');
        } else if (typeFilter === 'documents') {
          query = query.or('mime_type.ilike.%pdf%,mime_type.ilike.%document%');
        }
      }

      const [mediaResult, foldersResult] = await Promise.all([
        query,
        currentFolderId
          ? supabase
              .from('media_folders')
              .select('id, name, parent_id')
              .eq('parent_id', currentFolderId)
              .order('name')
          : supabase
              .from('media_folders')
              .select('id, name, parent_id')
              .is('parent_id', null)
              .order('name')
      ]);

      if (mediaResult.error) throw mediaResult.error;
      if (foldersResult.error) throw foldersResult.error;

      setMedia(mediaResult.data || []);
      setFolders(foldersResult.data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-8 w-8" />;
    if (mimeType.startsWith('video/')) return <Film className="h-8 w-8" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    const newProgress: {[key: string]: number} = {};

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload files');

      for (const file of files) {
        newProgress[file.name] = 0;
        setUploadProgress({...newProgress});

        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Create media record
        const { error: dbError } = await supabase
          .from('media')
          .insert({
            filename: file.name,
            url: publicUrl,
            mime_type: file.type,
            size: file.size,
            folder_id: currentFolderId,
            file_type: file.type.split('/')[0],
            created_by: user.id,
          });

        if (dbError) throw dbError;

        newProgress[file.name] = 100;
        setUploadProgress({...newProgress});
      }

      toast.success(`Uploaded ${files.length} file(s)`);

      // Refresh media list
      await fetchData();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: mediaType === 'images' ? { 'image/*': [] }
      : mediaType === 'videos' ? { 'video/*': [] }
      : mediaType === 'audio' ? { 'audio/*': [] }
      : mediaType === 'documents' ? { 'application/pdf': [], 'application/msword': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] }
      : undefined,
    disabled: uploading,
  });

  const filteredMedia = media.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="images">Images</SelectItem>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : uploading
                ? 'border-muted-foreground/20 bg-muted/50 cursor-not-allowed'
                : 'border-muted-foreground/20 hover:border-primary hover:bg-accent/50'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Uploading files...</p>
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-1 text-xs">
                    {Object.entries(uploadProgress).map(([name, progress]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="truncate flex-1 text-left">{name}</span>
                        <span>{progress}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolderId(null)}
              className="h-7 px-2"
            >
              <Home className="h-3 w-3" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="grid grid-cols-6 gap-3 pb-4 border-b">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Folder className="h-8 w-8 text-primary" />
                      <span className="text-xs font-medium truncate w-full text-center">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Media Grid */}
              {filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  {getMediaIcon('image/')}
                  <p className="mt-2">No files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                  {filteredMedia.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item)}
                      className="group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      {item.mime_type.startsWith('image/') ? (
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          {getMediaIcon(item.mime_type)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-2">
                        <p className="text-xs text-white truncate w-full text-center">
                          {item.filename}
                        </p>
                        <p className="text-xs text-white/70">
                          {formatFileSize(item.size)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
