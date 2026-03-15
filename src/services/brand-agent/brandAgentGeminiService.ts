// ABOUTME: Brand Agent chat service with brand library context integration
// ABOUTME: Loads brand visual DNA, prompt library, and directives into Gemini system instruction

import { supabase } from '@/integrations/supabase/client';
import type { Attachment } from '@/components/shared-chat/types';
import {
  getBrandAgentSettings,
  DEFAULT_QUICK_PROMPTS,
  DEFAULT_GREETING_TEMPLATES,
  DEFAULT_CHAT_PROMPT,
} from './brandAgentSettings';

export interface UserContext {
  id?: string;
  email: string;
  name: string;
  title?: string;
  department?: string;
}

export interface BrandContext {
  brand: {
    id: string;
    name: string;
    description: string | null;
    brand_voice: string | null;
    visual_identity: string | null;
    quick_prompts: Array<{ name: string; prompt: string; icon?: string; category?: string }>;
  } | null;
  profile: {
    visual_dna: Record<string, unknown> | null;
    photography_style: Record<string, unknown> | null;
    color_profile: Record<string, unknown> | null;
    composition_rules: Record<string, unknown> | null;
    product_catalog: Record<string, unknown> | null;
    brand_identity: Record<string, unknown> | null;
    tone_of_voice: Record<string, unknown> | null;
    typography: Record<string, unknown> | null;
    brand_standards: Record<string, unknown> | null;
    brand_story: Record<string, unknown> | null;
    total_images_analyzed: number;
    confidence_score: number | null;
    source_metadata: Record<string, unknown> | null;
  } | null;
  directives: Array<{
    name: string;
    persona: string;
    rules: unknown;
    forbidden_combinations: unknown;
    required_elements: unknown;
    tone_guidelines: string | null;
  }>;
  promptTemplates: Array<{
    name: string;
    category: string | null;
    prompt_template: string;
    locked_parameters: Record<string, unknown>;
    camera_preset: Record<string, unknown> | null;
  }>;
  totalPrompts: number;
  sourcesAnalyzed: number;
}

/**
 * Fetch all brand context for system instruction injection
 */
export async function fetchBrandContext(brandId: string): Promise<BrandContext> {
  try {
    const [
      { data: brand },
      { data: profile },
      { data: directives },
      { data: prompts, count: totalPrompts },
    ] = await Promise.all([
      supabase
        .from('creative_studio_brands')
        .select('id, name, description, brand_voice, visual_identity, quick_prompts')
        .eq('id', brandId)
        .single(),
      supabase
        .from('creative_studio_brand_profiles')
        .select('visual_dna, photography_style, color_profile, composition_rules, product_catalog, brand_identity, tone_of_voice, typography, brand_standards, brand_story, total_images_analyzed, confidence_score, source_metadata')
        .eq('brand_id', brandId)
        .single(),
      supabase
        .from('creative_studio_agent_directives')
        .select('name, persona, rules, forbidden_combinations, required_elements, tone_guidelines')
        .eq('brand_id', brandId)
        .eq('is_active', true),
      supabase
        .from('creative_studio_brand_prompts')
        .select('name, category, prompt_template, locked_parameters, camera_preset', { count: 'exact' })
        .eq('brand_id', brandId)
        .order('usage_count', { ascending: false })
        .limit(20),
    ]);

    return {
      brand: brand
        ? { ...brand, quick_prompts: Array.isArray(brand.quick_prompts) ? brand.quick_prompts : [] }
        : null,
      profile: profile || null,
      directives: directives || [],
      promptTemplates: prompts || [],
      totalPrompts: totalPrompts || 0,
      sourcesAnalyzed: profile?.total_images_analyzed || 0,
    };
  } catch (error) {
    console.error('[Brand Agent] Failed to fetch brand context:', error);
    return {
      brand: null,
      profile: null,
      directives: [],
      promptTemplates: [],
      totalPrompts: 0,
      sourcesAnalyzed: 0,
    };
  }
}

/**
 * Build the system instruction from brand context + admin settings
 */
