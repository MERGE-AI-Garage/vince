// ABOUTME: Admin CRUD for brand reference image collections (product, character, style, environment)
// ABOUTME: Collapsible collection cards with drag-drop upload, per-image metadata, and type-to-intent enforcement

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Trash2, Star, ChevronDown, ChevronUp, Package, User, Paintbrush, TreePine, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  useBrandReferenceCollections,
  useAddBrandReference,
  useUpdateBrandReference,
  useRemoveBrandReference,
  useRenameBrandCollection,
} from '@/hooks/useBrandReferences';
import type { ReferenceType, ReferenceIntent, BrandReference, BrandReferenceCollection } from '@/types/creative-studio';

interface BrandReferenceCollectionsProps {
  brandId: string;
  brandSlug: string;
}

const PILL_BTN = 'rounded-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all duration-150';

const TYPE_OPTIONS: { value: ReferenceType; label: string; icon: typeof Package; description: string }[] = [
  { value: 'product', label: 'Product', icon: Package, description: 'Physical products, packaging, objects' },
  { value: 'character', label: 'Character', icon: User, description: 'People, mascots — maintains likeness across scenes' },
  { value: 'style', label: 'Style', icon: Paintbrush, description: 'Photography style, visual aesthetic examples' },
  { value: 'environment', label: 'Environment', icon: TreePine, description: 'Locations, settings, backdrops' },
];

const RESOLUTION_OPTIONS = [
  { value: 'low', label: 'Low (280 tokens)' },
  { value: 'medium', label: 'Medium (560 tokens)' },
  { value: 'high', label: 'High (1120 tokens)' },
] as const;

// Character collections are capped per model; we use the most restrictive limit for the UI
const MAX_CHARACTER_IMAGES = 4;

function getDefaultIntent(type: ReferenceType): ReferenceIntent {
  if (type === 'character') return 'subject';
  if (type === 'style') return 'style';
  return 'subject';
}

function getTypeIcon(type: ReferenceType) {
  const opt = TYPE_OPTIONS.find(t => t.value === type);
  return opt?.icon || Package;
}

