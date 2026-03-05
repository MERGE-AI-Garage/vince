// ABOUTME: React Query hooks for lab submission CRUD and lab generation tracking
// ABOUTME: Handles fetching submissions, lab-tagged generations, and triggering evaluation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { LabSubmission, LabConfig } from '@/hooks/useEnablementPrograms';
import type { GenerationWithDetails } from '@/types/creative-studio';
import { LAB_QUOTA_KEY } from '@/hooks/useLabQuota';

const LAB_SUBMISSION_KEY = 'lab-submission';
const LAB_GENERATIONS_KEY = 'lab-generations';

/** Fetch the current user's lab submission for a specific module */
export function useLabSubmission(moduleId: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [LAB_SUBMISSION_KEY, profile?.id, moduleId],
    queryFn: async () => {
      if (!profile?.id || !moduleId) return null;

      const { data, error } = await supabase
        .from('lab_submissions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) throw error;
      return data as LabSubmission | null;
    },
    enabled: !!profile?.id && !!moduleId,
    // Poll every 3s while evaluation is in progress, stop when done
    refetchInterval: (query) => {
      const data = query.state.data as LabSubmission | null | undefined;
      return (data?.evaluation_status === 'evaluating') ? 3000 : false;
    },
  });
}

/** Fetch generations tagged with a specific lab module */
export function useLabGenerations(moduleId: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: [LAB_GENERATIONS_KEY, profile?.id, moduleId],
    queryFn: async () => {
      if (!profile?.id || !moduleId) return [];

      const { data, error } = await supabase
        .from('creative_studio_generations')
        .select('*')
        .eq('user_id', profile.id)
        .contains('metadata', { lab_module_id: moduleId })
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as GenerationWithDetails[];
    },
    enabled: !!profile?.id && !!moduleId,
    staleTime: 10000,
  });
}

/** Select a generation for submission and set submitted state */
export function useSubmitLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      selectedGenerationId,
    }: {
      submissionId: string;
      selectedGenerationId: string;
    }) => {
      // Update submission with selected generation and mark as submitted
      const { error: updateError } = await supabase
        .from('lab_submissions')
        .update({
          selected_generation_id: selectedGenerationId,
          submitted_at: new Date().toISOString(),
          evaluation_status: 'evaluating',
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // Trigger evaluation edge function
      const { error: evalError } = await supabase.functions.invoke('evaluate-lab-submission', {
        body: { submission_id: submissionId },
      });

      if (evalError) throw evalError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [LAB_SUBMISSION_KEY] });
      queryClient.invalidateQueries({ queryKey: [LAB_QUOTA_KEY] });
      toast.success('Submitted! Evaluating your work...');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Submission failed. Please try again.');
    },
  });
}

/** Persist the student's selected generation to the database immediately on click */
export function usePersistLabSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      generationId,
    }: {
      submissionId: string;
      generationId: string;
    }) => {
      const { error } = await supabase
        .from('lab_submissions')
        .update({
          selected_generation_id: generationId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LAB_SUBMISSION_KEY] });
    },
    onError: () => {
      toast.error('Failed to save selection. Please try again.');
    },
  });
}

