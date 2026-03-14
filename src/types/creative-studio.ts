// ABOUTME: TypeScript interfaces for Creative Studio (Brand Shop) - AI image and video generation
// ABOUTME: Defines types for models, generations, quotas, brands, camera controls, agent directives, and brand intelligence

// ============================================================================
// Generation Types & Operations
// ============================================================================

export type GenerationType =
  | 'text_to_image'
  | 'image_to_image'
  | 'image_edit'
  | 'inpainting'
  | 'outpainting'
  | 'upscaling'
  | 'product_recontext'
  | 'virtual_try_on'
  | 'multi_turn_edit'
  | 'object_remove'
  | 'object_insert'
  | 'background_swap'
  | 'text_to_video'
  | 'image_to_video'
  | 'keyframe_video'
  | 'ingredients_to_video'
  | 'json_prompt_video'
  | 'scene_extension'
  | 'creative_package'
  | 'brand_card';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ModelType = 'image' | 'video';

export type ModelCapability =
  | 'text_to_image'
  | 'inpainting'
  | 'outpainting'
  | 'upscaling'
  | 'masking'
  | 'editing'
  | 'multi_turn_edit'
  | 'multi_image_fusion'
  | 'typographic_rendering'
  | 'grounding'
  | 'product_recontext'
  | 'virtual_try_on'
  | 'text_to_video'
  | 'image_to_video'
  | 'keyframe_video'
  | 'scene_extension'
  | 'video_inpainting'
  | 'json_prompt'
  | 'audio_generation'
  | 'reference_images';

// ============================================================================
// Model Types
// ============================================================================

export interface ModelPricingTier {
  label: string;
  per_second: number;
}

export interface ModelParameters {
  aspect_ratios?: string[];
  resolutions?: string[];
  durations?: number[];
  max_resolution?: string;
  max_sample_count?: number;
  max_reference_images?: number;
  supports_negative_prompt?: boolean;
  supports_audio?: boolean;
  supports_seed?: boolean;
  supports_thinking?: boolean;
  supports_grounding?: boolean;
  supports_system_instruction?: boolean;
  supports_4k?: boolean;
  image_sizes?: string[];
  output_mime_types?: string[];
  rate_limit_per_minute?: number;
  thinking_levels?: string[];
  media_resolutions?: string[];
  // Pricing fields
  cost_unit?: 'per_image' | 'per_second' | 'per_generation';
  cost_basis?: 'flat_rate' | 'duration_based' | 'token_based';
  cost_per_second?: number;
  cost_per_image?: number;
  default_duration?: number;
  pricing_tiers?: ModelPricingTier[];
}