function getTypeBadgeColor(type: ReferenceType): string {
  switch (type) {
    case 'product': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'character': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'style': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'environment': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
}

export function BrandReferenceCollections({ brandId, brandSlug }: BrandReferenceCollectionsProps) {
  const { user } = useAuth();
  const { data: collections, isLoading } = useBrandReferenceCollections(brandId);
  const addReference = useAddBrandReference();
  const updateReference = useUpdateBrandReference();
  const removeReference = useRemoveBrandReference();
  const renameCollection = useRenameBrandCollection();

  // New collection form state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ReferenceType>('product');

  // Track which collections are expanded and which are uploading
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [uploadingCollection, setUploadingCollection] = useState<string | null>(null);

  const toggleExpanded = (name: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCreateCollection = () => {
    if (!newName.trim()) {
      toast.error('Collection name is required');
      return;
    }

    // Slug-ify the name for storage
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicates
    if (collections?.some(c => c.name === slug)) {
      toast.error('A collection with that name already exists');
      return;
    }

    // Don't actually create a DB record yet — just open upload mode for this new collection
    setUploadingCollection(slug);
    setExpandedCollections(prev => new Set(prev).add(slug));
    setCreating(false);
    setNewName('');

    // We need at least one image, so we'll create the collection implicitly when the first image is uploaded
    toast.success(`Collection "${newName.trim()}" ready — upload your first image`);
  };

  const handleImageUploaded = async (url: string, collection: string, type: ReferenceType) => {
    const existingCollection = collections?.find(c => c.name === collection);
    const isFirst = !existingCollection || existingCollection.images.length === 0;

    // Enforce character limit
    if (type === 'character' && existingCollection && existingCollection.images.length >= MAX_CHARACTER_IMAGES) {
      toast.error(`Character collections are limited to ${MAX_CHARACTER_IMAGES} images (model constraint)`);
      return;
    }

    try {
      await addReference.mutateAsync({
        brand_id: brandId,
        url,
        storage_path: `brands/${brandSlug}/references/${collection}`,
        collection,
        reference_type: type,
        reference_intent: getDefaultIntent(type),
        media_resolution: 'medium',
        is_primary: isFirst,
        created_by: user?.id,
      });

      toast.success('Reference image added');
      setUploadingCollection(null);
    } catch (err) {
      toast.error(`Failed to save: ${String(err)}`);
    }
  };

  const handleDelete = async (id: string, storagePath?: string) => {
    if (!window.confirm('Remove this reference image?')) return;
    try {
      await removeReference.mutateAsync({ id, brandId, storagePath });
      toast.success('Reference removed');
    } catch (err) {
      toast.error(`Failed to remove: ${String(err)}`);
    }
  };

  const handleRename = async (oldName: string, newName: string) => {
    try {
      await renameCollection.mutateAsync({ brandId, oldName, newName });
      toast.success(`Collection renamed to "${newName}"`);
    } catch (err) {
      toast.error(`Failed to rename: ${String(err)}`);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await updateReference.mutateAsync({ id, brandId, updates: { is_primary: true } });
    } catch (err) {
      toast.error(`Failed to update: ${String(err)}`);
    }
  };

  const handleUpdateLabel = async (id: string, label: string) => {
    try {
      await updateReference.mutateAsync({ id, brandId, updates: { label } });
    } catch (err) {
      toast.error(`Failed to update: ${String(err)}`);
    }
  };

  const handleUpdateResolution = async (id: string, media_resolution: 'low' | 'medium' | 'high') => {
    try {
      await updateReference.mutateAsync({ id, brandId, updates: { media_resolution } });
    } catch (err) {
      toast.error(`Failed to update: ${String(err)}`);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-muted-foreground text-center py-4">Loading reference collections...</p>;
  }

  // Combine existing collections with any new empty ones being created
  const allCollections = collections || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Reference Collections</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Curated image sets that AI references during generation to achieve visual fidelity. Group by type — products (exact appearance), characters (consistent likeness across scenes), style (aesthetic direction), or environments (settings and backdrops). Reference image limits vary by model.
          </p>
        </div>
        {!creating && (
          <Button variant="outline" size="sm" className={PILL_BTN} onClick={() => setCreating(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Collection
          </Button>
        )}
      </div>

      {/* New collection form */}
      {creating && (
        <div className="border rounded-md p-3 bg-muted/30 space-y-3">
          <Label className="text-xs">New reference collection</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Collection name (e.g., CEO Headshots)"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
            />
            <Select value={newType} onValueChange={(v) => setNewType(v as ReferenceType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-1.5">
                      <t.icon className="h-3 w-3" />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {newType && (
            <p className="text-[10px] text-muted-foreground">
              {TYPE_OPTIONS.find(t => t.value === newType)?.description}
              {newType === 'character' && ` • Limited to ${MAX_CHARACTER_IMAGES} images per model constraints.`}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleCreateCollection}>
              Create
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setCreating(false); setNewName(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {allCollections.length === 0 && !creating && uploadingCollection === null && (
        <div className="text-center py-6 border rounded-md border-dashed">
          <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">No reference collections yet.</p>
          <p className="text-xs text-muted-foreground">Add product shots, character headshots, or style references.</p>
        </div>
      )}

      {/* Collection list */}
      {allCollections.map((collection) => (
        <CollectionCard
          key={collection.name}
          collection={collection}
          brandSlug={brandSlug}
          isExpanded={expandedCollections.has(collection.name)}
          isUploading={uploadingCollection === collection.name}
          onToggleExpanded={() => toggleExpanded(collection.name)}
          onStartUpload={() => setUploadingCollection(collection.name)}
          onCancelUpload={() => setUploadingCollection(null)}
          onImageUploaded={(url) => handleImageUploaded(url, collection.name, collection.reference_type)}
          onDelete={handleDelete}
          onSetPrimary={handleSetPrimary}
          onUpdateLabel={handleUpdateLabel}
          onUpdateResolution={handleUpdateResolution}
          onRename={(newName) => handleRename(collection.name, newName)}
        />
      ))}

      {/* Upload for a new collection that has no images yet */}
      {uploadingCollection && !allCollections.some(c => c.name === uploadingCollection) && (
        <div className="border rounded-md p-3 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={`text-[10px] h-5 ${getTypeBadgeColor(newType)}`}>
              {newType}
            </Badge>
            <span className="text-xs font-medium">{uploadingCollection}</span>
          </div>
          <ImageUpload
            currentImageUrl={undefined}
            onImageUploaded={(url) => handleImageUploaded(url, uploadingCollection, newType)}
            onImageRemoved={() => setUploadingCollection(null)}
            folder={`brands/${brandSlug}/references/${uploadingCollection}`}
            maxSizeMB={5}
            acceptedTypes={['image/png', 'image/jpeg', 'image/webp']}
            mediaFolderPath={`/brands/${brandSlug}/references`}
            mediaTitle={`${brandSlug} ${uploadingCollection} reference`}
            className="border-0 p-0 shadow-none"
          />
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setUploadingCollection(null)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Collection card ─────────────────────────────────────────────────────────

interface CollectionCardProps {
  collection: BrandReferenceCollection;
  brandSlug: string;
  isExpanded: boolean;
  isUploading: boolean;
  onToggleExpanded: () => void;
  onStartUpload: () => void;
  onCancelUpload: () => void;
  onImageUploaded: (url: string) => void;
  onDelete: (id: string, storagePath?: string) => void;
  onSetPrimary: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onUpdateResolution: (id: string, res: 'low' | 'medium' | 'high') => void;
  onRename: (newName: string) => void;
}

function CollectionCard({
  collection,
  brandSlug,
  isExpanded,
  isUploading,
  onToggleExpanded,
  onStartUpload,
  onCancelUpload,
  onImageUploaded,
  onDelete,
  onSetPrimary,
  onUpdateLabel,
  onUpdateResolution,
  onRename,
}: CollectionCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(collection.name);
  const [previewImage, setPreviewImage] = useState<BrandReference | null>(null);

  const TypeIcon = getTypeIcon(collection.reference_type);
  const atCharacterLimit = collection.reference_type === 'character'
    && collection.images.length >= MAX_CHARACTER_IMAGES;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <div className="border rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 group/header">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-3 flex-1 min-w-0 hover:bg-muted/50 transition-colors text-left rounded -m-1 p-1">
              {/* Thumbnail: primary image or icon */}
              <div className="w-10 h-10 rounded border bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                {collection.primaryImage ? (
                  <img
                    src={collection.primaryImage.url}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {renaming ? (
                    <span className="text-sm font-medium truncate text-muted-foreground">{collection.name}</span>
                  ) : (
                    <span className="text-sm font-medium truncate">{collection.name}</span>
                  )}
                  <Badge className={`text-[10px] h-4 px-1.5 ${getTypeBadgeColor(collection.reference_type)}`}>
                    {collection.reference_type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {collection.images.length} image{collection.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Intent: {collection.reference_intent}
                  {collection.reference_type === 'character' && ` • ${collection.images.length}/${MAX_CHARACTER_IMAGES} max`}
                </p>
              </div>

              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>
          </CollapsibleTrigger>
          {!renaming && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0"
              onClick={(e) => { e.stopPropagation(); setRenaming(true); setRenameValue(collection.name); }}
              title="Rename collection"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
        {renaming && (
          <div className="flex items-center gap-2 px-3 pb-2 border-t pt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-7 text-xs flex-1"
              placeholder="New collection name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onRename(renameValue); setRenaming(false); }
                if (e.key === 'Escape') setRenaming(false);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => { onRename(renameValue); setRenaming(false); }}
              title="Save"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setRenaming(false)}
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="border-t p-3 space-y-3">
            {/* Image grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {collection.images.map((ref) => (
                <div key={ref.id} className="border rounded overflow-hidden group relative">
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={ref.url}
                      alt={ref.label || ref.filename || 'Reference'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(ref)}
                    />
                    {/* Overlay actions */}
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!ref.is_primary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 bg-background/80 hover:text-primary text-muted-foreground"
                          onClick={() => onSetPrimary(ref.id)}
                          title="Set as collection thumbnail"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-background/80 text-destructive hover:text-destructive"
                        onClick={() => onDelete(ref.id, ref.storage_path)}
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {ref.is_primary && (
                      <div className="absolute top-1 left-1">
                        <Star className="h-3 w-3 text-primary fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Per-image metadata */}
                  <div className="p-1.5 space-y-1">
                    <Input
                      value={ref.label || ''}
                      onChange={(e) => onUpdateLabel(ref.id, e.target.value)}
                      placeholder="Label (e.g., Front angle)"
                      className="h-6 text-[10px] border-0 bg-transparent p-0 focus-visible:ring-0"
                    />
                    <Select
                      value={ref.media_resolution}
                      onValueChange={(val) => onUpdateResolution(ref.id, val as 'low' | 'medium' | 'high')}
                    >
                      <SelectTrigger className="h-5 text-[10px] border-0 bg-transparent p-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload button */}
            {isUploading ? (
              <div className="space-y-2">
                <ImageUpload
                  currentImageUrl={undefined}
                  onImageUploaded={onImageUploaded}
                  onImageRemoved={onCancelUpload}
                  folder={`brands/${brandSlug}/references/${collection.name}`}
                  maxSizeMB={5}
                  acceptedTypes={['image/png', 'image/jpeg', 'image/webp']}
                  mediaFolderPath={`/brands/${brandSlug}/references`}
                  mediaTitle={`${brandSlug} ${collection.name} reference`}
                  className="border-0 p-0 shadow-none"
                />
                <Button variant="ghost" size="sm" className="text-xs" onClick={onCancelUpload}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-xs w-full"
                onClick={onStartUpload}
                disabled={atCharacterLimit}
              >
                <Plus className="h-3 w-3 mr-1" />
                {atCharacterLimit
                  ? `Character limit reached (${MAX_CHARACTER_IMAGES} max)`
                  : 'Add Image'
                }
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>

      {/* Image lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          {previewImage && (
            <div className="space-y-3">
              <img
                src={previewImage.url}
                alt={previewImage.label || 'Reference image'}
                className="w-full rounded-md"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {previewImage.label && (
                  <span className="font-medium text-foreground">{previewImage.label}</span>
                )}
                <Badge className={`text-[9px] h-4 px-1.5 ${getTypeBadgeColor(collection.reference_type)}`}>
                  {collection.reference_type}
                </Badge>
                <span>Resolution: {previewImage.media_resolution}</span>
                <span>Intent: {previewImage.reference_intent}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
