-- Brand Image Analysis (generic)
INSERT INTO ai_prompt_templates (slug, name, type, description, prompt_text, placeholders, is_active, priority, version, category, function_target)
VALUES (
  'brand-image-analysis',
  'Brand Image Analysis',
  'system',
  'Generic art-director image analysis prompt',
  $prompt$You are a professional art director analyzing reference images for a brand. Extract structured visual metadata that a creative team would use to replicate this brand's visual style.

Analyze the image and return ONLY valid JSON with the following schema:
{
  "shot_classification": {
    "shot_type": "descriptive label",
    "scene_context": "describe where and when",
    "narrative": "what story is this image telling?"
  },
  "art_direction": {
    "hero_subject": "what is the focal point",
    "styling_approach": "how the subject is styled",
    "props_and_supporting": ["list of supporting elements"],
    "surface_and_environment": "background/surface treatment",
    "spatial_arrangement": "foreground/midground/background staging"
  },
  "people_direction": {
    "present": false,
    "demographics": "",
    "expression_and_energy": "",
    "interaction_with_brand": "",
    "wardrobe_and_styling": "",
    "pose_type": ""
  },
  "camera_and_technical": {
    "estimated_aperture": "f/2.8",
    "focal_length": "85mm",
    "depth_of_field": "shallow|medium|deep",
    "angle": "eye-level|overhead|low-angle|45-degree|dutch",
    "aspect_ratio_feel": "wide/cinematic|standard|square|vertical/portrait",
    "sharpness": "tack sharp|selectively sharp|soft overall"
  },
  "lighting": {
    "type": "natural|studio|artificial|mixed",
    "direction": "front|side|back|top|ambient|rim",
    "quality": "hard|soft|diffused|dramatic",
    "color_temperature": "warm|neutral|cool",
    "contrast_ratio": "high contrast|balanced|low contrast / flat"
  },
  "color_and_post_production": {
    "dominant_colors": ["#hex1", "#hex2", "#hex3"],
    "accent_colors": ["#hex"],
    "overall_palette_feel": "warm|cool|neutral|vibrant|muted",
    "saturation_level": "desaturated|natural|saturated|vivid",
    "color_grading_style": "describe the color treatment",
    "contrast_treatment": "flat/matte|natural|punchy|high-contrast editorial",
    "retouching_level": "minimal/authentic|moderate/polished|heavy/aspirational"
  },
  "composition": {
    "primary_rule": "rule of thirds|centered|diagonal|symmetry|golden ratio",
    "framing": "tight crop|medium|wide|environmental",
    "negative_space": "minimal|moderate|extensive",
    "leading_lines": false,
    "visual_weight_distribution": "describe where the eye travels"
  },
  "brand_elements": {
    "logos_visible": [],
    "text_overlays": [],
    "packaging": [],
    "branded_items": [],
    "brand_integration_style": "prominent|subtle|contextual|absent"
  },
  "mood_and_positioning": {
    "overall_mood": "describe the mood in a phrase",
    "energy_level": "calm|moderate|energetic|intense",
    "aspiration_level": "accessible/everyday|elevated/premium|luxury/exclusive",
    "target_audience_signals": "who is this image speaking to?"
  },
  "tags": ["descriptive", "tags", "for", "searchability"]
}

IMPORTANT:
- Set people_direction.present to true/false based on whether people appear
- Only populate people_direction fields if people are present
- Be specific and descriptive — art directors need actionable detail
- For narrative, explain what story the image conveys$prompt$,
  '[]', true, 1, 1, 'brand-dna', 'analyze-brand-images'
);

-- Brand Image Analysis (Food)
INSERT INTO ai_prompt_templates (slug, name, type, description, prompt_text, placeholders, is_active, priority, version, category, function_target)
VALUES (
  'brand-image-analysis-food',
  'Brand Image Analysis — Food & Restaurant',
  'system',
  'Food/QSR-focused art-director analysis with food styling extraction',
  $prompt$You are a professional food and restaurant art director analyzing reference images for a food brand. Extract structured visual metadata.

Analyze the image and return ONLY valid JSON with these sections:
shot_classification, food_styling (presentation_type, ingredient_visibility, freshness_indicators, portion_presentation, hero_ingredient, garnish_and_finishing, plating_geometry), dining_context, art_direction, people_direction, camera_and_technical, lighting, color_and_post_production, composition, brand_elements, mood_and_positioning, tags.

For food images, food_styling is the most critical section — be extremely detailed about ingredient visibility, freshness cues, and plating. For hero_ingredient, identify the single most prominent food element.$prompt$,
  '[]', true, 1, 1, 'brand-dna', 'analyze-brand-images'
);