export interface CreativeStudioModel {
  id: string;
  name: string;
  model_id: string;
  model_type: ModelType;
  provider: string;
  description?: string;
  capabilities: ModelCapability[];
  parameters: ModelParameters;
  cost_per_generation: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Brand Types
// ============================================================================

export interface QuickPrompt {
  name: string;
  prompt: string;
  icon?: string;
  category?: string;
}

export type BrandCategory =
  | 'food'
  | 'outdoor-apparel'
  | 'healthcare'
  | 'automotive'
  | 'beauty'
  | 'retail'
  | 'financial'
  | 'technology';

export const BRAND_CATEGORIES: { value: BrandCategory; label: string }[] = [
  { value: 'food', label: 'Food & Restaurant' },
  { value: 'outdoor-apparel', label: 'Outdoor & Apparel' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'retail', label: 'Retail' },
  { value: 'financial', label: 'Financial Services' },
  { value: 'technology', label: 'Technology' },
];

export type BrandCardImageKey =
  | 'brand_dna'
  | 'ai_guidelines'
  | 'generation_prompt'
  | 'templates'
  | 'brand_agent';

export const BRAND_CARD_IMAGE_LABELS: Record<BrandCardImageKey, { label: string; description: string }> = {
  brand_dna: { label: 'Brand DNA', description: 'Visual intelligence & creative direction' },
  ai_guidelines: { label: 'AI Guidelines', description: 'Tool compliance & governance' },
  generation_prompt: { label: 'Generation Prompt', description: 'Brand voice & prompt injection' },
  templates: { label: 'Templates', description: 'Saved generation configurations' },
  brand_agent: { label: 'Brand Agent', description: 'AI brand assistant' },
};

export interface CreativeStudioBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  logo_mark_url?: string;
  primary_color: string;
  secondary_color: string;
  color_palette?: string[];
  visual_identity?: string;
  quick_prompts: QuickPrompt[];
  brand_voice?: string;
  website_url?: string;
  brand_category?: BrandCategory;
  hero_image_url?: string;
  header_image_url?: string;
  image_analysis_prompt_id?: string;
  synthesis_prompt_id?: string;
  show_animated_border: boolean;
  animated_border_speed: number;
  animated_border_colors?: string[];
  showcase_button_colors?: string[];
  card_images?: Partial<Record<BrandCardImageKey, string>>;
  card_image_prompts?: Partial<Record<BrandCardImageKey, string>>;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type CreateBrandInput = Omit<
  CreativeStudioBrand,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;

export type UpdateBrandInput = Partial<CreateBrandInput>;

export type LogoVariant = 'full_color' | 'reversed' | 'mono_dark' | 'mono_light';
export type LogoLockup = 'horizontal' | 'vertical' | 'stacked' | 'mark_only' | 'wordmark';
export type LogoBackground = 'light' | 'dark' | 'transparent' | 'any';

export interface BrandLogo {
  id: string;
  brand_id: string;
  url: string;
  storage_path?: string;
  filename?: string;
  variant: LogoVariant;
  lockup: LogoLockup;
  background: LogoBackground;
  is_default: boolean;
  notes?: string;
  sort_order: number;
  created_at: string;
  created_by?: string;
}

// ============================================================================
// Brand Reference Collections
// ============================================================================

export type ReferenceType = 'product' | 'character' | 'style' | 'environment';

export interface BrandReference {
  id: string;
  brand_id: string;
  url: string;
  storage_path?: string;
  filename?: string;
  collection: string;
  reference_type: ReferenceType;
  reference_intent: ReferenceIntent;
  label?: string;
  description?: string;
  media_resolution: 'low' | 'medium' | 'high';
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  created_by?: string;
}

export interface BrandReferenceCollection {
  name: string;
  reference_type: ReferenceType;
  reference_intent: ReferenceIntent;
  images: BrandReference[];
  primaryImage?: BrandReference;
}

// ============================================================================
// Brand Intelligence Types (Phase 2)
// ============================================================================

export type ImageCategory = 'logo' | 'photo';

export interface BrandColor {
  name?: string;
  hex: string;
  rgb?: string;
  cmyk?: string;
  pms?: string;
  role?: string;
  source?: string;
}

export interface BrandImageAnalysis {
  id: string;
  brand_id: string;
  source_image_url: string;
  analysis_data: {
    // New art-director schema fields
    shot_classification?: {
      shot_type?: string;
      scene_context?: string;
      narrative?: string;
    };
    art_direction?: {
      hero_subject?: string;
      styling_approach?: string;
      props_and_supporting?: string[];
      surface_and_environment?: string;
      spatial_arrangement?: string;
    };
    people_direction?: {
      present?: boolean;
      demographics?: string;
      expression_and_energy?: string;
      interaction_with_brand?: string;
      wardrobe_and_styling?: string;
      pose_type?: string;
    };
    camera_and_technical?: {
      estimated_aperture?: string;
      focal_length?: string;
      depth_of_field?: string;
      angle?: string;
      aspect_ratio_feel?: string;
      sharpness?: string;
    };
    lighting?: {
      type?: string;
      direction?: string;
      quality?: string;
      color_temperature?: string;
      contrast_ratio?: string;
      // Legacy fields
      key_fill_ratio?: string;
      lighting_type?: string;
    };
    color_and_post_production?: {
      dominant_colors?: string[];
      accent_colors?: string[];
      overall_palette_feel?: string;
      saturation_level?: string;
      color_grading_style?: string;
      contrast_treatment?: string;
      retouching_level?: string;
    };
    composition?: {
      primary_rule?: string;
      framing?: string;
      negative_space?: string;
      leading_lines?: boolean;
      visual_weight_distribution?: string;
      // Legacy fields
      rule_of_thirds?: boolean;
      symmetry?: string;
    };
    brand_elements?: {
      logos_visible?: string[];
      text_overlays?: string[];
      packaging?: string[];
      branded_items?: string[];
      brand_integration_style?: string;
      // Legacy fields
      logos?: string[];
      text?: string[];
    };
    mood_and_positioning?: {
      overall_mood?: string;
      energy_level?: string;
      aspiration_level?: string;
      target_audience_signals?: string;
    };
    // Category-specific sections (present based on brand category)
    food_styling?: {
      presentation_type?: string;
      ingredient_visibility?: string[];
      freshness_indicators?: string[];
      portion_presentation?: string;
      hero_ingredient?: string;
      garnish_and_finishing?: string;
      plating_geometry?: string;
    };
    dining_context?: {
      setting?: string;
      table_surface?: string;
      accompanying_items?: string[];
      meal_occasion?: string;
    };
    product_styling?: {
      garment_presentation?: string;
      fit_and_silhouette?: string;
      layering_visibility?: string;
      fabric_and_texture?: string;
      key_feature_visibility?: string;
      color_blocking?: string;
    };
    environment_and_activity?: {
      terrain?: string;
      weather_conditions?: string;
      activity?: string;
      scale_and_grandeur?: string;
      season?: string;
    };
    clinical_context?: {
      setting?: string;
      clinical_elements_visible?: string[];
      cleanliness_and_order?: string;
      technology_integration?: string;
      accessibility_signals?: string;
    };
    patient_provider_dynamic?: {
      interaction_type?: string;
      trust_signals?: string;
      diversity_and_representation?: string;
      emotional_tone?: string;
      power_balance?: string;
    };
    // Legacy fields (from old schema — still present in historical analyses)
    camera_settings?: {
      estimated_aperture?: string;
      focal_length?: string;
      depth_of_field?: string;
      shutter_speed_feel?: string;
    };
    color_palette?: {
      dominant_colors?: string[];
      accent_colors?: string[];
      overall_tone?: string;
      saturation_level?: string;
    };
    subject?: {
      category?: string;
      position?: string;
      styling_details?: string;
      textures?: string[];
      materials?: string[];
    };
    mood?: {
      overall_mood?: string;
      energy_level?: string;
      formality?: string;
    };
    technical_quality?: {
      resolution_feel?: string;
      sharpness?: string;
      noise_level?: string;
    };
  };
  tags: string[];
  analyzed_at: string;
  analyzed_by?: string;
  source_type?: 'image' | 'website' | 'document';
  image_category?: ImageCategory;
}

export interface BrandVisualProfile {
  id: string;
  brand_id: string;
  visual_dna: Record<string, unknown>;
  photography_style?: {
    preferred_aperture?: string;
    preferred_focal_length?: string;
    preferred_lighting?: string;
    preferred_color_temperature?: string;
    depth_of_field_preference?: string;
    film_stock_feel?: string;
  };
  color_profile?: {
    mandatory_colors?: string[];
    brand_colors?: BrandColor[];
    forbidden_colors?: string[];
    palette_relationships?: string;
    overall_tone?: string;
  };
  composition_rules?: {
    preferred_layouts?: string[];
    framing_conventions?: string[];
    aspect_ratio_preference?: string;
  };
  product_catalog?: Record<string, {
    name: string;
    styling_rules: string[];
    required_elements: string[];
    forbidden_elements: string[];
  }>;
  brand_identity?: {
    tagline?: string;
    brand_values?: string[];
    brand_aesthetic?: string;
    positioning?: string;
    target_audience?: string;
    visual_language?: string;
    manifesto?: string;
    messaging?: string[];
    logo_description?: string;
  };
  tone_of_voice?: {
    formality?: string;
    personality?: string;
    energy?: string;
    dos?: string[];
    donts?: string[];
  };
  typography?: {
    heading_font?: string;
    body_font?: string;
    style_description?: string;
  };
  art_direction_rules?: {
    preferred_shot_types?: string[];
    styling_conventions?: string[];
    prop_guidelines?: string[];
    surface_preferences?: string[];
    people_direction?: {
      casting_guidelines?: string;
      interaction_style?: string;
      wardrobe_guidelines?: string;
    };
  };
  post_production_style?: {
    color_grading?: string;
    contrast_approach?: string;
    retouching_philosophy?: string;
    overall_treatment?: string;
  };
  brand_story?: {
    narrative_summary?: string;
    mission_vision?: {
      mission?: string;
      vision?: string;
      purpose?: string;
    };
    heritage?: {
      founding_story?: string;
      milestones?: string[];
      legacy?: string;
    };
    sustainability?: {
      environmental?: string;
      social?: string;
      governance?: string;
      goals?: string[];
    };
    innovation?: {
      approach?: string;
      differentiators?: string[];
      technology?: string;
    };
    culture?: {
      values_in_practice?: string;
      employee_experience?: string;
      dei?: string;
    };
    community?: {
      partnerships?: string[];
      programs?: string;
      impact_metrics?: string;
    };
    customer_focus?: {
      promise?: string;
      experience?: string;
      testimonial_themes?: string[];
    };
    competitive_position?: {
      market_position?: string;
      key_differentiators?: string[];
      awards?: string[];
    };
  };
  brand_standards?: Record<string, unknown>;
  source_metadata?: Record<string, unknown>;
  total_images_analyzed: number;
  last_analysis_run?: string;
  confidence_score: number;
  updated_at: string;
}

export type TemplateContentType = 'image' | 'video';

// Director Mode preset fields for video templates (partial — only populated fields apply)
export interface DirectorPreset {
  scene_description?: string;
  camera_movement?: string;
  lighting?: string;
  lens?: string;
  subject_attributes?: string;
  dialogue?: string;
}

// Video-specific parameters stored in locked_parameters for video templates
export interface VideoTemplateParams {
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  generate_audio?: boolean;
  director_mode?: boolean;
  director_preset?: DirectorPreset;
}

export type ReferenceIntent = 'subject' | 'style' | 'structure';

export interface TemplateReferenceImage {
  url: string;
  storage_path: string;
  reference_intent: ReferenceIntent;
  media_resolution: 'low' | 'medium' | 'high';
  filename?: string;
}

export interface BrandPromptTemplate {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  category?: string;
  content_type: TemplateContentType;
  prompt_template: string;
  locked_parameters: Record<string, unknown>;
  variable_fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'number';
    default_value?: string;
    options?: string[];
    required?: boolean;
  }>;
  camera_preset?: CameraPreset;
  reference_images?: TemplateReferenceImage[];
  reference_collections?: string[];
  agent_directive_id?: string;
  recommended_model?: string;
  created_by?: string;
  is_auto_generated: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export type DirectiveFocusArea =
  | 'visual_identity'
  | 'photography_and_composition'
  | 'tone_and_messaging'
  | 'typography_and_text'
  | 'product_representation'
  | 'compliance';

export const DIRECTIVE_FOCUS_AREAS: Array<{
  value: DirectiveFocusArea;
  label: string;
  description: string;
}> = [
  { value: 'visual_identity', label: 'Visual Identity', description: 'Colors, logos, marks, and brand symbols' },
  { value: 'photography_and_composition', label: 'Photography & Composition', description: 'Shot types, lighting, camera, framing' },
  { value: 'tone_and_messaging', label: 'Tone & Messaging', description: 'Voice, copy direction, content dos/don\'ts' },
  { value: 'typography_and_text', label: 'Typography & Text', description: 'Font usage, text overlays, typographic rules' },
  { value: 'product_representation', label: 'Product Representation', description: 'Product shots, required elements, faithful reproduction' },
  { value: 'compliance', label: 'Compliance', description: 'Regulatory, legal, and industry restrictions' },
];

export interface AgentDirective {
  id: string;
  brand_id: string;
  name: string;
  persona: string;
  focus_area?: DirectiveFocusArea;
  rules: Array<{
    rule: string;
    severity: 'error' | 'warning' | 'info';
    category?: string;
  }>;
  forbidden_combinations?: Array<{
    items: string[];
    reason: string;
  }>;
  required_elements?: Array<{
    element: string;
    when?: string;
  }>;
  tone_guidelines?: string;
  is_active: boolean;
  created_at: string;
}

export interface BrandGenerationPromptSectionToggles {
  brand_identity: boolean;
  tone_of_voice: boolean;
  visual_style: boolean;
  color_palette: boolean;
  typography: boolean;
  photography_direction: boolean;
  composition_rules: boolean;
  brand_guardrails: boolean;
  brand_story: boolean;
}

export interface BrandGenerationPrompt {
  id: string;
  brand_id: string;
  version: number;
  is_active: boolean;
  prompt_text: string;
  section_toggles: BrandGenerationPromptSectionToggles;
  synthesis_metadata?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const GENERATION_PROMPT_SECTIONS: Array<{
  key: keyof BrandGenerationPromptSectionToggles;
  label: string;
  heading: string;
}> = [
  { key: 'brand_identity', label: 'Brand Identity', heading: '## Brand Identity' },
  { key: 'tone_of_voice', label: 'Tone of Voice', heading: '## Tone of Voice' },
  { key: 'visual_style', label: 'Visual Style', heading: '## Visual Style' },
  { key: 'color_palette', label: 'Color Palette', heading: '## Color Palette' },
  { key: 'typography', label: 'Typography', heading: '## Typography' },
  { key: 'photography_direction', label: 'Photography Direction', heading: '## Photography Direction' },
  { key: 'composition_rules', label: 'Composition Rules', heading: '## Composition Rules' },
  { key: 'brand_guardrails', label: 'Brand Guardrails', heading: '## Brand Guardrails' },
  { key: 'brand_story', label: 'Brand Story', heading: '## Brand Story' },
];

export interface ComplianceCheckResult {
  compliant: boolean;
  violations: Array<{
    rule: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
  }>;
  suggestions: string[];
}

// ============================================================================
// Camera Controls Types (Phase 2)
// ============================================================================

export interface CameraPreset {
  aperture?: number;
  focal_length?: number;
  shutter_speed?: string;
  film_stock?: string;
  camera_body?: string;
  lighting_setup?: string;
  color_temperature?: number;
  color_temperature_preset?: string;
  composition?: string;
  depth_of_field?: string;
  print_process?: string;
  color_grade?: string;
  film_effect?: string;
  shot_type?: string;
}

export type FilmStock =
  | 'kodak_portra_400'
  | 'kodak_portra_800'
  | 'kodak_ektar_100'
  | 'fuji_velvia_50'
  | 'fuji_provia_100'
  | 'fuji_superia_400'
  | 'ilford_hp5'
  | 'ilford_delta_3200'
  | 'cinestill_800t'
  | 'digital_clean'
  | 'digital_vivid';

export type LightingSetup =
  | 'soft_diffused_window'
  | 'hard_directional_flash'
  | 'golden_hour_backlight'
  | 'studio_three_point'
  | 'neon_glow'
  | 'dramatic_chiaroscuro'
  | 'flat_overcast'
  | 'ring_light'
  | 'natural_shade';

export type CompositionRule =
  | 'rule_of_thirds'
  | 'centered'
  | 'diagonal'
  | 'golden_ratio'
  | 'symmetry'
  | 'leading_lines'
  | 'frame_within_frame';

// ============================================================================
// Conversational Edit Types (Thought Signatures)
// ============================================================================

export interface ConversationTurn {
  role: 'user' | 'model';
  text?: string;
  image_url?: string;
  image_base64?: string;
  thought_signature?: string;
  timestamp: string;
}

// ============================================================================
// Generation Parameters
// ============================================================================

export interface GenerationParameters {
  aspect_ratio?: string;
  resolution?: string;
  duration?: number;
  seed?: number;
  guidance_scale?: number;
  num_outputs?: number;
  negative_prompt?: string;
  mask_dilation?: number;
  expansion_direction?: 'up' | 'down' | 'left' | 'right' | 'all';
  temperature?: number;
  top_p?: number;
  thinking_level?: string;
  upscale_factor?: number;
  camera_preset?: CameraPreset;
  [key: string]: unknown;
}

export interface CreativeStudioGeneration {
  id: string;
  user_id?: string;
  brand_id?: string;
  generation_type: GenerationType;
  model_id?: string;
  model_used: string;
  prompt_text?: string;
  negative_prompt?: string;
  parameters: GenerationParameters;
  input_image_url?: string;
  input_mask_url?: string;
  output_urls: string[];
  media_ids: string[];
  status: GenerationStatus;
  generation_time_ms?: number;
  estimated_cost_usd?: number;
  actual_cost_usd?: number;
  error_message?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
}

export interface GenerationWithDetails extends CreativeStudioGeneration {
  model?: CreativeStudioModel;
  brand?: CreativeStudioBrand;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

// ============================================================================
// Quota Types
// ============================================================================

export interface CreativeStudioUserQuota {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  image_generations_used: number;
  video_generations_used: number;
  image_generations_limit?: number;
  video_generations_limit?: number;
  is_unlimited: boolean;
  updated_at: string;
}

export interface QuotaCheckResult {
  can_generate: boolean;
  remaining: number;
  limit_value: number;
  is_unlimited: boolean;
  period_end: string;
}

export interface UserQuotaDisplay {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  image_generations_used: number;
  image_limit: number;
  video_generations_used: number;
  video_limit: number;
  is_unlimited: boolean;
  period_start: string;
  period_end: string;
}

// ============================================================================
// Cost Settings Types
// ============================================================================

export interface CostSetting {
  id: string;
  setting_key: string;
  setting_value: string | number | boolean;
  description?: string;
  updated_at: string;
  updated_by?: string;
}

export interface CostSettings {
  default_image_weekly_limit: number;
  default_video_weekly_limit: number;
  image_cost: number;
  video_cost: number;
  budget_alert_threshold: number;
  admin_email_alerts: boolean;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface CostAnalytics {
  date: string;
  generation_type: GenerationType;
  total_generations: number;
  estimated_cost: number;
  actual_cost: number;
  avg_generation_time_ms: number;
  unique_users: number;
}

export interface GenerationStats {
  total_generations: number;
  image_generations: number;
  video_generations: number;
  successful_generations: number;
  failed_generations: number;
  success_rate: number;
  average_generation_time_ms: number;
  total_estimated_cost: number;
  unique_users: number;
  generations_by_type: Array<{
    type: GenerationType;
    count: number;
  }>;
  generations_by_model: Array<{
    model_name: string;
    count: number;
  }>;
  generations_over_time: Array<{
    date: string;
    count: number;
  }>;
  cost_by_model: Array<{
    model_name: string;
    cost: number;
  }>;
  generations_by_brand: Array<{
    brand_id: string | null;
    brand_name: string;
    count: number;
  }>;
  generations_by_hour: Array<{
    hour: number;
    count: number;
  }>;
}

export interface TopUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  generation_count: number;
  successful_count: number;
  failed_count: number;
  success_rate: number;
  total_cost: number;
  last_activity: string;
  favorite_model: string;
  favorite_type: string;
  types_used: number;
}

export interface PromptAnalytics {
  avg_length: number;
  total_prompts: number;
  length_distribution: Array<{
    bucket: string;
    count: number;
    sort_order: number;
  }>;
  reused_prompts: Array<{
    prompt_preview: string;
    times_used: number;
    unique_users: number;
  }>;
  top_keywords: Array<{
    word: string;
    frequency: number;
  }>;
}

export interface BudgetStatus {
  threshold: number;
  currentSpend: number;
  percentUsed: number;
  isOverBudget: boolean;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface GenerateImageRequest {
  generation_type: GenerationType;
  prompt: string;
  model_id?: string;
  brand_id?: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  num_outputs?: number;
  seed?: number;
  input_image?: string;
  mask_image?: string;
  expansion_direction?: string;
  mask_mode?: string;
  edit_mode?: string;
  mask_dilation?: number;
  guidance_scale?: number;
  upscale_factor?: number;
  // Gemini-specific
  temperature?: number;
  top_p?: number;
  thinking_level?: string;
  image_size?: string;
  use_grounding?: boolean;
  reference_images?: Array<{
    image: string;
    media_resolution?: 'low' | 'medium' | 'high';
  }>;
  // Multi-turn editing
  conversation_history?: ConversationTurn[];
  thought_signature?: string;
  system_instruction?: string;
  // Product recontext / virtual try-on
  person_image?: string;
  garment_image?: string;
  // Camera controls
  camera_preset?: CameraPreset;
}

export interface GenerateVideoRequest {
  generation_type: GenerationType;
  prompt: string;
  model_id?: string;
  brand_id?: string;
  aspect_ratio?: string;
  resolution?: string;
  duration?: number;
  input_image?: string;
  last_frame?: string;
  include_audio?: boolean;
  negative_prompt?: string;
  seed?: number;
  person_generation?: string;
  resize_mode?: 'pad' | 'crop';
  sample_count?: number;
  // Reference images for ingredients-to-video
  reference_images?: Array<{
    image: string;
    type: 'asset' | 'style';
  }>;
  // Scene extension
  source_video?: string;
  target_duration?: number;
  // Director mode (JSON structured prompt)
  json_prompt?: {
    scene_description?: string;
    camera_movement?: string;
    lighting?: string;
    lens?: string;
    subject_attributes?: string;
    dialogue?: string;
  };
}

export interface GenerationResponse {
  success: boolean;
  generation_id: string;
  output_urls: string[];
  media_ids: string[];
  generation_time_ms: number;
  error?: string;
  details?: string;
  // Multi-turn editing response
  thought_signature?: string;
  text_response?: string;
}

export interface QuotaErrorResponse {
  success: false;
  error: string;
  details: string;
  quota: {
    remaining: number;
    limit: number;
    reset_date: string;
  };
}

// ============================================================================
// Audit Log Types (Phase 3)
// ============================================================================

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  generation_id?: string;
  brand_id?: string;
  model_used?: string;
  prompt_text?: string;
  parameters?: Record<string, unknown>;
  estimated_cost_usd?: number;
  compliance_check_result?: ComplianceCheckResult;
  ip_address?: string;
  session_id?: string;
  created_at: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export type EditorMode = 'generate' | 'edit' | 'video';

export type EditTool =
  | 'select'
  | 'brush'
  | 'eraser'
  | 'inpaint'
  | 'outpaint'
  | 'upscale'
  | 'remove';

export interface EditorState {
  mode: EditorMode;
  activeTool: EditTool;
  selectedModelId?: string;
  selectedBrandId?: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  currentImage?: string;
  currentMask?: string;
  brushSize: number;
  isGenerating: boolean;
}

export interface HistoryItem {
  id: string;
  type: 'image' | 'video';
  thumbnail: string;
  url: string;
  prompt?: string;
  createdAt: string;
}

// ============================================================================
// Model Guidance Types (Phase 3)
// ============================================================================

export interface ModelGuidance {
  model_id: string;
  best_for: string;
  description: string;
  strengths: string[];
  limitations: string[];
  use_cases: string[];
  cost_tier: 'low' | 'medium' | 'high' | 'premium';
  speed_tier: 'fast' | 'standard' | 'slow';
  quality_tier: 'draft' | 'standard' | 'high' | 'ultra';
}

// ── Composite deliverable types for interleaved creative packages ────────────

export type DeliverableType =
  | 'linkedin_post'
  | 'product_shot_with_text'
  | 'social_story'
  | 'display_banner'
  | 'email_header'
  | 'tiktok_reel'
  | 'instagram_feed_portrait'
  | 'print_full_page'
  | 'print_ooh_billboard'
  | 'print_ooh_transit'
  | 'print_direct_mail'
  | 'print_collateral'
  | 'banner_leaderboard'
  | 'banner_skyscraper';

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  linkedin_post: 'LinkedIn Post',
  product_shot_with_text: 'Product Shot with Text',
  social_story: 'Social Story',
  display_banner: 'Display Banner',
  email_header: 'Email Header',
  tiktok_reel: 'TikTok / Reels',
  instagram_feed_portrait: 'Instagram Feed (Portrait)',
  print_full_page: 'Print Ad — Full Page',
  print_ooh_billboard: 'OOH — Billboard',
  print_ooh_transit: 'OOH — Transit Shelter',
  print_direct_mail: 'Direct Mail',
  print_collateral: 'Collateral — Sell Sheet',
  banner_leaderboard: 'Banner — Leaderboard',
  banner_skyscraper: 'Banner — Skyscraper',
};
