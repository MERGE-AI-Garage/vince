// ABOUTME: Gemini Vision API client for analyzing media images
// ABOUTME: Extracts tags, objects, colors, alt text, and SynthID watermark detection

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SynthIDResult {
  detected: boolean;
  confidence: number;
  generatedBy?: string;
  details?: string;
}

export interface MediaAnalysisResult {
  altText: string;
  tags: string[];
  dominantColors: string[];
  detectedObjects: string[];
  suggestedTitle: string;
  contentType: 'photo' | 'illustration' | 'diagram' | 'screenshot' | 'document' | 'other';
  useCases: string[];
  isNSFW: boolean;
  confidence: number;
  cost: number;
  model: string;
  synthId?: SynthIDResult;
}

let genAI: GoogleGenerativeAI | null = null;

export function initializeGeminiVision(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export function isGeminiInitialized(): boolean {
  return genAI !== null;
}

/**
 * Detect SynthID watermark in an image using Gemini
 */
export async function detectSynthID(
  imageData: string,
  mimeType: string
): Promise<SynthIDResult> {
  if (!genAI) {
    throw new Error('Gemini Vision not initialized. Call initializeGeminiVision first.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this image and determine if it contains a SynthID watermark (invisible watermark embedded by Google AI image generation tools like Imagen 3).

Answer these questions in JSON format:
{
  "hasSynthID": true/false,
  "confidence": 0.0-1.0,
  "generatedBy": "Name of the AI model if detected (e.g., 'Imagen 3', 'Gemini', 'Unknown')",
  "details": "Brief explanation of how you determined this"
}

SynthID watermarks are invisible digital watermarks embedded directly into images by Google DeepMind's AI models. They survive cropping, compression, filters, and screenshots.

Important: Only indicate hasSynthID as true if you can confirm this image was created by Google AI tools with SynthID watermarking. Be conservative - if uncertain, return false.

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageData.split(',')[1] || imageData,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const detection = JSON.parse(jsonText);

    return {
      detected: detection.hasSynthID || false,
      confidence: detection.confidence || 0,
      generatedBy: detection.generatedBy || undefined,
      details: detection.details || undefined,
    };
  } catch (error) {
    console.error('SynthID detection error:', error);
    return {
      detected: false,
      confidence: 0,
    };
  }
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
  imageData: string,
  mimeType: string,
  filename: string
): Promise<MediaAnalysisResult> {
  if (!genAI) {
    throw new Error('Gemini Vision not initialized. Call initializeGeminiVision first.');
  }

  try {
    const modelName = 'gemini-2.0-flash-exp';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Analyze this image and provide a comprehensive analysis in JSON format with the following structure:

{
  "altText": "A detailed, accessible description of the image (1-2 sentences, suitable for screen readers)",
  "tags": ["array", "of", "relevant", "keywords", "and", "tags"],
  "dominantColors": ["color1", "color2", "color3", "color4", "color5", "color6"],
  "detectedObjects": ["list", "of", "main", "objects", "or", "subjects"],
  "suggestedTitle": "A concise title for this image",
  "contentType": "photo|illustration|diagram|screenshot|document|other",
  "useCases": ["suggested", "use", "cases", "like", "social media header", "blog post", "etc"],
  "isNSFW": false,
  "confidence": 0.95
}

Guidelines:
- altText: Make it descriptive, accessible, and SEO-friendly
- tags: Include 10-15 relevant tags (objects, colors, mood, style, composition)
- dominantColors: List exactly 6 hex color codes representing the most prominent colors in the image
- detectedObjects: Main subjects or objects in the image
- suggestedTitle: Short, descriptive title (3-7 words)
- contentType: Classify the image type
- useCases: Where this image would work well (marketing, social media, documentation, etc)
- isNSFW: Flag if content is inappropriate
- confidence: Your confidence in this analysis (0-1)

Return ONLY the JSON object, no additional text.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageData.split(',')[1] || imageData,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const analysis = JSON.parse(jsonText);

    // Calculate cost based on usage metadata
    const usageMetadata = result.response.usageMetadata;
    let cost = 0;
    if (usageMetadata) {
      const totalTokens = (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0);
      // gemini-2.0-flash pricing: $0.10/M input + $0.40/M output = avg $0.25/M tokens
      cost = (totalTokens / 1000000) * 0.25;
    }

    const synthIdResult = await detectSynthID(imageData, mimeType);

    return {
      ...analysis,
      cost,
      model: modelName,
      synthId: synthIdResult,
    };
  } catch (error) {
    console.error('Gemini Vision analysis error:', error);
    return {
      altText: `Image: ${filename}`,
      tags: ['untagged'],
      dominantColors: [],
      detectedObjects: [],
      suggestedTitle: filename.replace(/\.[^/.]+$/, ''),
      contentType: 'other',
      useCases: [],
      isNSFW: false,
      confidence: 0,
      cost: 0,
      model: 'gemini-2.0-flash-exp',
      synthId: undefined,
    };
  }
}
