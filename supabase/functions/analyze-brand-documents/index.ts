// ABOUTME: Edge Function that analyzes brand documents (PDFs, PPTX, text) using Gemini
// ABOUTME: Extracts structured brand data matching brand_profiles schema for each document

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { getPromptWithModel } from '../_shared/prompt-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentInput {
  content: string;            // base64 data, storage URL, or plain text
  content_type: 'pdf' | 'pptx' | 'docx' | 'text' | 'image';
  mime_type: string;
  filename: string;
  document_type_hint?: string;
}

interface AnalyzeDocumentsRequest {
  brand_id: string;
  documents: DocumentInput[];
  classify_only?: boolean;
}

const FALLBACK_DOCUMENT_ANALYSIS_PROMPT = `You are a brand strategist analyzing a client document. Extract all brand-relevant information into structured JSON.

Return ONLY valid JSON with these sections.
CRITICAL: For sections NOT applicable to this document type, return null — NOT empty objects like {}. Only populate sections where the document explicitly contains relevant information.

{
  "photography_style": { "aperture": "", "focal_length": "", "lighting": "", "color_temp": "", "depth_of_field": "", "philosophy": "", "rules": [], "retouching_guidelines": {} },
  "composition_rules": { "layouts": [], "angles": {}, "aspect_ratios": {}, "template_specs": {} },
  "product_catalog": { "categories": {}, "products": {}, "ingredient_inventory": {} },
  "brand_identity": { "tagline": "", "values": [], "aesthetic": "", "positioning": "", "target_audience": "", "visual_language": "" },
  "tone_of_voice": { "formality": "", "personality": [], "energy": "", "sensory_language": [], "copy_guidelines": {} },
  "color_profile": { "brand_colors": [{ "name": "Color Name", "hex": "#000000", "rgb": "R,G,B", "cmyk": "C,M,Y,K", "pms": "PMS 123 C", "role": "primary|secondary|accent" }], "saturation": "", "forbidden": [] },
  "visual_dna": { "primary_elements": [], "secondary_elements": [], "forbidden_elements": [] },
  "typography": { "primary_font": "", "secondary_font": "", "hierarchy": {} },
  "brand_story": {
    "narrative_summary": "One paragraph synthesis of the brand's corporate narrative",
    "mission_vision": { "mission": "", "vision": "", "purpose": "" },
    "heritage": { "founding_story": "", "milestones": [], "legacy": "" },
    "sustainability": { "environmental": "", "social": "", "governance": "", "goals": [] },
    "innovation": { "approach": "", "differentiators": [], "technology": "" },
    "culture": { "values_in_practice": "", "employee_experience": "", "dei": "" },
    "community": { "partnerships": [], "programs": "", "impact_metrics": "" },
    "customer_focus": { "promise": "", "experience": "", "testimonial_themes": [] },
    "competitive_position": { "market_position": "", "key_differentiators": [], "awards": [] }
  },
  "document_summary": "2-3 sentence summary of what this document covers",
  "document_type": "photography_guide | brand_style_guide | product_catalog | template_spec | corporate_brochure | csr_report | annual_report | pitch_deck | dei_report | investor_presentation | capabilities_overview | general",
  "confidence": 0.0
}

DOCUMENT-TYPE EXTRACTION FOCUS:
Based on the document type, pay special attention to these sections and return null for sections outside the focus area unless explicitly covered:
- csr_report / dei_report: brand_story (sustainability, culture, community). Return null for photography_style, composition_rules, typography, visual_dna, color_profile.
- annual_report / investor_presentation: brand_story (mission_vision, heritage, innovation, competitive_position). Return null for photography_style, composition_rules.
- pitch_deck / capabilities_overview: brand_story (innovation, customer_focus, competitive_position). Return null for photography_style, composition_rules, typography.
- corporate_brochure: brand_story (narrative_summary, mission_vision, heritage, culture), brand_identity, tone_of_voice. Return null for photography_style, composition_rules, typography, visual_dna, color_profile unless the brochure explicitly covers visual standards.
- brand_style_guide: Focus on visual sections (photography_style, color_profile, composition_rules, typography, visual_dna). brand_story is secondary.
- product_catalog: Focus on product_catalog section. brand_story is secondary.

Be thorough. Extract specific numbers (dimensions in pixels, aperture values, color hex codes, ingredient lists). Do not generalize — capture the exact specifications from the document.

ARRAY COMPLETENESS MANDATE:
For array fields (milestones, differentiators, awards, goals, partnerships, values, testimonial_themes, products), extract EVERY item found in the document — not just highlights or a representative sample. If a document contains a timeline with 15 milestones, return all 15. Format milestones as "YEAR: Description" strings. Completeness is more valuable than brevity.`;

