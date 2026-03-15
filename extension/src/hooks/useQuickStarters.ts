// ABOUTME: Fetches brand-specific QuickStarter presets from the database
// ABOUTME: Falls back to generic brand-neutral presets when a brand has no templates

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PromptCategory } from '../services/promptService';

export interface VariableField {
  key?: string;
  name?: string;
  label: string;
  type: 'text' | 'select' | 'number';
  options?: string[];
  default_value?: string;
  required?: boolean;
}

export interface QuickStarterPreset {
  label: string;
  description: string;
  variableFields?: VariableField[];
}

export interface QuickStarterCategory {
  key: string;
  label: string;
  formCategory: PromptCategory;
  presets: QuickStarterPreset[];
}

// Standard category display config — order determines QuickStarter display order
const STANDARD_CATEGORIES: Record<string, { label: string; formCategory: PromptCategory }> = {
  'brand-overview': { label: 'Describe Brand', formCategory: 'general' },
  social:           { label: 'Social',          formCategory: 'image' },
  hero:             { label: 'Hero',             formCategory: 'image' },
  product:          { label: 'Product',          formCategory: 'image' },
  lifestyle:        { label: 'Lifestyle',        formCategory: 'image' },
  campaign:         { label: 'Campaign',         formCategory: 'image' },
  editorial:        { label: 'Editorial',        formCategory: 'image' },
  cinematography:   { label: 'Cinematic',        formCategory: 'image' },
  email:            { label: 'Email Copy',       formCategory: 'text' },
  blog:             { label: 'Blog Post',        formCategory: 'text' },
  presentation:     { label: 'Presentation',     formCategory: 'presentation' },
};

// Image-type categories from the Creative Studio agent
const IMAGE_CATEGORIES = new Set([
  'product', 'lifestyle', 'campaign', 'social', 'hero', 'editorial', 'cinematography',
]);

function formCategoryForDbCategory(cat: string): PromptCategory {
  if (IMAGE_CATEGORIES.has(cat)) return 'image';
  if (cat === 'email' || cat === 'blog') return 'text';
  if (cat === 'presentation') return 'presentation';
  if (cat === 'brand-overview') return 'general';
  return 'image'; // default for unknown categories
}

