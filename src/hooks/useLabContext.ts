// ABOUTME: Reads lab URL params and assembles lab state for Creative Studio
// ABOUTME: Returns null/empty when no lab params present — zero impact on standalone studio

import { useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLabSubmission, useLabGenerations, useSubmitLab } from '@/hooks/useLabSubmissions';
import type { ProgramModule, EnablementProgram, LabConfig, LabSubmission } from '@/hooks/useEnablementPrograms';

export interface LabContextValue {
  isLabMode: true;
  labModuleId: string;
  labProgramId: string;
  labConfig: LabConfig;
  labModule: ProgramModule;
  labProgram: EnablementProgram;
  labSubmission: LabSubmission | null;
  labGenerations: any[];
  labGenerationCount: number;
  submitLab: (selectedGenerationId: string) => void;
  isSubmitting: boolean;
  exitLab: () => void;
}

/** Fetch a single module by ID (lighter than loading all program modules) */
function useModuleById(moduleId: string | null) {
  return useQuery({
    queryKey: ['lab-module', moduleId],
    queryFn: async () => {
      if (!moduleId) return null;
      const { data, error } = await supabase
        .from('program_modules')
        .select('*')
        .eq('id', moduleId)
        .single();
      if (error) throw error;
      return data as ProgramModule;
    },
    enabled: !!moduleId,
    staleTime: 300000, // 5 min — module content rarely changes
  });
}

/** Fetch a single program by ID */
function useProgramById(programId: string | null) {
  return useQuery({
    queryKey: ['lab-program', programId],
    queryFn: async () => {
      if (!programId) return null;
      const { data, error } = await supabase
        .from('enablement_programs')
        .select('*')
        .eq('id', programId)
        .single();
      if (error) throw error;
      return data as EnablementProgram;
    },
    enabled: !!programId,
    staleTime: 300000,
  });
}

/**
 * Read lab context from URL params. Returns null when not in lab mode.
 * All lab-specific data (module, program, config, submission, generations)
 * is fetched from this single hook to keep CreativeStudio.tsx clean.
 */
export function useLabContext(): LabContextValue | null {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const labModuleId = searchParams.get('lab_module_id');
  const labProgramId = searchParams.get('lab_program_id');

  const { data: labModule } = useModuleById(labModuleId);
  const { data: labProgram } = useProgramById(labProgramId);
  const { data: labSubmission } = useLabSubmission(labModuleId || undefined);
  const { data: labGenerations } = useLabGenerations(labModuleId || undefined);
  const submitLabMutation = useSubmitLab();

  const labConfig = useMemo(() => {
    if (!labModule?.exercise_resources) return null;
    const resources = labModule.exercise_resources as Record<string, any>;
    const lab = resources.lab;
    if (!lab || lab.enabled !== true) return null;
    return lab as LabConfig;
  }, [labModule]);

  const submitLab = useCallback((selectedGenerationId: string) => {
    if (!labSubmission?.id) return;
    submitLabMutation.mutate({
      submissionId: labSubmission.id,
      selectedGenerationId,
    });
  }, [labSubmission?.id, submitLabMutation]);

  const exitLab = useCallback(() => {
    if (labProgram?.slug && labModule?.slug) {
      navigate(`/learn/programs/${labProgram.slug}?module=${labModule.slug}`);
    } else {
      navigate('/learn/programs');
    }
  }, [labProgram?.slug, labModule?.slug, navigate]);

  // Not in lab mode — return null
  if (!labModuleId || !labProgramId) return null;

  // Still loading
  if (!labModule || !labProgram || !labConfig) return null;

  return {
    isLabMode: true,
    labModuleId,
    labProgramId,
    labConfig,
    labModule,
    labProgram,
    labSubmission: labSubmission ?? null,
    labGenerations: labGenerations ?? [],
    labGenerationCount: labGenerations?.length ?? 0,
    submitLab,
    isSubmitting: submitLabMutation.isPending,
    exitLab,
  };
}