// Hard whitelist: which profile sections each document type is allowed to populate.
// Prevents corporate brochures from injecting visual identity data (photography, colors, typography)
// and prevents brand style guides from overriding corporate narrative data.
const DOCUMENT_TYPE_ALLOWED_SECTIONS: Record<string, string[]> = {
  corporate_brochure:      ['brand_story', 'brand_identity', 'tone_of_voice'],
  csr_report:              ['brand_story'],
  dei_report:              ['brand_story'],
  annual_report:           ['brand_story', 'brand_identity'],
  investor_presentation:   ['brand_story', 'brand_identity'],
  pitch_deck:              ['brand_story', 'brand_identity', 'tone_of_voice'],
  capabilities_overview:   ['brand_story', 'brand_identity', 'tone_of_voice', 'product_catalog'],
  product_catalog:         ['product_catalog', 'brand_identity'],
  photography_guide:       ['photography_style', 'composition_rules', 'visual_dna'],
  brand_style_guide:       ['photography_style', 'composition_rules', 'color_profile', 'visual_dna', 'typography', 'brand_identity', 'tone_of_voice', 'brand_story'],
  template_spec:           ['composition_rules', 'typography'],
  // 'general' is intentionally absent — all sections allowed
};

// Metadata keys that are always kept regardless of document type
const ALWAYS_KEPT_KEYS = ['document_summary', 'document_type', 'confidence'];

function filterByDocumentType(analysis: Record<string, unknown>, documentType: string): Record<string, unknown> {
  const allowed = DOCUMENT_TYPE_ALLOWED_SECTIONS[documentType];
  if (!allowed) return analysis; // 'general' or unknown — keep everything

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(analysis)) {
    if (ALWAYS_KEPT_KEYS.includes(key) || allowed.includes(key)) {
      filtered[key] = value;
    } else {
      filtered[key] = null; // Explicitly null out disallowed sections
    }
  }
  return filtered;
}

// Convert ArrayBuffer to base64 in chunks to avoid stack overflow on large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

const CLASSIFICATION_PROMPT = `You are a document classifier. Given a document, classify it into one of these categories:
- general: Generic brand or marketing material
- photography_guide: Photography direction, shot lists, camera settings
- brand_style_guide: Brand identity, visual standards, logo usage
- product_catalog: Product descriptions, SKUs, ingredient lists
- template_spec: Layout templates, specifications, design grids
- corporate_brochure: Company mission, about us, corporate overview, history
- csr_report: Corporate social responsibility, sustainability report, ESG disclosure
- annual_report: Annual report, integrated report, year in review
- pitch_deck: Sales pitch, business development deck, partnership proposal
- dei_report: Diversity, equity and inclusion report, workforce demographics
- investor_presentation: Investor day, earnings presentation, shareholder materials
- capabilities_overview: Capabilities brochure, services overview, what we do

Return ONLY valid JSON: {"document_type": "category_name", "confidence": 0.0, "reason": "Brief explanation"}`;

