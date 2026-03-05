// ABOUTME: React hooks for AI enablement programs and certifications management
// ABOUTME: Handles CRUD for programs, enrollments, modules, and completion tracking

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getBeltPromptSlug } from './useBeltManagement';

export interface EnablementProgram {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  icon: string | null;
  color_scheme: Record<string, any> | null;
  program_type: 'mandatory' | 'core_tool' | 'advanced_tool' | 'specialty';
  tool_name: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  required_maturity_level_id: string | null;
  prerequisite_program_ids: string[] | null;
  learning_outcomes: string[] | null;
  curriculum: Record<string, any> | null;
  estimated_hours: number | null;
  completion_criteria: Record<string, any> | null;
  tools_access_granted: Record<string, any> | null;
  completion_message: string | null;
  featured: boolean;
  enrollment_count: number;
  completion_rate: number | null;
  display_order: number | null;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  enrolled_at: string;
  enrolled_by: string | null;
  enrollment_type: 'manual' | 'self_service' | 'auto';
  started_at: string | null;
  completed_at: string | null;
  current_status: 'enrolled' | 'in_progress' | 'completed' | 'suspended' | 'failed';
  progress_percentage: number;
  modules_completed: Array<{
    module_id: string;
    completed_at: string;
  }>;
  quiz_score: number | null;
  quiz_attempts: number;
  project_submitted: boolean;
  project_url: string | null;
  certified_at: string | null;
  certificate_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  program?: EnablementProgram;
  user?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface ProgramModule {
  id: string;
  program_id: string;
  title: string;
  slug: string;
  description: string | null;
  section: string;
  module_type: 'video' | 'reading' | 'exercise' | 'quiz' | 'project';
  content_markdown: string | null;
  video_url: string | null;
  video_duration: number | null;
  video_thumbnail_url: string | null;
  exercise_description: string | null;
  exercise_resources: Record<string, any> | null;
  quiz_questions: Record<string, any> | null;
  passing_score: number | null;
  quiz_config: Record<string, any> | null;
  downloadable_files: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  related_prompt_ids: string[] | null;
  xp_reward: number | null;
  display_order: number;
  estimated_minutes: number | null;
  learning_objectives: string[] | null;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Lab exercise configuration stored in exercise_resources.lab
export interface EvaluationCriterion {
  name: string;
  weight: number;
  description: string;
  rubric: {
    excellent: string;
    good: string;
    needs_work: string;
  };
}

export interface LabConfig {
  enabled: true;
  lab_type: 'image_generation' | 'image_edit' | 'video_generation';
  title: string;
  objective: string;
  instructions: string[];
  evaluation_criteria: EvaluationCriterion[];
  constraints?: {
    required_generation_type?: string;
    required_aspect_ratio?: string;
    min_generations?: number;
    max_generations?: number;
  };
  suggested_brand_id?: string;
  suggested_model_id?: string;
  hints?: string[];
}

export interface LabSubmission {
  id: string;
  user_id: string;
  module_id: string;
  program_id: string;
  generation_ids: string[];
  selected_generation_id: string | null;
  evaluation: Record<string, any>;
  evaluation_status: 'pending' | 'evaluating' | 'completed' | 'failed';
  score: number | null;
  feedback_summary: string | null;
  submitted_at: string | null;
  evaluated_at: string | null;
  created_at: string;
  updated_at: string;
  // Admin review fields
  admin_score: number | null;
  admin_notes: string | null;
  admin_review_status: 'approved' | 'revision_requested' | 'overridden' | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // Attempt tracking
  attempt_number: number;
  attempt_history: Array<{
    attempt: number;
    score: number | null;
    evaluation: Record<string, any>;
    submitted_at: string | null;
    evaluated_at: string | null;
  }>;
  needs_admin_attention: boolean;
}

/** Extract typed LabConfig from a module's exercise_resources, or null if not a lab */
export function getLabConfig(module: ProgramModule): LabConfig | null {
  const resources = module.exercise_resources;
  if (!resources || typeof resources !== 'object') return null;
  const lab = (resources as Record<string, any>).lab;
  if (!lab || lab.enabled !== true) return null;
  return lab as LabConfig;
}

/** Fetch module counts per program (admin) */
export const useProgramModuleCounts = () => {
  return useQuery({
    queryKey: ['program-module-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_modules')
        .select('program_id');

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data) {
        counts.set(row.program_id, (counts.get(row.program_id) || 0) + 1);
      }
      return counts;
    },
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch all active programs
export const useEnablementPrograms = (options?: {
  includeFeatured?: boolean;
  programType?: string;
  difficulty?: string;
}) => {
  return useQuery({
    queryKey: ['enablement-programs', options],
    queryFn: async () => {
      let query = supabase
        .from('enablement_programs')
        .select('*')
        .eq('is_active', true)
        .is('archived_at', null)
        .order('display_order');

      if (options?.includeFeatured) {
        query = query.eq('featured', true);
      }
      if (options?.programType) {
        query = query.eq('program_type', options.programType);
      }
      if (options?.difficulty) {
        query = query.eq('difficulty_level', options.difficulty);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EnablementProgram[];
    },
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch all programs (including inactive) - for admin
export const useAllEnablementPrograms = () => {
  return useQuery({
    queryKey: ['enablement-programs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enablement_programs')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return data as EnablementProgram[];
    },
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch single program by ID
export const useEnablementProgram = (id: string | undefined) => {
  return useQuery({
    queryKey: ['enablement-program', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('enablement_programs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EnablementProgram;
    },
    enabled: !!id,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch program by slug
export const useEnablementProgramBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['enablement-program-slug', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('enablement_programs')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as EnablementProgram;
    },
    enabled: !!slug,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch program modules
export const useProgramModules = (programId: string | undefined) => {
  return useQuery({
    queryKey: ['program-modules', programId],
    queryFn: async () => {
      if (!programId) return [];

      const { data, error } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', programId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as ProgramModule[];
    },
    enabled: !!programId,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

/** Fetch all modules for a program including inactive (admin) */
export const useAllProgramModules = (programId: string | undefined) => {
  return useQuery({
    queryKey: ['program-modules-all', programId],
    queryFn: async () => {
      if (!programId) return [];

      const { data, error } = await supabase
        .from('program_modules')
        .select('*')
        .eq('program_id', programId)
        .order('display_order');

      if (error) throw error;
      return data as ProgramModule[];
    },
    enabled: !!programId,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch current user's enrollments
export const useMyProgramEnrollments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-program-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_program_enrollments')
        .select(`
          *,
          program:enablement_programs(*)
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data as ProgramEnrollment[];
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch specific enrollment
export const useProgramEnrollment = (programId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['program-enrollment', user?.id, programId],
    queryFn: async () => {
      if (!user || !programId) return null;

      const { data, error } = await supabase
        .from('user_program_enrollments')
        .select(`
          *,
          program:enablement_programs(*)
        `)
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as ProgramEnrollment;
    },
    enabled: !!user && !!programId,
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Fetch all enrollments (admin)
export const useAllProgramEnrollments = (filters?: {
  status?: string;
  programId?: string;
}) => {
  return useQuery({
    queryKey: ['all-program-enrollments', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_program_enrollments')
        .select(`
          *,
          program:enablement_programs(*),
          user:profiles!user_program_enrollments_user_id_profiles_fkey(full_name, email, avatar_url)
        `)
        .order('enrolled_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('current_status', filters.status);
      }
      if (filters?.programId) {
        query = query.eq('program_id', filters.programId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProgramEnrollment[];
    },
    staleTime: 30000,
    refetchOnMount: true,
  });
};

// Create program (admin)
export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: Omit<EnablementProgram, 'id' | 'created_at' | 'updated_at' | 'enrollment_count'>) => {
      const { data, error } = await supabase
        .from('enablement_programs')
        .insert(program)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enablement-programs'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-programs-all'] });
      toast.success('Program created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating program:', error);
      toast.error(`Failed to create program: ${error.message}`);
    },
  });
};

// Update program (admin)
export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Omit<Partial<EnablementProgram>, 'id' | 'created_at' | 'updated_at' | 'enrollment_count' | 'completion_rate'> }) => {
      const { data, error } = await supabase
        .from('enablement_programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enablement-programs'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-programs-all'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-program'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-program-slug'] });
      toast.success('Program updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating program:', error);
      toast.error(`Failed to update program: ${error.message}`);
    },
  });
};

// Archive or restore a program (admin)
export const useArchiveProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from('enablement_programs')
        .update({ archived_at: archive ? new Date().toISOString() : null })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ['enablement-programs'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-programs-all'] });
      toast.success(archive ? 'Program archived' : 'Program restored');
    },
    onError: (error: Error) => {
      console.error('Error archiving program:', error);
      toast.error(`Failed to archive program: ${error.message}`);
    },
  });
};

// Delete program (admin) — surfaces FK constraint violations as actionable messages
export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('enablement_programs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enablement-programs'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-programs-all'] });
      toast.success('Program deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting program:', error);
      const code = error?.code || error?.message?.match(/\b23503\b/)?.[0];
      if (code === '23503') {
        toast.error(
          'Cannot delete: this program has enrollments, submissions, or other linked records. Archive it instead.',
          { duration: 6000 }
        );
      } else {
        toast.error(`Failed to delete program: ${error.message}`);
      }
    },
  });
};

// Enroll user in program
export const useEnrollInProgram = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ programId, enrolledBy, programName, programSlug }: {
      programId: string;
      enrolledBy?: string;
      programName?: string;
      programSlug?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_program_enrollments')
        .insert({
          user_id: user.id,
          program_id: programId,
          enrolled_by: enrolledBy || null,
          enrollment_type: enrolledBy ? 'manual' : 'self_service',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['all-program-enrollments'] });
      toast.success('Successfully enrolled in program!');

      // Fire-and-forget notification
      if (user && variables.programName) {
        supabase.functions.invoke('send-enablement-notification', {
          body: {
            event_type: 'enrollment_confirmation',
            user_id: user.id,
            program_name: variables.programName,
            program_slug: variables.programSlug,
          },
        }).catch((err) => console.warn('[Notification] enrollment:', err));
      }
    },
    onError: (error: Error) => {
      console.error('Error enrolling in program:', error);
      toast.error(`Failed to enroll: ${error.message}`);
    },
  });
};

// Unenroll user from program (hard delete + activity log)
export const useUnenrollFromProgram = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, programId }: {
      userId?: string;
      programId: string;
      programName?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('unenroll_from_program', {
        p_user_id: userId || user.id,
        p_program_id: programId,
      });

      if (error) throw error;
      if (!data) throw new Error('Enrollment not found');
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['all-program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-programs'] });
      queryClient.invalidateQueries({ queryKey: ['enablement-programs-all'] });
      toast.success(
        variables.programName
          ? `Unenrolled from ${variables.programName}`
          : 'Successfully unenrolled from program'
      );
    },
    onError: (error: Error) => {
      console.error('Error unenrolling from program:', error);
      toast.error(`Failed to unenroll: ${error.message}`);
    },
  });
};

// Update enrollment progress
export const useUpdateEnrollmentProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      updates
    }: {
      enrollmentId: string;
      updates: Partial<ProgramEnrollment>
    }) => {
      const { data, error } = await supabase
        .from('user_program_enrollments')
        .update(updates)
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['all-program-enrollments'] });
    },
    onError: (error: Error) => {
      console.error('Error updating enrollment progress:', error);
      toast.error(`Failed to update progress: ${error.message}`);
    },
  });
};

// Complete program module
export const useCompleteModule = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      moduleId,
      programId
    }: {
      enrollmentId: string;
      moduleId: string;
      programId: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Fetch current enrollment
      const { data: enrollment, error: fetchError } = await supabase
        .from('user_program_enrollments')
        .select('modules_completed, current_status')
        .eq('id', enrollmentId)
        .single();

      if (fetchError) throw fetchError;

      const completedModules = enrollment.modules_completed || [];
      const newModule = {
        module_id: moduleId,
        completed_at: new Date().toISOString(),
      };

      // Check if already completed
      if (completedModules.find((m: any) => m.module_id === moduleId)) {
        return enrollment;
      }

      const updatedModules = [...completedModules, newModule];

      // Fetch total required modules
      const { data: modules, error: modulesError } = await supabase
        .from('program_modules')
        .select('id')
        .eq('program_id', programId)
        .eq('is_required', true)
        .eq('is_active', true);

      if (modulesError) throw modulesError;

      const totalRequired = modules?.length || 0;
      const requiredIds = new Set(modules?.map((m: { id: string }) => m.id) || []);
      const completedRequiredCount = updatedModules.filter((m: { module_id: string }) => requiredIds.has(m.module_id)).length;
      const progress = totalRequired > 0 ? Math.min(100, Math.round((completedRequiredCount / totalRequired) * 100)) : 0;

      // Update enrollment
      const { data, error } = await supabase
        .from('user_program_enrollments')
        .update({
          modules_completed: updatedModules,
          progress_percentage: progress,
          current_status: enrollment.current_status === 'enrolled' ? 'in_progress' : enrollment.current_status,
          started_at: enrollment.current_status === 'enrolled' ? new Date().toISOString() : undefined,
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollment'] });
      toast.success('Module completed!');
    },
    onError: (error: Error) => {
      console.error('Error completing module:', error);
      toast.error(`Failed to complete module: ${error.message}`);
    },
  });
};

// Complete program (get certified)
export const useCompleteProgram = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      programName
    }: {
      enrollmentId: string;
      programName: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Capture current belt level before the update triggers promotion
      const cachedMaturity = queryClient.getQueryData<any>(['user-maturity', user.id]);
      const previousLevelId = cachedMaturity?.current_level_id || null;

      const { data, error } = await supabase
        .from('user_program_enrollments')
        .update({
          current_status: 'completed',
          completed_at: new Date().toISOString(),
          certified_at: new Date().toISOString(),
          progress_percentage: 100,
        })
        .eq('id', enrollmentId)
        .select('*, program:enablement_programs(id, name, slug, description, learning_outcomes)')
        .single();

      if (error) throw error;
      return { ...data, _previousLevelId: previousLevelId };
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-program-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['program-enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['user-maturity'] });
      toast.success(`Congratulations! You've completed ${variables.programName}! 🎉`);

      if (!user) return;

      // Fire-and-forget: program completion notification
      supabase.functions.invoke('send-enablement-notification', {
        body: {
          event_type: 'program_completion',
          user_id: user.id,
          program_name: variables.programName,
        },
      }).catch((err) => console.warn('[Notification] completion:', err));

      // Fire-and-forget: program completion certificate generation
      const programData = data.program as any;
      if (programData?.id) {
        supabase.functions.invoke('generate-certificate', {
          body: {
            user_id: user.id,
            certificate_type: 'program',
            program_id: programData.id,
            course_id: programData.id,
            course_title: variables.programName,
            user_name: user.user_metadata?.full_name || '',
            completion_date: new Date().toISOString(),
            prompt_slug: 'program-completion-certificate',
            extra_placeholders: {
              program_name: variables.programName,
              program_description: programData.description || '',
              learning_outcomes: (programData.learning_outcomes || []).join(', '),
            },
          },
        }).catch((err) => console.warn('[Certificate] program:', err));
      }

      queryClient.invalidateQueries({ queryKey: ['user-program-certificates'] });

      // Detect belt advancement: the DB trigger runs synchronously within the
      // transaction, so by now user_maturity reflects any promotion
      try {
        const { data: maturityData } = await supabase
          .from('user_maturity')
          .select('current_level_id, current_level:maturity_levels(name, slug)')
          .eq('user_id', user.id)
          .single();

        if (maturityData && data._previousLevelId && maturityData.current_level_id !== data._previousLevelId) {
          const levelName = (maturityData.current_level as any)?.name || 'a new level';
          const levelSlug = (maturityData.current_level as any)?.slug || '';
          const promptSlug = getBeltPromptSlug(levelSlug);

          console.log(`[Belt] Advancement detected: ${data._previousLevelId} → ${maturityData.current_level_id}`);

          // Generate certificate first, then send email with the certificate image
          (async () => {
            let certificateImageUrl: string | undefined;

            try {
              const { data: certResult } = await supabase.functions.invoke('generate-certificate', {
                body: {
                  user_id: user.id,
                  certificate_type: 'belt',
                  maturity_level_id: maturityData.current_level_id,
                  course_id: maturityData.current_level_id,
                  course_title: levelName,
                  user_name: user.user_metadata?.full_name || '',
                  completion_date: new Date().toISOString(),
                  prompt_slug: promptSlug,
                  extra_placeholders: {
                    belt_name: levelName,
                    specialization: '',
                    track_name: 'AI Enablement',
                    programs_completed: '',
                  },
                },
              });
              certificateImageUrl = certResult?.certificate?.certificate_url;
              console.log('[Belt] Certificate generated:', certificateImageUrl ? 'with image' : 'no image URL');
            } catch (err) {
              console.warn('[Certificate] belt generation failed, sending email without image:', err);
            }

            try {
              await supabase.functions.invoke('send-enablement-notification', {
                body: {
                  event_type: 'belt_advancement',
                  user_id: user.id,
                  belt_name: levelName,
                  certificate_image_url: certificateImageUrl,
                },
              });
              console.log('[Notification] Belt advancement email sent');
            } catch (err) {
              console.warn('[Notification] belt email failed:', err);
            }
          })();
        }
      } catch (err) {
        console.warn('[Belt] Failed to check for advancement:', err);
      }
    },
    onError: (error: Error) => {
      console.error('Error completing program:', error);
      toast.error(`Failed to complete program: ${error.message}`);
    },
  });
};

// Create program module (admin)
export const useCreateProgramModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: Omit<ProgramModule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('program_modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-modules'] });
      queryClient.invalidateQueries({ queryKey: ['program-modules-all'] });
      toast.success('Module created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating module:', error);
      toast.error(`Failed to create module: ${error.message}`);
    },
  });
};

// Update program module (admin)
export const useUpdateProgramModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProgramModule> }) => {
      const { data, error } = await supabase
        .from('program_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-modules'] });
      queryClient.invalidateQueries({ queryKey: ['program-modules-all'] });
      toast.success('Module updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating module:', error);
      toast.error(`Failed to update module: ${error.message}`);
    },
  });
};

// Delete program module (admin)
export const useDeleteProgramModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('program_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-modules'] });
      queryClient.invalidateQueries({ queryKey: ['program-modules-all'] });
      toast.success('Module deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting module:', error);
      toast.error(`Failed to delete module: ${error.message}`);
    },
  });
};
