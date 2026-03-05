// ABOUTME: Phase 0 validation script for Gemini interleaved output (text + images in one response).
// ABOUTME: Tests responseModalities: ['TEXT', 'IMAGE'] with brand context injection.

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const OUTPUT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), 'output');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BRAND_CONTEXT = `You are Vince, an AI creative director for Brand Lens.
You are currently working with the Google brand.

Brand DNA:
- Primary color: #4285F4 (Google Blue)
- Secondary colors: #EA4335 (Red), #FBBC04 (Yellow), #34A853 (Green)
- Typography: Google Sans (headlines), Roboto (body)
- Visual style: Clean, minimal, generous whitespace, product-forward
- Photography style: Bright, optimistic, diverse representation, real moments
- Tone: Helpful, approachable, technically confident

When generating creative content, ensure all imagery and copy reflects Google's brand identity.
Include headlines and body copy alongside each image.`;

const BRIEF = `Create a social media campaign for Google AI Studio targeting developers.
The campaign should feel technical but approachable.

Generate the following deliverables:
1. A hero banner image (wide format) with headline copy
2. An Instagram square post with caption
3. A vertical story image with overlay text

For each deliverable, write the headline/copy first, then generate the corresponding image.`;

async function runTest(testName, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent(config);
    const latency = Date.now() - startTime;

    console.log(`Latency: ${latency}ms (${(latency / 1000).toFixed(1)}s)`);

    if (!response.candidates?.[0]?.content?.parts) {
      console.log('No parts in response');
      console.log('Raw response:', JSON.stringify(response, null, 2).slice(0, 500));
      return { success: false, latency, error: 'No parts in response' };
    }

    const parts = response.candidates[0].content.parts;
    console.log(`Total parts: ${parts.length}`);

    let textCount = 0;
    let imageCount = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part.text) {
        textCount++;
        console.log(`\n  Part ${i}: TEXT (${part.text.length} chars)`);
        console.log(`  Preview: ${part.text.slice(0, 150).replace(/\n/g, ' ')}...`);
      } else if (part.inlineData) {
        imageCount++;
        const { mimeType, data } = part.inlineData;
        const sizeKB = Math.round(Buffer.from(data, 'base64').length / 1024);
        console.log(`\n  Part ${i}: IMAGE (${mimeType}, ${sizeKB}KB)`);

        // Save image to disk
        const ext = mimeType.split('/')[1] || 'png';
        const filename = `${testName.replace(/\s+/g, '-').toLowerCase()}-${imageCount}.${ext}`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
        console.log(`  Saved: ${filepath}`);
      } else {
        console.log(`\n  Part ${i}: UNKNOWN`, Object.keys(part));
      }
    }

    console.log(`\nSummary: ${textCount} text parts, ${imageCount} image parts`);
    console.log(`Latency: ${(latency / 1000).toFixed(1)}s`);

    // Token usage
    if (response.usageMetadata) {
      const usage = response.usageMetadata;
      console.log(`Tokens — prompt: ${usage.promptTokenCount}, response: ${usage.candidatesTokenCount}, total: ${usage.totalTokenCount}`);
    }

    return { success: true, latency, textCount, imageCount };
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`Error after ${latency}ms:`, err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
    }
    return { success: false, latency, error: err.message };
  }
}

// Test 1: Basic interleaved output with brand context
const test1 = await runTest('Interleaved with brand context', {
  model: 'gemini-3.1-flash-image-preview',
  contents: [{ role: 'user', parts: [{ text: BRIEF }] }],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    systemInstruction: BRAND_CONTEXT,
  },
});

// Test 2: With explicit aspect ratio
const test2 = await runTest('With 16:9 aspect ratio', {
  model: 'gemini-3.1-flash-image-preview',
  contents: [{ role: 'user', parts: [{ text: 'Generate a wide hero banner image for Google AI Studio. Developer audience. Include headline copy before the image.' }] }],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    systemInstruction: BRAND_CONTEXT,
    imageConfig: { aspectRatio: '16:9' },
  },
});

// Test 3: Square format
const test3 = await runTest('With 1:1 aspect ratio', {
  model: 'gemini-3.1-flash-image-preview',
  contents: [{ role: 'user', parts: [{ text: 'Generate a square Instagram post for Google AI Studio. Include caption copy before the image.' }] }],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    systemInstruction: BRAND_CONTEXT,
    imageConfig: { aspectRatio: '1:1' },
  },
});

// Test 4: Vertical story
const test4 = await runTest('With 9:16 aspect ratio', {
  model: 'gemini-3.1-flash-image-preview',
  contents: [{ role: 'user', parts: [{ text: 'Generate a vertical story image for Google AI Studio. Include overlay text suggestion before the image.' }] }],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    systemInstruction: BRAND_CONTEXT,
    imageConfig: { aspectRatio: '9:16' },
  },
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('RESULTS SUMMARY');
console.log('='.repeat(60));
const results = [
  { name: 'Interleaved (multi-image)', ...test1 },
  { name: '16:9 aspect ratio', ...test2 },
  { name: '1:1 aspect ratio', ...test3 },
  { name: '9:16 aspect ratio', ...test4 },
];

for (const r of results) {
  const status = r.success ? 'PASS' : 'FAIL';
  const details = r.success
    ? `${r.textCount} text, ${r.imageCount} images, ${(r.latency / 1000).toFixed(1)}s`
    : r.error;
  console.log(`  [${status}] ${r.name}: ${details}`);
}

console.log(`\nImages saved to: ${OUTPUT_DIR}`);