// Resolve document content into Gemini-ready parts
async function resolveDocumentParts(
  doc: DocumentInput,
  supabaseUrl: string,
  supabaseServiceKey: string,
): Promise<Array<Record<string, unknown>>> {
  const parts: Array<Record<string, unknown>> = [];

  // Plain text content — send as text part
  if (doc.content_type === 'text' || doc.mime_type === 'text/plain' || doc.mime_type === 'text/markdown') {
    parts.push({ text: `Document: ${doc.filename}\n\n${doc.content}` });
    return parts;
  }

  // URL to Supabase Storage or external — fetch and convert to base64
  if (doc.content.startsWith('http://') || doc.content.startsWith('https://')) {
    const fetchHeaders: Record<string, string> = {};

    // Add service role auth for Supabase Storage URLs
    if (doc.content.includes(supabaseUrl)) {
      fetchHeaders['Authorization'] = `Bearer ${supabaseServiceKey}`;
    }

    const response = await fetch(doc.content, { headers: fetchHeaders });
    if (!response.ok) {
      throw new Error(`Failed to fetch document from storage: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const mimeType = doc.mime_type || response.headers.get('content-type') || 'application/pdf';

    parts.push({
      inlineData: { mimeType, data: base64 },
    });
    parts.push({
      text: `This is "${doc.filename}"${doc.document_type_hint ? ` (type: ${doc.document_type_hint})` : ''}. Extract all brand-relevant data according to the system instructions.`,
    });
    return parts;
  }

  // Base64-encoded content — use directly as inlineData
  if (doc.content.startsWith('data:')) {
    const [header, data] = doc.content.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1] || doc.mime_type || 'application/pdf';
    parts.push({
      inlineData: { mimeType, data },
    });
  } else {
    // Raw base64 string (no data: prefix)
    parts.push({
      inlineData: { mimeType: doc.mime_type || 'application/pdf', data: doc.content },
    });
  }

  parts.push({
    text: `This is "${doc.filename}"${doc.document_type_hint ? ` (type: ${doc.document_type_hint})` : ''}. Extract all brand-relevant data according to the system instructions.`,
  });

  return parts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch configurable prompt from DB, fall back to hardcoded
    const promptData = await getPromptWithModel(supabase, 'brand-document-analysis');
    const basePrompt = promptData?.prompt.prompt_text || FALLBACK_DOCUMENT_ANALYSIS_PROMPT;

    // Verify auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: AnalyzeDocumentsRequest = await req.json();
    const { brand_id, documents, classify_only } = body;

    if (!brand_id || !documents?.length) {
      return new Response(JSON.stringify({ error: 'brand_id and documents are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Lightweight classification mode: classify documents without full extraction ---
    if (classify_only) {
      console.log(`[Document Analyzer] Classification-only mode for ${documents.length} document(s)`);
      const modelName = promptData?.modelConfig?.model_name || 'gemini-3-flash-preview';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

      const classifications: Array<{
        filename: string;
        document_type: string;
        confidence: number;
        reason: string;
      }> = [];

      for (const doc of documents) {
        try {
          const docParts = await resolveDocumentParts(doc, supabaseUrl, supabaseServiceKey);
          const payload = {
            contents: [{ role: 'user', parts: docParts }],
            systemInstruction: { parts: [{ text: CLASSIFICATION_PROMPT }] },
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 256,
              responseMimeType: 'application/json',
            },
          };

          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            classifications.push({ filename: doc.filename, document_type: 'general', confidence: 0, reason: 'Classification failed' });
            continue;
          }

          const data = await response.json();
          const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textContent) {
            const parsed = JSON.parse(textContent);
            classifications.push({
              filename: doc.filename,
              document_type: parsed.document_type || 'general',
              confidence: parsed.confidence || 0,
              reason: parsed.reason || '',
            });
          } else {
            classifications.push({ filename: doc.filename, document_type: 'general', confidence: 0, reason: 'No response' });
          }
        } catch (err: any) {
          console.error(`[Document Analyzer] Classification failed for ${doc.filename}:`, err);
          classifications.push({ filename: doc.filename, document_type: 'general', confidence: 0, reason: err.message || 'Error' });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        classify_only: true,
        classifications,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Document Analyzer] Starting analysis of ${documents.length} document(s) for brand ${brand_id}`);

    const results: Array<{
      filename: string;
      analysis: Record<string, unknown>;
      document_type: string;
      document_summary: string;
      error?: string;
    }> = [];

    // Process documents sequentially — each can be large, and Gemini needs full context per doc
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      console.log(`[Document Analyzer] Processing ${i + 1}/${documents.length}: ${doc.filename} (${doc.content_type}, hint: ${doc.document_type_hint || 'none'})`);

      try {
        // Resolve content into Gemini-ready parts
        const docParts = await resolveDocumentParts(doc, supabaseUrl, supabaseServiceKey);

        // Build prompt with document type hint if provided
        let systemPrompt = basePrompt;
        if (doc.document_type_hint && doc.document_type_hint !== 'general') {
          systemPrompt += `\n\nThis document is specifically a ${doc.document_type_hint.replace(/_/g, ' ')}. Pay special attention to extracting data relevant to this document type.`;
        }

        // Call Gemini for document understanding + structured extraction
        const modelName = promptData?.modelConfig?.model_name || 'gemini-3-flash-preview';
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

        const payload = {
          contents: [{
            role: 'user',
            parts: docParts,
          }],
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.3,
            topP: 0.85,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        };

        // Abort Gemini call at 120s to stay within Supabase's 150s edge function limit
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);

        let response: Response;
        try {
          response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          if (fetchErr.name === 'AbortError') {
            throw new Error(`Gemini analysis timed out after 120s for ${doc.filename}. The document may be too large — try splitting it into smaller sections.`);
          }
          throw fetchErr;
        }
        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Document Analyzer] Gemini API rejected ${doc.filename}: ${response.status} — ${errorText.slice(0, 500)}`);
          results.push({
            filename: doc.filename,
            analysis: {},
            document_type: doc.document_type_hint || 'unknown',
            document_summary: '',
            error: `Gemini API error: ${response.status}`,
          });
          continue;
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
          results.push({
            filename: doc.filename,
            analysis: {},
            document_type: doc.document_type_hint || 'unknown',
            document_summary: '',
            error: 'No content in Gemini response',
          });
          continue;
        }

        // Parse JSON response
        let analysis: Record<string, unknown>;
        try {
          analysis = JSON.parse(textContent);
        } catch {
          // Try to extract JSON from markdown code block
          const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[1].trim());
          } else {
            throw new Error('Failed to parse analysis JSON');
          }
        }

        const geminiType = (analysis.document_type as string) || 'general';
        // Honor user-confirmed classification for filtering; fall back to Gemini's classification
        const documentType = doc.document_type_hint && doc.document_type_hint !== 'general'
          ? doc.document_type_hint
          : geminiType;
        if (geminiType !== documentType) {
          console.log(`[Document Analyzer] ${doc.filename}: type mismatch — hint=${doc.document_type_hint}, extracted=${geminiType} — using hint for filtering`);
        }
        const documentSummary = (analysis.document_summary as string) || '';
        const confidence = (analysis.confidence as number) || 0;

        // Filter out sections not allowed for this document type
        const filteredAnalysis = filterByDocumentType(analysis, documentType);

        const allowedSections = DOCUMENT_TYPE_ALLOWED_SECTIONS[documentType];
        if (allowedSections) {
          console.log(`[Document Analyzer] ${doc.filename}: type=${documentType}, allowed sections: [${allowedSections.join(', ')}]`);
        }
        console.log(`[Document Analyzer] ${doc.filename}: type=${documentType}, confidence=${confidence}, summary=${documentSummary.slice(0, 100)}`);

        results.push({
          filename: doc.filename,
          analysis: filteredAnalysis,
          document_type: documentType,
          document_summary: documentSummary,
        });

        // Small delay between documents to avoid rate limits
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (err: any) {
        console.error(`[Document Analyzer] Error processing ${doc.filename}:`, err);
        results.push({
          filename: doc.filename,
          analysis: {},
          document_type: doc.document_type_hint || 'unknown',
          document_summary: '',
          error: err.message || 'Processing failed',
        });
      }
    }

    // Store successful results in database
    const analysisRecords = results
      .filter(r => !r.error)
      .map(r => ({
        brand_id,
        source_image_url: r.filename,
        source_type: 'document',
        analysis_data: r.analysis,
        tags: [
          'document-analysis',
          r.document_type,
          ...r.filename.toLowerCase().replace(/[^a-z0-9]+/g, '-').split('-').filter(Boolean).slice(0, 3),
        ],
        analyzed_by: user.id,
      }));

    let savedCount = analysisRecords.length;
    let insertErrors: string[] = [];

    if (analysisRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('creative_studio_brand_analyses')
        .insert(analysisRecords);

      if (insertError) {
        console.error('[Document Analyzer] Batch insert failed, retrying individually:', insertError.message);
        savedCount = 0;
        for (const record of analysisRecords) {
          const { error } = await supabase
            .from('creative_studio_brand_analyses')
            .insert(record);
          if (error) {
            console.error(`[Document Analyzer] Insert failed for ${record.source_image_url}:`, error.message);
            insertErrors.push(`${record.source_image_url}: ${error.message}`);
          } else {
            savedCount++;
          }
        }
      }
    }

    // Audit log (non-blocking)
    await supabase.from('creative_studio_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'analyze_brand_documents',
      brand_id,
      parameters: {
        document_count: documents.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        saved: savedCount,
        insert_errors: insertErrors.length > 0 ? insertErrors : undefined,
        document_types: results.map(r => r.document_type),
        filenames: documents.map(d => d.filename),
      },
    }).then(({ error }) => { if (error) console.error('[Document Analyzer] Audit log insert failed:', error.message); });

    // Fail the response if zero records were saved
    if (savedCount === 0 && analysisRecords.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Analysis completed but failed to save results: ${insertErrors.join('; ')}`,
        total: documents.length,
        analyzed: results.filter(r => !r.error).length,
        saved: 0,
        insert_errors: insertErrors,
        results,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      total: documents.length,
      analyzed: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      saved: savedCount,
      insert_errors: insertErrors.length > 0 ? insertErrors : undefined,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Document Analyzer] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Document analysis failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
