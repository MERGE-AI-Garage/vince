// ABOUTME: One-time backfill script — analyzes all untagged media images with Gemini Vision
// ABOUTME: Run with: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/backfill-media-tags.mjs

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    const env = {};
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) env[match[1].trim()] = match[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const fileEnv = loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || fileEnv.VITE_GEMINI_API_KEY;

// Delay between Gemini calls — stays well under free-tier rate limits
const DELAY_MS = 300;

// ── Validate config ────────────────────────────────────────────────────────
if (!SUPABASE_URL) {
  console.error('❌  SUPABASE_URL not found. Check .env or set SUPABASE_URL env var.');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set.');
  console.error('    Get it from: Supabase Dashboard → Settings → API → service_role key');
  console.error('    Run as: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/backfill-media-tags.mjs');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY not found. Check .env or set GEMINI_API_KEY env var.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ── Gemini analysis ────────────────────────────────────────────────────────
async function analyzeImage(imageUrl, mimeType, filename) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Fetch and convert to base64
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const prompt = `Analyze this image and provide a comprehensive analysis in JSON format:

{
  "altText": "A detailed, accessible description of the image (1-2 sentences)",
  "tags": ["array", "of", "10-15", "relevant", "keywords"],
  "dominantColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
  "detectedObjects": ["main", "subjects", "and", "objects"],
  "suggestedTitle": "Concise title (3-7 words)",
  "contentType": "photo|illustration|diagram|screenshot|document|other",
  "useCases": ["suggested", "use", "cases"],
  "isNSFW": false,
  "confidence": 0.95
}

Guidelines:
- tags: objects, colors, mood, style, composition (10-15 keywords)
- dominantColors: exactly 6 hex color codes
- suggestedTitle: short and descriptive
- contentType: classify the image type
- useCases: where this image works best (social media, blog, hero, etc)

Return ONLY the JSON object, no additional text.`;

  const result = await model.generateContent([
    { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64 } },
    { text: prompt },
  ]);

  let jsonText = result.response.text().trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '').trim();
  }

  const analysis = JSON.parse(jsonText);

  const usageMetadata = result.response.usageMetadata;
  const totalTokens = (usageMetadata?.promptTokenCount || 0) + (usageMetadata?.candidatesTokenCount || 0);
  const cost = (totalTokens / 1_000_000) * 0.25;

  return { ...analysis, cost, model: 'gemini-2.0-flash-exp' };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍  Fetching untagged images...\n');

  const { data: images, error } = await supabase
    .from('media')
    .select('id, filename, url, mime_type, custom_metadata')
    .eq('file_type', 'image')
    .is('auto_tags', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌  Failed to fetch images:', error.message);
    process.exit(1);
  }

  if (!images || images.length === 0) {
    console.log('✅  No untagged images found — nothing to do.');
    process.exit(0);
  }

  console.log(`📸  Found ${images.length} untagged image${images.length === 1 ? '' : 's'}\n`);

  let succeeded = 0;
  let failed = 0;
  let totalCost = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const num = `[${i + 1}/${images.length}]`;

    process.stdout.write(`${num} ${img.filename} ... `);

    try {
      const analysis = await analyzeImage(img.url, img.mime_type, img.filename);
      totalCost += analysis.cost || 0;

      const { error: updateError } = await supabase
        .from('media')
        .update({
          title: analysis.suggestedTitle,
          description: analysis.altText,
          auto_tags: analysis.tags,
          detected_objects: analysis.detectedObjects,
          dominant_colors: analysis.dominantColors,
          ai_analysis_cost: analysis.cost,
          ai_analysis_model: analysis.model,
          custom_metadata: {
            ...(img.custom_metadata || {}),
            ai_analysis: {
              content_type: analysis.contentType,
              use_cases: analysis.useCases,
              confidence: analysis.confidence,
              analyzed_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', img.id);

      if (updateError) throw updateError;

      console.log(`✅  ${analysis.tags?.slice(0, 4).join(', ')}`);
      succeeded++;
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }

    // Rate limit delay (skip after last item)
    if (i < images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅  ${succeeded} succeeded   ❌  ${failed} failed`);
  console.log(`💰  Estimated cost: $${totalCost.toFixed(4)}`);
  console.log('─────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
