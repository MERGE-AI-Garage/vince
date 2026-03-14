// ABOUTME: Full media library browser tab for the Creative Studio admin panel.
// ABOUTME: Supports hierarchical folders, tagging, search, bulk operations, drag-drop, and image preview.

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HardDrive,
  Upload,
  Search,
  Grid3x3,
  List,
  Folder,
  FolderOpen,
  FolderArchive,
  FolderGit2,
  Home,
  ChevronRight,
  Loader2,
  FileImage,
  Film,
  Music,
  FileText,
  Download,
  Trash2,
  Eye,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { MediaFile, MediaFolder, MediaTag, FileType, ViewMode, MediaStats } from '@/types/media';
import { MediaPreview } from '@/components/media/MediaPreview';
import { MediaFolderDialog } from '@/components/media/MediaFolderDialog';
import { MediaBulkActionsBar } from '@/components/media/MediaBulkActionsBar';
import { MediaTagDialog } from '@/components/media/MediaTagDialog';
import { MediaMoveDialog } from '@/components/media/MediaMoveDialog';
import { MediaUploadDialog } from '@/components/media/MediaUploadDialog';
import { MediaUserLink } from '@/components/media/MediaUserLink';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const getFolderIcon = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    'folder': Folder,
    'folder-open': FolderOpen,
    'folder-archive': FolderArchive,
    'folder-git': FolderGit2,
    'image': FileImage,
    'film': Film,
    'music': Music,
    'file-text': FileText,
  };
  return iconMap[iconName] || Folder;
};

