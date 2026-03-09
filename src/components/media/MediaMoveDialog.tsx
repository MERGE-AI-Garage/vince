// ABOUTME: Dialog for selecting destination folder when moving media files
// ABOUTME: Displays folder hierarchy and allows selection of target folder or root

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, Home } from 'lucide-react';
import type { MediaFolder } from '@/types/media';

interface MediaMoveDialogProps {
  open: boolean;
  onClose: () => void;
  onMove: (folderId: string | null) => void;
  folders: MediaFolder[];
  fileCount: number;
  currentFolderId?: string | null;
}

export function MediaMoveDialog({
  open,
  onClose,
  onMove,
  folders,
  fileCount,
  currentFolderId,
}: MediaMoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleMove = () => {
    onMove(selectedFolderId);
    onClose();
  };

  const availableFolders = folders.filter((f) => f.id !== currentFolderId);
  const showRootOption = currentFolderId !== null;

  const getFolderPath = (folder: MediaFolder): string => {
    const path: string[] = [];
    let current: MediaFolder | undefined = folder;

    while (current) {
      path.unshift(current.name);
      current = folders.find((f) => f.id === current?.parent_id);
    }

    return path.join(' / ');
  };

  const getNestingLevel = (folder: MediaFolder): number => {
    let level = 0;
    let current: MediaFolder | undefined = folder;

    while (current?.parent_id) {
      level++;
      current = folders.find((f) => f.id === current?.parent_id);
    }

    return level;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move {fileCount} {fileCount === 1 ? 'file' : 'files'}</DialogTitle>
          <DialogDescription>
            {showRootOption
              ? 'Select a destination folder or choose root to move files to the top level.'
              : 'Select a destination folder.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {showRootOption && (
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedFolderId === null
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Home className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Root</p>
                  <p className="text-xs text-muted-foreground">Top level folder</p>
                </div>
              </button>
            )}

            {availableFolders.length === 0 && !showRootOption ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No folders available. Create a folder first to organize your files.
              </div>
            ) : availableFolders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No other folders available
              </div>
            ) : (
              availableFolders.map((folder) => {
                const nestingLevel = getNestingLevel(folder);
                const folderPath = getFolderPath(folder);

                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedFolderId === folder.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                    style={{ paddingLeft: `${12 + nestingLevel * 16}px` }}
                  >
                    <Folder
                      className="h-5 w-5 flex-shrink-0"
                      style={{ color: folder.color || '#3b82f6' }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {folderPath}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove}>
            Move {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
