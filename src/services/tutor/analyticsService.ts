// ABOUTME: Admin analytics queries for the Mitch tutor dashboard
// ABOUTME: Fetches learner rosters, session insights, engagement trends, and drill-down data

import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────

export interface LearnerRosterEntry {
  user_id: string;
  user_name: string;
  user_email: string;
  avatar_url?: string;
  programs_engaged: number;
  total_sessions: number;
  avg_comprehension_score: number | null;
  global_strengths: string[];
  global_struggles: string[];
  tutor_notes: string | null;
  last_session_at: string | null;
  risk_level: 'excelling' | 'on-track' | 'at-risk';
}

export interface LearnerDetail {
  profile: LearnerRosterEntry;
  learning_style: Record<string, unknown>;
  communication_preferences: Record<string, unknown>;
  memory: LearnerMemoryEntry[];
  sessions: SessionSummaryEntry[];
  assessments: LearnerAssessmentEntry[];
}

export interface LearnerMemoryEntry {
  program_id: string;
  program_name: string;
  topics_discussed: string[];
  misconceptions: string[];
  strengths: string[];
  areas_for_review: string[];
  summary: string | null;
}

export interface SessionSummaryEntry {
  id: string;
  conversation_id: string;
  program_id: string;
  program_name: string;
  module_id: string;
  module_title: string;
  session_type: string;
  summary: string;
  topics_covered: string[];
  key_insights: Array<{ topic: string; insight: string; type: string }>;
  handoff_note: string | null;
  message_count: number;
  created_at: string;
}

export interface LearnerAssessmentEntry {
  id: string;
  module_id: string;
  module_title: string;
  program_name: string;
  assessment_type: 'pre' | 'post';
  question: string;
  comprehension_score: number | null;
  created_at: string;
}

export interface InsightAggregate {
  topic: string;
  insight: string;
  type: string;
  count: number;
  modules: string[];
  learner_count: number;
}

export interface InsightLearnerRow {
  user_id: string;
  user_name: string;
  user_email: string;
  module_title: string;
  program_name: string;
  insight: string;
  created_at: string;
}

export interface ModuleEffectivenessRow {
  module_id: string;
  module_title: string;
  program_name: string;
  avg_pre_score: number | null;
  avg_post_score: number | null;
  learning_gain: number | null;
  session_count: number;
  struggle_rate: number;
}

export interface SessionVolumeTrend {
  date: string;
  voiceCount: number;
  textCount: number;
}

export interface ComprehensionTrend {
  week: string;
  avgPre: number;
  avgPost: number;
  gain: number;
}

export interface ProgramEngagementRow {
  program_id: string;
  program_name: string;
  session_count: number;
  unique_learners: number;
  avg_comprehension: number | null;
}

export interface TutorImpactRow {
  program_id: string;
  program_name: string;
  completion_with_tutor: number;
  completion_without_tutor: number;
  total_with_tutor: number;
  total_without_tutor: number;
}

export interface SessionQualityTrend {
  date: string;
  avgTurns: number;
  avgMessages: number;
  quickPromptRatio: number;
  toolUsageRate: number;
}

// ─── Shared helpers ──────────────────────────────────────────────────

function riskLevel(score: number | null): 'excelling' | 'on-track' | 'at-risk' {
  if (score == null) return 'at-risk';
  if (score >= 70) return 'excelling';
  if (score >= 40) return 'on-track';
  return 'at-risk';
}

function sinceDate(daysBack?: number): string | undefined {
  if (!daysBack) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString();
}

async function batchFetchNames(moduleIds: Set<string>, programIds: Set<string>) {
  let moduleMap = new Map<string, string>();
  let programMap = new Map<string, string>();

  if (moduleIds.size > 0) {
    const { data } = await supabase
      .from('program_modules')
      .select('id, title')
      .in('id', [...moduleIds]);
    if (data) moduleMap = new Map(data.map(m => [m.id, m.title]));
  }
  if (programIds.size > 0) {
    const { data } = await supabase
      .from('enablement_programs')
      .select('id, name')
      .in('id', [...programIds]);
    if (data) programMap = new Map(data.map(p => [p.id, p.name]));
  }
  return { moduleMap, programMap };
}

// ─── Learners Tab ────────────────────────────────────────────────────

export interface FetchLearnerRosterOptions {
  search?: string;
  programId?: string;
  riskLevel?: 'all' | 'at-risk' | 'on-track' | 'excelling';
  daysBack?: number;
}