export function MediaLibraryTab() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [tags, setTags] = useState<MediaTag[]>([]);
  const [allFolders, setAllFolders] = useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>('newest');
  const [uploaderFilter, setUploaderFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentFolderId, fileTypeFilter]);

  useEffect(() => {
    if (showTagDialog && tags.length === 0) {
      supabase.from('media_tags').select('*').order('name').then(({ data }) => {
        if (data) setTags(data);
      });
    }
  }, [showTagDialog]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Select only columns needed for display — avoids fetching heavy jsonb fields
      let mediaQuery = supabase
        .from('media')
        .select('id, filename, title, url, thumbnail_url, mime_type, file_type, folder_id, created_at, size_bytes, created_by', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (currentFolderId) {
        mediaQuery = mediaQuery.eq('folder_id', currentFolderId);
      }

      if (fileTypeFilter !== 'all') {
        mediaQuery = mediaQuery.eq('file_type', fileTypeFilter);
      }

      let foldersQuery = supabase
        .from('media_folders')
        .select('id, name, parent_id, icon, color, path')
        .order('name');

      if (currentFolderId) {
        foldersQuery = foldersQuery.eq('parent_id', currentFolderId);
      } else {
        foldersQuery = foldersQuery.is('parent_id', null);
      }

      const [
        { data: mediaData, error: mediaError, count: totalCount },
        { data: foldersData, error: foldersError },
        { data: allFoldersData, error: allFoldersError },
      ] = await Promise.all([
        mediaQuery,
        foldersQuery,
        supabase.from('media_folders').select('id, name, parent_id, icon, color, path').order('path'),
      ]);

      if (mediaError) throw mediaError;
      if (foldersError) throw foldersError;
      if (allFoldersError) throw allFoldersError;

      setMedia(mediaData || []);
      setFolders(foldersData || []);
      setAllFolders(allFoldersData || []);

      // Compute stats from fetched data — no extra query needed
      const files = mediaData || [];
      const filesByType: Record<FileType, number> = { image: 0, video: 0, audio: 0, document: 0, other: 0 };
      const sizeByType: Record<FileType, number> = { image: 0, video: 0, audio: 0, document: 0, other: 0 };
      let totalSize = 0;
      files.forEach((file) => {
        const type = file.file_type as FileType;
        filesByType[type] = (filesByType[type] || 0) + 1;
        sizeByType[type] = (sizeByType[type] || 0) + (file.size_bytes || 0);
        totalSize += file.size_bytes || 0;
      });
      setStats({ totalFiles: totalCount ?? files.length, totalSize, filesByType, sizeByType, recentUploads: 0, largestFiles: [] });
    } catch (error: any) {
      toast.error(`Failed to load media: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload files');

      for (const file of files) {
        const mimeType = file.type;
        let fileType: FileType = 'other';
        if (mimeType.startsWith('image/')) fileType = 'image';
        else if (mimeType.startsWith('video/')) fileType = 'video';
        else if (mimeType.startsWith('audio/')) fileType = 'audio';
        else if (mimeType.includes('pdf') || mimeType.includes('document')) fileType = 'document';

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = currentFolderId ? `${currentFolderId}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('media')
          .insert({
            filename: file.name,
            url: publicUrl,
            storage_path: filePath,
            mime_type: mimeType,
            file_type: fileType,
            size_bytes: file.size,
            folder_id: currentFolderId,
            created_by: user.id,
          });

        if (dbError) throw dbError;
      }

      toast.success(`Uploaded ${files.length} file(s)`);
      await fetchData();
      await fetchStats();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.rpc('admin_soft_delete_media', {
        media_ids: [deleteTarget.id],
      });
      if (error) throw error;
      toast.success('File deleted');
      setDeleteTarget(null);
      await fetchData();
      await fetchStats();
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    try {
      const { error } = await supabase.rpc('admin_soft_delete_media', {
        media_ids: Array.from(selectedFiles),
      });
      if (error) throw error;
      toast.success(`Deleted ${selectedFiles.size} file(s)`);
      setSelectedFiles(new Set());
      setShowBulkDeleteConfirm(false);
      await fetchData();
      await fetchStats();
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleSaveFolder = async (folderData: Partial<MediaFolder>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (folderData.id) {
        const { error } = await supabase
          .from('media_folders')
          .update({
            name: folderData.name,
            description: folderData.description,
            color: folderData.color,
            icon: folderData.icon,
            parent_id: folderData.parent_id,
            updated_by: user.id,
          })
          .eq('id', folderData.id);
        if (error) throw error;
        toast.success('Folder updated');
      } else {
        const { error } = await supabase
          .from('media_folders')
          .insert({
            name: folderData.name,
            description: folderData.description,
            color: folderData.color || '#3b82f6',
            icon: folderData.icon || 'folder',
            parent_id: folderData.parent_id || currentFolderId,
            created_by: user.id,
          });
        if (error) throw error;
        toast.success('Folder created');
      }

      await fetchData();
    } catch (error: any) {
      toast.error(`Failed to save folder: ${error.message}`);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredMedia.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredMedia.map((f) => f.id)));
    }
  };

  const handleBulkDownload = () => {
    const selectedMedia = media.filter((f) => selectedFiles.has(f.id));
    selectedMedia.forEach((file) => {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success(`Downloading ${selectedFiles.size} file(s)`);
  };

  const handleMoveFiles = async (destinationFolderId: string | null) => {
    if (selectedFiles.size === 0) return;
    try {
      const { error } = await supabase
        .from('media')
        .update({ folder_id: destinationFolderId })
        .in('id', Array.from(selectedFiles));
      if (error) throw error;
      const destination = destinationFolderId
        ? allFolders.find((f) => f.id === destinationFolderId)?.name || 'selected folder'
        : 'root';
      toast.success(`Moved ${selectedFiles.size} file(s) to ${destination}`);
      setSelectedFiles(new Set());
      setShowMoveDialog(false);
      await fetchData();
    } catch (error: any) {
      toast.error(`Move failed: ${error.message}`);
    }
  };

  const handlePreviewNavigate = (direction: 'prev' | 'next') => {
    if (!previewFile) return;
    const currentIndex = filteredMedia.findIndex((f) => f.id === previewFile.id);
    if (direction === 'prev' && currentIndex > 0) setPreviewFile(filteredMedia[currentIndex - 1]);
    else if (direction === 'next' && currentIndex < filteredMedia.length - 1) setPreviewFile(filteredMedia[currentIndex + 1]);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const fileId = draggableId.replace('file-', '');
    const folderId = destination.droppableId === 'root' ? null : destination.droppableId.replace('folder-', '');

    const file = media.find((f) => f.id === fileId);
    if (file && file.folder_id === folderId) return;

    try {
      const { error } = await supabase
        .from('media')
        .update({ folder_id: folderId })
        .eq('id', fileId);
      if (error) throw error;
      const destinationName = folderId
        ? allFolders.find((f) => f.id === folderId)?.name || 'selected folder'
        : 'root';
      toast.success(`Moved to ${destinationName}`);
      await fetchData();
    } catch (error: any) {
      toast.error(`Move failed: ${error.message}`);
    }
  };

  const currentFolder = allFolders.find((f) => f.id === currentFolderId) || null;

  const buildBreadcrumbPath = (): MediaFolder[] => {
    if (!currentFolderId || !currentFolder) return [];
    const path: MediaFolder[] = [];
    let folder: MediaFolder | null = currentFolder;
    while (folder) {
      path.unshift(folder);
      folder = folder.parent_id ? allFolders.find((f) => f.id === folder!.parent_id) || null : null;
    }
    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath();

  const uniqueUploaders = Array.from(
    new Map(
      media
        .filter((file) => file.created_by)
        .map((file) => [
          file.created_by!,
          { id: file.created_by!, name: file.creator_profile?.full_name || 'Unknown User' },
        ])
    ).values()
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case 'image': return <FileImage className="h-8 w-8" />;
      case 'video': return <Film className="h-8 w-8" />;
      case 'audio': return <Music className="h-8 w-8" />;
      default: return <FileText className="h-8 w-8" />;
    }
  };

  const filteredMedia = (() => {
    let filtered = searchTerm.trim()
      ? media.filter(
          (file) =>
            file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (file.title && file.title.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : [...media];

    if (uploaderFilter !== 'all') {
      filtered = filtered.filter((file) => file.created_by === uploaderFilter);
    }

    switch (sortBy) {
      case 'newest': filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'name-asc': filtered.sort((a, b) => a.filename.localeCompare(b.filename)); break;
      case 'name-desc': filtered.sort((a, b) => b.filename.localeCompare(a.filename)); break;
      case 'size-desc': filtered.sort((a, b) => b.size_bytes - a.size_bytes); break;
      case 'size-asc': filtered.sort((a, b) => a.size_bytes - b.size_bytes); break;
    }

    return filtered;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Media Library</h2>
          {stats && (
            <p className="text-sm text-muted-foreground">
              {stats.totalFiles} files · {formatFileSize(stats.totalSize)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUploadDialog(true)} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Files</p>
                <p className="text-xl font-bold mt-0.5">{stats.totalFiles}</p>
              </div>
              <FileImage className="h-5 w-5 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Storage</p>
                <p className="text-xl font-bold mt-0.5">{formatFileSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="h-5 w-5 text-purple-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Images</p>
                <p className="text-xl font-bold mt-0.5">{stats.filesByType.image || 0}</p>
              </div>
              <FileImage className="h-5 w-5 text-green-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Videos</p>
                <p className="text-xl font-bold mt-0.5">{stats.filesByType.video || 0}</p>
              </div>
              <Film className="h-5 w-5 text-orange-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto items-center">
          {filteredMedia.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 border rounded">
              <Checkbox
                checked={selectedFiles.size === filteredMedia.length && filteredMedia.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedFiles.size > 0 ? `${selectedFiles.size} selected` : 'Select all'}
              </span>
            </div>
          )}

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={fileTypeFilter} onValueChange={(value: any) => setFileTypeFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="size-desc">Largest First</SelectItem>
              <SelectItem value="size-asc">Smallest First</SelectItem>
            </SelectContent>
          </Select>

          {uniqueUploaders.length > 0 && (
            <Select value={uploaderFilter} onValueChange={setUploaderFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUploaders.map((uploader) => (
                  <SelectItem key={uploader.id} value={uploader.id}>
                    {uploader.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2">
          {selectedFiles.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowTagDialog(true)}>
              <Tag className="h-4 w-4 mr-2" />
              Tag ({selectedFiles.size})
            </Button>
          )}
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm py-3 px-1">
        <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(null)} className="h-8 px-2 hover:bg-accent">
          <Home className="h-4 w-4 mr-1.5" />
          <span className="font-medium">Home</span>
        </Button>
        {breadcrumbPath.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {index === breadcrumbPath.length - 1 ? (
              <span className="text-sm font-semibold px-2 py-1 bg-accent/50 rounded">{folder.name}</span>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(folder.id)} className="h-8 px-2 hover:bg-accent">
                {folder.name}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <Droppable key={folder.id} droppableId={`folder-${folder.id}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                      }`}
                    >
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="flex flex-col items-center gap-2"
                      >
                        {(() => {
                          const IconComponent = getFolderIcon(folder.icon);
                          return (
                            <IconComponent
                              className="h-8 w-8"
                              style={{ color: folder.color || 'hsl(var(--primary))' }}
                            />
                          );
                        })()}
                        <span className="text-sm font-medium truncate w-full text-center">{folder.name}</span>
                      </button>
                      <div style={{ display: 'none' }}>{provided.placeholder}</div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          )}

          {/* Media Grid / List */}
          {filteredMedia.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Upload your first file to get started'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <Droppable droppableId="root" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                >
                  {filteredMedia.map((file, index) => (
                    <Draggable key={file.id} draggableId={`file-${file.id}`} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`group hover:shadow-lg transition-all cursor-pointer ${snapshot.isDragging ? 'opacity-50 shadow-2xl' : ''}`}
                        >
                          <CardContent className="p-3" onClick={() => setPreviewFile(file)}>
                            <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden relative">
                              <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedFiles.has(file.id)}
                                  onCheckedChange={() => toggleFileSelection(file.id)}
                                  className="bg-white border-2"
                                />
                              </div>
                              {file.file_type === 'image' ? (
                                <img
                                  src={file.thumbnail_url || file.url}
                                  alt={file.filename}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : file.file_type === 'video' ? (
                                <video src={file.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" preload="none" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">{getFileIcon(file.file_type)}</div>
                              )}
                            </div>
                            <p className="text-xs font-medium truncate" title={file.filename}>{file.filename}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size_bytes)}</p>
                            {file.created_by && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                By: <MediaUserLink userId={file.created_by} userName={file.creator_profile?.full_name} className="text-[10px]" />
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">{new Date(file.created_at).toLocaleDateString()}</p>
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setPreviewFile(file)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-6 px-2"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = file.url;
                                  link.download = file.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setDeleteTarget(file)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <Droppable droppableId="root">
              {(provided) => (
                <Card>
                  <CardContent className="p-0">
                    <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y">
                      {filteredMedia.map((file, index) => (
                        <Draggable key={file.id} draggableId={`file-${file.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-4 p-4 hover:bg-accent transition-colors cursor-pointer ${snapshot.isDragging ? 'opacity-50 bg-accent' : ''}`}
                              onClick={() => setPreviewFile(file)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox checked={selectedFiles.has(file.id)} onCheckedChange={() => toggleFileSelection(file.id)} />
                              </div>
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                {file.file_type === 'image' ? (
                                  <img src={file.thumbnail_url || file.url} alt={file.filename} className="w-full h-full object-cover rounded" loading="lazy" decoding="async" />
                                ) : file.file_type === 'video' ? (
                                  <video src={file.url} className="w-full h-full object-cover rounded" preload="none" />
                                ) : (
                                  getFileIcon(file.file_type)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.filename}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{formatFileSize(file.size_bytes)}</span>
                                  <span className="capitalize">{file.file_type}</span>
                                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                  {file.created_by && (
                                    <span className="truncate max-w-[150px]">
                                      By: <MediaUserLink userId={file.created_by} userName={file.creator_profile?.full_name} className="text-sm" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => setPreviewFile(file)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = file.url;
                                    link.download = file.filename;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(file)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </CardContent>
                </Card>
              )}
            </Droppable>
          )}
        </DragDropContext>
      )}

      {/* Dialogs */}
      <MediaPreview
        file={previewFile}
        files={filteredMedia}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDelete={(file) => { setDeleteTarget(file); setPreviewFile(null); }}
        onNavigate={handlePreviewNavigate}
        onUpdate={fetchData}
      />

      <MediaFolderDialog
        open={showFolderDialog}
        onClose={() => { setShowFolderDialog(false); setEditingFolder(null); }}
        onSave={handleSaveFolder}
        folder={editingFolder}
        parentFolderId={currentFolderId}
        allFolders={allFolders}
      />

      <MediaTagDialog
        open={showTagDialog}
        onClose={() => setShowTagDialog(false)}
        mediaIds={Array.from(selectedFiles)}
        allTags={tags}
        onTagsUpdated={() => { fetchData(); setSelectedFiles(new Set()); }}
      />

      <MediaMoveDialog
        open={showMoveDialog}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMoveFiles}
        folders={allFolders}
        fileCount={selectedFiles.size}
        currentFolderId={currentFolderId}
      />

      <MediaUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUpload}
        currentFolderName={currentFolder?.name}
      />

      <MediaBulkActionsBar
        selectedCount={selectedFiles.size}
        onClearSelection={() => setSelectedFiles(new Set())}
        onMove={() => setShowMoveDialog(true)}
        onTag={() => setShowTagDialog(true)}
        onDelete={() => setShowBulkDeleteConfirm(true)}
        onDownload={handleBulkDownload}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{deleteTarget?.filename}" from the media library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedFiles.size} file(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the selected files from the media library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedFiles.size} file(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
