// ABOUTME: Standalone campaigns page for non-admin users.
// ABOUTME: Wraps CampaignsTab so art directors can review their campaign history without admin access.

import { CampaignsTab } from '@/components/creative-studio/CampaignsTab';
import PageLayout from '@/components/PageLayout';

export default function MyCampaigns() {
  return (
    <PageLayout>
      <CampaignsTab />
    </PageLayout>
  );
}
