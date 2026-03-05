// ABOUTME: Full CRUD admin panel for camera preset options with inline editing and bulk actions
// ABOUTME: Expandable rows show full prompt fragments, click-to-edit fields, and multi-select operations

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera, Plus, Trash2, ChevronDown, ChevronRight, Check, X, Power, PowerOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { MergeLogo } from '@/components/ai-pulse/vendorLogos';
import {
  useAllCameraOptions,
  useCreateCameraOption,
  useUpdateCameraOption,
  useToggleCameraOption,
  useDeleteCameraOption,
  type CameraOption,
  type CameraOptionCategory,
  type CameraMediaType,
  type CreateCameraOptionInput,
  type UpdateCameraOptionInput,
} from '@/hooks/useCreativeStudioCameraOptions';

const CATEGORIES: { value: CameraOptionCategory; label: string }[] = [
  { value: 'film_stock', label: 'Film Stock' },
  { value: 'camera_body', label: 'Camera Body' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'composition', label: 'Composition' },
  { value: 'depth_of_field', label: 'Depth of Field' },
  { value: 'print_process', label: 'Print Process' },
  { value: 'color_grade', label: 'Color Grade' },
  { value: 'film_effect', label: 'Film Effect' },
  { value: 'shot_type', label: 'Shot Type' },
  { value: 'aperture', label: 'Aperture' },
  { value: 'focal_length', label: 'Focal Length' },
  { value: 'color_temperature', label: 'Color Temp' },
  { value: 'frame_rate', label: 'Frame Rate' },
];

