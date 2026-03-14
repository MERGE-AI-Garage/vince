// ABOUTME: Extracts product catalog data from a URL and merges it into the brand profile
// ABOUTME: Updates ONLY the product_catalog field — never touches brand identity, voice, or visual DNA

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractProductCatalogRequest {
  url: string;
  brand_id: string;
}

interface ProductEntry {
  name: string;
  variants?: string[];
  styling_rules?: string[];
  required_elements?: string[];
  forbidden_elements?: string[];
  visual_description?: string;
}

interface ExtractedProducts {
  [key: string]: ProductEntry;
}

async function fetchPageContent(url: string): Promise<string | null> {
  // Try Jina Reader first — works reliably for SPAs and product pages
  try {
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/html',
        'X-Return-Format': 'html',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (jinaResponse.ok) {
      const html = await jinaResponse.text();
      if (html.length > 500) {
        console.log(`[extract-product-catalog] Jina succeeded (${html.length} bytes)`);
        return html;
      }
    }
  } catch (err) {
    console.warn('[extract-product-catalog] Jina failed:', err);
  }

  // Fallback to direct fetch
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandLens/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) {
      const html = await response.text();
      if (html.length > 500) {
        console.log(`[extract-product-catalog] Direct fetch succeeded (${html.length} bytes)`);
        return html;
      }
    }
  } catch (err) {
    console.warn('[extract-product-catalog] Direct fetch failed:', err);
  }

  return null;
}

function mergeProductCatalog(
  existing: Record<string, unknown> | null | undefined,
  incoming: ExtractedProducts,
): Record<string, unknown> {
  const merged = { ...(existing || {}) };
  Object.assign(merged, incoming);
  return merged;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body: ExtractProductCatalogRequest = await req.json();
    const { url, brand_id } = body;

    if (!url || !brand_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'url and brand_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    console.log(`[extract-product-catalog] Fetching: ${normalizedUrl}`);
    const pageContent = await fetchPageContent(normalizedUrl);

    if (!pageContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not fetch page content. Try a different URL.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract products via Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const extractionPrompt = `You are a product catalog extractor. Analyze this web page and extract product information.

CRITICAL: Extract ONLY product data. Do NOT extract brand identity, taglines, company values, or marketing copy.

For each distinct product (or product family) you find, extract:
- name: the official product name
- variants: color options, sizes, or editions (array of strings)
- styling_rules: how this product should be depicted photographically (e.g., "always show the screen on", "show from the front 3/4 angle")
- required_elements: what must always appear when depicting this product (e.g., "distinctive camera system", "keyboard for laptops")
- forbidden_elements: what must never appear with this product (e.g., "competitor devices", "cases that obscure the design")
- visual_description: a concise, neutral visual description suitable for image generation prompts — describe by visual characteristics only, never use the product name or brand name (e.g., "slim rectangular glass-and-aluminum smartphone with a distinctive horizontal camera bar on the rear")

Return a JSON object where each key is a lowercase, underscored product identifier:
{
  "product_key": {
    "name": "Official Product Name",
    "variants": ["Colorway A", "Colorway B"],
    "styling_rules": ["Rule 1", "Rule 2"],
    "required_elements": ["Element 1"],
    "forbidden_elements": ["Thing to avoid"],
    "visual_description": "Neutral visual description without brand or product names"
  }
}

If you find no products (e.g., the page is a brand homepage with no specific products), return {}.

PAGE CONTENT:
${pageContent.slice(0, 30000)}`;

    const result = await model.generateContent(extractionPrompt);
    const responseText = result.response.text();

    let extractedProducts: ExtractedProducts;
    try {
      const parsed = JSON.parse(responseText);
      extractedProducts = typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      console.error('[extract-product-catalog] Failed to parse Gemini response:', responseText.slice(0, 300));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse product data from page' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productCount = Object.keys(extractedProducts).length;
    console.log(`[extract-product-catalog] Extracted ${productCount} products from ${normalizedUrl}`);

    if (productCount === 0) {
      return new Response(
        JSON.stringify({ success: true, products: {}, message: 'No products found on this page. Try a specific product page URL.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing product catalog
    const { data: profile } = await supabaseClient
      .from('creative_studio_brand_profiles')
      .select('product_catalog')
      .eq('brand_id', brand_id)
      .single();

    const existingCatalog = (profile?.product_catalog as Record<string, unknown>) || {};
    const mergedCatalog = mergeProductCatalog(existingCatalog, extractedProducts);

    // Update ONLY the product_catalog column
    const { error: updateError } = await supabaseClient
      .from('creative_studio_brand_profiles')
      .update({ product_catalog: mergedCatalog })
      .eq('brand_id', brand_id);

    if (updateError) {
      console.error('[extract-product-catalog] Failed to update profile:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save product catalog' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        products: extractedProducts,
        product_count: productCount,
        source_url: normalizedUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-product-catalog] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