export async function fetchLearnerRoster(options?: FetchLearnerRosterOptions): Promise<{
  learners: LearnerRosterEntry[];
  totals: { active: number; atRisk: number; avgScore: number | null; avgSessions: number };
}> {
  // Fetch learner profiles with user info
  const { data: profiles, error } = await supabase
    .from('tutor_learner_profiles')
    .select(`
      user_id,
      global_strengths,
      global_struggles,
      total_sessions,
      total_programs_engaged,
      avg_comprehension_score,
      tutor_notes,
      updated_at,
      profiles!tutor_learner_profiles_user_id_fkey (
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Also fetch the most recent session summary per user for "last active"
  const { data: recentSessions } = await supabase
    .from('tutor_session_summaries')
    .select('user_id, created_at')
    .order('created_at', { ascending: false });

  const lastSessionMap = new Map<string, string>();
  for (const s of recentSessions || []) {
    if (!lastSessionMap.has(s.user_id)) {
      lastSessionMap.set(s.user_id, s.created_at);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let learners: LearnerRosterEntry[] = (profiles || []).map((row: any) => {
    const score = row.avg_comprehension_score != null ? Number(row.avg_comprehension_score) : null;
    return {
      user_id: row.user_id,
      user_name: [row.profiles?.first_name, row.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown',
      user_email: row.profiles?.email || '',
      avatar_url: row.profiles?.avatar_url || undefined,
      programs_engaged: row.total_programs_engaged || 0,
      total_sessions: row.total_sessions || 0,
      avg_comprehension_score: score,
      global_strengths: row.global_strengths || [],
      global_struggles: row.global_struggles || [],
      tutor_notes: row.tutor_notes || null,
      last_session_at: lastSessionMap.get(row.user_id) || row.updated_at,
      risk_level: riskLevel(score),
    };
  });

  // Apply filters
  if (options?.search) {
    const q = options.search.toLowerCase();
    learners = learners.filter(l =>
      l.user_name.toLowerCase().includes(q) || l.user_email.toLowerCase().includes(q)
    );
  }
  if (options?.riskLevel && options.riskLevel !== 'all') {
    learners = learners.filter(l => l.risk_level === options.riskLevel);
  }
  if (options?.daysBack) {
    const since = sinceDate(options.daysBack)!;
    learners = learners.filter(l => l.last_session_at && l.last_session_at >= since);
  }

  // Compute totals
  const active = learners.length;
  const atRisk = learners.filter(l => l.risk_level === 'at-risk').length;
  const scores = learners
    .map(l => l.avg_comprehension_score)
    .filter((s): s is number => s != null);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const avgSessions = active > 0 ? Math.round(learners.reduce((a, l) => a + l.total_sessions, 0) / active * 10) / 10 : 0;

  return { learners, totals: { active, atRisk, avgScore, avgSessions } };
}

export async function fetchLearnerDetail(userId: string): Promise<LearnerDetail> {
  // Parallel fetch everything for this user
  const [profileRes, memoryRes, summariesRes, assessmentsRes] = await Promise.all([
    supabase
      .from('tutor_learner_profiles')
      .select(`
        *,
        profiles!tutor_learner_profiles_user_id_fkey (first_name, last_name, email, avatar_url)
      `)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('tutor_learner_memory')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('tutor_session_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tutor_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  // Collect IDs for name resolution
  const moduleIds = new Set<string>();
  const programIds = new Set<string>();
  for (const s of summariesRes.data || []) {
    moduleIds.add(s.module_id);
    programIds.add(s.program_id);
  }
  for (const a of assessmentsRes.data || []) {
    moduleIds.add(a.module_id);
    programIds.add(a.program_id);
  }
  for (const m of memoryRes.data || []) {
    programIds.add(m.program_id);
  }

  const { moduleMap, programMap } = await batchFetchNames(moduleIds, programIds);

  const p = profileRes.data;
  const score = p?.avg_comprehension_score != null ? Number(p.avg_comprehension_score) : null;

  const profile: LearnerRosterEntry = {
    user_id: userId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user_name: [(p as any)?.profiles?.first_name, (p as any)?.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user_email: (p as any)?.profiles?.email || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    avatar_url: (p as any)?.profiles?.avatar_url || undefined,
    programs_engaged: p?.total_programs_engaged || 0,
    total_sessions: p?.total_sessions || 0,
    avg_comprehension_score: score,
    global_strengths: p?.global_strengths || [],
    global_struggles: p?.global_struggles || [],
    tutor_notes: p?.tutor_notes || null,
    last_session_at: summariesRes.data?.[0]?.created_at || null,
    risk_level: riskLevel(score),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memory: LearnerMemoryEntry[] = (memoryRes.data || []).map((m: any) => ({
    program_id: m.program_id,
    program_name: programMap.get(m.program_id) || 'Unknown Program',
    topics_discussed: Array.isArray(m.topics_discussed) ? m.topics_discussed.map((t: unknown) => typeof t === 'string' ? t : (t as { topic?: string })?.topic || String(t)) : [],
    misconceptions: Array.isArray(m.misconceptions) ? m.misconceptions.map((t: unknown) => typeof t === 'string' ? t : (t as { topic?: string })?.topic || String(t)) : [],
    strengths: Array.isArray(m.strengths) ? m.strengths.map((t: unknown) => typeof t === 'string' ? t : (t as { topic?: string })?.topic || String(t)) : [],
    areas_for_review: Array.isArray(m.areas_for_review) ? m.areas_for_review.map((t: unknown) => typeof t === 'string' ? t : (t as { topic?: string })?.topic || String(t)) : [],
    summary: m.summary,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: SessionSummaryEntry[] = (summariesRes.data || []).map((s: any) => ({
    id: s.id,
    conversation_id: s.conversation_id,
    program_id: s.program_id,
    program_name: programMap.get(s.program_id) || 'Unknown Program',
    module_id: s.module_id,
    module_title: moduleMap.get(s.module_id) || 'Unknown Module',
    session_type: s.session_type,
    summary: s.summary,
    topics_covered: s.topics_covered || [],
    key_insights: s.key_insights || [],
    handoff_note: s.handoff_note,
    message_count: s.message_count || 0,
    created_at: s.created_at,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assessments: LearnerAssessmentEntry[] = (assessmentsRes.data || []).map((a: any) => ({
    id: a.id,
    module_id: a.module_id,
    module_title: moduleMap.get(a.module_id) || 'Unknown Module',
    program_name: programMap.get(a.program_id) || 'Unknown Program',
    assessment_type: a.assessment_type,
    question: a.question,
    comprehension_score: a.comprehension_score,
    created_at: a.created_at,
  }));

  return {
    profile,
    learning_style: p?.learning_style || {},
    communication_preferences: p?.communication_preferences || {},
    memory,
    sessions,
    assessments,
  };
}

// ─── Insights Tab ────────────────────────────────────────────────────

export async function fetchTopicInsights(options?: {
  daysBack?: number;
  programId?: string;
}): Promise<{
  misconceptions: InsightAggregate[];
  struggles: InsightAggregate[];
  strengths: InsightAggregate[];
}> {
  let query = supabase
    .from('tutor_session_summaries')
    .select('key_insights, module_id, user_id, created_at');

  if (options?.daysBack) {
    query = query.gte('created_at', sinceDate(options.daysBack)!);
  }
  if (options?.programId) {
    query = query.eq('program_id', options.programId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Collect module names
  const moduleIds = new Set<string>();
  for (const row of data || []) {
    if (row.module_id) moduleIds.add(row.module_id);
  }
  const { moduleMap } = await batchFetchNames(moduleIds, new Set());

  // Aggregate insights by type
  const agg = new Map<string, { topic: string; insight: string; type: string; count: number; modules: Set<string>; users: Set<string> }>();

  for (const row of data || []) {
    const insights = (row.key_insights || []) as Array<{ topic: string; insight: string; type: string }>;
    for (const ins of insights) {
      const key = `${ins.type}::${ins.topic}::${ins.insight}`;
      const existing = agg.get(key);
      if (existing) {
        existing.count++;
        if (row.module_id) existing.modules.add(moduleMap.get(row.module_id) || row.module_id);
        existing.users.add(row.user_id);
      } else {
        agg.set(key, {
          topic: ins.topic,
          insight: ins.insight,
          type: ins.type,
          count: 1,
          modules: new Set(row.module_id ? [moduleMap.get(row.module_id) || row.module_id] : []),
          users: new Set([row.user_id]),
        });
      }
    }
  }

  const toArray = (type: string): InsightAggregate[] =>
    [...agg.values()]
      .filter(a => a.type === type)
      .map(a => ({
        topic: a.topic,
        insight: a.insight,
        type: a.type,
        count: a.count,
        modules: [...a.modules],
        learner_count: a.users.size,
      }))
      .sort((a, b) => b.count - a.count);

  return {
    misconceptions: toArray('misconception'),
    struggles: toArray('struggle'),
    strengths: toArray('strength'),
  };
}

export async function fetchInsightLearners(
  topic: string,
  insightType: string,
  options?: { daysBack?: number },
): Promise<InsightLearnerRow[]> {
  let query = supabase
    .from('tutor_session_summaries')
    .select(`
      user_id, module_id, program_id, key_insights, created_at,
      profiles!tutor_session_summaries_user_id_fkey (first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });

  if (options?.daysBack) {
    query = query.gte('created_at', sinceDate(options.daysBack)!);
  }

  const { data, error } = await query;
  if (error) throw error;

  const moduleIds = new Set<string>();
  const programIds = new Set<string>();
  for (const row of data || []) {
    if (row.module_id) moduleIds.add(row.module_id);
    if (row.program_id) programIds.add(row.program_id);
  }
  const { moduleMap, programMap } = await batchFetchNames(moduleIds, programIds);

  const results: InsightLearnerRow[] = [];
  for (const row of data || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const insights = (r.key_insights || []) as Array<{ topic: string; insight: string; type: string }>;
    for (const ins of insights) {
      if (ins.topic === topic && ins.type === insightType) {
        results.push({
          user_id: r.user_id,
          user_name: [r.profiles?.first_name, r.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown',
          user_email: r.profiles?.email || '',
          module_title: moduleMap.get(r.module_id) || 'Unknown Module',
          program_name: programMap.get(r.program_id) || 'Unknown Program',
          insight: ins.insight,
          created_at: r.created_at,
        });
      }
    }
  }

  return results;
}

export async function fetchModuleEffectiveness(options?: {
  daysBack?: number;
}): Promise<ModuleEffectivenessRow[]> {
  // Fetch assessments and session summaries in parallel
  const since = sinceDate(options?.daysBack);

  let assessQuery = supabase.from('tutor_assessments').select('module_id, program_id, assessment_type, comprehension_score');
  let summaryQuery = supabase.from('tutor_session_summaries').select('module_id, key_insights');

  if (since) {
    assessQuery = assessQuery.gte('created_at', since);
    summaryQuery = summaryQuery.gte('created_at', since);
  }

  const [assessRes, summaryRes] = await Promise.all([assessQuery, summaryQuery]);
  if (assessRes.error) throw assessRes.error;
  if (summaryRes.error) throw summaryRes.error;

  // Collect module/program names
  const moduleIds = new Set<string>();
  const programIds = new Set<string>();
  for (const a of assessRes.data || []) {
    moduleIds.add(a.module_id);
    programIds.add(a.program_id);
  }
  const { moduleMap, programMap } = await batchFetchNames(moduleIds, programIds);

  // Aggregate assessments by module
  const moduleAssess = new Map<string, { pre: number[]; post: number[]; programId: string }>();
  for (const a of assessRes.data || []) {
    const existing = moduleAssess.get(a.module_id) || { pre: [], post: [], programId: a.program_id };
    if (a.comprehension_score != null) {
      if (a.assessment_type === 'pre') existing.pre.push(a.comprehension_score);
      else existing.post.push(a.comprehension_score);
    }
    moduleAssess.set(a.module_id, existing);
  }

  // Count sessions with struggles per module
  const moduleStruggles = new Map<string, { total: number; withStruggle: number }>();
  for (const s of summaryRes.data || []) {
    const existing = moduleStruggles.get(s.module_id) || { total: 0, withStruggle: 0 };
    existing.total++;
    const insights = (s.key_insights || []) as Array<{ type: string }>;
    if (insights.some(i => i.type === 'misconception' || i.type === 'struggle')) {
      existing.withStruggle++;
    }
    moduleStruggles.set(s.module_id, existing);
  }

  const rows: ModuleEffectivenessRow[] = [];
  for (const [moduleId, assess] of moduleAssess) {
    const avgPre = assess.pre.length > 0 ? Math.round(assess.pre.reduce((a, b) => a + b, 0) / assess.pre.length) : null;
    const avgPost = assess.post.length > 0 ? Math.round(assess.post.reduce((a, b) => a + b, 0) / assess.post.length) : null;
    const struggles = moduleStruggles.get(moduleId);

    rows.push({
      module_id: moduleId,
      module_title: moduleMap.get(moduleId) || 'Unknown Module',
      program_name: programMap.get(assess.programId) || 'Unknown Program',
      avg_pre_score: avgPre,
      avg_post_score: avgPost,
      learning_gain: avgPre != null && avgPost != null ? avgPost - avgPre : null,
      session_count: struggles?.total || 0,
      struggle_rate: struggles && struggles.total > 0
        ? Math.round((struggles.withStruggle / struggles.total) * 100)
        : 0,
    });
  }

  rows.sort((a, b) => (a.learning_gain ?? -999) - (b.learning_gain ?? -999));
  return rows;
}

// ─── Engagement Tab ──────────────────────────────────────────────────

export async function fetchSessionVolumeTrend(options?: {
  daysBack?: number;
}): Promise<SessionVolumeTrend[]> {
  const since = sinceDate(options?.daysBack || 30);

  const [voiceRes, textRes] = await Promise.all([
    supabase
      .from('voice_sessions')
      .select('created_at')
      .eq('agent', 'mitch')
      .gte('created_at', since!),
    supabase
      .from('chatbot_conversations')
      .select('created_at')
      .contains('metadata', { assistant: 'tutor' })
      .gte('created_at', since!),
  ]);

  // Group by date
  const dayMap = new Map<string, { voice: number; text: number }>();

  for (const v of voiceRes.data || []) {
    const day = v.created_at.slice(0, 10);
    const existing = dayMap.get(day) || { voice: 0, text: 0 };
    existing.voice++;
    dayMap.set(day, existing);
  }
  for (const t of textRes.data || []) {
    const day = t.created_at.slice(0, 10);
    const existing = dayMap.get(day) || { voice: 0, text: 0 };
    existing.text++;
    dayMap.set(day, existing);
  }

  return [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      voiceCount: counts.voice,
      textCount: counts.text,
    }));
}

