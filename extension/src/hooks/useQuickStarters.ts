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
  social: { label: 'Social Graphic', formCategory: 'image' },
  hero: { label: 'Hero Image', formCategory: 'image' },
  cinematography: { label: 'Video / Cinematic', formCategory: 'image' },
  email: { label: 'Email Copy', formCategory: 'text' },
  blog: { label: 'Blog Post', formCategory: 'text' },
  presentation: { label: 'Presentation', formCategory: 'presentation' },
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
    {
      key: 'brand-overview',
      label: `Describe ${name}`,
      formCategory: 'general',
      presets: [
        {
          label: 'Full brand introduction',
          description: `Introduce ${name} to an AI tool — who they are, positioning, personality, and voice`,
          variableFields: [
            { key: 'tool', label: 'AI tool', type: 'select', options: ['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Adobe Firefly', 'Other'], default_value: 'Gemini' },
          ],
        },
        {
          label: 'Industry positioning',
          description: `Brief an AI tool on ${name}'s industry positioning and capabilities`,
          variableFields: [
            { key: 'tool', label: 'AI tool', type: 'select', options: ['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Adobe Firefly', 'Other'], default_value: 'Gemini' },
          ],
        },
        {
          label: 'Consumer positioning',
          description: `Brief an AI tool on ${name}'s consumer-facing positioning and approach`,
          variableFields: [
            { key: 'tool', label: 'AI tool', type: 'select', options: ['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Adobe Firefly', 'Other'], default_value: 'Gemini' },
          ],
        },
        {
          label: 'Voice guidelines',
          description: `Provide ${name} voice direction so an AI tool generates on-brand copy`,
          variableFields: [
            { key: 'tool', label: 'AI tool', type: 'select', options: ['ChatGPT', 'Gemini', 'Claude', 'Midjourney', 'Adobe Firefly', 'Other'], default_value: 'Gemini' },
            { key: 'content_type', label: 'Content type', type: 'select', options: ['Social copy', 'Email', 'Blog', 'Ad copy', 'General'], default_value: 'General' },
          ],
        },
      ],
    },
    {
      key: 'social',
      label: 'Social Graphic',
      formCategory: 'image',
      presets: [
        {
          label: 'Campaign promotion',
          description: `Social post promoting a new ${name} campaign — authentic, vibrant, human-centered imagery`,
          variableFields: [
            { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram Feed', 'Instagram Story', 'LinkedIn', 'Facebook', 'X / Twitter'], default_value: 'Instagram Feed' },
            { key: 'theme', label: 'Campaign theme', type: 'text' },
            { key: 'mood', label: 'Mood', type: 'select', options: ['Energetic', 'Warm', 'Bold', 'Minimal', 'Premium'], default_value: 'Energetic' },
          ],
        },
        {
          label: 'Thought leadership visual',
          description: `LinkedIn visual for ${name} featuring a bold data point or insight — clean, editorial layout`,
          variableFields: [
            { key: 'topic', label: 'Topic or insight', type: 'text' },
            { key: 'format', label: 'Format', type: 'select', options: ['Single image', 'Carousel', 'Infographic'], default_value: 'Single image' },
          ],
        },
        {
          label: 'Culture spotlight',
          description: `Instagram Story highlighting ${name} team culture, a new hire, or behind-the-scenes`,
          variableFields: [
            { key: 'subject', label: 'Subject', type: 'select', options: ['New hire', 'Team event', 'Behind-the-scenes', 'Office life', 'Community'], default_value: 'Behind-the-scenes' },
          ],
        },
        {
          label: 'Results announcement',
          description: `Social graphic announcing a ${name} case study result or award with key metrics`,
          variableFields: [
            { key: 'achievement', label: 'Achievement', type: 'text' },
            { key: 'platform', label: 'Platform', type: 'select', options: ['LinkedIn', 'Instagram Feed', 'X / Twitter'], default_value: 'LinkedIn' },
          ],
        },
      ],
    },
    {
      key: 'email',
      label: 'Email Copy',
      formCategory: 'text',
      presets: [
        {
          label: 'Follow-up email',
          description: `Follow-up email from ${name} after a pitch — confident, clear, reinforcing differentiators`,
          variableFields: [
            { key: 'recipient', label: 'Recipient type', type: 'select', options: ['Prospect', 'Current client', 'Partner', 'Vendor'], default_value: 'Prospect' },
            { key: 'context', label: 'What was discussed', type: 'text' },
          ],
        },
        {
          label: 'Campaign launch',
          description: `Client-facing email from ${name} announcing a campaign launch with milestones`,
          variableFields: [
            { key: 'campaign', label: 'Campaign name', type: 'text' },
            { key: 'tone', label: 'Tone', type: 'select', options: ['Exciting', 'Professional', 'Warm', 'Urgent'], default_value: 'Exciting' },
          ],
        },
        {
          label: 'Internal newsletter',
          description: `${name} company newsletter covering wins, new hires, and initiatives`,
          variableFields: [
            { key: 'highlights', label: 'Key highlights', type: 'text' },
          ],
        },
        {
          label: 'Event invitation',
          description: `Invitation email for a ${name} industry conference, webinar, or hosted event`,
          variableFields: [
            { key: 'event_type', label: 'Event type', type: 'select', options: ['Webinar', 'Conference', 'Workshop', 'Happy hour', 'Product launch'], default_value: 'Webinar' },
            { key: 'event_name', label: 'Event name', type: 'text' },
          ],
        },
      ],
    },
    {
      key: 'hero',
      label: 'Hero Image',
      formCategory: 'image',
      presets: [
        {
          label: 'Campaign landing page',
          description: `${name} landing page hero — warm, sophisticated, people-forward photography`,
          variableFields: [
            { key: 'campaign', label: 'Campaign or product', type: 'text' },
            { key: 'style', label: 'Photography style', type: 'select', options: ['Lifestyle', 'Studio', 'Environmental', 'Abstract', 'Product-focused'], default_value: 'Lifestyle' },
            { key: 'aspect', label: 'Aspect ratio', type: 'select', options: ['16:9 wide', '4:3 standard', '1:1 square', '21:9 ultra-wide'], default_value: '16:9 wide' },
          ],
        },
        {
          label: 'Capabilities page',
          description: `${name} hero image showing the intersection of capability, creativity, and strategy`,
          variableFields: [
            { key: 'capability', label: 'Capability area', type: 'text' },
            { key: 'mood', label: 'Mood', type: 'select', options: ['Innovative', 'Trustworthy', 'Bold', 'Warm'], default_value: 'Innovative' },
          ],
        },
        {
          label: 'Industry vertical',
          description: `${name} hero image for industry-specific content — empathetic, trust-forward`,
          variableFields: [
            { key: 'industry', label: 'Industry', type: 'text' },
          ],
        },
        {
          label: 'Lifestyle hero',
          description: `${name} hero image for consumer/lifestyle work — energetic, culturally tuned, bold`,
          variableFields: [
            { key: 'subject', label: 'Subject or scene', type: 'text' },
            { key: 'energy', label: 'Energy level', type: 'select', options: ['High energy', 'Relaxed', 'Aspirational', 'Playful'], default_value: 'High energy' },
          ],
        },
      ],
    },
    {
      key: 'cinematography',
      label: 'Video / Cinematic',
      formCategory: 'image',
      presets: [
        {
          label: 'Brand film opener',
          description: `${name} brand film opening — emotionally-driven, documentary feel, cinematic quality`,
          variableFields: [
            { key: 'subject', label: 'Subject or scene', type: 'text' },
            { key: 'beat', label: 'Emotional beat', type: 'select', options: ['Hopeful', 'Joyful', 'Determined', 'Intimate', 'Triumphant'], default_value: 'Hopeful' },
            { key: 'setting', label: 'Setting', type: 'select', options: ['Urban', 'Nature', 'Indoor', 'Mixed environments'], default_value: 'Urban' },
          ],
        },
        {
          label: 'Product showcase reel',
          description: `${name} product showcase — clean, precise, feature-forward cinematography`,
          variableFields: [
            { key: 'product', label: 'Product or service', type: 'text' },
            { key: 'feature', label: 'Key feature to highlight', type: 'text' },
            { key: 'environment', label: 'Environment', type: 'select', options: ['Studio', 'In-situ', 'Lifestyle context'], default_value: 'In-situ' },
          ],
        },
        {
          label: 'Culture / behind-the-scenes',
          description: `${name} culture or team moment — authentic, candid, human-forward`,
          variableFields: [
            { key: 'scene', label: 'Scene type', type: 'select', options: ['Team collaboration', 'Creative process', 'Community event', 'Milestone celebration'], default_value: 'Team collaboration' },
            { key: 'energy', label: 'Energy', type: 'select', options: ['Warm and intimate', 'Energetic and alive', 'Quiet and focused'], default_value: 'Warm and intimate' },
          ],
        },
        {
          label: 'Campaign :30 spot',
          description: `${name} campaign spot — 30-second narrative arc with strong opening, build, and CTA`,
          variableFields: [
            { key: 'theme', label: 'Campaign theme', type: 'text' },
            { key: 'mood', label: 'Mood', type: 'select', options: ['Inspirational', 'Bold', 'Playful', 'Cinematic drama', 'Documentary'], default_value: 'Inspirational' },
          ],
        },
      ],
    },
    {
      key: 'blog',
      label: 'Blog Post',
      formCategory: 'text',
      presets: [
        {
          label: 'Industry thought leadership',
          description: `Thought leadership article from ${name} on industry trends and transformation`,
          variableFields: [
            { key: 'topic', label: 'Topic', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['C-suite', 'Marketing leaders', 'Practitioners', 'General'], default_value: 'Marketing leaders' },
            { key: 'length', label: 'Length', type: 'select', options: ['Short (500 words)', 'Medium (1000 words)', 'Long (1500+ words)'], default_value: 'Medium (1000 words)' },
          ],
        },
        {
          label: 'Case study writeup',
          description: `${name} case study writeup — results-driven, specific metrics, clear narrative arc`,
          variableFields: [
            { key: 'client', label: 'Client or project', type: 'text' },
            { key: 'results', label: 'Key result', type: 'text' },
          ],
        },
        {
          label: 'Trends analysis',
          description: `Forward-looking trends analysis for the ${name} industry landscape`,
          variableFields: [
            { key: 'trend', label: 'Trend or topic', type: 'text' },
          ],
        },
        {
          label: 'Point of view piece',
          description: `${name} POV piece on the intersection of creativity and technology`,
          variableFields: [
            { key: 'angle', label: 'Angle or thesis', type: 'text' },
            { key: 'tone', label: 'Tone', type: 'select', options: ['Provocative', 'Optimistic', 'Analytical', 'Conversational'], default_value: 'Optimistic' },
          ],
        },
      ],
    },
    {
      key: 'presentation',
      label: 'Presentation',
      formCategory: 'presentation',
      presets: [
        {
          label: 'Quarterly review',
          description: `${name} QBR deck — performance metrics, strategic highlights, next-quarter priorities`,
          variableFields: [
            { key: 'quarter', label: 'Quarter', type: 'select', options: ['Q1', 'Q2', 'Q3', 'Q4'], default_value: 'Q1' },
            { key: 'focus', label: 'Focus area', type: 'text' },
          ],
        },
        {
          label: 'New business pitch',
          description: `${name} capabilities pitch — positioning, case studies, team, and approach`,
          variableFields: [
            { key: 'prospect', label: 'Prospect industry', type: 'text' },
            { key: 'slides', label: 'Deck length', type: 'select', options: ['Short (8-10 slides)', 'Standard (15-20 slides)', 'Comprehensive (25+ slides)'], default_value: 'Standard (15-20 slides)' },
          ],
        },
        {
          label: 'Strategy deck',
          description: `${name} strategy recommendation — insights, creative direction, media plan, KPIs`,
          variableFields: [
            { key: 'objective', label: 'Business objective', type: 'text' },
          ],
        },
        {
          label: 'Training session',
          description: `${name} internal enablement deck — clear structure, practical takeaways`,
          variableFields: [
            { key: 'topic', label: 'Training topic', type: 'text' },
            { key: 'audience', label: 'Audience', type: 'select', options: ['New hires', 'Full team', 'Leadership', 'Clients'], default_value: 'Full team' },
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
        variableFields: parseVariableFields(row.variable_fields),
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