function buildSystemInstruction(brandCtx: BrandContext, adminPrompt: string | null): string {
  const basePrompt = adminPrompt || DEFAULT_CHAT_PROMPT;

  const sections: string[] = [basePrompt];

  if (brandCtx.brand) {
    sections.push(`\n\n--- ACTIVE BRAND: ${brandCtx.brand.name} ---`);
    if (brandCtx.brand.description) sections.push(`Description: ${brandCtx.brand.description}`);
    if (brandCtx.brand.brand_voice) sections.push(`Brand Voice: ${brandCtx.brand.brand_voice}`);
    if (brandCtx.brand.visual_identity) sections.push(`Visual Identity: ${brandCtx.brand.visual_identity}`);
  }

  if (brandCtx.profile) {
    // Build source summary from metadata
    const meta = brandCtx.profile.source_metadata as Record<string, unknown> | null;
    const sourceDesc = meta
      ? [
          meta.image_analyses && `${meta.image_analyses} images`,
          meta.website_analyses && `${meta.website_analyses} websites`,
          meta.document_analyses && `${meta.document_analyses} documents`,
        ].filter(Boolean).join(', ') || `${brandCtx.sourcesAnalyzed} sources`
      : `${brandCtx.sourcesAnalyzed} sources`;

    if (brandCtx.profile.visual_dna) {
      sections.push(`\n--- VISUAL DNA (${sourceDesc} analyzed, confidence: ${((brandCtx.profile.confidence_score || 0) * 100).toFixed(0)}%) ---`);
      sections.push(JSON.stringify(brandCtx.profile.visual_dna, null, 1));
    }
    if (brandCtx.profile.photography_style) {
      sections.push('\n--- PHOTOGRAPHY STYLE ---');
      sections.push(JSON.stringify(brandCtx.profile.photography_style, null, 1));
    }
    if (brandCtx.profile.color_profile) {
      sections.push('\n--- COLOR PROFILE ---');
      sections.push(JSON.stringify(brandCtx.profile.color_profile, null, 1));
    }
    if (brandCtx.profile.composition_rules) {
      sections.push('\n--- COMPOSITION RULES ---');
      sections.push(JSON.stringify(brandCtx.profile.composition_rules, null, 1));
    }
    if (brandCtx.profile.product_catalog) {
      sections.push('\n--- PRODUCT CATALOG ---');
      sections.push(JSON.stringify(brandCtx.profile.product_catalog, null, 1));
    }
    if (brandCtx.profile.brand_identity) {
      sections.push('\n--- BRAND IDENTITY ---');
      sections.push(JSON.stringify(brandCtx.profile.brand_identity, null, 1));
    }
    if (brandCtx.profile.tone_of_voice) {
      sections.push('\n--- TONE OF VOICE ---');
      sections.push(JSON.stringify(brandCtx.profile.tone_of_voice, null, 1));
    }
    if (brandCtx.profile.typography) {
      sections.push('\n--- TYPOGRAPHY ---');
      sections.push(JSON.stringify(brandCtx.profile.typography, null, 1));
    }
    if (brandCtx.profile.brand_story) {
      sections.push('\n--- BRAND STORY ---');
      sections.push(JSON.stringify(brandCtx.profile.brand_story, null, 1));
    }
    if (brandCtx.profile.brand_standards) {
      // Include key prescriptive sections for the agent — writer guidelines, glossary,
      // vertical positioning, and social media voice are most actionable
      const standards = brandCtx.profile.brand_standards as Record<string, unknown>;
      const agentRelevant: Record<string, unknown> = {};
      for (const key of ['writer_guidelines', 'glossary', 'social_media_voice', 'vertical_positioning', 'positioning_framework', 'personality_mood_descriptors', 'service_capabilities', 'competitive_landscape', 'healthcare_messaging', 'boilerplate_short']) {
        if (standards[key]) agentRelevant[key] = standards[key];
      }
      if (Object.keys(agentRelevant).length > 0) {
        sections.push('\n--- BRAND STANDARDS (Prescriptive) ---');
        sections.push(JSON.stringify(agentRelevant, null, 1));
      }
    }
  }

  if (brandCtx.directives.length > 0) {
    sections.push('\n--- BRAND DIRECTIVES ---');
    for (const directive of brandCtx.directives) {
      sections.push(`\n[${directive.name}]`);
      sections.push(`Persona: ${directive.persona}`);
      if (directive.rules) sections.push(`Rules: ${JSON.stringify(directive.rules)}`);
      if (directive.forbidden_combinations) sections.push(`Forbidden: ${JSON.stringify(directive.forbidden_combinations)}`);
      if (directive.required_elements) sections.push(`Required: ${JSON.stringify(directive.required_elements)}`);
      if (directive.tone_guidelines) sections.push(`Tone: ${directive.tone_guidelines}`);
    }
  }

  if (brandCtx.promptTemplates.length > 0) {
    sections.push(`\n--- PROMPT LIBRARY (${brandCtx.totalPrompts} templates, showing top ${brandCtx.promptTemplates.length}) ---`);
    for (const pt of brandCtx.promptTemplates) {
      sections.push(`\n[${pt.name}] (${pt.category || 'general'})`);
      sections.push(`Template: ${pt.prompt_template}`);
      if (pt.locked_parameters && Object.keys(pt.locked_parameters).length > 0) {
        sections.push(`Locked: ${JSON.stringify(pt.locked_parameters)}`);
      }
    }
  }

  return sections.join('\n');
}