export async function fetchComprehensionTrend(options?: {
  daysBack?: number;
}): Promise<ComprehensionTrend[]> {
  const since = sinceDate(options?.daysBack || 90);

  let query = supabase
    .from('tutor_assessments')
    .select('assessment_type, comprehension_score, created_at')
    .order('created_at', { ascending: true });

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Group by ISO week
  const weekMap = new Map<string, { pre: number[]; post: number[] }>();
  for (const a of data || []) {
    if (a.comprehension_score == null) continue;
    const d = new Date(a.created_at);
    // ISO week: get Monday of the week
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().slice(0, 10);

    const existing = weekMap.get(weekKey) || { pre: [], post: [] };
    if (a.assessment_type === 'pre') existing.pre.push(a.comprehension_score);
    else existing.post.push(a.comprehension_score);
    weekMap.set(weekKey, existing);
  }

  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, scores]) => {
      const avgPre = scores.pre.length > 0 ? Math.round(scores.pre.reduce((a, b) => a + b, 0) / scores.pre.length) : 0;
      const avgPost = scores.post.length > 0 ? Math.round(scores.post.reduce((a, b) => a + b, 0) / scores.post.length) : 0;
      return { week, avgPre, avgPost, gain: avgPost - avgPre };
    });
}

export async function fetchProgramEngagement(options?: {
  daysBack?: number;
}): Promise<ProgramEngagementRow[]> {
  const since = sinceDate(options?.daysBack || 90);

  let query = supabase
    .from('tutor_session_summaries')
    .select('program_id, user_id');

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Aggregate by program
  const progMap = new Map<string, { sessions: number; users: Set<string> }>();
  for (const row of data || []) {
    const existing = progMap.get(row.program_id) || { sessions: 0, users: new Set() };
    existing.sessions++;
    existing.users.add(row.user_id);
    progMap.set(row.program_id, existing);
  }

  // Fetch program names
  const programIds = new Set(progMap.keys());
  const { programMap } = await batchFetchNames(new Set(), programIds);

  return [...progMap.entries()].map(([pid, stats]) => ({
    program_id: pid,
    program_name: programMap.get(pid) || 'Unknown Program',
    session_count: stats.sessions,
    unique_learners: stats.users.size,
    avg_comprehension: null, // Populated if needed from assessments
  }));
}