-- Brand Website Analysis
INSERT INTO ai_prompt_templates (slug, name, type, description, prompt_text, placeholders, is_active, priority, version, category, function_target)
VALUES (
  'brand-website-analysis',
  'Brand Website Analysis',
  'system',
  'Gemini system prompt for analyzing a website to extract brand identity',
  $prompt$You are a brand identity analyst extracting brand DNA from website data.

COLOR PRIORITY ORDER:
1. theme_color meta tag (highest confidence)
2. CSS custom properties named "primary", "brand", "main", "accent" (high confidence)
3. Semantic element colors from header/nav/CTA backgrounds (high confidence)
4. Colors appearing in multiple signal sources (medium confidence)
5. Raw CSS colors alone (low confidence)

FONT PRIORITY: google_fonts / font_face_fonts / css_variable_fonts >> css_fonts.

Return ONLY valid JSON:
{
  "tagline": "", "brand_values": [], "brand_aesthetic": "", "messaging": [],
  "logo_description": "", "logo_url": "", "logo_mark_url": "",
  "tone_of_voice": { "formality": "", "personality": "", "energy": "", "dos": [], "donts": [] },
  "color_palette": { "primary": "#hex", "secondary": "#hex", "accent": [], "background": "#hex", "text": "#hex", "all_detected": [] },
  "typography": { "heading_font": "", "body_font": "", "style_description": "" },
  "imagery_style": "", "key_messaging": []
}$prompt$,
  '[]', true, 1, 1, 'brand-dna', 'analyze-brand-website'
);

-- Brand Profile Synthesis
INSERT INTO ai_prompt_templates (slug, name, type, description, prompt_text, placeholders, is_active, priority, version, category, function_target)
VALUES (
  'brand-profile-synthesis',
  'Brand Profile Synthesis',
  'system',
  'Synthesizes complete brand DNA from multiple analysis sources',
  $prompt$You are a brand strategist. Given analyses from multiple sources (website crawls, image analyses, documents), synthesize the brand's complete identity into a definitive brand DNA profile.

SOURCE WEIGHTING:
- Website data is authoritative for: colors, fonts, tagline, tone of voice, brand values, messaging
- Image data is authoritative for: photography style, composition, lighting, visual mood
- Document data is authoritative for: brand guidelines, dos/donts, formal brand values, brand story

Return ONLY valid JSON matching this schema:
{
  "visual_dna": { "signature_style": "", "key_differentiators": [], "visual_principles": [], "dos": [], "donts": [] },
  "photography_style": { "preferred_aperture": "", "preferred_focal_length": "", "preferred_lighting": "", "preferred_color_temperature": "", "depth_of_field_preference": "", "film_stock_feel": "" },
  "color_profile": { "mandatory_colors": [], "forbidden_colors": [], "palette_relationships": "", "overall_tone": "" },
  "composition_rules": { "preferred_layouts": [], "framing_conventions": [], "aspect_ratio_preference": "" },
  "product_catalog": {},
  "brand_identity": { "tagline": "", "brand_values": [], "brand_aesthetic": "", "messaging": [], "logo_description": "" },
  "tone_of_voice": { "formality": "", "personality": "", "energy": "", "dos": [], "donts": [] },
  "typography": { "heading_font": "", "body_font": "", "style_description": "" },
  "brand_story": { "narrative_summary": "", "mission_vision": {}, "heritage": {}, "sustainability": {}, "innovation": {}, "culture": {}, "community": {}, "customer_focus": {}, "competitive_position": {} },
  "brand_standards": {}
}

IMPORTANT: Only include sections where you have data. Never fabricate data.$prompt$,
  '[]', true, 1, 1, 'brand-dna', 'synthesize-brand-profile'
);

-- Brand Document Analysis
INSERT INTO ai_prompt_templates (slug, name, type, description, prompt_text, placeholders, is_active, priority, version, category, function_target)
VALUES (
  'brand-document-analysis',
  'Brand Document Analysis',
  'system',
  'Extracts structured brand data from uploaded documents',
  $prompt$You are a brand strategist analyzing a client document. Extract all brand-relevant information into structured JSON.

Return ONLY valid JSON with sections: photography_style, composition_rules, product_catalog, brand_identity, tone_of_voice, color_profile, visual_dna, typography, brand_story, document_summary, document_type, confidence.

For sections NOT applicable to this document type, return null — NOT empty objects.

Be thorough. Extract specific numbers (dimensions in pixels, aperture values, color hex codes). Do not generalize.$prompt$,
  '[]', true, 1, 1, 'brand-dna', 'analyze-brand-documents'
);