/** Reset a submission for retry — archives current attempt, increments counter, clears evaluation */
export function useRetryLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      currentAttempt,
      currentScore,
      currentEvaluation,
      currentSubmittedAt,
      currentEvaluatedAt,
    }: {
      submissionId: string;
      currentAttempt: number;
      currentScore: number | null;
      currentEvaluation: Record<string, any>;
      currentSubmittedAt: string | null;
      currentEvaluatedAt: string | null;
    }) => {
      // Fetch current attempt_history to append to
      const { data: current, error: fetchError } = await supabase
        .from('lab_submissions')
        .select('attempt_history')
        .eq('id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      const history = (current?.attempt_history as any[]) || [];
      history.push({
        attempt: currentAttempt,
        score: currentScore,
        evaluation: currentEvaluation,
        submitted_at: currentSubmittedAt,
        evaluated_at: currentEvaluatedAt,
      });

      const nextAttempt = currentAttempt + 1;
      const needsAttention = nextAttempt > 3;

      const { error } = await supabase
        .from('lab_submissions')
        .update({
          attempt_number: nextAttempt,
          attempt_history: history,
          evaluation_status: 'pending',
          evaluation: null,
          score: null,
          feedback_summary: null,
          submitted_at: null,
          evaluated_at: null,
          selected_generation_id: null,
          admin_review_status: null,
          admin_score: null,
          admin_notes: null,
          reviewed_by: null,
          reviewed_at: null,
          needs_admin_attention: needsAttention,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      return { nextAttempt, needsAttention };
    },
    onSuccess: ({ nextAttempt }) => {
      queryClient.invalidateQueries({ queryKey: [LAB_SUBMISSION_KEY] });
      queryClient.invalidateQueries({ queryKey: [LAB_QUOTA_KEY] });
      toast.success(`Starting attempt ${nextAttempt} — you've got this!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset lab. Please try again.');
    },
  });
}

// ── Admin hooks ──────────────────────────────────────────────────────────────

const ALL_LAB_SUBMISSIONS_KEY = 'all-lab-submissions';

export interface LabSubmissionWithDetails extends LabSubmission {
  user_name: string | null;
  user_email: string | null;
  user_avatar: string | null;
  module_title: string | null;
  module_slug: string | null;
  module_passing_score: number | null;
  program_name: string | null;
  program_slug: string | null;
  submitted_image_url: string | null;
  submitted_prompt: string | null;
  // Lab assignment context
  lab_config: LabConfig | null;
  // Generation metadata
  generation_type: string | null;
  model_used: string | null;
  negative_prompt: string | null;
  input_image_url: string | null;
  generation_parameters: Record<string, any> | null;
  generation_time_ms: number | null;
  all_output_urls: string[] | null;
  // All student generations (fallback when no selected generation)
  student_generations: Array<{
    id: string;
    prompt_text: string | null;
    output_urls: string[];
    model_used: string | null;
    generation_type: string | null;
    brand_id: string | null;
    parameters: Record<string, any> | null;
    created_at: string;
  }> | null;
  // Brand context
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_primary_color: string | null;
  brand_category: string | null;
}

/** Fetch all lab submissions with joined user/module/program data (admin only) */
export function useAllLabSubmissions() {
  return useQuery({
    queryKey: [ALL_LAB_SUBMISSIONS_KEY],
    queryFn: async () => {
      // Step 1: Fetch submissions with module and program joins
      const { data: submissions, error } = await supabase
        .from('lab_submissions')
        .select(`
          *,
          module:program_modules!lab_submissions_module_id_fkey(title, slug, passing_score, exercise_resources),
          program:enablement_programs!lab_submissions_program_id_fkey(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!submissions?.length) return [] as LabSubmissionWithDetails[];

      // Step 2: Batch-fetch user profiles
      const userIds = [...new Set(submissions.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, p]),
      );

      // Step 3: Batch-fetch selected generations AND all generation_ids
      const selectedGenIds = submissions
        .map((s: any) => s.selected_generation_id)
        .filter(Boolean) as string[];
      const allTrackedGenIds = submissions
        .flatMap((s: any) => s.generation_ids || [])
        .filter(Boolean) as string[];
      const allGenIds = [...new Set([...selectedGenIds, ...allTrackedGenIds])];

      let genMap = new Map<string, any>();
      if (allGenIds.length > 0) {
        const { data: gens } = await supabase
          .from('creative_studio_generations')
          .select('id, prompt_text, output_urls, model_used, generation_type, parameters, brand_id, negative_prompt, input_image_url, generation_time_ms, created_at')
          .in('id', allGenIds);

        genMap = new Map(
          (gens || []).map((g: any) => [g.id, g]),
        );
      }

      // Step 3b: Batch-fetch brands referenced by generations
      const brandIds = [...new Set(
        Array.from(genMap.values())
          .map((g: any) => g.brand_id)
          .filter(Boolean),
      )] as string[];

      let brandMap = new Map<string, any>();
      if (brandIds.length > 0) {
        const { data: brands } = await supabase
          .from('creative_studio_brands')
          .select('id, name, logo_url, primary_color, brand_category')
          .in('id', brandIds);

        brandMap = new Map(
          (brands || []).map((b: any) => [b.id, b]),
        );
      }

      // Step 4: Merge
      return submissions.map((s: any) => {
        const profile = profileMap.get(s.user_id);
        const gen = s.selected_generation_id ? genMap.get(s.selected_generation_id) : null;

        // Fallback: if no selected generation, use most recent from generation_ids
        const fallbackGens = !gen && s.generation_ids?.length
          ? (s.generation_ids as string[])
              .map((gid: string) => genMap.get(gid))
              .filter(Boolean)
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : null;
        const primaryGen = gen || (fallbackGens?.[0] ?? null);

        const brand = primaryGen?.brand_id ? brandMap.get(primaryGen.brand_id) : null;

        // Extract lab config from exercise_resources
        const exerciseResources = s.module?.exercise_resources;
        const labRaw = exerciseResources?.lab;
        const labConfig = (labRaw && labRaw.enabled === true) ? labRaw as LabConfig : null;

        // Build student_generations array from generation_ids
        const studentGens = s.generation_ids?.length
          ? (s.generation_ids as string[])
              .map((gid: string) => genMap.get(gid))
              .filter(Boolean)
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : null;

        return {
          ...s,
          module: undefined,
          program: undefined,
          user_name: profile?.full_name || null,
          user_email: profile?.email || null,
          user_avatar: profile?.avatar_url || null,
          module_title: s.module?.title || null,
          module_slug: s.module?.slug || null,
          module_passing_score: s.module?.passing_score || null,
          program_name: s.program?.name || null,
          program_slug: s.program?.slug || null,
          submitted_image_url: primaryGen?.output_urls?.[0] || null,
          submitted_prompt: primaryGen?.prompt_text || null,
          lab_config: labConfig,
          generation_type: primaryGen?.generation_type || null,
          model_used: primaryGen?.model_used || null,
          negative_prompt: primaryGen?.negative_prompt || null,
          input_image_url: primaryGen?.input_image_url || null,
          generation_parameters: primaryGen?.parameters || null,
          generation_time_ms: primaryGen?.generation_time_ms || null,
          all_output_urls: primaryGen?.output_urls || null,
          student_generations: studentGens,
          brand_name: brand?.name || null,
          brand_logo_url: brand?.logo_url || null,
          brand_primary_color: brand?.primary_color || null,
          brand_category: brand?.brand_category || null,
        } as LabSubmissionWithDetails;
      });
    },
    staleTime: 30000,
    refetchOnMount: true,
  });
}