const MEDIA_TYPES: { value: CameraMediaType; label: string }[] = [
  { value: 'still', label: 'Still' },
  { value: 'video', label: 'Video' },
  { value: 'both', label: 'Both' },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function CameraPresetAdmin() {
  const { data: options, isLoading } = useAllCameraOptions();
  const createMutation = useCreateCameraOption();
  const updateMutation = useUpdateCameraOption();
  const toggleMutation = useToggleCameraOption();
  const deleteMutation = useDeleteCameraOption();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<CameraMediaType | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const filtered = options?.filter(o =>
    (!selectedCategory || o.category === selectedCategory) &&
    (!selectedMediaType || o.media_type === selectedMediaType)
  ) || [];

  const categoryCounts = (options || []).reduce<Record<string, number>>((acc, o) => {
    acc[o.category] = (acc[o.category] || 0) + 1;
    return acc;
  }, {});

  const handleCreate = () => {
    setEditorOpen(true);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, is_active: !currentActive });
      toast.success(`Option ${currentActive ? 'disabled' : 'enabled'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
      toast.success('Option deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleInlineUpdate = async (id: string, updates: UpdateCameraOptionInput) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      toast.success('Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleSaveNew = async (data: CreateCameraOptionInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Option created');
      setEditorOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (filtered.every(o => selectedIds.has(o.id))) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(o => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(o => next.add(o.id));
        return next;
      });
    }
  };

  const handleBulkToggle = async (enable: boolean) => {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      try {
        await toggleMutation.mutateAsync({ id, is_active: enable });
        count++;
      } catch { /* continue */ }
    }
    toast.success(`${enable ? 'Enabled' : 'Disabled'} ${count} options`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    let count = 0;
    for (const id of ids) {
      try {
        await deleteMutation.mutateAsync(id);
        count++;
      } catch { /* continue */ }
    }
    toast.success(`Deleted ${count} options`);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      <TabHeroHeader
        gradientLight="from-[#f0f4f8] via-[#e4ecf4] to-[#d5e1ed]"
        gradientDark="dark:from-[#111827] dark:via-[#1e2a3a] dark:to-[#1a3148]"
        watermark={<Camera className="w-full h-full" />}
        watermarkSmall={<MergeLogo className="w-full h-full" />}
        badgeIcon={<Camera className="w-4 h-4 text-gray-700 dark:text-white/80" />}
        badgeLabel="Photography Controls"
        title="Camera Presets"
        subtitle="Film stocks · lens options · lighting · composition presets"
        actions={
          <Button onClick={handleCreate} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        }
      />
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-500" />
              Camera Preset Options
            </CardTitle>
            <CardDescription>
              {options?.length || 0} options across {Object.keys(categoryCounts).length} categories
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge
            variant={!selectedCategory ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] h-5"
            onClick={() => setSelectedCategory(null)}
          >
            All ({options?.length || 0})
          </Badge>
          {CATEGORIES.filter(c => categoryCounts[c.value]).map(c => (
            <Badge
              key={c.value}
              variant={selectedCategory === c.value ? 'default' : 'outline'}
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setSelectedCategory(c.value)}
            >
              {c.label} ({categoryCounts[c.value]})
            </Badge>
          ))}
        </div>

        {/* Media type filter */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[10px] text-muted-foreground mr-1">Media:</span>
          <Badge
            variant={!selectedMediaType ? 'default' : 'outline'}
            className="cursor-pointer text-[10px] h-5"
            onClick={() => setSelectedMediaType(null)}
          >
            All
          </Badge>
          {MEDIA_TYPES.map(mt => (
            <Badge
              key={mt.value}
              variant={selectedMediaType === mt.value ? 'default' : 'outline'}
              className="cursor-pointer text-[10px] h-5"
              onClick={() => setSelectedMediaType(mt.value)}
            >
              {mt.label}
            </Badge>
          ))}
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg border">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleBulkToggle(true)}>
              <Power className="h-3 w-3" />
              Enable
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleBulkToggle(false)}>
              <PowerOff className="h-3 w-3" />
              Disable
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 text-destructive" onClick={() => setBulkDeleteConfirm(true)}>
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : !options || options.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No camera options configured.
          </p>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            {/* Select all header */}
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={selectAllFiltered}
                className="h-3.5 w-3.5"
              />
              <span className="text-[10px] text-muted-foreground">
                {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filtered.length})
              </span>
            </div>
            <div className="space-y-1">
              {filtered.map(opt => (
                <OptionRow
                  key={opt.id}
                  option={opt}
                  expanded={expandedId === opt.id}
                  selected={selectedIds.has(opt.id)}
                  onToggleExpand={() => setExpandedId(expandedId === opt.id ? null : opt.id)}
                  onToggleSelect={() => toggleSelect(opt.id)}
                  onToggleActive={() => handleToggle(opt.id, opt.is_active)}
                  onUpdate={(updates) => handleInlineUpdate(opt.id, updates)}
                  onDelete={() => setDeleteConfirm(opt.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Create Dialog (dialog only for new items) */}
      <CreateOptionDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveNew}
        saving={createMutation.isPending}
      />

      {/* Single Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Camera Option</DialogTitle>
            <DialogDescription>
              This option will be permanently removed. Existing templates using this option will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={() => setBulkDeleteConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Options</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedIds.size} camera options. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : `Delete ${selectedIds.size} Options`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
    </div>
  );
}

// ── Inline Editable Field ────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  multiline = false,
  className = '',
  placeholder = '',
}: {
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }, [draft, value, onSave]);

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Enter' && multiline && e.metaKey) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      cancel();
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className={`text-left cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors ${className}`}
        title="Click to edit"
      >
        {value || <span className="text-muted-foreground italic">{placeholder || 'Click to edit'}</span>}
      </button>
    );
  }

  if (multiline) {
    return (
      <div className="flex flex-col gap-1">
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          className="text-xs font-mono resize-none min-h-[60px]"
        />
        <div className="flex gap-1 justify-end">
          <span className="text-[9px] text-muted-foreground mr-auto">Cmd+Enter to save, Esc to cancel</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onMouseDown={(e) => { e.preventDefault(); cancel(); }}>
            <X className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onMouseDown={(e) => { e.preventDefault(); save(); }}>
            <Check className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={save}
      className={`h-7 text-xs ${className}`}
    />
  );
}

// ── Option Row (expandable, with inline editing) ─────────────────────────────

interface OptionRowProps {
  option: CameraOption;
  expanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onToggleActive: () => void;
  onUpdate: (updates: UpdateCameraOptionInput) => void;
  onDelete: () => void;
}

function OptionRow({
  option, expanded, selected, onToggleExpand, onToggleSelect,
  onToggleActive, onUpdate, onDelete,
}: OptionRowProps) {
  return (
    <div className={`border rounded-lg transition-colors ${
      option.is_active ? '' : 'opacity-50'
    } ${selected ? 'border-primary/40 bg-primary/5' : ''}`}>
      {/* Collapsed row */}
      <div className="flex items-center gap-2 p-2.5">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          className="h-3.5 w-3.5 shrink-0"
        />
        <button
          onClick={onToggleExpand}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <InlineEdit
              value={option.display_name}
              onSave={(val) => onUpdate({ display_name: val })}
              className="text-sm font-medium"
            />
            <Badge variant="outline" className="text-[8px] h-4 px-1 capitalize shrink-0">
              {option.category.replace(/_/g, ' ')}
            </Badge>
            <Badge
              variant="secondary"
              className={`text-[8px] h-4 px-1 shrink-0 ${
                option.media_type === 'video' ? 'bg-purple-100 text-purple-700' :
                option.media_type === 'both' ? 'bg-blue-100 text-blue-700' :
                ''
              }`}
            >
              {option.media_type}
            </Badge>
          </div>
          {!expanded && (
            <p className="text-[10px] text-muted-foreground/70 truncate font-mono mt-0.5 px-1">
              {option.prompt_fragment}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono w-6 text-right">
            #{option.sort_order}
          </span>
          <Switch
            checked={option.is_active}
            onCheckedChange={onToggleActive}
            className="scale-75"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-9 pb-3 space-y-2 border-t mx-2.5 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium">Description</label>
            <InlineEdit
              value={option.description || ''}
              onSave={(val) => onUpdate({ description: val || null })}
              className="text-[11px] text-muted-foreground"
              placeholder="Add a description..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground font-medium">Prompt Fragment</label>
            <InlineEdit
              value={option.prompt_fragment}
              onSave={(val) => onUpdate({ prompt_fragment: val })}
              multiline
              className="text-[11px] font-mono text-muted-foreground/80"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground font-medium">Sort Order</label>
              <InlineEdit
                value={String(option.sort_order)}
                onSave={(val) => onUpdate({ sort_order: parseInt(val) || 0 })}
                className="text-[11px] font-mono w-12"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-muted-foreground font-medium">Media Type</label>
              <Select
                value={option.media_type}
                onValueChange={(val: CameraMediaType) => onUpdate({ media_type: val })}
              >
                <SelectTrigger className="h-6 text-[10px] w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map(mt => (
                    <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {option.category}/{option.slug}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Option Dialog (dialog only for new items) ─────────────────────────

interface CreateOptionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateCameraOptionInput) => Promise<void>;
  saving: boolean;
}

function CreateOptionDialog({ open, onClose, onSave, saving }: CreateOptionDialogProps) {
  const [category, setCategory] = useState<string>('');
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [promptFragment, setPromptFragment] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [mediaType, setMediaType] = useState<CameraMediaType>('both');
  const [autoSlug, setAutoSlug] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setCategory('');
      setSlug('');
      setDisplayName('');
      setDescription('');
      setPromptFragment('');
      setSortOrder(0);
      setIsActive(true);
      setMediaType('both');
      setAutoSlug(true);
    }
    if (!isOpen) onClose();
  };

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (autoSlug) {
      setSlug(slugify(name));
    }
  };

  const handleSave = () => {
    if (!displayName.trim() || !promptFragment.trim() || !category || !slug.trim()) return;
    onSave({
      category,
      slug: slug.trim(),
      display_name: displayName.trim(),
      description: description.trim() || undefined,
      prompt_fragment: promptFragment.trim(),
      sort_order: sortOrder,
      is_active: isActive,
      media_type: mediaType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="w-4 h-4 text-primary" />
            Add Camera Option
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
                placeholder="e.g., kodak_portra_400"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Display Name *</Label>
            <Input
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Kodak Portra 400"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the effect..."
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Prompt Fragment *</Label>
            <Textarea
              value={promptFragment}
              onChange={(e) => setPromptFragment(e.target.value)}
              className="h-20 text-xs font-mono resize-none"
              placeholder="The text appended to the generation prompt when this option is selected..."
            />
            <p className="text-[9px] text-muted-foreground">
              This text is appended to the image generation prompt verbatim.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Media Type</Label>
              <Select value={mediaType} onValueChange={(v: CameraMediaType) => setMediaType(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map(mt => (
                    <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Active</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-xs text-muted-foreground">
                  {isActive ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !displayName.trim() || !promptFragment.trim() || !category || !slug.trim()}
            className="gap-1"
          >
            <Camera className="w-3 h-3" />
            {saving ? 'Saving...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