export async function fetchTutorImpact(): Promise<TutorImpactRow[]> {
  // Get all enrollments with completion status
  const { data: enrollments, error: enrollErr } = await supabase
    .from('user_program_enrollments')
    .select('user_id, program_id, current_status');
  if (enrollErr) throw enrollErr;

  // Get unique user IDs who have used the tutor
  const { data: tutorUsers, error: tutorErr } = await supabase
    .from('tutor_session_summaries')
    .select('user_id, program_id');
  if (tutorErr) throw tutorErr;

  const tutorUsersByProgram = new Map<string, Set<string>>();
  for (const t of tutorUsers || []) {
    const existing = tutorUsersByProgram.get(t.program_id) || new Set();
    existing.add(t.user_id);
    tutorUsersByProgram.set(t.program_id, existing);
  }

  // Aggregate by program
  const progStats = new Map<string, {
    withTutor: { completed: number; total: number };
    withoutTutor: { completed: number; total: number };
  }>();

  for (const e of enrollments || []) {
    const existing = progStats.get(e.program_id) || {
      withTutor: { completed: 0, total: 0 },
      withoutTutor: { completed: 0, total: 0 },
    };
    const usedTutor = tutorUsersByProgram.get(e.program_id)?.has(e.user_id) || false;
    const bucket = usedTutor ? existing.withTutor : existing.withoutTutor;
    bucket.total++;
    if (e.current_status === 'completed') bucket.completed++;
    progStats.set(e.program_id, existing);
  }

  const programIds = new Set(progStats.keys());
  const { programMap } = await batchFetchNames(new Set(), programIds);

  return [...progStats.entries()]
    .filter(([, s]) => s.withTutor.total > 0 || s.withoutTutor.total > 0)
    .map(([pid, s]) => ({
      program_id: pid,
      program_name: programMap.get(pid) || 'Unknown Program',
      completion_with_tutor: s.withTutor.total > 0 ? Math.round((s.withTutor.completed / s.withTutor.total) * 100) : 0,
      completion_without_tutor: s.withoutTutor.total > 0 ? Math.round((s.withoutTutor.completed / s.withoutTutor.total) * 100) : 0,
      total_with_tutor: s.withTutor.total,
      total_without_tutor: s.withoutTutor.total,
    }));
}

