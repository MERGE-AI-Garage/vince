// ABOUTME: Analyzes video content using Gemini video understanding.
// ABOUTME: Competitor mode: returns competitive intelligence + counter-campaign brief. Self-critique mode: returns product/UX feedback.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  video_url: string;
  brand_id?: string;
  analysis_context?: string;
  mode?: 'competitor' | 'self_critique';
}

interface CompetitiveAnalysis {
  competitor_summary: string;
  key_messages: string[];
  visual_style: string;
  target_audience: string;
  emotional_hooks: string[];
  weaknesses: string[];
  scenes: Array<{
    timestamp: string;
    scene_type: string;
    emotional_signal: string;
    marketing_intent: string;
  }>;
  campaign_directions: Array<{
    title: string;
    concept: string;
    emotional_angle: string;
    tagline: string;
  }>;
  counter_brief: string;
  counter_deliverables: Array<{
    name: string;
    description: string;
    deliverable_type: string;
    aspect_ratio: string;
  }>;
}

interface SelfCritiqueAnalysis {
  product_summary: string;
  ux_observations: string[];
  missed_opportunities: string[];
  demo_narrative_issues: string[];
  recommended_improvements: string[];
  demo_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { video_url, brand_id, analysis_context, mode = 'competitor' } = await req.json() as AnalyzeRequest;
    if (!video_url) throw new Error('video_url is required');
    if (mode === 'competitor' && !brand_id) throw new Error('brand_id is required for competitor mode');

    // Normalize YouTube URL formats to standard watch URL
    const normalizedUrl = normalizeVideoUrl(video_url);
    const ai = new GoogleGenAI({ apiKey });
    const startTime = Date.now();

    if (mode === 'self_critique') {
      return await handleSelfCritique(ai, normalizedUrl, startTime, corsHeaders);
    }

    // Competitor mode: fetch brand context
    const { data: brand } = await supabase
      .from('creative_studio_brands')
      .select('name, primary_color, secondary_color, visual_identity, brand_voice, brand_category')
      .eq('id', brand_id)
      .single();

    if (!brand) throw new Error('Brand not found');

    const { data: profile } = await supabase
      .from('creative_studio_brand_profiles')
      .select('visual_dna, photography_style, color_profile, brand_identity, tone_of_voice')
      .eq('brand_id', brand_id)
      .maybeSingle();

    const brandContext = buildBrandContext(brand, profile);

    const systemPrompt = `You are Vince, an expert AI creative director for Vince. You are analyzing a competitor's video to help the client craft a superior brand-aligned counter-campaign.

${brandContext}

Your job:
1. Analyze the competitor video's messaging, visual style, tone, emotional hooks, and scene-by-scene narrative arc
2. Identify their strategic weaknesses and where the client's brand can win
3. Generate 3 distinct campaign direction options (the user will pick one before generating assets)
4. Generate a complete counter-campaign brief that leverages the client's brand DNA

Always respond with valid JSON matching the schema exactly.`;

    const userPrompt = `Analyze this competitor video and generate a counter-campaign strategy for ${brand.name}.
${analysis_context ? `\nContext: ${analysis_context}` : ''}

Return a JSON object with this exact structure:
{
  "competitor_summary": "2-3 sentence summary of what this video is doing and who it's for",
  "key_messages": ["message 1", "message 2", "message 3"],
  "visual_style": "description of the visual style, color palette, production quality",
  "target_audience": "who this video is targeting",
  "emotional_hooks": ["hook 1", "hook 2"],
  "weaknesses": ["strategic weakness 1", "strategic weakness 2", "strategic weakness 3"],
  "scenes": [
    {
      "timestamp": "0:00–0:06",
      "scene_type": "Product reveal",
      "emotional_signal": "anticipation",
      "marketing_intent": "Establish hero product positioning"
    }
  ],
  "campaign_directions": [
    {
      "title": "Direction name (3-5 words)",
      "concept": "1-2 sentence description of this campaign approach",
      "emotional_angle": "The core emotion this direction targets",
      "tagline": "A punchy 5-7 word tagline for this direction"
    },
    {
      "title": "Second direction name",
      "concept": "1-2 sentence description of the second approach",
      "emotional_angle": "The core emotion this direction targets",
      "tagline": "A punchy 5-7 word tagline"
    },
    {
      "title": "Third direction name",
      "concept": "1-2 sentence description of the third approach",
      "emotional_angle": "The core emotion this direction targets",
      "tagline": "A punchy 5-7 word tagline"
    }
  ],
  "counter_brief": "A complete 2-3 paragraph creative brief for a counter-campaign that leverages ${brand.name}'s brand DNA. Be specific about the strategy, tone, and visual direction.",
  "counter_deliverables": [
    {
      "name": "Hero Banner",
      "description": "Brief description of what this specific deliverable should show/say",
      "deliverable_type": "display_banner",
      "aspect_ratio": "16:9"
    },
    {
      "name": "Social Story",
      "description": "Brief description",
      "deliverable_type": "social_story",
      "aspect_ratio": "9:16"
    },
    {
      "name": "LinkedIn Post",
      "description": "Brief description",
      "deliverable_type": "linkedin_post",
      "aspect_ratio": "4:3"
    }
  ]
}

Generate exactly 3 campaign_directions. Generate scene entries for each distinct scene you can identify.`;

