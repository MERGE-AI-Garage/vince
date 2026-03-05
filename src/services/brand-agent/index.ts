// ABOUTME: Barrel exports for brand agent service layer
// ABOUTME: Re-exports settings, Gemini service, and types

export {
  getBrandAgentSettings,
  clearBrandAgentSettingsCache,
  getDefaultBrandAgentSettings,
  DEFAULT_QUICK_PROMPTS,
  DEFAULT_GREETING_TEMPLATES,
  DEFAULT_VOICE_PROMPT,
  DEFAULT_CHAT_PROMPT,
  type BrandAgentSettings,
} from './brandAgentSettings';

export {
  sendMessageToBrandAgent,
  generateBrandAgentGreeting,
  fetchBrandContext,
  deriveBrandContextPrompts,
  createBrandAgentConversation,
  deleteBrandAgentConversation,
  type UserContext,
  type BrandContext,
} from './brandAgentGeminiService';
