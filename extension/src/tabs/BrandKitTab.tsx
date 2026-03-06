// ABOUTME: Brand guidelines tab that renders dynamic profile-based guidelines
// ABOUTME: Uses the brand profile data from the database to generate a complete brand kit view

import { DynamicBrandKit, DynamicBrandKitLoading, DynamicBrandKitEmpty } from '../brand-kit/DynamicBrandKit';
import { useBrandGuidelines } from '../hooks/useBrandGuidelines';

interface BrandKitTabProps {
  brandId?: string | null;
  isDefaultBrand?: boolean;
  brandName?: string | null;
}

export function BrandKitTab({ brandId, brandName }: BrandKitTabProps) {
  return <DynamicBrandKitWrapper brandId={brandId} brandName={brandName} />;
}

function DynamicBrandKitWrapper({ brandId, brandName }: { brandId?: string | null; brandName?: string | null }) {
  const { data, isLoading } = useBrandGuidelines(brandId);

  if (isLoading) return <DynamicBrandKitLoading />;
  if (!data || !data.profile) return <DynamicBrandKitEmpty brandName={brandName || undefined} />;

  return <DynamicBrandKit data={data} />;
}
