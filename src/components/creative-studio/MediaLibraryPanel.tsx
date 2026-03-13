// ABOUTME: Side-panel media browser for Creative Studio
// ABOUTME: Shows user's Creative Studio media with click-to-load and drag-to-canvas

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Search, Folder, Home, ExternalLink } from 'lucide-react';
import { MediaLibraryTab } from './MediaLibraryTab';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  file_type: string;
  folder_id: string | null;
  created_at: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
}

interface MediaLibraryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (url: string) => void;
}

export function MediaLibraryPanel({ open, onOpenChange, onSelectImage }: MediaLibraryPanelProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'All Media' },
  ]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showFullLibrary, setShowFullLibrary] = useState(false);

  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);

    try {
      // Fetch folders
      let foldersQuery = supabase
        .from('media_folders')
        .select('id, name, parent_id, icon, color')
        .order('name');

      if (currentFolderId) {
        foldersQuery = foldersQuery.eq('parent_id', currentFolderId);
      } else {
        foldersQuery = foldersQuery.is('parent_id', null);
      }

      const { data: foldersData } = await foldersQuery;
      setFolders(foldersData || []);

      // Fetch media (images only for the canvas)
      let mediaQuery = supabase
        .from('media')
        .select('id, filename, url, mime_type, file_type, folder_id, created_at')
        .is('deleted_at', null)
        .eq('file_type', 'image')
        .order('created_at', { ascending: false })
        .limit(100);

      if (currentFolderId) {
        mediaQuery = mediaQuery.eq('folder_id', currentFolderId);
      } else {
        mediaQuery = mediaQuery.is('folder_id', null);
      }

      const { data: mediaData } = await mediaQuery;
      setMedia(mediaData || []);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  }, [open, currentFolderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateToFolder = (folder: MediaFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToPath = (index: number) => {
    const entry = folderPath[index];
    setCurrentFolderId(entry.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  const handleDragStart = (e: React.DragEvent, url: string) => {
    e.dataTransfer.setData('text/uri-list', url);
    e.dataTransfer.setData('text/plain', url);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleSelectItem = (url: string) => {
    onSelectImage(url);
    onOpenChange(false);
  };

  const filteredMedia = search
    ? media.filter((m) => m.filename.toLowerCase().includes(search.toLowerCase()))
    : media;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0 flex flex-col shadow-2xl">
        <SheetHeader className="px-5 pt-5 pb-4 border-b bg-muted/30">
          <SheetTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="block">Media Library</span>
                <span className="text-[10px] text-muted-foreground font-normal">Click to load or drag to canvas</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowFullLibrary(true)}
              title="Open full media library"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full Library
            </Button>
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-5 py-3 bg-card/50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-9 h-9 text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="px-5 py-2 flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto bg-card/30">
          {folderPath.map((entry, i) => (
            <span key={i} className="flex items-center gap-1 whitespace-nowrap">
              {i > 0 && <span>/</span>}
              <button
                onClick={() => navigateToPath(i)}
                className="hover:text-foreground transition-colors"
              >
                {i === 0 ? <Home className="w-3 h-3 inline" /> : entry.name}
              </button>
            </span>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 border-t">
          <div className="p-3">
            {loading ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {/* Folders */}
                {folders.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => navigateToFolder(folder)}
                        className="aspect-square bg-card rounded-lg border border-border shadow-sm hover:border-primary/50 hover:shadow-md flex flex-col items-center justify-center gap-1.5 transition-all"
                      >
                        <Folder
                          className="w-6 h-6"
                          style={{ color: folder.color || undefined }}
                        />
                        <span className="text-[10px] text-muted-foreground truncate max-w-full px-1">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Images */}
                {filteredMedia.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images in this folder</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {filteredMedia.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item.url)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.url)}
                        className="aspect-square bg-card rounded-lg border border-border shadow-sm hover:border-primary/50 hover:shadow-md overflow-hidden cursor-grab active:cursor-grabbing transition-all group relative"
                      >
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[9px] text-white truncate">{item.filename}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>

    <Dialog open={showFullLibrary} onOpenChange={setShowFullLibrary}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Media Library
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <MediaLibraryTab />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
