// ABOUTME: Cinematic full-bleed brand card with centered logo and dark overlays
// ABOUTME: Admin actions (edit, DNA, delete, toggle) accessible via hover-reveal dropdown

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Star, Dna, MoreHorizontal, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreativeStudioBrand } from '@/types/creative-studio';

interface BrandCardProps {
  brand: CreativeStudioBrand;
  hasDna: boolean;
  onEdit: (id: string) => void;
  onBuildDna: (brand: CreativeStudioBrand) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const BrandCard = memo(({
  brand,
  hasDna,
  onEdit,
  onBuildDna,
  onSetDefault,
  onDelete,
  onToggleActive,
}: BrandCardProps) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl cursor-pointer',
        'shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
        'hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] hover:-translate-y-1.5',
        'transition-all duration-500',
        !brand.is_active && 'opacity-50',
        brand.is_default && 'ring-2 ring-primary/30',
      )}
      onClick={() => onEdit(brand.id)}
    >
      {/* Full-bleed background — image or neutral gray */}
      <div className="relative h-56 overflow-hidden">
        {(brand.header_image_url || brand.hero_image_url) ? (
          <img
            src={(brand.header_image_url || brand.hero_image_url)!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-800" />
        )}

        {/* Cinematic overlay — dark vignette for logo contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.3))]" />

        {/* Large centered logo */}
        <div className="absolute inset-0 flex items-center justify-center p-6 pb-14">
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={brand.name}
              className="relative z-10 max-w-[200px] max-h-20 object-contain drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] brightness-0 invert"
            />
          ) : (
            <span className="relative z-10 text-3xl font-bold text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] font-serif tracking-tight">
              {brand.name}
            </span>
          )}
        </div>

        {/* Badges — top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {brand.is_default && (
            <Badge className="bg-white/20 text-white border-0 text-[10px] h-5 gap-0.5 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-current" />
              Default
            </Badge>
          )}
          {hasDna && (
            <Badge className="bg-white/20 text-white border-0 text-[10px] h-5 gap-0.5 backdrop-blur-sm">
              <Dna className="h-2.5 w-2.5" />
              DNA
            </Badge>
          )}
          {!brand.is_active && (
            <Badge className="bg-red-500/30 text-red-200 border-0 text-[10px] h-5 gap-0.5 backdrop-blur-sm">
              <PowerOff className="h-2.5 w-2.5" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Action menu — top-right, reveal on hover */}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(brand.id)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBuildDna(brand)}>
                <Dna className="h-3.5 w-3.5 mr-2" />
                {hasDna ? 'Rebuild DNA' : 'Build DNA'}
              </DropdownMenuItem>
              {!brand.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(brand.id)}>
                  <Star className="h-3.5 w-3.5 mr-2" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleActive(brand.id, brand.is_active)}>
                {brand.is_active ? (
                  <>
                    <PowerOff className="h-3.5 w-3.5 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-3.5 w-3.5 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(brand.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-8 bg-gradient-to-t from-black/80 to-transparent z-10">
          <h3 className="text-base font-semibold text-white truncate">{brand.name}</h3>
          {brand.description ? (
            <p className="text-[11px] text-white/60 leading-relaxed line-clamp-1 mt-0.5">{brand.description}</p>
          ) : (
            <p className="text-[11px] text-white/40 italic mt-0.5">No description</p>
          )}
        </div>
      </div>
    </div>
  );
});

BrandCard.displayName = 'BrandCard';

export { BrandCard };