function displayLabelForCategory(cat: string): string {
  if (STANDARD_CATEGORIES[cat]) return STANDARD_CATEGORIES[cat].label;
  // Title-case unknown categories
  return cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildGenericFallbacks(brandName: string): QuickStarterCategory[] {
  const name = brandName || 'this brand';
  return [
    // ── Describe Brand ────────────────────────────────────────────────────────
    {
      key: 'brand-overview',
      label: `Describe ${name}`,
      formCategory: 'general',
      presets: [
        {
          label: 'Full brand introduction',
          description: `You are being briefed on ${name}. Use only the information provided — do not invent, infer, or supplement with outside knowledge.\n\nBRAND: ${name}\nPOSITIONING: [draw from brand_identity and positioning_framework]\nPERSONALITY: [draw from personality_mood_descriptors and tone_of_voice — 3 to 5 sharp descriptors, not vague adjectives]\nVOICE IN PRACTICE:\n  ✓ Sounds like: [a vivid on-brand sentence example]\n  ✗ Never like: [what this brand would never say or sound like]\nVISUAL DNA: [draw from visual_identity — color palette, photography style, typographic personality]\n\nUse this briefing every time you generate content for ${name} in this session.`,
          variableFields: [
            { key: 'tool', label: 'AI tool', type: 'select', options: ['Gemini', 'ChatGPT', 'Claude', 'Midjourney', 'Adobe Firefly', 'Other'], default_value: 'Gemini' },
          ],
        },
        {
          label: 'Brand voice system prompt',
          description: `You are a creative writer for ${name}.\n\nVOICE PILLARS (draw from tone_of_voice and personality_mood_descriptors):\n1. [Pillar name]: [what it means in practice]\n   ✓ Sound like: "[on-brand example sentence]"\n   ✗ Not like: "[off-brand counter-example]"\n2. [Pillar name]: [what it means in practice]\n   ✓ Sound like: "[example]"\n   ✗ Not like: "[counter-example]"\n3. [Pillar name]: [what it means in practice]\n   ✓ Sound like: "[example]"\n   ✗ Not like: "[counter-example]"\n\nVOCABULARY\nUse: [8–12 words and phrases from brand glossary and brand_standards]\nAvoid: [8–12 words that contradict this brand's voice]\n\nYOU ARE WRITING: {{content_type}}`,
          variableFields: [
            { key: 'content_type', label: 'Content type', type: 'select', options: ['Social copy', 'Email', 'Blog post', 'Ad copy', 'Presentation', 'General'], default_value: 'Social copy' },
          ],
        },
        {
          label: 'Visual identity brief',
          description: `Brief an image generation tool on ${name}'s visual identity. Use only what is documented — do not invent.\n\nBRAND: ${name}\nCOLOR PALETTE: [exact hex values or names from visual_identity — primary, secondary, accent]\nPHOTOGRAPHY STYLE: [draw from photography_style — lighting, composition, subject matter, mood]\nTYPOGRAPHY: [headline and body typeface from typography_guidelines]\nVISUAL PERSONALITY: [3 to 4 descriptors that define the aesthetic — e.g., "warm, editorial, human-forward"]\nFORBIDDEN: [visual elements, color combinations, or styles explicitly excluded in brand_standards or forbidden_combinations]\n\nApply this visual system to every image you generate for ${name}.`,
          variableFields: [],
        },
        {
          label: 'Competitive positioning context',
          description: `Context for positioning ${name} against the competitive landscape.\n\nBRAND: ${name}\nCATEGORY: [draw from brand_identity — what space this brand competes in]\nCORE DIFFERENTIATOR: [the single irreducible thing ${name} owns that competitors cannot — drawn from positioning_framework or brand_story]\nCOMPETITIVE FRAME: [how ${name} chooses to define its category — what it rejects as well as what it claims]\nNARRATIVE STANCE: [the point of view ${name} takes in the market — challenger, authority, innovator, etc.]\n\nDo not soften the positioning. ${name} has a clear point of view — use it.`,
          variableFields: [],
        },
      ],
    },

    // ── Social ────────────────────────────────────────────────────────────────
    {
      key: 'social',
      label: 'Social',
      formCategory: 'image',
      presets: [
        {
          label: 'Campaign announcement',
          description: `IMAGE BRIEF — ${name} social graphic for a campaign announcement on {{platform}}.\n\nSINGLE-MINDED PROPOSITION: [draw from positioning_framework or campaign brief — the one thing this image must communicate]\nAUDIENCE: [specific persona from brand context — life stage, mindset, what they care about]\nMOOD: {{mood}} — translate this word into photographic choices: lighting, subject energy, color temperature, composition tension\nVISUAL DIRECTION: Authentic, human-forward. Real moments over staged setups. {{platform}} native dimensions and safe zones.\nCOLOR: Grounded in ${name}'s palette. [reference primary and accent colors from visual_identity]\nDO NOT: stock-photo body language, generic backgrounds, competitor brand colors`,
          variableFields: [
            { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram Feed', 'Instagram Story', 'LinkedIn', 'Facebook', 'X / Twitter'], default_value: 'Instagram Feed' },
            { key: 'mood', label: 'Mood', type: 'select', options: ['Energetic', 'Warm', 'Bold', 'Minimal', 'Premium', 'Playful'], default_value: 'Energetic' },
          ],
        },
        {
          label: 'Thought leadership visual',
          description: `IMAGE BRIEF — ${name} LinkedIn visual for a thought leadership post.\n\nTOPIC: {{topic}}\nSINGLE-MINDED PROPOSITION: This image must make {{topic}} feel urgent, credible, and distinctly ${name}'s point of view — not generic industry content.\nAUDIENCE MIND STATE: They've seen a hundred posts on this topic. This one earns a stop-scroll because it looks like editorial journalism, not a social ad.\nVISUAL DIRECTION: Clean, editorial layout. Data or insight as the visual hero. Typography-led if needed. ${name} brand palette applied with restraint.\nFORMAT: LinkedIn feed image — 1200 × 627px or 1:1 square\nDO NOT: clip art, illustration clichés, overly branded color blocking`,
          variableFields: [
            { key: 'topic', label: 'Topic or insight', type: 'text' },
          ],
        },
        {
          label: 'Culture moment',
          description: `IMAGE BRIEF — ${name} social graphic capturing a team, community, or behind-the-brand moment.\n\nSUBJECT: {{subject}}\nEMOTIONAL TRUTH: The viewer should feel the energy of being inside ${name} — the real texture of the culture, not a corporate values poster.\nVISUAL DIRECTION: Candid over posed. Natural light preferred. Environmental context matters — show the actual space, not a clean backdrop.\nCOMPOSITION: Leave room for text overlay at {{platform}} safe zones. Faces and expressions carry the story.\nDO NOT: forced smiles, matching outfits, stock-photo diversity`,
          variableFields: [
            { key: 'subject', label: 'Subject', type: 'select', options: ['Team event', 'Behind-the-scenes', 'Community moment', 'Office life', 'Milestone celebration'], default_value: 'Behind-the-scenes' },
            { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram Story', 'Instagram Feed', 'LinkedIn'], default_value: 'Instagram Story' },
          ],
        },
        {
          label: 'Results announcement',
          description: `IMAGE BRIEF — ${name} social graphic announcing a result, award, or milestone.\n\nACHIEVEMENT: {{achievement}}\nPRIMARY MESSAGE: The number or recognition is the hero. Everything else supports it.\nVISUAL DIRECTION: Bold, clean, confident. The design should feel earned — like a front page, not a press release. ${name} brand colors carry the weight.\nTYPOGRAPHY: Headline metric at maximum legibility. Supporting context in secondary type. Brand mark present but not dominant.\nPLATFORM: {{platform}}\nDO NOT: oversaturated celebration graphics, confetti clichés, generic award imagery`,
          variableFields: [
            { key: 'achievement', label: 'Achievement or metric', type: 'text' },
            { key: 'platform', label: 'Platform', type: 'select', options: ['LinkedIn', 'Instagram Feed', 'X / Twitter'], default_value: 'LinkedIn' },
          ],
        },
      ],
    },

    // ── Hero ──────────────────────────────────────────────────────────────────
    {
      key: 'hero',
      label: 'Hero',
      formCategory: 'image',
      presets: [
        {
          label: 'Campaign landing page hero',
          description: `IMAGE BRIEF — ${name} hero image for a {{campaign}} campaign landing page.\n\nSINGLE-MINDED PROPOSITION: In 3 seconds of visual contact, the viewer must understand: this brand solves something real for people who look like them.\nAUDIENCE: [specific persona from brand context — what they want, what they fear, what makes them stop]\nPHOTOGRAPHY STYLE: {{style}} — [translate to specific choices: lens compression, depth of field, subject relationship to camera, ambient vs. directional light]\nASPECT RATIO: {{aspect}} — compose with text safe zones in mind. The hero image is a stage; copy is the actor.\nCOLOR TEMPERATURE: Warm and grounded, aligned with ${name}'s palette\nDO NOT: obvious stock photography, models that look like models, backgrounds that could be any brand`,
          variableFields: [
            { key: 'campaign', label: 'Campaign or product', type: 'text' },
            { key: 'style', label: 'Photography style', type: 'select', options: ['Lifestyle', 'Environmental', 'Studio', 'Documentary', 'Abstract'], default_value: 'Lifestyle' },
            { key: 'aspect', label: 'Aspect ratio', type: 'select', options: ['16:9 wide', '4:3 standard', '1:1 square', '21:9 ultra-wide'], default_value: '16:9 wide' },
          ],
        },
        {
          label: 'Capability or service page',
          description: `IMAGE BRIEF — ${name} hero for a {{capability}} capability or service page.\n\nCHALLENGE: Translate an abstract service into a felt human experience. The viewer shouldn't see "a service" — they should see the outcome it creates.\nVISUAL STRATEGY: Find the human moment inside the capability. What does it look like when {{capability}} actually works? Photograph that.\nMOOD: {{mood}} — grounded, credible, forward-leaning. This is expertise worn lightly.\nCOMPOSITION: Environmental or contextual. People in real working situations, not posed product shots.\nDO NOT: handshake photos, floating icons, generic office interiors`,
          variableFields: [
            { key: 'capability', label: 'Capability or service area', type: 'text' },
            { key: 'mood', label: 'Mood', type: 'select', options: ['Innovative', 'Trustworthy', 'Bold', 'Warm', 'Authoritative'], default_value: 'Innovative' },
          ],
        },
        {
          label: 'Industry vertical hero',
          description: `IMAGE BRIEF — ${name} hero image for {{industry}} industry content.\n\nAUDIENCE RECOGNITION: Someone in {{industry}} should see this image and immediately feel understood — not marketed to. The visual speaks their language before the headline does.\nVISUAL DIRECTION: Specific over generic. Show the texture of {{industry}} — the actual environments, tools, or people. Authentic documentary photography, not conceptual illustration.\nLIGHTING: Natural or available light preferred. Warm, human, credible.\nSUBJECT: Real people in real contexts. Faces preferred when appropriate. Emotion over action.\nDO NOT: generic "business professional" imagery, abstract metaphors, competitor brand environments`,
          variableFields: [
            { key: 'industry', label: 'Industry', type: 'text' },
          ],
        },
        {
          label: 'Brand value or manifesto',
          description: `IMAGE BRIEF — ${name} hero image expressing the brand's core value or belief: "{{belief}}"\n\nVISUAL TASK: Translate an abstract brand value into a single, indelible photographic moment. The image should work without any copy — the belief is visible in the frame.\nAPPROACH: Find the human truth inside "{{belief}}". What does it look like in real life? Where does it happen? Who lives it?\nTONE: {{tone}} — carry this emotional register in every visual decision: subject, light, moment, distance.\nDO NOT: literal illustration of the concept, stock metaphors, forced symbolism`,
          variableFields: [
            { key: 'belief', label: 'Brand value or belief', type: 'text' },
            { key: 'tone', label: 'Emotional tone', type: 'select', options: ['Hopeful', 'Defiant', 'Intimate', 'Triumphant', 'Contemplative'], default_value: 'Hopeful' },
          ],
        },
      ],
    },

    // ── Product ───────────────────────────────────────────────────────────────
    {
      key: 'product',
      label: 'Product',
      formCategory: 'image',
      presets: [
        {
          label: 'Lifestyle product shot',
          description: `IMAGE BRIEF — ${name} product in a {{context}} lifestyle context.\n\nPRODUCT: {{product}}\nCORE TASK: Show the product as part of a life, not as an object on display. The viewer should want the lifestyle, and the product comes with it.\nENVIRONMENT: {{context}} — specific, curated, consistent with ${name}'s world. The background is part of the brand story.\nSUBJECT: Product in use or in natural rest. Human presence preferred but not required — if present, person is real and unselfconscious.\nLIGHTING: Natural or soft directional. Warm, tactile, honest.\nCOLOR: Product colors harmonize with ${name}'s palette. No color conflicts with brand identity.\nDO NOT: white cyc studio backdrop, product floating in space, artificial "in use" staging`,
          variableFields: [
            { key: 'product', label: 'Product or service', type: 'text' },
            { key: 'context', label: 'Lifestyle context', type: 'select', options: ['Home / living', 'Workspace / professional', 'Outdoors / active', 'Urban / city', 'Travel'], default_value: 'Home / living' },
          ],
        },
        {
          label: 'Studio hero product',
          description: `IMAGE BRIEF — ${name} studio product shot for {{placement}}.\n\nPRODUCT: {{product}}\nOBJECTIVE: Elevate the product to icon status. This is a portrait, not a catalog image.\nSURFACE: {{surface}} — chosen for texture contrast against the product. Light interaction is intentional.\nLIGHTING: [draw from ${name}'s visual_identity — studio lighting style. Describe shadow behavior, key-to-fill ratio, color temperature]\nCOMPOSITION: Confident negative space. Product occupies the frame without apology.\nFINISH: Color-graded to ${name}'s palette. Retouching standard: pristine but not hyperreal.\nDO NOT: drop shadows, radial gradients, lifestyle props that compete with the product`,
          variableFields: [
            { key: 'product', label: 'Product', type: 'text' },
            { key: 'placement', label: 'Placement', type: 'select', options: ['E-commerce PDP', 'Print campaign', 'Social media', 'OOH / billboard', 'Editorial'], default_value: 'E-commerce PDP' },
            { key: 'surface', label: 'Surface / background', type: 'select', options: ['Seamless white', 'Seamless black', 'Natural material (wood, stone, linen)', 'Brand color', 'Gradient'], default_value: 'Natural material (wood, stone, linen)' },
          ],
        },
        {
          label: 'Product in use',
          description: `IMAGE BRIEF — ${name} product-in-use shot showing {{action}}.\n\nPRODUCT: {{product}}\nCORE MOMENT: The instant of use — the moment the product does its job. Not before, not after. The moment.\nHUMAN PRESENCE: Hands or partial person. Close enough to feel real, wide enough to give context. No face required unless the face IS the story.\nLIGHTING: Available light or matched to the use environment — honest and contextual.\nCOMPOSITION: Product and action are co-equal subjects. Neither dominates. The interaction is the image.\nDO NOT: instructional photography, dramatic gesture-acting, studio lighting in a real environment`,
          variableFields: [
            { key: 'product', label: 'Product', type: 'text' },
            { key: 'action', label: 'Action or use moment', type: 'text' },
          ],
        },
        {
          label: 'Product collection flat lay',
          description: `IMAGE BRIEF — ${name} product collection flat lay for {{channel}}.\n\nPRODUCTS: {{products}}\nCURATION LOGIC: These products belong together — the flat lay should make that case visually. Arrange by [color story / use story / hierarchy — pick one] and commit.\nSURFACE: [consistent with ${name}'s visual_identity — material, texture, color temperature]\nPROPS: Minimal. Only what reinforces the collection's world. No props that compete with product.\nLIGHTING: Even, soft, directional. No harsh shadows. All products equally readable.\nSCALE: Intentional. Hero product gets priority real estate. Supporting items recede.\nDO NOT: random prop accumulation, clashing surfaces, harsh shadows across product faces`,
          variableFields: [
            { key: 'products', label: 'Products to feature', type: 'text' },
            { key: 'channel', label: 'Channel', type: 'select', options: ['E-commerce', 'Social media', 'Email', 'Print catalog', 'Editorial'], default_value: 'Social media' },
          ],
        },
      ],
    },

    // ── Lifestyle ─────────────────────────────────────────────────────────────
    {
      key: 'lifestyle',
      label: 'Lifestyle',
      formCategory: 'image',
      presets: [
        {
          label: 'Aspirational lifestyle scene',
          description: `IMAGE BRIEF — ${name} aspirational lifestyle image for {{placement}}.\n\nBRAND WORLD: The world ${name} customers want to inhabit — not who they are today, but who they're becoming. Photograph that version of their life.\nSCENE: {{scene}} — specific location, time of day, ambient detail. The more specific, the more credible the aspiration.\nSUBJECT: A person who looks like the audience's best-self projection. Authentic beauty, not advertising beauty. Real life, elevated.\nMOOD: {{mood}} — translate to photographic decisions: warm vs. cool light, depth of field, subject relationship to camera (intimate vs. observer)\nCOLOR: Harmonize with ${name}'s palette. The world of this image should feel continuous with the brand's visual system.\nDO NOT: obvious luxury signaling, model-agency casting, environments that feel financially exclusive`,
          variableFields: [
            { key: 'scene', label: 'Scene or setting', type: 'text' },
            { key: 'mood', label: 'Emotional mood', type: 'select', options: ['Aspirational', 'Relaxed', 'Energetic', 'Intimate', 'Playful', 'Serene'], default_value: 'Aspirational' },
            { key: 'placement', label: 'Placement', type: 'select', options: ['Campaign hero', 'Social media', 'Email header', 'Website'], default_value: 'Campaign hero' },
          ],
        },
        {
          label: 'Cultural moment',
          description: `IMAGE BRIEF — ${name} lifestyle image anchored in a specific cultural moment: {{moment}}\n\nSTRATEGIC INTENT: ${name} is not commenting on {{moment}} from the outside — this brand lives in this culture. The image should feel like it belongs here.\nPHOTOGRAPHIC APPROACH: Documentary + brand — the honesty of photojournalism within the aesthetic of ${name}'s visual system. Real people, real energy, brand-coherent color.\nSUBJECT: The moment itself, not a recreation of it. If this has to be staged, stage it so well it reads as found.\nCOLOR TEMPERATURE: [match to ${name}'s visual_identity — warm or neutral grounding, not oversaturated]\nDO NOT: trend-chasing that ages instantly, performative diversity, cultural signifiers used as decoration`,
          variableFields: [
            { key: 'moment', label: 'Cultural moment or context', type: 'text' },
          ],
        },
        {
          label: 'Behind the brand',
          description: `IMAGE BRIEF — ${name} behind-the-brand image showing {{subject}}.\n\nPURPOSE: Make the audience feel they have access to something real — the actual texture of what ${name} does and who does it. Transparency builds trust.\nPHOTOGRAPHIC TONE: Candid is the default. If it looks posed, it fails. The camera is a witness, not a director.\nSUBJECT: {{subject}} — photograph the work, the people, the environment with equal respect. No subject is "just background."\nLIGHTING: Available light when possible. Flash acceptable only if invisible in the final image.\nCOMPOSITION: Environmental context matters. Show where this happens, not just what happens.\nDO NOT: staged candids, suspiciously perfect workspaces, uniformed teams`,
          variableFields: [
            { key: 'subject', label: 'Subject', type: 'select', options: ['Creative process', 'Team at work', 'Production / making-of', 'Leadership moment', 'Community event'], default_value: 'Creative process' },
          ],
        },
        {
          label: 'Community and connection',
          description: `IMAGE BRIEF — ${name} community image for {{channel}} capturing genuine human connection.\n\nEMOTIONAL BRIEF: The viewer should feel warmth, belonging, and recognition — "that's my kind of people." Not corporate community; real community.\nSUBJECT: {{community_type}} — people together in a real context. Interaction over proximity. The relationship between subjects is the subject.\nPHOTOGRAPHIC APPROACH: Close, warm, observational. Medium focal length. Available light. Moments of genuine expression — laughter, focus, collaboration.\nCOLOR: Warm color temperature consistent with ${name}'s palette. Skin tones are the priority subject for white balance.\nDO NOT: handshake photos, forced group poses, overly diverse casting that reads as intentional`,
          variableFields: [
            { key: 'community_type', label: 'Community type', type: 'select', options: ['Customers', 'Team / internal', 'Partners', 'Creative community', 'Local community'], default_value: 'Customers' },
            { key: 'channel', label: 'Channel', type: 'select', options: ['Social media', 'Website', 'Campaign', 'Annual report'], default_value: 'Social media' },
          ],
        },
      ],
    },

    // ── Campaign ──────────────────────────────────────────────────────────────
    {
      key: 'campaign',
      label: 'Campaign',
      formCategory: 'image',
      presets: [
        {
          label: 'Campaign launch visual',
          description: `IMAGE BRIEF — ${name} campaign launch visual for "{{campaign_name}}"\n\nCAMPAIGN PROPOSITION: {{proposition}}\nVISUAL TASK: This is the image that defines the campaign's world. Every other asset will inherit from it — it must be distinctive, ownable, and immediately readable as ${name}.\nSINGLE-MINDED VISUAL IDEA: [one clear image idea that embodies {{proposition}} — specific scene, subject, moment, or composition strategy]\nMOOD: {{mood}} — carry this through every decision: light quality, subject energy, color temperature, depth of field\nCOMPOSITION: Designed for adaptability across {{format}} and other sizes. Establish the visual hierarchy here.\nBRAND PRESENCE: ${name} visual system fully expressed — palette, photography style, compositional values\nDO NOT: campaign imagery that could work for a competitor, generic "big emotion" photography, overly conceptual art direction`,
          variableFields: [
            { key: 'campaign_name', label: 'Campaign name', type: 'text' },
            { key: 'proposition', label: 'Campaign proposition', type: 'text' },
            { key: 'mood', label: 'Campaign mood', type: 'select', options: ['Inspirational', 'Bold', 'Warm', 'Urgent', 'Playful', 'Cinematic'], default_value: 'Inspirational' },
            { key: 'format', label: 'Primary format', type: 'select', options: ['Social media', 'Digital display', 'OOH / billboard', 'Print', 'Video thumbnail'], default_value: 'Social media' },
          ],
        },
        {
          label: 'OOH / billboard',
          description: `IMAGE BRIEF — ${name} out-of-home image for a {{size}} placement.\n\nOOH CONSTRAINT: This image will be seen at 60 mph from 30 feet away. It has 3 seconds. One image. One idea. No second chances.\nSINGLE VISUAL IDEA: {{visual_idea}} — photograph this with maximum clarity and impact. Simplicity is a strategy.\nCOMPOSITION: Center-weighted or rule-of-thirds. Leave space for the headline. No visual noise. High contrast for outdoor readability.\nSCALE: Everything in the frame must read at billboard scale — no fine detail that disappears at size.\nCOLOR: High contrast. ${name} brand colors applied with confidence. Works in full sun and at night.\nDO NOT: complex compositions, multiple subjects competing for attention, fine typographic details`,
          variableFields: [
            { key: 'visual_idea', label: 'Visual idea or subject', type: 'text' },
            { key: 'size', label: 'Format', type: 'select', options: ['Billboard (14×48ft)', 'Bus shelter', 'Transit / subway', 'Wallscape', 'Digital OOH'], default_value: 'Billboard (14×48ft)' },
          ],
        },
        {
          label: 'Integrated campaign system',
          description: `IMAGE BRIEF — ${name} integrated campaign image for "{{campaign_name}}" — {{channel}} execution.\n\nCAMPAIGN VISUAL SYSTEM: This image is one expression of a larger campaign. It must be visually consistent with the campaign's established world while optimized for {{channel}}.\nCHANNEL-SPECIFIC REQUIREMENTS: {{channel}} — [dimensions, safe zones, viewing context, scroll behavior — optimize for this medium specifically]\nVISUAL CONSISTENCY: Same color palette, photography style, subject type, and compositional logic as the campaign hero. Different frame, same world.\nMESSAGE HIERARCHY: In the {{channel}} context, the viewer sees [copy / image / both] first. Design accordingly.\nDO NOT: creative drift from campaign visual system, channel-optimized shortcuts that sacrifice brand coherence`,
          variableFields: [
            { key: 'campaign_name', label: 'Campaign name', type: 'text' },
            { key: 'channel', label: 'Channel', type: 'select', options: ['Social media', 'Display advertising', 'Email', 'Print', 'OOH', 'Video'], default_value: 'Social media' },
          ],
        },
        {
          label: 'Retargeting / conversion',
          description: `IMAGE BRIEF — ${name} retargeting image for {{audience_segment}} viewers — {{format}} format.\n\nCONTEXT: This audience has already seen ${name}. This image is not an introduction — it is a closing argument.\nAUDIENCE MIND STATE: {{audience_segment}} — they know the brand, they considered it, something stopped them. This image addresses that hesitation without acknowledging it explicitly.\nVISUAL STRATEGY: Confident, specific, product or outcome-forward. Less aspirational than brand advertising; more direct about what they get.\nCONVERSION HIERARCHY: Image → specific benefit → clear CTA. Every element earns its place.\nDO NOT: vague aspiration, generic brand imagery, anything that requires knowing the full campaign context to understand`,
          variableFields: [
            { key: 'audience_segment', label: 'Audience segment', type: 'select', options: ['Site visitors', 'Cart abandoners', 'Past customers', 'Engaged social followers', 'Event attendees'], default_value: 'Site visitors' },
            { key: 'format', label: 'Ad format', type: 'select', options: ['Display 300×250', 'Display 728×90', 'Social feed', 'Stories / vertical'], default_value: 'Display 300×250' },
          ],
        },
      ],
    },

    // ── Editorial ─────────────────────────────────────────────────────────────
    {
      key: 'editorial',
      label: 'Editorial',
      formCategory: 'image',
      presets: [
        {
          label: 'Thought leadership visual',
          description: `IMAGE BRIEF — ${name} editorial image for a thought leadership piece on "{{topic}}"\n\nEDITORIAL INTENT: This image should make "{{topic}}" feel consequential — like it belongs in a serious publication that respects its readers.\nVISUAL APPROACH: {{style}} — [translate to specific photographic and compositional choices]\nSUBJECT: The idea itself, made visible. Find the human, environmental, or conceptual image that makes "{{topic}}" legible at a glance.\nTONE: Intelligent, credible, forward-looking. ${name} as a publication, not a brand running an ad.\nCOLOR: Editorial restraint — ${name}'s palette applied with subtlety. The subject leads; the brand endorses.\nDO NOT: literal concept illustration, stock "thinking professional" imagery, visual metaphors that have been used a thousand times`,
          variableFields: [
            { key: 'topic', label: 'Topic or subject', type: 'text' },
            { key: 'style', label: 'Visual style', type: 'select', options: ['Photographic / documentary', 'Abstract / conceptual', 'Data visualization', 'Portrait / people-led', 'Environmental'], default_value: 'Photographic / documentary' },
          ],
        },
        {
          label: 'Magazine-style spread',
          description: `IMAGE BRIEF — ${name} magazine-style editorial image for a {{publication_type}} spread on "{{subject}}"\n\nEDITORIAL FRAME: Design this as if it belongs in {{publication_type}}. The image has the ambition, craft, and point of view of editorial photography — but it's ${name}'s world.\nSUBJECT: {{subject}} — photographed with the visual intelligence of editorial work: a strong concept, a decisive moment, an unexpected angle.\nLAYOUT AWARENESS: This image will carry a headline and deck copy. Compose with text placement in mind — left third, bottom third, or full bleed with type overlay zone.\nCOLOR GRADE: [consistent with ${name}'s palette — specify warm/cool balance, saturation level, contrast philosophy]\nDO NOT: advertising aesthetics in an editorial format, over-branded compositions, portfolio photography that prioritizes technique over communication`,
          variableFields: [
            { key: 'subject', label: 'Subject or story', type: 'text' },
            { key: 'publication_type', label: 'Publication style', type: 'select', options: ['Business / trade press', 'Consumer lifestyle', 'Industry journal', 'Annual report', 'Brand magazine'], default_value: 'Business / trade press' },
          ],
        },
        {
          label: 'Industry insight graphic',
          description: `IMAGE BRIEF — ${name} editorial graphic expressing the insight: "{{insight}}"\n\nCOMMUNICATION TASK: Make "{{insight}}" visually self-evident before anyone reads the caption. The image does the argument.\nAPPROACH: {{approach}} — [translate to specific visual execution]\nBRAND VOICE IN IMAGE FORM: This graphic should feel unmistakably ${name} — the same intelligence and directness in visual form that the brand has in words.\nFORMAT: Optimized for {{channel}} — dimensions, safe zones, text legibility at platform scale\nDO NOT: generic infographic aesthetic, clip art, data visualization that requires a legend to understand`,
          variableFields: [
            { key: 'insight', label: 'Insight or finding', type: 'text' },
            { key: 'approach', label: 'Visual approach', type: 'select', options: ['Data / statistics visual', 'Conceptual photography', 'Illustrated graphic', 'Typography-led'], default_value: 'Data / statistics visual' },
            { key: 'channel', label: 'Channel', type: 'select', options: ['LinkedIn', 'Twitter / X', 'Newsletter', 'Website', 'Presentation'], default_value: 'LinkedIn' },
          ],
        },
        {
          label: 'Award or recognition feature',
          description: `IMAGE BRIEF — ${name} editorial image announcing recognition for "{{achievement}}"\n\nTONE: Earned confidence — not bragging, not humble. ${name} has accomplished something real; this image holds that truth without overplaying it.\nVISUAL STRATEGY: The recognition is real. Make it feel real — not like a press release image.\nSUBJECT: {{subject_choice}} — photographed with the same authenticity we'd give any editorial subject.\nCOMPOSITION: The achievement is present but not the only thing in the frame. Context and story around it elevate it.\nCOLOR: ${name}'s palette with confident application. This moment should feel on-brand, not like a generic award graphic.\nDO NOT: trophy imagery clichés, staged handshakes, graphic treatments that look like internal slides`,
          variableFields: [
            { key: 'achievement', label: 'Recognition or achievement', type: 'text' },
            { key: 'subject_choice', label: 'Visual subject', type: 'select', options: ['Team / people', 'Work / deliverable', 'Abstract / symbolic', 'Brand mark treatment'], default_value: 'Team / people' },
          ],
        },
      ],
    },

    // ── Cinematic ─────────────────────────────────────────────────────────────
    {
      key: 'cinematography',
      label: 'Cinematic',
      formCategory: 'image',
      presets: [
        {
          label: 'Brand film opener',
          description: `VIDEO BRIEF — ${name} brand film opening sequence — first {{duration}} seconds.\n\nOPENING MANDATE: The first frame must earn the next. The first 3 seconds determine whether anyone watches the next 27.\nEMOTIONAL ARC: Open with {{beat}} — not stated, felt. The viewer should feel something before they know what they're watching.\nCINEMATIC APPROACH: [draw from ${name}'s visual_identity — describe lens choice, camera movement philosophy, lighting style, color grade]\nSEQUENCING LOGIC: Each shot builds on the last. The edit has rhythm. The rhythm matches the emotional arc.\nSETTING: {{setting}} — specific, textured, owned by this brand's visual world\nDO NOT: stock footage feel, title cards in the first 5 seconds, music-video cutting rhythms for a brand with editorial sensibility`,
          variableFields: [
            { key: 'duration', label: 'Opening duration', type: 'select', options: ['5 seconds', '10 seconds', '15 seconds', '30 seconds'], default_value: '10 seconds' },
            { key: 'beat', label: 'Emotional beat', type: 'select', options: ['Hopeful', 'Determined', 'Joyful', 'Intimate', 'Triumphant', 'Restless'], default_value: 'Hopeful' },
            { key: 'setting', label: 'Setting', type: 'select', options: ['Urban', 'Natural environment', 'Interior / workspace', 'Mixed / transitional'], default_value: 'Urban' },
          ],
        },
        {
          label: 'Product showcase film',
          description: `VIDEO BRIEF — ${name} product showcase film for "{{product}}"\n\nFILM INTENT: Elevate {{product}} to the status it deserves. This is not a demo reel — it is a portrait of what the product is and what it makes possible.\nPRODUCT HERO MOMENTS: [the 3 to 4 most visually compelling aspects of {{product}} — choose for cinematic quality, not feature completeness]\nCINEMATOGRAPHY: {{environment}} environment — [lighting that reveals the product's material quality: [specify based on product — glass catches light differently than matte fabric]]\nMOVEMENT: Camera moves that feel intentional — reveal, orbit, push-in. Movement serves the product, not the cinematographer's ambition.\nDURATION: {{duration}} — every second must be earned. Cut ruthlessly.\nDO NOT: feature-listing narration over visuals, sped-up time-lapses as a crutch, music that overwhelms the product`,
          variableFields: [
            { key: 'product', label: 'Product or service', type: 'text' },
            { key: 'environment', label: 'Environment', type: 'select', options: ['Studio', 'In-situ / real-world', 'Lifestyle context', 'Abstract / constructed'], default_value: 'In-situ / real-world' },
            { key: 'duration', label: 'Film duration', type: 'select', options: [':15 sec', ':30 sec', ':60 sec', '2+ min'], default_value: ':30 sec' },
          ],
        },
        {
          label: 'Culture documentary',
          description: `VIDEO BRIEF — ${name} culture documentary short — {{theme}}\n\nDOCUMENTARY ETHIC: We are not directing a commercial about our culture. We are witnessing it. The camera follows; it does not choreograph.\nSUBJECT: {{subject}} — real people, real work, real moments. If the camera is in the room long enough, the moments arrive on their own.\nCINEMATIC STYLE: Handheld intimacy. Natural light dominant. Interview-and-observe structure if needed. The edit finds the story after the shoot, not before.\nEMOTIONAL TRUTH: By the end, the viewer should understand something real about what it means to work on, with, or for ${name}.\nMUSIC: Understated. Serves the edit. Does not explain what the visuals already say.\nDO NOT: scripted "authentic" moments, employees visibly aware of the camera, editorial choices that flatten everyone into one happy story`,
          variableFields: [
            { key: 'theme', label: 'Theme or focus', type: 'select', options: ['How we work', 'Why we do this', 'Who we are', 'What we make', 'A day in the life'], default_value: 'How we work' },
            { key: 'subject', label: 'Primary subject', type: 'select', options: ['Individual contributor', 'Creative team', 'Leadership', 'Cross-functional project', 'Community moment'], default_value: 'Creative team' },
          ],
        },
        {
          label: 'Campaign :30 spot',
          description: `VIDEO BRIEF — ${name} campaign :30 television / digital spot for "{{campaign}}"\n\nNARRATIVE STRUCTURE: A :30 spot is a complete story — setup, complication, resolution, or some subversion of that arc. No time for waste; every second has a job.\nFIRST 5 SECONDS: Stop the scroll / earn the remote. Open on {{hook}} — the specific moment, image, or sound that makes leaving impossible.\nEMOTIONAL ARC: Viewer enters feeling {{entry_state}} → spot creates tension or shift → viewer exits feeling {{exit_state}} and wants to [action].\nBRAND PRESENCE: ${name} earns the right to be in the story. The brand is not the hero — the audience is. ${name} enables the resolution.\nTONE: {{tone}} — consistent throughout. The :30 has one emotional register.\nDO NOT: logo reveal in the first 10 seconds, product feature list as narrative, emotional bait-and-switch that feels manipulative`,
          variableFields: [
            { key: 'campaign', label: 'Campaign name or theme', type: 'text' },
            { key: 'hook', label: 'Opening hook', type: 'text' },
            { key: 'entry_state', label: 'Viewer enters feeling', type: 'select', options: ['Curious', 'Skeptical', 'Nostalgic', 'Frustrated', 'Neutral'], default_value: 'Curious' },
            { key: 'exit_state', label: 'Viewer exits feeling', type: 'select', options: ['Inspired', 'Seen / understood', 'Proud', 'Motivated', 'Warm'], default_value: 'Inspired' },
            { key: 'tone', label: 'Tone', type: 'select', options: ['Inspirational', 'Witty', 'Cinematic / dramatic', 'Warm / human', 'Bold / provocative'], default_value: 'Inspirational' },
          ],
        },
      ],
    },

    // ── Email Copy ────────────────────────────────────────────────────────────
    {
      key: 'email',
      label: 'Email Copy',
      formCategory: 'text',
      presets: [
        {
          label: 'Campaign or product email',
          description: `COPY BRIEF: Email for {{audience}} — {{email_type}}\n\nAUDIENCE MIND STATE: {{audience}} — what they're thinking before they open this email, what competing priorities they have, what would make them delete it immediately\nSINGLE-MINDED PROPOSITION: One sentence — the single irreducible thing this email must land\nSUBJECT LINE: 40–50 characters. Creates curiosity without clickbait. Avoids spam triggers. Earns the open.\nPREVIEW TEXT: 80–100 characters. Complements the subject line — adds urgency or intrigue rather than repeating it.\nEMAIL STRUCTURE:\n  — Headline (8–12 words): The first thing they read after opening. Makes the case in one line.\n  — Opening (3–4 sentences, 60–90 words): Warm, specific, benefit-forward. Meet them where they are.\n  — Body (3–4 sentences, 60–90 words): The core message — offer, story, or argument. Specific over general.\n  — CTA: 3–5 words. Direct. Action verb.\nVOICE: [draw from ${name}'s tone_of_voice — confident, specific, warm without being soft]\nDO NOT: vague subject lines, passive voice, body copy that takes 3 sentences to get to the point`,
          variableFields: [
            { key: 'audience', label: 'Audience', type: 'select', options: ['Prospects', 'Current clients', 'Past customers', 'Partners', 'Internal team'], default_value: 'Prospects' },
            { key: 'email_type', label: 'Email type', type: 'select', options: ['Campaign launch', 'Product announcement', 'Follow-up / nurture', 'Event invitation', 'Results / case study'], default_value: 'Campaign launch' },
          ],
        },
        {
          label: 'Sales follow-up',
          description: `COPY BRIEF: ${name} sales follow-up email after {{context}}\n\nAUDIENCE MIND STATE: They know ${name}. They've been in a conversation. Something hasn't moved — a decision, a next step, an answer. This email closes that gap without pressure.\nSINGLE-MINDED PROPOSITION: Make the next step so clear and low-friction that saying yes is easier than saying nothing.\nTONE: Confident and warm. Not chasing; reminding. The relationship matters more than the transaction.\nSUBJECT LINE: Personal, specific, references the last touch. 5–8 words maximum.\nSTRUCTURE:\n  — Callback (1 sentence): Reference the conversation / context directly\n  — Value restatement (1–2 sentences): The thing that makes this worth their time, specific to them\n  — Next step (1 sentence): Specific ask — not "let me know if you have questions"\n  — Sign-off: Warm but brief\nWORD COUNT: 80–120 words total. If it's longer, it's trying too hard.\nDO NOT: apology language ("just following up"), vague subject lines, value props that weren't already established in the previous conversation`,
          variableFields: [
            { key: 'context', label: 'Previous touchpoint', type: 'select', options: ['Pitch / presentation', 'Discovery call', 'Demo', 'Proposal sent', 'Conference meeting'], default_value: 'Pitch / presentation' },
          ],
        },
        {
          label: 'Newsletter or content email',
          description: `COPY BRIEF: ${name} {{newsletter_type}} email — {{frequency}} edition\n\nREADER CONTRACT: People subscribed to this email because they trust ${name} knows something worth reading. Honor that trust. Every edition must earn the next open.\nCONTENT HIERARCHY:\n  1. {{lead_story}} — the single most valuable thing in this edition. Give it most of the space.\n  2. Supporting items (2–3 max): Each earns inclusion by being genuinely useful, not just available.\nVOICE: [draw from ${name}'s tone_of_voice — editorial authority without academic distance]\nSUBJECT LINE: A headline, not a label. "The {{newsletter_type}} Newsletter" is not a subject line.\nFORMAT: Scannable. Headers, short paragraphs, clear CTAs. Readers read at decision points — make every section's value self-evident before they commit to reading it.\nDO NOT: content roundups that are just links, no-context announcements, a tone that shifts between editions`,
          variableFields: [
            { key: 'newsletter_type', label: 'Newsletter type', type: 'select', options: ['Industry insights', 'Company news', 'Product updates', 'Customer stories', 'Thought leadership'], default_value: 'Industry insights' },
            { key: 'frequency', label: 'Edition', type: 'select', options: ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'], default_value: 'Monthly' },
            { key: 'lead_story', label: 'Lead story or topic', type: 'text' },
          ],
        },
        {
          label: 'Event or webinar invitation',
          description: `COPY BRIEF: ${name} invitation email for "{{event_name}}"\n\nTHE INVITATION PROBLEM: Everyone is busy and nobody needs another event. This email must answer "why this, why now, why me" before the reader has to ask.\nEVENT: {{event_name}} — {{event_type}}\nAUDIENCE: {{audience}} — what they want from this kind of event, what their objection will be, what would make them immediately register\nSUBJECT LINE: The event as a benefit, not a description. What they'll walk away with, not what you're calling it.\nSTRUCTURE:\n  — Hook (1–2 sentences): Lead with the outcome, not the event details\n  — What and why (2–3 sentences): Specific agenda, specific value — not "a conversation about industry trends"\n  — Who (1 sentence): The credibility signal — speaker, participants, or the specific audience this is built for\n  — Logistics: Date, time, format — clear and scannable\n  — CTA: Single, clear register/RSVP action\nDO NOT: leading with speaker credentials nobody asked about, vague "thought leadership" framing, event description that sounds the same as every other event`,
          variableFields: [
            { key: 'event_name', label: 'Event name', type: 'text' },
            { key: 'event_type', label: 'Event type', type: 'select', options: ['Webinar', 'In-person conference', 'Workshop', 'Executive roundtable', 'Product launch', 'Social / reception'], default_value: 'Webinar' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['Prospects', 'Clients', 'Partners', 'Industry peers', 'Internal team'], default_value: 'Clients' },
          ],
        },
      ],
    },

    // ── Blog Post ─────────────────────────────────────────────────────────────
    {
      key: 'blog',
      label: 'Blog Post',
      formCategory: 'text',
      presets: [
        {
          label: 'Thought leadership article',
          description: `COPY BRIEF: ${name} thought leadership article — "{{topic}}"\n\nAUDIENCE: {{audience}} — what they already believe about {{topic}}, what frustrates them about the current discourse, what would make them share this article\nAUDIENCE MIND STATE: They've read twenty articles on {{topic}}. This one earns a read because it has a genuine point of view, not because it covers the topic.\nSINGLE-MINDED PROPOSITION: The one argument this article makes. Not a list of insights — one claim that ${name} is willing to stake a position on.\nSTRUCTURE:\n  — Headline: A claim, not a topic. "How AI Changes Marketing" is a topic. "AI Won't Replace Creative Thinking — It Will Make Average Thinking Extinct" is a claim.\n  — Opening (100–150 words): The problem or tension that makes this article necessary. Earned urgency.\n  — Argument ({{length}}): Evidence, reasoning, examples — specific over general. Primary research or direct experience preferred over secondary sourcing.\n  — Conclusion: The implication. What the reader should do differently, think differently, or see differently.\nVOICE: [draw from ${name}'s tone_of_voice — authoritative, direct, earned — never hedged or academic]\nDO NOT: "in today's landscape," "it goes without saying," articles that have no position`,
          variableFields: [
            { key: 'topic', label: 'Topic', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['CMOs / marketing leadership', 'Brand managers', 'Creative directors', 'Agency practitioners', 'General business'], default_value: 'CMOs / marketing leadership' },
            { key: 'length', label: 'Length', type: 'select', options: ['Short (500–800 words)', 'Standard (1000–1200 words)', 'Long-form (1500–2000 words)'], default_value: 'Standard (1000–1200 words)' },
          ],
        },
        {
          label: 'Case study',
          description: `COPY BRIEF: ${name} case study — {{client_or_project}}\n\nCASE STUDY TRUTH: The work is the argument. Numbers without story are boring. Story without numbers is unconvincing. This case study earns both.\nCLIENT / PROJECT: {{client_or_project}}\nBUSINESS PROBLEM: [the specific, real challenge — not "needed to grow brand awareness" but something with enough specificity to feel like a real brief]\nAPPROACH: [what ${name} did that was distinct — the strategic or creative decision that changed the trajectory]\nRESULT: {{result}} — specific, measurable, attributable to the work. Plus the qualitative shift the numbers don't capture.\nSTRUCTURE:\n  — Headline: The result, stated baldly\n  — Challenge (150–200 words): Context that makes the solution interesting\n  — Solution (200–300 words): The work, and why these choices and not others\n  — Results (100–150 words): Metrics + meaning\n  — Quote: One client voice, specific and unguarded\nVOICE: Direct, confident, client-generous. ${name}'s intelligence shows in the work, not in how we describe it.\nDO NOT: vague challenges, generic creative rationale, results presented without context`,
          variableFields: [
            { key: 'client_or_project', label: 'Client or project', type: 'text' },
            { key: 'result', label: 'Key result', type: 'text' },
          ],
        },
        {
          label: 'Trends analysis',
          description: `COPY BRIEF: ${name} trends analysis — "{{trend}}"\n\nDISTINCTION FROM TREND ROUNDUPS: This is not a list of things that are happening. It is an argument about what those things mean and what to do about them. ${name} has a point of view; this article expresses it.\nTREND: {{trend}}\nAUDIENCE CONTEXT: {{audience}} — what they need to understand about {{trend}} to make better decisions, not just to sound current in meetings\nARGUMENT STRUCTURE:\n  — What is actually happening (vs. what people think is happening)\n  — Why it matters more / less / differently than the mainstream narrative says\n  — What smart practitioners should do differently as a result\nSUPPORTING EVIDENCE: Original data, client experience, or specific market examples preferred over secondary research repackaging\nVOICE: Analyst authority + creative perspective. ${name}'s unique position at the intersection of strategy and craft.\nDO NOT: trend enumeration without analysis, predictions disguised as insights, hedged "it remains to be seen" conclusions`,
          variableFields: [
            { key: 'trend', label: 'Trend or shift', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['CMOs / marketing leadership', 'Brand teams', 'Agency leaders', 'Media and press', 'General business'], default_value: 'Brand teams' },
          ],
        },
        {
          label: 'Point of view piece',
          description: `COPY BRIEF: ${name} POV piece — "{{angle}}"\n\nPOV BRIEF: ${name} has a perspective worth arguing for. This piece makes that argument in public. It will not appeal to everyone; it will earn deep trust from the right people.\nANGLE: {{angle}} — [frame as a genuine claim that someone could disagree with, not a safe observation]\nAUDIENCE: {{audience}} — people who will either strongly agree and share it, or push back and engage. No one in the middle.\nARGUMENT:\n  — The claim (stated plainly in the first 100 words — no buildup)\n  — The evidence (specific, earned — not analogies and abstractions)\n  — The implication (what this means for how {{audience}} should think or act)\nTONE: {{tone}} — commit to it fully. A POV piece that hedges is a features article.\nVOICE: [draw from ${name}'s tone_of_voice — this is the brand's most direct public expression of what it believes]\nDO NOT: opening with a question, throat-clearing preamble, false balance ("on the other hand")`,
          variableFields: [
            { key: 'angle', label: 'Angle or thesis', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['Industry peers', 'Clients / prospects', 'Creative community', 'Business leadership', 'General'], default_value: 'Industry peers' },
            { key: 'tone', label: 'Tone', type: 'select', options: ['Provocative', 'Optimistic', 'Analytical', 'Empathetic', 'Urgent'], default_value: 'Optimistic' },
          ],
        },
      ],
    },

    // ── Presentation ──────────────────────────────────────────────────────────
    {
      key: 'presentation',
      label: 'Presentation',
      formCategory: 'presentation',
      presets: [
        {
          label: 'New business pitch',
          description: `PRESENTATION BRIEF: ${name} capabilities pitch for {{prospect}}\n\nPITCH OBJECTIVE: Leave the room with a clear next step, not just a positive feeling. This deck earns the right to continue the conversation.\nAUDIENCE: {{prospect}} — what they care about most, what they've heard a dozen times from competitors, what would actually surprise them\nPITCH STRUCTURE ({{length}}):\n  1. Opening insight (1–2 slides): An observation about {{prospect}}'s world that demonstrates we've done our homework — specific, not generic industry knowledge\n  2. POV / philosophy (1–2 slides): Why ${name} approaches work differently — our belief system, not our credentials\n  3. Capabilities proof (3–5 slides): The work that makes the case — chosen for relevance to {{prospect}}, not for awards won\n  4. Process (1–2 slides): How we work, specifically — concrete enough to build trust, not a generic "our process" chart\n  5. Team (1 slide): The specific people on this account — not the company roster\n  6. Next step (1 slide): What we're proposing, and a clear, low-friction ask\nDESIGN: [draw from ${name}'s visual_identity — deck should look like the brand, not like a PowerPoint template]\nDO NOT: slides that read like documents, logo parades, case study metrics without creative`,
          variableFields: [
            { key: 'prospect', label: 'Prospect or audience', type: 'text' },
            { key: 'length', label: 'Deck length', type: 'select', options: ['Short (8–10 slides)', 'Standard (15–20 slides)', 'Comprehensive (25+ slides)'], default_value: 'Standard (15–20 slides)' },
          ],
        },
        {
          label: 'Quarterly business review',
          description: `PRESENTATION BRIEF: ${name} {{quarter}} QBR deck for {{audience}}\n\nQBR OBJECTIVE: Tell the truth about the quarter in a way that builds confidence in the partnership — what worked, what didn't, and why the path forward is clear.\nAUDIENCE: {{audience}} — what they need to see to feel informed, reassured, and aligned on next quarter\nQBR STRUCTURE:\n  1. Quarter-in-summary (1 slide): The single defining narrative of this quarter — not a list\n  2. Performance vs. goals (2–3 slides): Metrics with context — the numbers plus the story behind the numbers\n  3. What worked (1–2 slides): Specific wins with attribution — what we did that drove the result\n  4. What we learned (1 slide): Honest assessment of what didn't land and what we know now\n  5. {{quarter}} forward (2–3 slides): Specific priorities with rationale, not a wishlist\n  6. Questions / discussion: Designed to invite real dialogue, not to close a presentation\nTONE: Confident and honest. Don't oversell good quarters or undersell the tough ones.\nDO NOT: 40 KPI slides, unexplained metrics, optimism that isn't grounded in evidence`,
          variableFields: [
            { key: 'quarter', label: 'Quarter', type: 'select', options: ['Q1', 'Q2', 'Q3', 'Q4'], default_value: 'Q2' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['Client leadership', 'Internal leadership', 'Board / investors', 'Cross-functional team'], default_value: 'Client leadership' },
          ],
        },
        {
          label: 'Strategy recommendation',
          description: `PRESENTATION BRIEF: ${name} strategy recommendation deck — "{{objective}}"\n\nSTRATEGY BRIEF OBJECTIVE: Make the right answer obvious. Not by overwhelming with data, but by framing the problem correctly, showing the work, and landing on a single clear recommendation.\nOBJECTIVE: {{objective}}\nAUDIENCE: {{audience}} — what they already believe, where they're uncertain, what would make them act on this recommendation\nDECK STRUCTURE:\n  1. The problem (1–2 slides): Frame the challenge — include what makes this problem harder than it looks\n  2. The context (2–3 slides): Relevant landscape — market, audience, competitive, performance — the evidence that makes the recommendation necessary\n  3. Strategic options (1–2 slides): What we could do — with clear-eyed tradeoffs, not straw men\n  4. The recommendation (1 slide): What we should do, stated plainly. One recommendation, not a framework.\n  5. The plan (2–3 slides): How we execute — with enough specificity to build confidence\n  6. Measurement (1 slide): How we know it's working — specific metrics against specific goals\nVOICE: Rigorous but readable. The smartest recommendation in the room, delivered like a conversation.\nDO NOT: 2×2 matrices as a substitute for a recommendation, strategic vagueness that sounds thoughtful but commits to nothing`,
          variableFields: [
            { key: 'objective', label: 'Strategic objective', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['Client C-suite', 'Marketing leadership', 'Internal leadership', 'Board / investors'], default_value: 'Marketing leadership' },
          ],
        },
        {
          label: 'Training or enablement session',
          description: `PRESENTATION BRIEF: ${name} {{topic}} training deck for {{audience}}\n\nTRAINING OBJECTIVE: By the end of this session, {{audience}} should be able to [specific behavior change or new capability] — not just know something, but do something differently.\nTOPIC: {{topic}}\nAUDIENCE: {{audience}} — their current knowledge level, what they find confusing or intimidating about {{topic}}, what would make this immediately useful\nSESSION STRUCTURE:\n  1. Why this matters (1 slide): The practical stakes — what becomes possible when they get this right\n  2. The core model or framework (1–2 slides): One clean mental model, not a taxonomy\n  3. Demonstration (2–4 slides): Show it working — real examples, not hypotheticals\n  4. Practice / application (2–3 slides): Guided application — structured exercises or scenarios that build confidence\n  5. Common mistakes (1 slide): The 3 things people get wrong and how to avoid them\n  6. Resources and next steps (1 slide): Where to go from here — specific, actionable\nDESIGN: Learning-optimized. Clean hierarchy. Every slide has one job.\nDO NOT: content that could have been an email, exercises that feel like homework, more content than can be absorbed in the session time`,
          variableFields: [
            { key: 'topic', label: 'Training topic', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['New hires', 'Full team', 'Leadership', 'Clients / external', 'Specific department'], default_value: 'Full team' },
          ],
        },
      ],
    },
  ];
}

interface DbPromptRow {
  name: string;
  category: string | null;
  prompt_template: string;
  variable_fields: unknown;
}

/** Auto-detect {{token}} placeholders in a template and add fields for any without existing entries */
function autoDetectVariableFields(template: string, existing: VariableField[] | undefined): VariableField[] | undefined {
  const tokens = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
  if (tokens.length === 0) return existing;

  const existingKeys = new Set((existing || []).map(f => f.key || f.name || ''));
  const missing = [...new Set(tokens)].filter(t => !existingKeys.has(t));
  if (missing.length === 0) return existing;

  const autoFields: VariableField[] = missing.map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: 'text' as const,
  }));

  return [...(existing || []), ...autoFields];
}

function parseVariableFields(raw: unknown): VariableField[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((f: Record<string, unknown>) => ({
    key: (f.key as string) || (f.name as string) || '',
    label: (f.label as string) || '',
    type: (f.type as VariableField['type']) || 'text',
    options: Array.isArray(f.options) ? f.options as string[] : undefined,
    default_value: (f.default_value as string) || undefined,
    required: f.required as boolean | undefined,
  })).filter(f => f.key && f.label);
}

export function useQuickStarters(brandId: string | null | undefined, brandName: string | null | undefined) {
  const [dbPrompts, setDbPrompts] = useState<DbPromptRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!brandId) {
      setDbPrompts([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from('creative_studio_brand_prompts')
      .select('name, category, prompt_template, variable_fields')
      .eq('brand_id', brandId)
      .order('usage_count', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[useQuickStarters] Failed to fetch:', error);
          setDbPrompts([]);
        } else {
          setDbPrompts(data || []);
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [brandId]);

  const categories = useMemo(() => {
    const fallbacks = buildGenericFallbacks(brandName || 'this brand');

    if (dbPrompts.length === 0) return fallbacks;

    // Group DB prompts by category
    const grouped = new Map<string, QuickStarterPreset[]>();
    for (const row of dbPrompts) {
      const cat = row.category || 'general';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push({
        label: row.name,
        description: row.prompt_template,
        variableFields: autoDetectVariableFields(row.prompt_template, parseVariableFields(row.variable_fields)),
      });
    }

    // Build categories: use DB data where available, generic fallback otherwise
    const standardKeys = Object.keys(STANDARD_CATEGORIES);
    const result: QuickStarterCategory[] = [];

    for (const key of standardKeys) {
      const dbPresets = grouped.get(key);
      if (dbPresets && dbPresets.length > 0) {
        const label = key === 'brand-overview'
          ? `Describe ${brandName || 'Brand'}`
          : STANDARD_CATEGORIES[key].label;
        result.push({
          key,
          label,
          formCategory: STANDARD_CATEGORIES[key].formCategory,
          presets: dbPresets,
        });
        grouped.delete(key);
      } else {
        // Use fallback for this standard category
        const fallback = fallbacks.find(f => f.key === key);
        if (fallback) result.push(fallback);
      }
    }

    // Append non-standard categories from the DB (e.g., product, lifestyle, cinematography)
    for (const [cat, presets] of grouped) {
      result.push({
        key: cat,
        label: displayLabelForCategory(cat),
        formCategory: formCategoryForDbCategory(cat),
        presets,
      });
    }

    return result;
  }, [dbPrompts, brandName]);

  return { categories, isLoading };
}