    console.log('[analyze-competitor-video] Calling Gemini competitor mode, URL:', normalizedUrl);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { fileData: { mimeType: 'video/mp4', fileUri: normalizedUrl } },
            { text: userPrompt },
          ],
        },
      ],
      config: { systemInstruction: systemPrompt, temperature: 0.7 },
    });

    const latencyMs = Date.now() - startTime;
    const text = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
    console.log('[analyze-competitor-video] Response length:', text.length);

    let analysis: CompetitiveAnalysis;
    try {
      const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`Failed to parse analysis. Raw response: ${text.slice(0, 200)}`);
      analysis = JSON.parse(match[0]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand_name: brand.name,
        video_url: normalizedUrl,
        analysis,
        latency_ms: latencyMs,
        model: 'gemini-2.0-flash',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Competitor video analysis error:', error?.message || error, error?.status, error?.statusText);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function handleSelfCritique(
  ai: GoogleGenAI,
  videoUrl: string,
  startTime: number,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const systemPrompt = `You are watching a screen recording demo of an AI creative director product called Vince (Vince).
Analyze it as a product designer, UX critic, creative director, and AI engineer combined.
Be direct, specific, and actionable. Cite timestamps where possible.
Always respond with valid JSON matching the schema exactly.`;

  const userPrompt = `Watch this Vince demo recording and provide structured product feedback.

Return a JSON object with this exact structure:
{
  "product_summary": "2-3 sentence overall impression of the demo and product experience",
  "demo_score": 75,
  "ux_observations": [
    "Specific UX friction or confusion moment with timestamp if possible"
  ],
  "missed_opportunities": [
    "Feature or capability that wasn't shown but would have strengthened the demo"
  ],
  "demo_narrative_issues": [
    "Pacing problem, unclear explanation, or weak hook moment"
  ],
  "recommended_improvements": [
    "Specific actionable improvement with enough detail to act on"
  ]
}

demo_score is 0-100 where 100 = flawless demo that clearly communicates product value.
Provide 3-5 items in each array. Be honest and specific, not generic.`;

  console.log('[analyze-competitor-video] Calling Gemini self_critique mode, URL:', videoUrl);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { mimeType: 'video/mp4', fileUri: videoUrl } },
          { text: userPrompt },
        ],
      },
    ],
    config: { systemInstruction: systemPrompt, temperature: 0.6 },
  });

  const latencyMs = Date.now() - startTime;
  const text = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '';
  console.log('[analyze-competitor-video] Self-critique response length:', text.length);

  let analysis: SelfCritiqueAnalysis;
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    analysis = JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Failed to parse self-critique. Raw response: ${text.slice(0, 200)}`);
    analysis = JSON.parse(match[0]);
  }

  return new Response(
    JSON.stringify({
      success: true,
      mode: 'self_critique',
      video_url: videoUrl,
      analysis,
      latency_ms: latencyMs,
      model: 'gemini-2.0-flash',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

function normalizeVideoUrl(url: string): string {
  // youtu.be/ID → youtube.com/watch?v=ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/watch?v=${shortMatch[1]}`;

  // Already a full YouTube URL — return as-is
  if (url.includes('youtube.com/watch')) return url;

  // Other video URLs — return as-is (Gemini supports direct video file URLs too)
  return url;
}

function buildBrandContext(
  brand: Record<string, unknown>,
  profile: Record<string, unknown> | null,
): string {
  const lines: string[] = [
    `## Our Brand: ${brand.name}`,
    `Category: ${brand.brand_category || 'General'}`,
    `Primary Color: ${brand.primary_color}`,
    `Secondary Color: ${brand.secondary_color}`,
  ];

  if (brand.visual_identity) {
    lines.push(`Visual Identity: ${brand.visual_identity}`);
  }

  if (brand.brand_voice) {
    lines.push(`Brand Voice: ${brand.brand_voice}`);
  }

  if (profile?.visual_dna && typeof profile.visual_dna === 'object') {
    const dna = profile.visual_dna as Record<string, unknown>;
    if (dna.signature_style) lines.push(`Signature Style: ${dna.signature_style}`);
    if (dna.dos) lines.push(`Visual Dos: ${(dna.dos as string[]).join('; ')}`);
    if (dna.donts) lines.push(`Visual Don'ts: ${(dna.donts as string[]).join('; ')}`);
  }

  if (profile?.tone_of_voice && typeof profile.tone_of_voice === 'object') {
    const tone = profile.tone_of_voice as Record<string, unknown>;
    if (tone.personality) lines.push(`Tone: ${tone.personality}`);
  }

  return lines.join('\n');
}