/** Admin mutation to review/override a lab submission */
export function useAdminReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      adminScore,
      adminNotes,
      reviewStatus,
      reviewerId,
    }: {
      submissionId: string;
      adminScore?: number;
      adminNotes?: string;
      reviewStatus: 'approved' | 'revision_requested' | 'overridden';
      reviewerId: string;
    }) => {
      const updates: Record<string, any> = {
        admin_review_status: reviewStatus,
        admin_notes: adminNotes || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (adminScore !== undefined) {
        updates.admin_score = adminScore;
        // When overriding, also update the display score
        if (reviewStatus === 'overridden') {
          updates.score = adminScore;
        }
      }

      const { error } = await supabase
        .from('lab_submissions')
        .update(updates)
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALL_LAB_SUBMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [LAB_SUBMISSION_KEY] });
    },
  });
}

/** Admin: set a generation as selected and trigger AI evaluation */
export function useAdminTriggerEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      generationId,
    }: {
      submissionId: string;
      generationId: string;
    }) => {
      const { error: updateError } = await supabase
        .from('lab_submissions')
        .update({
          selected_generation_id: generationId,
          submitted_at: new Date().toISOString(),
          evaluation_status: 'evaluating',
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      const { error: evalError } = await supabase.functions.invoke('evaluate-lab-submission', {
        body: { submission_id: submissionId },
      });

      if (evalError) throw evalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ALL_LAB_SUBMISSIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [LAB_SUBMISSION_KEY] });
      queryClient.invalidateQueries({ queryKey: [LAB_QUOTA_KEY] });
      toast.success('Evaluation triggered — scores will appear shortly');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to trigger evaluation');
    },
  });
}

export { LAB_SUBMISSION_KEY, LAB_GENERATIONS_KEY, ALL_LAB_SUBMISSIONS_KEY };