/**
 * Replace template variables with brand context data
 */
function replaceTemplateVars(template: string, name: string, brandCtx: BrandContext): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return template
    .replace(/{name}/g, name)
    .replace(/{brandName}/g, brandCtx.brand?.name || 'Brand')
    .replace(/{totalPrompts}/g, String(brandCtx.totalPrompts))
    .replace(/{imagesAnalyzed}/g, String(brandCtx.sourcesAnalyzed))
    .replace(/{sourcesAnalyzed}/g, String(brandCtx.sourcesAnalyzed))
    .replace(/{timeOfDay}/g, timeOfDay);
}

/**
 * Generate Brand Agent greeting with brand context
 */
export async function generateBrandAgentGreeting(
  userContext?: UserContext,
  brandCtx?: BrandContext
): Promise<string> {
  const settings = await getBrandAgentSettings();
  const name = userContext?.name?.split(' ')[0] || 'there';

  const templates = (settings.greeting_templates && settings.greeting_templates.length > 0)
    ? settings.greeting_templates
    : DEFAULT_GREETING_TEMPLATES;
  const template = templates[Math.floor(Math.random() * templates.length)];

  const emptyCtx: BrandContext = { brand: null, profile: null, directives: [], promptTemplates: [], totalPrompts: 0, sourcesAnalyzed: 0 };
  const greeting = replaceTemplateVars(template, name, brandCtx || emptyCtx);

  if (settings.enable_context_greetings && brandCtx) {
    const callout = buildBrandContextCallout(brandCtx);
    if (callout) return `${greeting}\n\n${callout}`;
  }

  return greeting;
}

/**
 * Build context-aware callout about brand state
 */
function buildBrandContextCallout(ctx: BrandContext): string | null {
  if (!ctx.brand) return 'No brand selected. Pick a brand to get started.';
  if (!ctx.profile) return `**${ctx.brand.name}** profile hasn't been trained yet. Upload reference images to build the visual DNA.`;
  const sourceCount = ctx.sourcesAnalyzed || 0;
  if (sourceCount > 0) {
    return `Brand playbook loaded — ${sourceCount} source${sourceCount !== 1 ? 's' : ''} analyzed. Say "walk me through this brand" and I'll brief you on the visual DNA, photography standards, tone, and compliance rules before we shoot.`;
  }
  return null;
}

/**
 * Derive context-aware quick prompts from brand data
 */
export function deriveBrandContextPrompts(ctx: BrandContext): string[] {
  const prompts: string[] = [];
  if (!ctx.profile) prompts.push('Help me set up brand analysis');
  if (ctx.totalPrompts === 0) prompts.push('Create a prompt template for product shots');
  if (ctx.directives.length === 0) prompts.push('What brand directives should I set up?');
  // Add product-specific prompts from catalog
  if (ctx.profile?.product_catalog && typeof ctx.profile.product_catalog === 'object') {
    const catalog = ctx.profile.product_catalog as Record<string, unknown>;
    const products = Object.keys(catalog).slice(0, 3);
    for (const product of products) {
      prompts.push(`Hero shot of ${product}`);
    }
  }
  return prompts;
}

/**
 * Send a message to the Brand Agent via the edge function
 */
export interface ToolAction {
  toolName: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  error?: string;
  success: boolean;
}

export interface GeneratedImage {
  url: string;
  generation_id?: string;
}

