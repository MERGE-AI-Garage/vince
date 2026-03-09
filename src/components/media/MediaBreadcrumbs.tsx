// ABOUTME: Breadcrumb navigation for media library folder hierarchy with home button and clickable path
// ABOUTME: Shows current location and allows quick navigation to parent folders

import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import type { MediaFolder } from '@/types/media';

interface MediaBreadcrumbsProps {
  currentFolder: MediaFolder | null;
  allFolders: MediaFolder[];
  onNavigate: (folderId: string | null) => void;
}

export function MediaBreadcrumbs({ currentFolder, allFolders, onNavigate }: MediaBreadcrumbsProps) {
  // Build breadcrumb path
  const buildPath = (folder: MediaFolder | null): MediaFolder[] => {
    if (!folder) return [];

    const path: MediaFolder[] = [folder];
    let current = folder;

    while (current.parent_id) {
      const parent = allFolders.find((f) => f.id === current.parent_id);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }

    return path;
  };

  const path = buildPath(currentFolder);

  return (
    <div className="flex items-center gap-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-8 px-2 hover:bg-accent"
      >
        <Home className="h-4 w-4" />
      </Button>

      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className="h-8 px-2 hover:bg-accent font-medium"
            disabled={index === path.length - 1}
          >
            {folder.name}
          </Button>
        </div>
      ))}
    </div>
  );
}
