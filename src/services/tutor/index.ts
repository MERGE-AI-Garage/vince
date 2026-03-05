// ABOUTME: Barrel export for the AI Tutor service layer
// ABOUTME: Text chat and voice mode grounded in learning module content

export { getTutorSettings, getDefaultTutorSettings, clearTutorSettingsCache, DEFAULT_GREETING_TEMPLATES, DEFAULT_QUIZ_GREETING_TEMPLATES, DEFAULT_QUICK_PROMPTS } from './tutorSettings';
export type { TutorSettings, TutorQuickPrompt, VisualizerStyle } from './tutorSettings';
export type { LightPillarSettings, ClassicWaveSettings, Codrops3DOrbSettings, HyperspeedSettings } from '@/services/scout/scoutSettings';

export {
  createTutorConversation,
  deleteTutorConversation,
  sendTutorMessage,
  generateTutorGreeting,
  summarizeTutorSession,
} from './tutorGeminiService';
export type { TutorContext, TutorMessage, MessageMetadata } from './tutorGeminiService';

export { connectTutorVoiceSession, setTutorVoiceApiKey, forceCleanup } from './tutorVoiceService';
export type { VoiceSessionControl, VoiceSessionCallbacks, TranscriptItem } from './tutorVoiceService';

export { saveVoiceSession, fetchVoiceSessions, fetchVoiceSession } from './voiceSessionService';
export type { VoiceSessionRecord, VoiceTranscriptTurn, SaveVoiceSessionParams } from './voiceSessionService';

export { fetchTextSessions } from './textSessionService';
export type { TextSessionRecord, TextMessage } from './textSessionService';

export { fetchAssessments } from './assessmentService';
export type { AssessmentRecord, ModuleAssessmentSummary } from './assessmentService';

export {
  fetchLearnerRoster,
  fetchLearnerDetail,
  fetchTopicInsights,
  fetchInsightLearners,
  fetchModuleEffectiveness,
  fetchSessionVolumeTrend,
  fetchComprehensionTrend,
  fetchProgramEngagement,
  fetchTutorImpact,
  fetchSessionQualityTrend,
} from './analyticsService';
export type {
  LearnerRosterEntry,
  LearnerDetail,
  LearnerMemoryEntry,
  SessionSummaryEntry,
  LearnerAssessmentEntry,
  InsightAggregate,
  InsightLearnerRow,
  ModuleEffectivenessRow,
  SessionVolumeTrend,
  ComprehensionTrend,
  ProgramEngagementRow,
  TutorImpactRow,
  SessionQualityTrend,
} from './analyticsService';