export async function sendMessageToBrandAgent(
  message: string,
  conversationId: string | null,
  userId: string | null,
  brandId: string | null,
  onChunk?: (chunk: string) => void,
  userContext?: UserContext,
  attachments?: Attachment[]
): Promise<{
  role: string;
  content: string;
  prompt?: string;
  camera_preset?: Record<string, unknown>;
  recommended_model?: string;
  tool_actions?: ToolAction[];
  generated_images?: GeneratedImage[];
  generation_requested?: boolean;
}> {
  const settings = await getBrandAgentSettings();
  const activeBrandId = brandId || settings.default_brand_id;

  // Upload image attachments to storage so their URLs can be passed to generation tools.
  // Track which attachment indices were successfully uploaded — those skip inline data below.
  const uploadedIndices = new Set<number>();
  const referenceImageUrls: string[] = [];
  if (attachments && attachments.length > 0 && userId) {
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (att.mimeType.startsWith('image/')) {
        try {
          const ext = att.mimeType === 'image/png' ? 'png'
            : att.mimeType === 'image/gif' ? 'gif'
            : att.mimeType === 'image/webp' ? 'webp'
            : 'jpg';
          const path = `reference-images/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const buffer = Uint8Array.from(atob(att.data), c => c.charCodeAt(0));
          const { error: uploadError } = await supabase.storage
            .from('creative-studio')
            .upload(path, buffer, { contentType: att.mimeType, upsert: false });
          if (!uploadError) {
            const { data: pub } = supabase.storage.from('creative-studio').getPublicUrl(path);
            referenceImageUrls.push(pub.publicUrl);
            uploadedIndices.add(i);
          }
        } catch { /* non-critical — image falls back to inline data */ }
      }
    }
  }

  // Build multimodal parts[] if attachments are present.
  // Images uploaded to storage are sent as URLs only — their base64 data can be several MB,
  // which can exceed the edge function request body limit.
  const messageParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (attachments && attachments.length > 0) {
    messageParts.push({ text: message });
    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      if (!uploadedIndices.has(i)) {
        messageParts.push({ inlineData: { mimeType: att.mimeType, data: att.data } });
      }
    }
    if (referenceImageUrls.length > 0) {
      messageParts.push({ text: `[Reference images uploaded by user: ${referenceImageUrls.join(', ')}]` });
    }
  }
  const parts = messageParts.length > 0 ? messageParts : undefined;

  const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
    body: {
      brand_id: activeBrandId,
      user_message: message,
      parts,
      model_override: settings.text_model,
      conversation_id: conversationId,
      user_context: userContext ? {
        name: userContext.name,
        email: userContext.email,
      } : undefined,
    },
  });

  if (error) {
    console.error('[Brand Agent] Message error:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  if (!data || !data.success) {
    throw new Error(data?.error || 'Failed to get response from Brand Agent');
  }

  // The edge function now returns conversational text in `message` field
  const content = data.message || data.reasoning || data.prompt || 'Here is what I recommend:';
  if (onChunk && content) {
    const words = content.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  return {
    role: 'model',
    content,
    prompt: data.prompt,
    camera_preset: data.camera_preset,
    recommended_model: data.recommended_model,
    tool_actions: data.tool_actions,
    generated_images: data.generated_images,
    generation_requested: data.generation_requested,
  };
}

/**
 * Create a Brand Agent conversation record
 */
export async function createBrandAgentConversation(
  userId: string,
  source: 'web' | 'extension' | 'ios' = 'web',
): Promise<string> {
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .insert({
      user_id: userId,
      messages: [],
      tool_calls_count: 0,
      metadata: { assistant: 'vince', source },
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Persist voice session transcript to chatbot_conversations.
 * Called when a voice session ends — non-throwing.
 */
export async function saveVoiceConversation(
  conversationId: string,
  messages: Array<{ role: 'user' | 'model'; content: string; timestamp: Date }>,
  metadata: {
    brand_id?: string | null;
    brand_name?: string;
    tool_calls_count?: number;
    source?: 'web' | 'extension' | 'ios';
  },
): Promise<void> {
  try {
    const dbMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));

    const { error } = await supabase
      .from('chatbot_conversations')
      .update({
        messages: dbMessages,
        tool_calls_count: metadata.tool_calls_count ?? 0,
        updated_at: new Date().toISOString(),
        metadata: {
          assistant: 'vince',
          mode: 'voice',
          brand_id: metadata.brand_id,
          brand_name: metadata.brand_name,
          ...(metadata.source ? { source: metadata.source } : {}),
        },
      })
      .eq('id', conversationId);

    if (error) {
      console.error('[Brand Agent] Failed to save voice conversation:', error.message);
    }
  } catch (err) {
    console.error('[Brand Agent] Error saving voice conversation:', err);
  }
}

/**
 * Delete a Brand Agent conversation record
 */
export async function deleteBrandAgentConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('chatbot_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('[Brand Agent] Error deleting conversation:', error);
  }
}