export async function fetchSessionQualityTrend(options?: {
  daysBack?: number;
}): Promise<SessionQualityTrend[]> {
  const since = sinceDate(options?.daysBack || 30);

  const [voiceRes, textRes] = await Promise.all([
    supabase
      .from('voice_sessions')
      .select('turn_count, tool_calls_count, created_at')
      .eq('agent', 'mitch')
      .gte('created_at', since!),
    supabase
      .from('chatbot_conversations')
      .select('messages, tool_calls_count, created_at')
      .contains('metadata', { assistant: 'tutor' })
      .gte('created_at', since!),
  ]);

  // Group by day
  const dayMap = new Map<string, {
    turns: number[];
    messages: number[];
    quickPrompts: number;
    totalUserMessages: number;
    toolUsed: number;
    totalSessions: number;
  }>();

  for (const v of voiceRes.data || []) {
    const day = v.created_at.slice(0, 10);
    const existing = dayMap.get(day) || { turns: [], messages: [], quickPrompts: 0, totalUserMessages: 0, toolUsed: 0, totalSessions: 0 };
    existing.turns.push(v.turn_count || 0);
    existing.totalSessions++;
    if ((v.tool_calls_count || 0) > 0) existing.toolUsed++;
    dayMap.set(day, existing);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const t of (textRes.data || []) as any[]) {
    const day = t.created_at.slice(0, 10);
    const existing = dayMap.get(day) || { turns: [], messages: [], quickPrompts: 0, totalUserMessages: 0, toolUsed: 0, totalSessions: 0 };
    const msgs = (t.messages || []) as Array<{ role: string; source?: string }>;
    existing.messages.push(msgs.length);
    const userMsgs = msgs.filter(m => m.role === 'user');
    existing.totalUserMessages += userMsgs.length;
    existing.quickPrompts += userMsgs.filter(m => m.source === 'quick_prompt').length;
    existing.totalSessions++;
    if ((t.tool_calls_count || 0) > 0) existing.toolUsed++;
    dayMap.set(day, existing);
  }

  return [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      avgTurns: stats.turns.length > 0 ? Math.round(stats.turns.reduce((a, b) => a + b, 0) / stats.turns.length * 10) / 10 : 0,
      avgMessages: stats.messages.length > 0 ? Math.round(stats.messages.reduce((a, b) => a + b, 0) / stats.messages.length * 10) / 10 : 0,
      quickPromptRatio: stats.totalUserMessages > 0 ? Math.round((stats.quickPrompts / stats.totalUserMessages) * 100) : 0,
      toolUsageRate: stats.totalSessions > 0 ? Math.round((stats.toolUsed / stats.totalSessions) * 100) : 0,
    }));
}
