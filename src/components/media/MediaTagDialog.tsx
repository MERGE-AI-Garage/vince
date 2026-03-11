// ABOUTME: Dialog for managing tags on media files with create, assign, and remove operations
// ABOUTME: Supports bulk tagging and tag creation with color selection

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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import type { MediaTag } from '@/types/media';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaTagDialogProps {
  open: boolean;
  onClose: () => void;
  mediaIds: string[];
  allTags: MediaTag[];
  currentTags?: MediaTag[];
  onTagsUpdated: () => void;
}

export function MediaTagDialog({
  open,
  onClose,
  mediaIds,
  allTags,
  currentTags = [],
  onTagsUpdated,
}: MediaTagDialogProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentTags.length > 0) {
      setSelectedTagIds(new Set(currentTags.map((t) => t.id)));
    }
  }, [open, currentTags]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = newTagName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('media_tags')
        .insert({
          name: newTagName.trim(),
          slug,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Tag created');
      setNewTagName('');
      setSelectedTagIds((prev) => new Set([...prev, data.id]));
      onTagsUpdated();
    } catch (error: any) {
      toast.error(`Failed to create tag: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('media_tag_assignments')
        .delete()
        .in('media_id', mediaIds);

      if (selectedTagIds.size > 0) {
        const assignments = mediaIds.flatMap((mediaId) =>
          Array.from(selectedTagIds).map((tagId) => ({
            media_id: mediaId,
            tag_id: tagId,
          }))
        );

        const { error } = await supabase.from('media_tag_assignments').insert(assignments);
        if (error) throw error;
      }

      toast.success('Tags updated');
      onTagsUpdated();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to update tags: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Manage Tags {mediaIds.length > 1 && `(${mediaIds.length} files)`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Create New Tag</Label>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || creating}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Tags</Label>
            <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
              {allTags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags yet. Create one above.
                </p>
              ) : (
                <div className="space-y-2">
                  {allTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Checkbox
                        checked={selectedTagIds.has(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <Badge
                        style={{ backgroundColor: tag.color }}
                        className="text-white"
                      >
                        {tag.name}
                      </Badge>
                      {tag.category !== 'general' && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {tag.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedTagIds.size > 0 && (
            <div className="space-y-2">
              <Label>Selected ({selectedTagIds.size})</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
                {Array.from(selectedTagIds).map((tagId) => {
                  const tag = allTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tagId}
                      style={{ backgroundColor: tag.color }}
                      className="text-white"
                    >
                      {tag.name}
                      <button
                        onClick={() => toggleTag(tagId)}
                        className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
