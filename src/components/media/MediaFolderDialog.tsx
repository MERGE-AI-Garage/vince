// ABOUTME: Dialog for creating and editing media folders with name, description, color, and icon selection
// ABOUTME: Supports parent folder selection for hierarchical organization

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Folder, FolderOpen, FolderArchive, FolderGit2, Image, Film, Music, FileText } from 'lucide-react';
import type { MediaFolder } from '@/types/media';

interface MediaFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (folder: Partial<MediaFolder>) => Promise<void>;
  folder?: MediaFolder | null;
  parentFolderId?: string | null;
  allFolders?: MediaFolder[];
}

const FOLDER_ICONS = [
  { value: 'folder', label: 'Folder', Icon: Folder },
  { value: 'folder-open', label: 'Open Folder', Icon: FolderOpen },
  { value: 'folder-archive', label: 'Archive', Icon: FolderArchive },
  { value: 'folder-git', label: 'Projects', Icon: FolderGit2 },
  { value: 'image', label: 'Images', Icon: Image },
  { value: 'film', label: 'Videos', Icon: Film },
  { value: 'music', label: 'Audio', Icon: Music },
  { value: 'file-text', label: 'Documents', Icon: FileText },
];

const FOLDER_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#10b981', label: 'Green' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6b7280', label: 'Gray' },
];

export function MediaFolderDialog({
  open,
  onClose,
  onSave,
  folder,
  parentFolderId,
  allFolders = [],
}: MediaFolderDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('folder');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      setColor(folder.color);
      setIcon(folder.icon);
      setSelectedParentId(folder.parent_id);
    } else {
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setIcon('folder');
      setSelectedParentId(parentFolderId || null);
    }
  }, [folder, parentFolderId]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: folder?.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon,
        parent_id: selectedParentId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const SelectedIcon = FOLDER_ICONS.find((i) => i.value === icon)?.Icon || Folder;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'New Folder'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Folder"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in this folder?"
              rows={3}
            />
          </div>

          {allFolders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Folder (optional)</Label>
              <Select
                value={selectedParentId || 'root'}
                onValueChange={(value) => setSelectedParentId(value === 'root' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (No Parent)</SelectItem>
                  {allFolders
                    .filter((f) => f.id !== folder?.id)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.path}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_ICONS.map(({ value, label, Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {FOLDER_COLORS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setColor(value)}
                    className={`w-full aspect-square rounded border-2 transition-all ${
                      color === value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <SelectedIcon className="h-8 w-8" style={{ color }} />
            <div>
              <p className="font-medium">{name || 'Folder Name'}</p>
              <p className="text-sm text-muted-foreground">
                {description || 'No description'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : folder ? 'Save Changes' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
