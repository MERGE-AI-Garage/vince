// ABOUTME: Bulk actions toolbar for selected media files with move, tag, delete, and download operations
// ABOUTME: Displays selection count and provides batch operation controls

import { Button } from '@/components/ui/button';
import { X, FolderInput, Tag, Trash2, Download } from 'lucide-react';

interface MediaBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMove?: () => void;
  onTag?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function MediaBulkActionsBar({
  selectedCount,
  onClearSelection,
  onMove,
  onTag,
  onDelete,
  onDownload,
}: MediaBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-background shadow-lg">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'file' : 'files'} selected
        </span>
        <div className="h-6 w-px bg-border mx-2" />
        {onMove && (
          <Button variant="outline" size="sm" onClick={onMove}>
            <FolderInput className="h-4 w-4 mr-2" />
            Move
          </Button>
        )}
        {onTag && (
          <Button variant="outline" size="sm" onClick={onTag}>
            <Tag className="h-4 w-4 mr-2" />
            Tag
          </Button>
        )}
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
        <div className="h-6 w-px bg-border mx-2" />
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
