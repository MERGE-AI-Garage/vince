import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  detailed_description: string | null;
  badges: string[];
  status: string;
  pricing_model: string | null;
  official_link: string | null;
  logo_url?: string;
  documentation_link: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  show_on_main: boolean;
  metadata: Record<string, any>;
  category_id: string;
  preferred_media_type?: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  popular_on_homepage: boolean;
  company_standard: boolean;
  platform_champion_id?: string;
  preferred_image_type?: string;
  vendor_id?: string;
  vendor?: {
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
    terms_of_service_url: string | null;
    privacy_policy_url: string | null;
  };

  // Product-level Legal & Compliance - Phase 1
  has_indemnification?: boolean | null;
  indemnification_details?: string | null;
  compliance_certifications?: string[] | null;
  terms_of_service_url?: string | null;
  privacy_policy_url?: string | null;
  legal_notes?: string | null;

  // Product-level Risk Classification Framework
  commercial_safety?: 'Safe for Commercial Use' | 'Requires Human Review' | 'Unsafe for Commercial Use' | null;
  approved_workflow_stage?: 'Agency Marketing' | 'Internal Concepting & Pitches' | 'Internal Operations' | 'N/A' | null;
  access_tier?: 'Tier 1: Green' | 'Tier 2: Amber' | 'Tier 3: Red' | null;
  output_restrictions?: string | null;
  indemnification_level?: 'Full' | 'Limited' | 'None' | 'TBD' | 'N/A' | null;
  legal_class?: 'Enterprise Grade (Indemnified)' | 'General Purpose (Unindemnified)' | 'High-Risk / Litigated' | 'TBD' | null;
  risk_score?: 'Low' | 'Medium' | 'High' | 'TBD' | null;
  privacy_tier?: 'Tier 1: Public & Benign Data Only' | 'Tier 2: Internal Business Data' | 'Tier 3: Approved Client Data' | 'TBD' | null;
  input_data_policy?: string | null;
  training_opt_out?: 'Yes - Opted Out by Default' | 'Yes - Must Opt Out Manually' | 'No - Data is Used for Training' | 'TBD' | null;
  data_residency?: string | null;

  // Product-level Agency-Specific - Phase 2
  output_ownership_rights?: 'Client Owns All Rights' | 'Agency Owns - Licensed to Client' | 'Vendor Retains Rights - Limited License' | 'Shared Ownership' | 'TBD' | null;
  client_approval_required?: boolean | null;
  client_approval_policy?: string | null;
  client_disclosure_required?: boolean | null;
  client_disclosure_policy?: string | null;
  industry_restrictions?: string[] | null;
  commercial_license_scope?: string | null;
  procurement_status?: 'Approved Vendor' | 'Under Legal Review' | 'Pending IT Approval' | 'Pilot/Trial' | 'Not Approved' | 'Rejected' | null;
  contract_expiration_date?: string | null;
  approved_use_cases?: string[] | null;
  brand_safety_controls?: string | null;
  competitive_risk_level?: 'Low - Isolated Processing' | 'Medium - Shared Infrastructure' | 'High - Training on Customer Data' | 'TBD' | null;
}

export const useProducts = (categoryId?: string, includeInactive = false) => {
  return useQuery({
    queryKey: ['products', categoryId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(
            id,
            name,
            slug,
            icon,
            color_scheme
          ),
          platform_champion:profiles(
            id,
            first_name,
            last_name,
            full_name,
            email,
            avatar_url
          )
        `)
        .order('display_order');

      // Only filter by is_active if not including inactive products
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as (Product & { categories: any })[];
    },
  });
};

export const useProductsByCategory = (pageSlug: string) => {
  return useQuery({
    queryKey: ['products-by-category', pageSlug],
    queryFn: async () => {
      // First, get the page ID for the given slug
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', pageSlug)
        .single();

      if (pageError) {
        throw pageError;
      }

      // Then get products with their categories, filtering by page_id
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(
            id,
            name,
            slug,
            icon,
            color_scheme,
            page_id
          )
        `)
        .eq('is_active', true)
        .eq('categories.page_id', pageData.id)
        .order('display_order');

      if (error) {
        throw error;
      }

      // Group products by category
      const groupedProducts: Record<string, { category: any; products: Product[] }> = {};

      data.forEach((product) => {
        const category = product.categories;
        const categoryKey = category.slug;

        if (!groupedProducts[categoryKey]) {
          groupedProducts[categoryKey] = {
            category,
            products: []
          };
        }

        groupedProducts[categoryKey].products.push(product as Product);
      });

      return groupedProducts;
    },
  });
};

// Hook to fetch products by vendor for compliance tracking
export const useProductsByVendor = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['products-by-vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!vendorId,
  });
};

// Hook to update product compliance data
export const useUpdateProductCompliance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, complianceData }: {
      productId: string;
      complianceData: Partial<Product>
    }) => {
      const { error } = await supabase
        .from('products')
        .update(complianceData)
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-vendor'] });
      toast.success('Product compliance updated successfully');
    },
    onError: (error) => {
      console.error('Error updating product compliance:', error);
      toast.error('Failed to update product compliance');
    },
  });
};

// Hook to update a single product field
export const useUpdateProductField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      fieldName,
      value,
    }: {
      productId: string;
      fieldName: string;
      value: string | boolean | null;
    }) => {
      const updateData = {
        [fieldName]: value,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all product queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-vendor'] });

      // Show user-friendly field name in toast
      const fieldLabels: Record<string, string> = {
        access_tier: 'Access Tier',
        commercial_safety: 'Commercial Safety',
        risk_score: 'Risk Score',
        indemnification_level: 'Indemnification',
        training_opt_out: 'Training Opt-Out',
        status: 'Status',
        category_id: 'Category',
        is_active: 'Active',
        is_featured: 'Featured',
      };

      toast.success(`${fieldLabels[variables.fieldName] || 'Field'} updated successfully`);
    },
    onError: (error, variables) => {
      console.error('Failed to update product field:', error);
      toast.error(`Failed to update field: ${(error as Error).message}`);
    },
  });
};