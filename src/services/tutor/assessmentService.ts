// ABOUTME: Admin query layer for tutor pre/post assessments
// ABOUTME: Fetches assessment data with aggregation for learning gain metrics

import { supabase } from '@/integrations/supabase/client';

export interface AssessmentRecord {
  id: string;
  user_id: string;
  program_id: string;
  module_id: string;
  assessment_type: 'pre' | 'post';
  question: string;
  learner_response: string | null;
  ai_evaluation: {
    evaluation?: string;
    [key: string]: unknown;
  } | null;
  comprehension_score: number | null;
  created_at: string;
  // Joined
  user_name: string;
  user_email: string;
  module_title?: string;
  program_name?: string;
}

export interface ModuleAssessmentSummary {
  module_id: string;
  module_title: string;
  program_name: string;
  pre_count: number;
  post_count: number;
  avg_pre_score: number | null;
  avg_post_score: number | null;
  avg_gain: number | null;
  assessments: AssessmentRecord[];
}

export interface FetchAssessmentsOptions {
  programId?: string;
  daysBack?: number;
}

/**
 * Fetches all assessments with profile and module/program name joins.
 */
export async function fetchAssessments(options?: FetchAssessmentsOptions): Promise<{
  assessments: AssessmentRecord[];
  summaries: ModuleAssessmentSummary[];
  totals: {
    totalPre: number;
    totalPost: number;
    avgPreScore: number | null;
    avgPostScore: number | null;
    avgGain: number | null;
  };
}> {
  let query = supabase
    .from('tutor_assessments')
    .select(`
      *,
      profiles!tutor_assessments_user_id_fkey (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (options?.programId) {
    query = query.eq('program_id', options.programId);
  }

  if (options?.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  // Batch fetch module and program names
  const moduleIds = new Set<string>();
  const programIds = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data || []) as any[]) {
    if (row.module_id) moduleIds.add(row.module_id);
    if (row.program_id) programIds.add(row.program_id);
  }

  let moduleMap = new Map<string, string>();
  let programMap = new Map<string, string>();

  if (moduleIds.size > 0) {
    const { data: modules } = await supabase
      .from('program_modules')
      .select('id, title')
      .in('id', [...moduleIds]);
    if (modules) {
      moduleMap = new Map(modules.map(m => [m.id, m.title]));
    }
  }

  if (programIds.size > 0) {
    const { data: programs } = await supabase
      .from('enablement_programs')
      .select('id, name')
      .in('id', [...programIds]);
    if (programs) {
      programMap = new Map(programs.map(p => [p.id, p.name]));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assessments: AssessmentRecord[] = (data || []).map((row: any) => ({
    ...row,
    user_name: [row.profiles?.first_name, row.profiles?.last_name]
      .filter(Boolean).join(' ') || 'Unknown',
    user_email: row.profiles?.email || '',
    module_title: moduleMap.get(row.module_id),
    program_name: programMap.get(row.program_id),
    profiles: undefined,
  }));

  // Build per-module summaries
  const moduleGroups = new Map<string, AssessmentRecord[]>();
  for (const a of assessments) {
    const existing = moduleGroups.get(a.module_id) ?? [];
    existing.push(a);
    moduleGroups.set(a.module_id, existing);
  }

  const summaries: ModuleAssessmentSummary[] = [...moduleGroups.entries()].map(([moduleId, group]) => {
    const preScores = group
      .filter(a => a.assessment_type === 'pre' && a.comprehension_score != null)
      .map(a => a.comprehension_score!);
    const postScores = group
      .filter(a => a.assessment_type === 'post' && a.comprehension_score != null)
      .map(a => a.comprehension_score!);

    const avgPre = preScores.length > 0 ? Math.round(preScores.reduce((s, v) => s + v, 0) / preScores.length) : null;
    const avgPost = postScores.length > 0 ? Math.round(postScores.reduce((s, v) => s + v, 0) / postScores.length) : null;

    return {
      module_id: moduleId,
      module_title: moduleMap.get(moduleId) ?? 'Unknown Module',
      program_name: programMap.get(group[0]?.program_id) ?? 'Unknown Program',
      pre_count: group.filter(a => a.assessment_type === 'pre').length,
      post_count: group.filter(a => a.assessment_type === 'post').length,
      avg_pre_score: avgPre,
      avg_post_score: avgPost,
      avg_gain: avgPre != null && avgPost != null ? avgPost - avgPre : null,
      assessments: group,
    };
  });

  // Overall totals
  const allPre = assessments.filter(a => a.assessment_type === 'pre' && a.comprehension_score != null);
  const allPost = assessments.filter(a => a.assessment_type === 'post' && a.comprehension_score != null);
  const avgPreScore = allPre.length > 0
    ? Math.round(allPre.reduce((s, a) => s + a.comprehension_score!, 0) / allPre.length) : null;
  const avgPostScore = allPost.length > 0
    ? Math.round(allPost.reduce((s, a) => s + a.comprehension_score!, 0) / allPost.length) : null;

  return {
    assessments,
    summaries,
    totals: {
      totalPre: allPre.length,
      totalPost: allPost.length,
      avgPreScore,
      avgPostScore,
      avgGain: avgPreScore != null && avgPostScore != null ? avgPostScore - avgPreScore : null,
    },
  };
}
