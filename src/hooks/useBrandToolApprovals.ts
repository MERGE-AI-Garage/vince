// ABOUTME: Fetches brand-specific tool approvals joined with product + vendor compliance data
// ABOUTME: Powers the AI Guidelines card and dialog in the Brand Shop

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BrandToolApproval {
  id: string;
  approval_status: 'approved' | 'restricted' | 'not_approved' | 'pending';
  usage_scope: 'client_deliverables' | 'internal_concepting' | 'internal_only' | 'not_allowed';
  notes: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    access_tier: string | null;
    output_ownership_rights: string | null;
    client_approval_required: boolean | null;
    training_opt_out: string | null;
    privacy_tier: string | null;
    risk_score: string | null;
  };
  vendor: {
    id: string;
    name: string;
    slug: string;
    access_tier: string | null;
    risk_score: string | null;
    indemnification_level: string | null;
    compliance_certifications: string[] | null;
    privacy_tier: string | null;
    training_opt_out: string | null;
    brand_safety_controls: string | null;
    output_ownership_rights: string | null;
    client_approval_required: boolean;
  } | null;
}

export interface BrandToolApprovalsSummary {
  approvedCount: number;
  restrictedCount: number;
  notApprovedCount: number;
  pendingCount: number;
  total: number;
}

export function useBrandToolApprovals(brandId?: string) {
  return useQuery({
    queryKey: ['brand-tool-approvals', brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_tool_approvals')
        .select(`
          id,
          approval_status,
          usage_scope,
          notes,
          product:products(
            id, name, slug, logo_url,
            access_tier, output_ownership_rights, client_approval_required,
            training_opt_out, privacy_tier, risk_score,
            vendor:vendors(
              id, name, slug,
              access_tier, risk_score, indemnification_level,
              compliance_certifications, privacy_tier, training_opt_out,
              brand_safety_controls, output_ownership_rights, client_approval_required
            )
          )
        `)
        .eq('brand_id', brandId!)
        .order('approval_status');

      if (error) throw error;

      // Flatten the nested product/vendor structure
      const approvals: BrandToolApproval[] = (data || []).map((row: any) => ({
        id: row.id,
        approval_status: row.approval_status,
        usage_scope: row.usage_scope,
        notes: row.notes,
        product: row.product ? {
          id: row.product.id,
          name: row.product.name,
          slug: row.product.slug,
          logo_url: row.product.logo_url,
          access_tier: row.product.access_tier,
          output_ownership_rights: row.product.output_ownership_rights,
          client_approval_required: row.product.client_approval_required,
          training_opt_out: row.product.training_opt_out,
          privacy_tier: row.product.privacy_tier,
          risk_score: row.product.risk_score,
        } : null,
        vendor: row.product?.vendor || null,
      })).filter((a: any) => a.product !== null);

      const summary: BrandToolApprovalsSummary = {
        approvedCount: approvals.filter(a => a.approval_status === 'approved').length,
        restrictedCount: approvals.filter(a => a.approval_status === 'restricted').length,
        notApprovedCount: approvals.filter(a => a.approval_status === 'not_approved').length,
        pendingCount: approvals.filter(a => a.approval_status === 'pending').length,
        total: approvals.length,
      };

      return { approvals, summary };
    },
  });
}
