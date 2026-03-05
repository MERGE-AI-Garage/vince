// ABOUTME: Popover for selecting brand reference collections during image generation
// ABOUTME: Shows collections as cards with thumbnails, adds all images to the staging area on click

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Package, User, Paintbrush, TreePine } from 'lucide-react';
import { useBrandReferenceCollections } from '@/hooks/useBrandReferences';
import type { BrandReferenceCollection, ReferenceType } from '@/types/creative-studio';
import type { StagedImage } from './MultiImageStagingArea';

interface BrandReferencePickerProps {
  brandId?: string;
  currentImageCount: number;
  maxImages: number;
  onAddImages: (images: StagedImage[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

function getTypeIcon(type: ReferenceType) {
  switch (type) {
    case 'product': return Package;
    case 'character': return User;
    case 'style': return Paintbrush;
    case 'environment': return TreePine;
  }
}

function getTypeBadgeColor(type: ReferenceType): string {
  switch (type) {
    case 'product': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'character': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'style': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'environment': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
}

export function BrandReferencePicker({
  brandId,
  currentImageCount,
  maxImages,
  onAddImages,
  open,
  onOpenChange,
  children,
}: BrandReferencePickerProps) {
  const { data: collections, isLoading } = useBrandReferenceCollections(brandId);
  const slotsRemaining = maxImages - currentImageCount;

  const handleSelectCollection = (collection: BrandReferenceCollection) => {
    const available = Math.min(collection.images.length, slotsRemaining);
    if (available <= 0) return;

    const newImages: StagedImage[] = collection.images.slice(0, available).map(ref => ({
      id: crypto.randomUUID(),
      src: ref.url,
      mediaResolution: ref.media_resolution,
      referenceIntent: ref.reference_intent,
      referenceType: ref.reference_type,
      sourceCollection: ref.collection,
    }));

    onAddImages(newImages);
    onOpenChange(false);
  };

  if (!brandId || !collections?.length) return null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Brand Reference Collections</p>
          <p className="text-[10px] text-muted-foreground">
            {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
          </p>
        </div>
        <ScrollArea className="max-h-64">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
          ) : (
            <div className="p-2 space-y-1">
              {collections.map((collection) => {
                const TypeIcon = getTypeIcon(collection.reference_type);
                const wouldOverflow = collection.images.length > slotsRemaining;

                return (
                  <button
                    key={collection.name}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    onClick={() => handleSelectCollection(collection)}
                    disabled={slotsRemaining <= 0}
                  >
                    {/* Thumbnail */}
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{collection.name}</span>
                        <Badge className={`text-[9px] h-3.5 px-1 ${getTypeBadgeColor(collection.reference_type)}`}>
                          {collection.reference_type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {collection.images.length} image{collection.images.length !== 1 ? 's' : ''}
                        {wouldOverflow && slotsRemaining > 0 && ` (will add ${slotsRemaining})`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
