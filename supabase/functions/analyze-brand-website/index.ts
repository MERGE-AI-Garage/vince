// ABOUTME: Edge Function that analyzes a brand's website to extract brand DNA
// ABOUTME: Crawls homepage + key pages, extracts colors/fonts/messaging, sends to Gemini for structured analysis

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"
import { getPromptWithModel } from '../_shared/prompt-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeWebsiteRequest {
  brand_id: string;
  url: string;
}

interface ExtractedPageData {
  url: string;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  themeColor: string;
  headings: string[];
  bodyText: string;
  imageUrls: string[];
  jsonLd: Record<string, unknown>[];
}

interface ExtractedBrandSignals {
  pages: ExtractedPageData[];
  cssCustomPropertyColors: string[];
  cssRawColors: string[];
  semanticElementColors: string[];
  cssFonts: string[];
  googleFonts: string[];
  fontFaceFonts: string[];
  typekitFonts: string[];
  cssVariableFonts: string[];
  themeColor: string;
  faviconUrl: string;
  logoUrls: string[];
  totalPagesAnalyzed: number;
}

const FALLBACK_BRAND_ANALYSIS_PROMPT = `You are a brand identity analyst extracting brand DNA from website data.

## Color identification — CRITICAL
You receive multiple color signals with different reliability levels:

1. **theme_color**: HTML meta theme-color tag. When present, this is typically the primary brand color. HIGHEST confidence.
2. **css_custom_property_colors**: Colors from CSS custom properties (--primary, --brand-color, etc.). These are HIGHLY RELIABLE — developers explicitly define brand colors as custom properties.
3. **semantic_element_colors**: Colors extracted from inline styles on header, nav, CTA buttons, and headings. These represent colors actually applied to key brand UI elements. HIGH confidence.
4. **raw_css_colors**: Every hex color scraped from CSS. This is EXTREMELY NOISY — it includes utility classes (Tailwind, Bootstrap), component libraries, hover states, gradients, and decorative elements. Most of these are NOT brand colors. LOW confidence — use as supporting evidence only.

COLOR PRIORITY ORDER:
1. theme_color meta tag (highest confidence)
2. CSS custom properties named "primary", "brand", "main", "accent" (high confidence)
3. Semantic element colors from header/nav/CTA backgrounds (high confidence)
4. Colors appearing in multiple signal sources (medium confidence)
5. Raw CSS colors alone (low confidence — likely noise)

IMPORTANT: Many modern websites use CSS frameworks (Tailwind, Bootstrap) that inject hundreds of utility colors. These are NOT brand colors. When you see many similar colors (e.g., a range of reds, blues, greens at various saturations), these are likely utility palette steps, not brand choices. Focus on the few colors that appear in important positions (header, nav, CTAs).

When raw CSS colors conflict with custom properties or semantic colors, ALWAYS trust the higher-priority sources.

## Font identification — CRITICAL
You receive font signals from multiple sources, in priority order:

1. **google_fonts** / **font_face_fonts**: Fonts explicitly loaded via Google Fonts, Bunny Fonts, or @font-face CSS declarations. These are CUSTOM brand fonts — highest reliability.
2. **css_variable_fonts**: Font names extracted from CSS custom properties like --font-heading or --font-body. These indicate intentionally configured brand fonts. High reliability.
3. **typekit_fonts**: If this contains "__typekit_detected__", the site loads Adobe Fonts/Typekit. The actual font names may be in css_fonts or may not be detectable. Note this in your analysis.
4. **detected_css_fonts**: Every font-family declaration found in CSS. This is NOISY — includes framework defaults (Inter, system-ui, Arial, Helvetica, Roboto), fallback stacks, and UI library fonts. Only trust these if no higher-priority fonts were found.

FONT PRIORITY: google_fonts / font_face_fonts / css_variable_fonts >> css_fonts.
If you see "Fraunces" in font_face_fonts and "Inter" in css_fonts, the heading font is Fraunces, NOT Inter.
If ALL font lists are empty or only contain generic names, say "Sans-serif (not detected)" rather than guessing.

## Logo identification
You receive **detected_logo_urls**: URLs identified as potential logo images. May include "__inline_svg_logo__" which means an SVG logo was found inline in the HTML header but no URL can be extracted.

Brands often have multiple logo forms:
- **Wordmark/Primary logo**: The full brand name as a logo (e.g., "MERGE" spelled out). Usually wider/rectangular.
- **Icon mark/Symbol**: A compact symbol or icon (e.g., an "M" mark). Usually square or compact.

Pick the best primary logo URL (wordmark preferred) as logo_url. If you can identify a separate icon mark/symbol, return it as logo_mark_url. Look for clues like "mark", "icon", "symbol", "favicon" in URLs/alt text.

If only __inline_svg_logo__ is detected, set logo_url to null and note "Inline SVG logo detected in header" in logo_description.

## Screenshot analysis (when provided)
If a screenshot of the homepage is included, use it as GROUND TRUTH for visual decisions:
- **Colors**: Look at the actual header/nav background, CTA buttons, accent elements, and text colors in the screenshot. These are more reliable than CSS extraction for JS-rendered sites.
- **Typography**: Observe heading and body font styles visually. If CSS extraction found no fonts but you can see distinctive typography in the screenshot, describe the visual style (e.g., "geometric sans-serif", "humanist serif").
- **Logo**: Look at the top-left area of the screenshot for the brand logo. Describe what you see.
- **Overall aesthetic**: The screenshot reveals the true visual character of the brand.

When the screenshot conflicts with CSS extraction data, trust the screenshot for colors and overall visual identity. Use CSS data for exact hex values when they match what you see in the screenshot.

## Analysis instructions
Analyze the website data (and screenshot if provided) to identify:
- The brand's core identity and positioning
- True brand colors (NOT utility/UI library colors) — use priority order above, verified against screenshot
- Typography — use font priority above, cross-reference with screenshot visual
- Logo — pick the best detected URL or describe from screenshot if no URL found
- Tone of voice from writing style
- Brand values from messaging
- Corporate narrative from page content (see Corporate DNA section below)

## Corporate DNA extraction
Analyze the CONTENT of all pages — especially About, History, Sustainability, Careers, Community, Innovation, and Investor pages — to extract corporate narrative data into the brand_story section.

Page-to-section mapping:
- About / Our Story → narrative_summary, mission_vision, heritage
- Sustainability / ESG / Impact / CSR → sustainability
- Innovation / Technology / R&D → innovation
- Careers / Culture / Life At → culture (values_in_practice, employee_experience, dei)
- Community / Partnerships / Giving → community
- Customers / Testimonials / Case Studies → customer_focus
- Awards / Press / Investors → competitive_position

IMPORTANT: Only populate brand_story sub-sections where the website EXPLICITLY contains relevant information. Return null for sections not covered. Do NOT fabricate corporate narrative from thin marketing copy — if a page only has a one-line tagline about sustainability, that is not enough to populate the sustainability section.

Return ONLY valid JSON matching this schema:
{
  "tagline": "The brand's primary tagline or slogan",
  "brand_values": ["value1", "value2", "value3"],
  "brand_aesthetic": "Concise description of the brand's visual aesthetic",
  "messaging": ["Key message 1", "Key message 2"],
  "logo_description": "Description of the logo if identifiable",
  "logo_url": "URL of the primary/wordmark logo image (from detected_logo_urls, or null if none found)",
  "logo_mark_url": "URL of the icon mark/symbol logo if different from primary (or null if not found)",
  "tone_of_voice": {
    "formality": "formal|semi-formal|casual|conversational",
    "personality": "A few words describing brand personality",
    "energy": "calm|moderate|energetic|intense",
    "dos": ["Writing style things the brand should do"],
    "donts": ["Writing style things the brand should avoid"]
  },
  "color_palette": {
    "primary": "#hex (the dominant brand color — usually header/nav background or CTA color)",
    "secondary": "#hex (the second most prominent brand color)",
    "accent": ["#hex (supporting accent colors, max 3)"],
    "background": "#hex (page background)",
    "text": "#hex (body text color)",
    "all_detected": ["#hex (ONLY colors you are confident are intentional brand colors, not UI noise)"]
  },
  "typography": {
    "heading_font": "Font family name (prefer google_fonts/font_face_fonts/css_variable_fonts over css_fonts)",
    "body_font": "Font family name (prefer google_fonts/font_face_fonts/css_variable_fonts over css_fonts)",
    "style_description": "Description of the typographic style"
  },
  "imagery_style": "Description of the brand's visual/photography style",
  "key_messaging": ["Core messages from the website content"],
  "brand_story": {
    "narrative_summary": "One paragraph synthesis of the brand's corporate narrative from website content, or null if insufficient content",
    "mission_vision": { "mission": "Mission statement or null", "vision": "Vision statement or null", "purpose": "Purpose statement or null" },
    "heritage": { "founding_story": "Founding narrative or null", "milestones": ["Key milestone events mentioned on the site"], "legacy": "Legacy description or null" },
    "sustainability": { "environmental": "Environmental commitments or null", "social": "Social responsibility or null", "governance": "Governance practices or null", "goals": ["Specific sustainability goals mentioned"] },
    "innovation": { "approach": "Innovation approach or null", "differentiators": ["Technology or innovation differentiators"], "technology": "Technology description or null" },
    "culture": { "values_in_practice": "How values manifest in workplace or null", "employee_experience": "Employee experience description or null", "dei": "DEI commitments or null" },
    "community": { "partnerships": ["Named partnerships or programs"], "programs": "Community programs description or null", "impact_metrics": "Quantified impact or null" },
    "customer_focus": { "promise": "Customer promise or null", "experience": "Customer experience description or null", "testimonial_themes": ["Recurring themes from testimonials"] },
    "competitive_position": { "market_position": "Market positioning statement or null", "key_differentiators": ["Competitive differentiators"], "awards": ["Awards or recognition mentioned"] }
  }
}`;

// Adapted from generic-scraper.ts — resolves relative/protocol-relative URLs
function makeAbsoluteUrl(url: string, baseUrl: string): string | null {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    }
    if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('mailto:')) {
      return null;
    }
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

// Fetch a page with browser-like headers and timeout
async function fetchPage(url: string, timeoutMs = 15000): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      console.log(`[Website Analyzer] fetchPage got ${response.status} for ${url}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    return null;
  }
}

// Fetch CSS content from a stylesheet URL
async function fetchCSS(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MERGE-AI-Brand-Analyzer/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return '';
    const text = await response.text();
    // Limit CSS size to prevent memory issues
    return text.slice(0, 200_000);
  } catch {
    return '';
  }
}

// Capture a screenshot of a URL via ScreenshotOne API, returns base64-encoded JPEG or null
async function captureScreenshot(url: string, accessKey: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      access_key: accessKey,
      url,
      format: 'jpeg',
      image_quality: '80',
      viewport_width: '1440',
      viewport_height: '900',
      full_page: 'false',
      delay: '3', // wait for JS rendering
      block_ads: 'true',
      block_cookie_banners: 'true',
    });
    const response = await fetch(`https://api.screenshotone.com/take?${params}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      console.log(`[Website Analyzer] Screenshot failed: ${response.status}`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('[Website Analyzer] Screenshot capture failed:', err);
    return null;
  }
}

// Extract all hex colors from CSS (noisy — includes utility classes, component libraries, etc.)
function extractCSSRawColors(css: string): string[] {
  const colors = new Set<string>();

  const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  let match;
  while ((match = hexRegex.exec(css)) !== null) {
    const hex = normalizeHexColor(match[0]);
    if (hex && !isNonBrandColor(hex)) colors.add(hex);
  }

  return [...colors].slice(0, 30);
}

// Normalize 3-char hex to 6-char (#abc → #aabbcc)
function normalizeHexColor(hex: string): string {
  if (!hex) return '';
  hex = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

// Filter obvious non-brand colors — expanded to catch near-black, near-white, and common grays
function isNonBrandColor(hex: string): boolean {
  const exact = ['#000', '#000000', '#fff', '#ffffff', '#0000', '#00000000', '#ffffffff'];
  if (exact.includes(hex)) return true;

  // Parse to RGB and check for near-black, near-white, common grays
  const rgb = parseHexToRgb(hex);
  if (!rgb) return false;
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const isGray = (max - min) < 10;

  if (isGray && (max < 15 || min > 240)) return true; // near-black or near-white
  if (isGray && r > 100 && r < 200) return true; // mid-grays (common utility colors)
  return false;
}

function parseHexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const norm = normalizeHexColor(hex);
  const match = norm.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

// Convert rgb()/rgba() to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

// Convert hsl()/hsla() to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return rgbToHex(f(0), f(8), f(4));
}

// Parse any CSS color format to hex
function cssColorToHex(color: string): string | null {
  color = color.trim();
  if (color.startsWith('#')) return normalizeHexColor(color);

  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) return rgbToHex(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);

  const hslMatch = color.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) return hslToHex(+hslMatch[1], +hslMatch[2], +hslMatch[3]);

  return null;
}

// Extract colors from inline styles on semantic elements (header, nav, CTAs, headings)
function extractSemanticElementColors(doc: any): string[] {
  const colors = new Set<string>();
  const selectors = [
    'header', 'nav', 'footer', '[role="banner"]',
    'a[class*="btn"]', 'a[class*="button"]', 'a[class*="cta"]',
    'button[class*="primary"]', 'button[class*="cta"]',
    'h1', 'h2',
  ];

  for (const selector of selectors) {
    try {
      const els = doc.querySelectorAll(selector);
      for (const el of els) {
        const style = (el as Element).getAttribute('style') || '';
        if (!style) continue;

        // Extract color properties from inline style
        const colorProps = style.match(/(?:background-color|color|border-color)\s*:\s*([^;]+)/gi);
        if (colorProps) {
          for (const prop of colorProps) {
            const value = prop.split(':').slice(1).join(':').trim();
            const hex = cssColorToHex(value);
            if (hex && !isNonBrandColor(hex)) colors.add(hex);
          }
        }
      }
    } catch { /* skip invalid selectors */ }
  }

  return [...colors].slice(0, 15);
}

// Check if a CSS custom property name looks like a brand-intentional color vs a utility palette step
function isBrandPropertyName(propName: string): 'brand' | 'utility' | 'unknown' {
  const lower = propName.toLowerCase();
  // High-confidence brand properties
  if (/\b(primary|secondary|brand|accent|main|foreground|background|heading|cta|hero|nav|header|footer|link)\b/.test(lower)) {
    return 'brand';
  }
  // Tailwind/utility palette steps: --red-500, --color-orange-400, --tw-color-blue-100, etc.
  if (/--(?:[\w-]*-)?\d{2,3}(?:\s*:|$)/.test(propName) || /--(?:tw-|color-)/.test(lower)) {
    return 'utility';
  }
  return 'unknown';
}

// Extract CSS custom properties, separating brand-intentional colors from utility palette noise
function extractCSSCustomPropertyAllColors(css: string): string[] {
  const brandColors = new Set<string>();
  const unknownColors = new Set<string>();

  // Match property name + color value together
  const hexVarRegex = /(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi;
  let match;
  while ((match = hexVarRegex.exec(css)) !== null) {
    const propName = match[1];
    const hex = normalizeHexColor(match[2]);
    if (!hex || isNonBrandColor(hex)) continue;
    const tier = isBrandPropertyName(propName);
    if (tier === 'brand') brandColors.add(hex);
    else if (tier === 'unknown') unknownColors.add(hex);
    // 'utility' tier is intentionally dropped
  }

  // rgb()/rgba()/hsl()/hsla() in custom properties
  const funcVarRegex = /(--[\w-]+)\s*:\s*((?:rgb|hsl)a?\([^)]+\))/gi;
  while ((match = funcVarRegex.exec(css)) !== null) {
    const propName = match[1];
    const hex = cssColorToHex(match[2]);
    if (!hex || isNonBrandColor(hex)) continue;
    const tier = isBrandPropertyName(propName);
    if (tier === 'brand') brandColors.add(hex);
    else if (tier === 'unknown') unknownColors.add(hex);
  }

  // Return brand colors first, then unknown (exclude utility palette noise)
  // If we found brand-named colors, limit unknown to avoid noise
  const result = [...brandColors];
  const unknownLimit = brandColors.size > 0 ? 5 : 15;
  result.push(...[...unknownColors].slice(0, unknownLimit));
  return result.slice(0, 20);
}

// Extract font-family declarations from CSS text
function extractCSSFonts(css: string): string[] {
  const fonts = new Set<string>();
  const fontRegex = /font-family\s*:\s*([^;}{]+)/gi;
  let match;
  while ((match = fontRegex.exec(css)) !== null) {
    const families = match[1]
      .split(',')
      .map(f => f.trim().replace(/["']/g, ''))
      .filter(f => !['inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI'].includes(f));
    families.forEach(f => fonts.add(f));
  }
  return [...fonts].slice(0, 10);
}

// Detect Google Fonts from link tags (supports both v1 and v2 CSS API formats)
function extractGoogleFonts(doc: any, baseUrl: string): string[] {
  const fonts = new Set<string>();
  const links = doc.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"], link[href*="fonts.bunny.net"]');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    // CSS2 API: multiple family= params (e.g., family=Roboto:wght@400&family=Open+Sans:wght@400)
    const allFamilyMatches = href.matchAll(/family=([^&:]+)/g);
    for (const m of allFamilyMatches) {
      const families = decodeURIComponent(m[1]).split('|').map((f: string) => f.split(':')[0].replace(/\+/g, ' ').trim());
      families.forEach(f => { if (f) fonts.add(f); });
    }
  }
  return [...fonts];
}

// Detect Adobe Fonts (Typekit) from link/script tags
function extractTypekitFonts(doc: any): string[] {
  const fonts: string[] = [];
  const links = doc.querySelectorAll('link[href*="use.typekit.net"], script[src*="use.typekit.net"]');
  if (links.length > 0) {
    // Typekit loads are detected but font names require fetching the kit CSS
    // Flag this so Gemini knows Adobe Fonts are in use
    fonts.push('__typekit_detected__');
  }
  return fonts;
}

// Detect next/font or CSS variable font patterns on html/body elements
function extractCSSVariableFonts(doc: any, css: string): string[] {
  const fonts = new Set<string>();

  // Look for CSS variable font declarations like --font-heading: 'Fraunces', serif;
  const varFontRegex = /--font[-_]?\w*\s*:\s*["']?([^"';,}\n]+)/gi;
  let match;
  while ((match = varFontRegex.exec(css)) !== null) {
    const name = match[1].trim().replace(/["']/g, '');
    if (name && !['inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace', 'system-ui',
        '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'var('].some(skip => name.toLowerCase().startsWith(skip.toLowerCase()))) {
      fonts.add(name);
    }
  }

  // Look for data-font or class patterns that indicate font names on html/body
  for (const tag of ['html', 'body']) {
    const el = doc.querySelector(tag);
    if (!el) continue;
    const className = (el as Element).getAttribute('class') || '';
    const style = (el as Element).getAttribute('style') || '';

    // next/font sets CSS variables like --font-inter on body/html
    const varMatches = style.matchAll(/--font[-_](\w+)/g);
    for (const m of varMatches) {
      const name = m[1].charAt(0).toUpperCase() + m[1].slice(1);
      fonts.add(name);
    }
  }

  return [...fonts];
}

// Extract @font-face declarations — these are custom brand fonts loaded via CSS
function extractFontFaceFonts(css: string): string[] {
  const fonts = new Set<string>();
  const fontFaceRegex = /@font-face\s*\{[^}]*font-family\s*:\s*["']?([^"';}\n]+)["']?/gi;
  let match;
  while ((match = fontFaceRegex.exec(css)) !== null) {
    const name = match[1].trim();
    if (name && !['inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace'].includes(name.toLowerCase())) {
      fonts.add(name);
    }
  }
  return [...fonts];
}

// Check if an image is likely inside a partner/client logo grid (not the brand's own logo)
function isPartnerLogoGrid(el: Element): boolean {
  // Walk up to find container patterns: lists, grids, carousels with multiple logo images
  let parent = el.parentElement;
  for (let depth = 0; depth < 6 && parent; depth++) {
    const className = (parent.getAttribute('class') || '').toLowerCase();
    const id = (parent.getAttribute('id') || '').toLowerCase();
    const tag = parent.tagName?.toLowerCase() || '';

    // Check for partner/client grid indicators
    if (/partner|client|customer|trusted|carousel|slider|logo-grid|logo-wall|logo-strip/i.test(className + ' ' + id)) {
      return true;
    }

    // If the container has many sibling images, it's likely a logo grid
    if (tag === 'div' || tag === 'ul' || tag === 'section') {
      const siblingImgs = parent.querySelectorAll('img');
      if (siblingImgs.length >= 4) {
        // Multiple images in the same container with "logo" in their attributes = logo grid
        let logoCount = 0;
        for (const sib of siblingImgs) {
          const sibSrc = ((sib as Element).getAttribute('src') || '').toLowerCase();
          const sibAlt = ((sib as Element).getAttribute('alt') || '').toLowerCase();
          const sibClass = ((sib as Element).getAttribute('class') || '').toLowerCase();
          if (sibSrc.includes('logo') || sibAlt.includes('logo') || sibClass.includes('logo')) {
            logoCount++;
          }
        }
        if (logoCount >= 3) return true;
      }
    }

    parent = parent.parentElement;
  }
  return false;
}

// Extract logo image URLs using multiple heuristics
function extractLogoUrls(doc: any, baseUrl: string): string[] {
  const headerLogos: string[] = [];  // Highest priority: logos in header/nav
  const structuredLogos: string[] = []; // JSON-LD logos
  const attributeLogos: string[] = [];  // Images with "logo" in attributes

  // 1. JSON-LD Organization.logo or WebSite.publisher.logo
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse((script as Element).textContent || '');
      const findLogo = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        if (typeof obj.logo === 'string') return obj.logo;
        if (obj.logo?.url) return obj.logo.url;
        if (obj.publisher?.logo?.url) return obj.publisher.logo.url;
        if (obj.image?.url) return obj.image.url;
        return null;
      };
      const logoUrl = findLogo(data);
      if (logoUrl) {
        const abs = makeAbsoluteUrl(logoUrl, baseUrl);
        if (abs) structuredLogos.push(abs);
      }
    } catch { /* skip invalid JSON */ }
  }

  // 2. <img> inside <header>/<nav> that links to homepage (most reliable logo signal)
  // Walk up multiple levels to find the parent <a> — the img may be nested in spans/divs
  const headerImgs = doc.querySelectorAll('header img, nav img, [role="banner"] img');
  for (const img of headerImgs) {
    const el = img as Element;
    const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
    if (!src || src.startsWith('data:')) continue;

    let parent = el.parentElement;
    let linkHref = '';
    for (let depth = 0; depth < 5 && parent; depth++) {
      if (parent.tagName?.toLowerCase() === 'a') {
        linkHref = parent.getAttribute('href') || '';
        break;
      }
      parent = parent.parentElement;
    }
    if (linkHref === '/' || linkHref === '' || linkHref === baseUrl || linkHref.endsWith('.com') || linkHref.endsWith('.com/')) {
      const abs = makeAbsoluteUrl(src, baseUrl);
      if (abs && !headerLogos.includes(abs)) headerLogos.push(abs);
    }
  }

  // 3. SVG elements inside header/nav links — inline SVG logos
  const headerSvgs = doc.querySelectorAll('header a svg, nav a svg, [role="banner"] a svg');
  if (headerSvgs.length > 0) {
    headerLogos.push('__inline_svg_logo__');
  }

  // 4. <img> with class/id/alt/src containing "logo" — but skip partner logo grids
  const allImgs = doc.querySelectorAll('img');
  for (const img of allImgs) {
    const el = img as Element;
    const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
    if (!src || src.startsWith('data:')) continue;

    const alt = (el.getAttribute('alt') || '').toLowerCase();
    const className = (el.getAttribute('class') || '').toLowerCase();
    const id = (el.getAttribute('id') || '').toLowerCase();
    const srcLower = src.toLowerCase();

    if (alt.includes('logo') || className.includes('logo') || id.includes('logo') || srcLower.includes('logo')) {
      // Skip images that are inside partner/client logo grids
      if (isPartnerLogoGrid(el)) continue;
      const abs = makeAbsoluteUrl(src, baseUrl);
      if (abs) attributeLogos.push(abs);
    }
  }

  // Priority: header logos first (most reliable), then structured data, then attribute matches
  const all = [...headerLogos, ...structuredLogos, ...attributeLogos];
  return [...new Set(all)].slice(0, 5);
}

// Extract structured data from a parsed HTML document
function extractPageData(doc: any, url: string): ExtractedPageData {
  const getMetaContent = (selector: string): string =>
    doc.querySelector(selector)?.getAttribute('content')?.trim() || '';

  // Headings
  const headings: string[] = [];
  for (const tag of ['h1', 'h2']) {
    const els = doc.querySelectorAll(tag);
    for (const el of els) {
      const text = (el as Element).textContent?.trim();
      if (text && text.length > 2 && text.length < 200) {
        headings.push(text);
      }
    }
  }

  // Images (first 15)
  const imageUrls: string[] = [];
  const imgEls = doc.querySelectorAll('img[src], img[data-src]');
  for (const img of imgEls) {
    if (imageUrls.length >= 15) break;
    const src = (img as Element).getAttribute('src') || (img as Element).getAttribute('data-src') || '';
    const absUrl = makeAbsoluteUrl(src, url);
    if (absUrl && !absUrl.includes('data:') && !absUrl.includes('tracking') && !absUrl.includes('pixel')) {
      imageUrls.push(absUrl);
    }
  }

  // JSON-LD structured data
  const jsonLd: Record<string, unknown>[] = [];
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse((script as Element).textContent || '');
      if (data) jsonLd.push(data);
    } catch { /* skip invalid JSON */ }
  }

  // Body text (stripped, truncated)
  const bodyEl = doc.querySelector('body');
  let bodyText = '';
  if (bodyEl) {
    // Remove script, style, nav, footer content to focus on main content
    const clone = bodyEl;
    bodyText = (clone as Element).textContent?.replace(/\s+/g, ' ').trim().slice(0, 8000) || '';
  }

  return {
    url,
    title: doc.querySelector('title')?.textContent?.trim() || '',
    metaDescription: getMetaContent('meta[name="description"]'),
    ogTitle: getMetaContent('meta[property="og:title"]'),
    ogDescription: getMetaContent('meta[property="og:description"]'),
    ogImage: getMetaContent('meta[property="og:image"]'),
    themeColor: getMetaContent('meta[name="theme-color"]'),
    headings,
    bodyText,
    imageUrls,
    jsonLd,
  };
}

// Discover brand-relevant pages from nav links and sitemap
type PageCategory = 'about' | 'people' | 'news' | 'corporate';

async function discoverBrandPages(doc: any, baseUrl: string): Promise<string[]> {
  // About/mission pages: brand values, tone, messaging
  const aboutPatterns = [
    /\/about/i, /\/our-story/i, /\/mission/i, /\/values/i,
    /\/who-we-are/i, /\/our-purpose/i, /\/vision/i, /\/culture/i,
  ];
  // People/team pages: headshots, leadership, culture imagery
  const peoplePatterns = [
    /\/people/i, /\/team/i, /\/leadership/i, /\/our-team/i,
    /\/staff/i, /\/executives/i, /\/our-people/i, /\/meet-the-team/i,
  ];
  // News/press pages: awards, press photos, event imagery
  const newsPatterns = [
    /\/news/i, /\/press/i, /\/awards/i, /\/blog/i,
    /\/media/i, /\/newsroom/i, /\/in-the-news/i,
  ];
  // Corporate narrative pages: sustainability, history, careers, innovation, community
  const corporatePatterns = [
    /\/sustainability/i, /\/esg/i, /\/csr/i, /\/impact/i, /\/responsibility/i,
    /\/environment/i, /\/social-impact/i,
    /\/history/i, /\/timeline/i, /\/our-history/i, /\/heritage/i, /\/milestones/i,
    /\/innovation/i, /\/technology/i, /\/r-?and-?d/i, /\/research/i,
    /\/careers/i, /\/jobs/i, /\/life-at/i, /\/work-with-us/i, /\/join-us/i,
    /\/diversity/i, /\/dei/i, /\/inclusion/i,
    /\/community/i, /\/partnerships/i, /\/giving/i, /\/foundation/i,
    /\/customers/i, /\/testimonials/i, /\/case-stud/i, /\/success-stor/i,
    /\/investors/i, /\/investor-relations/i,
  ];
  const allPatterns = [...aboutPatterns, ...peoplePatterns, ...newsPatterns, ...corporatePatterns];

  const discovered = new Map<string, PageCategory>();
  const base = new URL(baseUrl);

  const classifyUrl = (pathname: string): PageCategory | null => {
    if (aboutPatterns.some(p => p.test(pathname))) return 'about';
    if (corporatePatterns.some(p => p.test(pathname))) return 'corporate';
    if (peoplePatterns.some(p => p.test(pathname))) return 'people';
    if (newsPatterns.some(p => p.test(pathname))) return 'news';
    return null;
  };

  // Strategy 1: Check nav links (also check ALL links for people/team pages since they may be in footer)
  const allLinks = doc.querySelectorAll('a[href]');
  for (const link of allLinks) {
    const href = (link as Element).getAttribute('href') || '';
    const absUrl = makeAbsoluteUrl(href, baseUrl);
    if (!absUrl) continue;

    try {
      const linkUrl = new URL(absUrl);
      if (linkUrl.host !== base.host) continue;
      const category = classifyUrl(linkUrl.pathname);
      if (category && !discovered.has(absUrl)) {
        discovered.set(absUrl, category);
      }
    } catch { /* skip invalid URLs */ }
  }

  // Strategy 2: Try common paths directly if we're missing categories
  const hasAbout = [...discovered.values()].includes('about');
  const hasPeople = [...discovered.values()].includes('people');
  const hasNews = [...discovered.values()].includes('news');
  const hasCorporate = [...discovered.values()].includes('corporate');

  const pathsToTry: Array<{ path: string; category: PageCategory }> = [];
  if (!hasAbout) {
    pathsToTry.push(
      { path: '/about', category: 'about' },
      { path: '/about-us', category: 'about' },
      { path: '/our-story', category: 'about' },
    );
  }
  if (!hasCorporate) {
    pathsToTry.push(
      { path: '/sustainability', category: 'corporate' },
      { path: '/history', category: 'corporate' },
      { path: '/innovation', category: 'corporate' },
      { path: '/careers', category: 'corporate' },
      { path: '/community', category: 'corporate' },
      { path: '/investors', category: 'corporate' },
    );
  }
  if (!hasPeople) {
    pathsToTry.push(
      { path: '/people', category: 'people' },
      { path: '/team', category: 'people' },
      { path: '/leadership', category: 'people' },
      { path: '/our-team', category: 'people' },
    );
  }
  if (!hasNews) {
    pathsToTry.push(
      { path: '/news', category: 'news' },
      { path: '/awards', category: 'news' },
    );
  }

  for (const { path, category } of pathsToTry) {
    const testUrl = `${base.protocol}//${base.host}${path}`;
    if (discovered.has(testUrl)) continue;
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MERGE-AI-Brand-Analyzer/1.0)' },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok && response.status === 200) {
        discovered.set(testUrl, category);
      }
    } catch { /* skip unreachable */ }
  }

  // Strategy 3: Try sitemap if we found very little
  if (discovered.size < 2) {
    try {
      const sitemapUrl = `${base.protocol}//${base.host}/sitemap.xml`;
      const sitemapHtml = await fetchPage(sitemapUrl, 5000);
      if (sitemapHtml) {
        const locRegex = /<loc>(.*?)<\/loc>/g;
        let match;
        while ((match = locRegex.exec(sitemapHtml)) !== null) {
          const loc = match[1].trim();
          const category = classifyUrl(loc);
          if (category && !discovered.has(loc)) {
            discovered.set(loc, category);
          }
        }
      }
    } catch { /* sitemap not available */ }
  }

  // Prioritize: 1 about + 1 corporate + 1 people + 1 news, then fill remaining slots
  const result: string[] = [];
  const byCategory: Record<PageCategory, string[]> = { about: [], corporate: [], people: [], news: [] };
  for (const [url, cat] of discovered) byCategory[cat].push(url);

  // Take first of each category
  if (byCategory.about.length > 0) result.push(byCategory.about[0]);
  if (byCategory.corporate.length > 0) result.push(byCategory.corporate[0]);
  if (byCategory.people.length > 0) result.push(byCategory.people[0]);
  if (byCategory.news.length > 0) result.push(byCategory.news[0]);

  // Fill remaining slots up to 8 (extra slots for corporate narrative pages)
  for (const [url] of discovered) {
    if (result.length >= 8) break;
    if (!result.includes(url)) result.push(url);
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    const screenshotOneKey = Deno.env.get('SCREENSHOTONE_ACCESS_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch configurable prompt from DB, fall back to hardcoded
    const promptData = await getPromptWithModel(supabase, 'brand-website-analysis');
    const brandAnalysisPrompt = promptData?.prompt.prompt_text || FALLBACK_BRAND_ANALYSIS_PROMPT;

    // Identify caller for logging — gateway handles security via --no-verify-jwt
    const authHeader = req.headers.get('Authorization');
    let callerId = 'anonymous';
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        callerId = payload.role === 'service_role' ? 'service_role' : (payload.sub || 'user');
      } catch { /* not a parseable JWT */ }
    }
    console.log(`[analyze-brand-website] Caller: ${callerId}`);

    const body = await req.json();
    const { brand_id, url, user_id: bodyUserId } = body;

    // Resolve user identity: from request body, JWT, or fallback for service-role callers
    let user: { id: string; email: string };
    if (bodyUserId) {
      user = { id: bodyUserId, email: 'system@brand-lens' };
    } else if (callerId !== 'anonymous' && callerId !== 'service_role') {
      user = { id: callerId, email: 'unknown' };
    } else {
      user = { id: 'system', email: 'system@brand-lens' };
    }

    if (!brand_id || !url) {
      return new Response(JSON.stringify({ error: 'brand_id and url are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    console.log(`[Website Analyzer] Starting analysis of: ${normalizedUrl}`);

    // Step 1: Fetch homepage (try direct fetch first, then Jina Reader as fallback)
    console.log('[Website Analyzer] Step 1: Fetching homepage...');
    let homepageHtml = await fetchPage(normalizedUrl);
    let usedJinaFallback = false;

    // If direct fetch fails or returns SPA shell, try Jina Reader
    let needsJina = !homepageHtml;
    if (homepageHtml) {
      const tempDoc = new DOMParser().parseFromString(homepageHtml, 'text/html');
      const tempBody = tempDoc?.querySelector('body')?.textContent?.trim() || '';
      if (tempBody.length < 100) {
        console.log(`[Website Analyzer] SPA detected (body ${tempBody.length} chars)`);
        needsJina = true;
      }
    }

    if (needsJina) {
      console.log(`[Website Analyzer] Trying Jina Reader fallback for: ${normalizedUrl}`);
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${normalizedUrl}`, {
          headers: {
            'Accept': 'text/html',
            'X-Return-Format': 'html',
          },
          signal: AbortSignal.timeout(30000),
        });
        if (jinaResponse.ok) {
          const jinaHtml = await jinaResponse.text();
          if (jinaHtml.length > 200) {
            console.log(`[Website Analyzer] Jina fallback succeeded (${jinaHtml.length} bytes)`);
            homepageHtml = jinaHtml;
            usedJinaFallback = true;
          } else {
            console.log(`[Website Analyzer] Jina returned too little content (${jinaHtml.length} bytes)`);
          }
        } else {
          console.log(`[Website Analyzer] Jina returned ${jinaResponse.status}`);
        }
      } catch (err) {
        console.error('[Website Analyzer] Jina fallback failed:', err);
      }
    }

    if (!homepageHtml) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not fetch the website. The site may be blocking automated access — try uploading screenshots or a brand guidelines document instead.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Website Analyzer] Step 2: Parsing HTML (${homepageHtml.length} bytes, jina=${usedJinaFallback})...`);
    let homeDoc = new DOMParser().parseFromString(homepageHtml, 'text/html');
    if (!homeDoc) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse website HTML' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Final body text check after all fallbacks
    let bodyText = homeDoc.querySelector('body')?.textContent?.trim() || '';
    if (bodyText.length < 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This website uses client-side rendering and could not be analyzed. Try uploading screenshots or a brand guidelines document instead.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Extract homepage data
    console.log('[Website Analyzer] Step 3: Extracting homepage data...');
    const pages: ExtractedPageData[] = [extractPageData(homeDoc, normalizedUrl)];

    // Step 3: Extract CSS colors and fonts from homepage
    console.log('[Website Analyzer] Step 4: Extracting CSS...');
    let allCSS = '';

    // Inline styles
    const styleEls = homeDoc.querySelectorAll('style');
    for (const style of styleEls) {
      allCSS += (style as Element).textContent || '';
    }

    // External stylesheets and screenshot — fetch in parallel
    const stylesheetLinks = homeDoc.querySelectorAll('link[rel="stylesheet"]');
    const cssUrls: string[] = [];
    for (const link of stylesheetLinks) {
      const href = (link as Element).getAttribute('href');
      if (href) {
        const absUrl = makeAbsoluteUrl(href, normalizedUrl);
        if (absUrl) cssUrls.push(absUrl);
      }
    }
    // Launch screenshot capture in parallel with CSS fetching
    const screenshotPromise = screenshotOneKey
      ? captureScreenshot(normalizedUrl, screenshotOneKey)
      : Promise.resolve(null);
    const [cssResults, screenshotBase64] = await Promise.all([
      Promise.all(cssUrls.slice(0, 5).map(u => fetchCSS(u))),
      screenshotPromise,
    ]);
    allCSS += cssResults.join('\n');
    if (screenshotBase64) {
      console.log(`[Website Analyzer] Screenshot captured (${Math.round(screenshotBase64.length / 1024)}KB base64)`);
    } else {
      console.log('[Website Analyzer] No screenshot captured (key missing or capture failed)');
    }

    const cssCustomPropertyColors = extractCSSCustomPropertyAllColors(allCSS);
    const cssRawColors = extractCSSRawColors(allCSS);
    const semanticElementColors = extractSemanticElementColors(homeDoc);
    const cssFonts = extractCSSFonts(allCSS);
    const googleFonts = extractGoogleFonts(homeDoc, normalizedUrl);
    const fontFaceFonts = extractFontFaceFonts(allCSS);
    const typekitFonts = extractTypekitFonts(homeDoc);
    const cssVariableFonts = extractCSSVariableFonts(homeDoc, allCSS);

    // Theme color from meta tag
    const themeColorMeta = homeDoc.querySelector('meta[name="theme-color"]')?.getAttribute('content')?.trim() || '';

    // Favicon
    const faviconEl = homeDoc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    const faviconUrl = faviconEl ? makeAbsoluteUrl(faviconEl.getAttribute('href') || '', normalizedUrl) || '' : '';

    // Logo detection
    const logoUrls = extractLogoUrls(homeDoc, normalizedUrl);

    console.log(`[Website Analyzer] CSS custom property colors: ${cssCustomPropertyColors.join(', ')}`);
    console.log(`[Website Analyzer] Semantic element colors: ${semanticElementColors.join(', ')}`);
    console.log(`[Website Analyzer] Theme color: ${themeColorMeta || 'none'}`);
    console.log(`[Website Analyzer] Raw CSS colors: ${cssRawColors.length} found`);
    console.log(`[Website Analyzer] Fonts — Google: [${googleFonts.join(', ')}], @font-face: [${fontFaceFonts.join(', ')}], Variable: [${cssVariableFonts.join(', ')}], Typekit: [${typekitFonts.join(', ')}], CSS: [${cssFonts.join(', ')}]`);
    console.log(`[Website Analyzer] Logo URLs detected: ${logoUrls.length} — ${logoUrls.join(', ')}`);

    // Step 4: Discover and fetch key brand pages
    console.log(`[Website Analyzer] Step 5: Discovering brand pages...`);
    const brandPageUrls = await discoverBrandPages(homeDoc, normalizedUrl);
    console.log(`[Website Analyzer] Discovered ${brandPageUrls.length} brand pages: ${brandPageUrls.join(', ')}`);

    for (const pageUrl of brandPageUrls) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const pageHtml = await fetchPage(pageUrl);
      if (pageHtml) {
        const pageDoc = new DOMParser().parseFromString(pageHtml, 'text/html');
        if (pageDoc) {
          pages.push(extractPageData(pageDoc, pageUrl));
        }
      }
    }

    // Step 5: Build extraction bundle for Gemini
    const extractionBundle: ExtractedBrandSignals = {
      pages,
      cssCustomPropertyColors,
      cssRawColors,
      semanticElementColors,
      cssFonts,
      googleFonts,
      fontFaceFonts,
      typekitFonts,
      cssVariableFonts,
      themeColor: themeColorMeta,
      faviconUrl,
      logoUrls,
      totalPagesAnalyzed: pages.length,
    };

    // Prepare a concise text representation for Gemini with clear signal hierarchy
    const bundleText = JSON.stringify({
      pages_analyzed: pages.map(p => ({
        url: p.url,
        title: p.title,
        meta_description: p.metaDescription,
        og_title: p.ogTitle,
        og_description: p.ogDescription,
        headings: p.headings.slice(0, 10),
        body_text: p.bodyText.slice(0, 3000),
        json_ld: p.jsonLd,
      })),
      theme_color: themeColorMeta || null,
      css_custom_property_colors: cssCustomPropertyColors,
      semantic_element_colors: semanticElementColors,
      raw_css_colors: cssRawColors,
      detected_google_fonts: googleFonts,
      detected_font_face_fonts: fontFaceFonts,
      detected_css_variable_fonts: cssVariableFonts,
      detected_typekit_fonts: typekitFonts,
      detected_css_fonts: cssFonts,
      detected_logo_urls: logoUrls,
    }, null, 0);

    // Step 6: Send to Gemini for brand DNA analysis (multimodal: screenshot + text)
    console.log(`[Website Analyzer] Step 6: Sending to Gemini (bundle: ${bundleText.length} chars, screenshot: ${screenshotBase64 ? 'yes' : 'no'})...`);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`;

    // Build multimodal parts: screenshot (if available) + text data
    const userParts: Array<Record<string, unknown>> = [];
    if (screenshotBase64) {
      userParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: screenshotBase64,
        },
      });
      userParts.push({
        text: `This is a screenshot of the website homepage at ${normalizedUrl}. Use this to visually confirm brand colors (especially header/nav background, CTA button colors, accent colors), typography (heading and body font styles), and logo placement. The screenshot is the GROUND TRUTH for visual appearance — if the extracted CSS data conflicts with what you see in the screenshot, trust the screenshot.\n\nExtracted Data (for exact hex values and font names):\n${bundleText}`,
      });
    } else {
      userParts.push({
        text: `Analyze this website data and extract the brand's identity DNA.\n\nWebsite: ${normalizedUrl}\n\nExtracted Data:\n${bundleText}`,
      });
    }

    const payload = {
      contents: [{
        role: 'user',
        parts: userParts,
      }],
      systemInstruction: {
        parts: [{ text: brandAnalysisPrompt }],
      },
      generationConfig: {
        temperature: 0.3,
        topP: 0.85,
        responseMimeType: 'application/json',
      },
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} — ${errorText.slice(0, 200)}`);
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No analysis content in Gemini response');
    }

    let analysis: Record<string, unknown>;
    try {
      const parsed = JSON.parse(textContent);
      analysis = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        analysis = Array.isArray(parsed) ? parsed[0] : parsed;
      } else {
        throw new Error('Failed to parse brand analysis JSON');
      }
    }

    // Step 7: Store analysis result
    const analysisRecord = {
      brand_id,
      source_image_url: normalizedUrl,
      source_type: 'website',
      analysis_data: {
        ...analysis,
        _extraction: {
          css_custom_property_colors: cssCustomPropertyColors,
          semantic_element_colors: semanticElementColors,
          css_raw_colors: cssRawColors,
          theme_color: themeColorMeta,
          css_fonts: cssFonts,
          google_fonts: googleFonts,
          font_face_fonts: fontFaceFonts,
          css_variable_fonts: cssVariableFonts,
          typekit_fonts: typekitFonts,
          pages_analyzed: pages.map(p => p.url),
          image_urls: pages.flatMap(p => p.imageUrls).slice(0, 20),
          favicon_url: faviconUrl,
          logo_urls: logoUrls,
          screenshot_included: !!screenshotBase64,
        },
      },
      tags: ['website-analysis', ...pages.map(p => {
        try { return new URL(p.url).pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'homepage'; }
        catch { return 'page'; }
      })],
      analyzed_by: user.id,
    };

    const { error: insertError } = await supabase
      .from('creative_studio_brand_analyses')
      .insert(analysisRecord);

    if (insertError) {
      console.error('Failed to store website analysis:', insertError);
    }

    // Update brand's website_url if not already set
    await supabase
      .from('creative_studio_brands')
      .update({ website_url: normalizedUrl })
      .eq('id', brand_id)
      .is('website_url', null);

    // Write colors back to brand record from analysis (only if not already set)
    const colorPalette = (analysis as Record<string, unknown>)?.color_palette;
    let primaryFromAnalysis: string | null = null;
    let secondaryFromAnalysis: string | null = null;
    if (Array.isArray(colorPalette) && colorPalette.length >= 2) {
      // Gemini sometimes returns a flat array of hex strings
      primaryFromAnalysis = colorPalette[0] as string;
      secondaryFromAnalysis = colorPalette[1] as string;
    } else if (colorPalette && typeof colorPalette === 'object') {
      const cp = colorPalette as Record<string, unknown>;
      if (typeof cp.primary === 'string') primaryFromAnalysis = cp.primary;
      if (typeof cp.secondary === 'string') secondaryFromAnalysis = cp.secondary;
    }
    if (primaryFromAnalysis || secondaryFromAnalysis) {
      const brandUpdates: Record<string, string> = {};
      if (primaryFromAnalysis) brandUpdates.primary_color = primaryFromAnalysis;
      if (secondaryFromAnalysis) brandUpdates.secondary_color = secondaryFromAnalysis;
      if (Object.keys(brandUpdates).length > 0) {
        const { data: currentBrand } = await supabase
          .from('creative_studio_brands')
          .select('primary_color, secondary_color')
          .eq('id', brand_id)
          .single();
        const colorUpdates: Record<string, string> = {};
        if (brandUpdates.primary_color && !currentBrand?.primary_color) colorUpdates.primary_color = brandUpdates.primary_color;
        if (brandUpdates.secondary_color && !currentBrand?.secondary_color) colorUpdates.secondary_color = brandUpdates.secondary_color;
        if (Object.keys(colorUpdates).length > 0) {
          await supabase.from('creative_studio_brands').update(colorUpdates).eq('id', brand_id);
          console.log(`[Website Analyzer] Wrote colors to brand: ${JSON.stringify(colorUpdates)}`);
        }
      }
    }

    // Set logo URLs from analysis or extraction if not already set
    const analysisLogoUrl = (analysis as Record<string, unknown>)?.logo_url as string | undefined;
    const analysisLogoMarkUrl = (analysis as Record<string, unknown>)?.logo_mark_url as string | undefined;
    const realLogoUrls = logoUrls.filter(u => !u.startsWith('__'));
    const bestLogoUrl = analysisLogoUrl || realLogoUrls[0] || null;
    const bestLogoMarkUrl = analysisLogoMarkUrl || null;

    const logoUpdates: Record<string, string> = {};
    if (bestLogoUrl) logoUpdates.logo_url = bestLogoUrl;
    if (bestLogoMarkUrl) logoUpdates.logo_mark_url = bestLogoMarkUrl;

    if (Object.keys(logoUpdates).length > 0) {
      // Only set logos that aren't already populated
      const { data: currentBrand } = await supabase
        .from('creative_studio_brands')
        .select('logo_url, logo_mark_url')
        .eq('id', brand_id)
        .single();

      const finalUpdates: Record<string, string> = {};
      if (logoUpdates.logo_url && !currentBrand?.logo_url) finalUpdates.logo_url = logoUpdates.logo_url;
      if (logoUpdates.logo_mark_url && !currentBrand?.logo_mark_url) finalUpdates.logo_mark_url = logoUpdates.logo_mark_url;

      if (Object.keys(finalUpdates).length > 0) {
        await supabase
          .from('creative_studio_brands')
          .update(finalUpdates)
          .eq('id', brand_id);
      }
    }

    // Chain to synthesize-brand-profile to build the brand DNA profile from analysis data
    // Fire-and-forget — synthesis takes ~20s but we don't need to wait
    const synthUrl = `${supabaseUrl}/functions/v1/synthesize-brand-profile`;
    fetch(synthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({ brand_id }),
    }).then(async (synthResp) => {
      if (!synthResp.ok) {
        const err = await synthResp.text().catch(() => 'unknown');
        console.error(`[Website Analyzer] Synthesis failed (${synthResp.status}):`, err.slice(0, 200));
      } else {
        console.log(`[Website Analyzer] Synthesis completed for brand ${brand_id}`);
      }
    }).catch((err) => {
      console.error(`[Website Analyzer] Synthesis fetch error:`, err.message);
    });

    // Audit log
    await supabase.from('creative_studio_audit_log').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'analyze_brand_website',
      brand_id,
      parameters: {
        url: normalizedUrl,
        pages_analyzed: pages.length,
        css_custom_property_colors: cssCustomPropertyColors.length,
        semantic_element_colors: semanticElementColors.length,
        css_raw_colors: cssRawColors.length,
        theme_color: themeColorMeta || null,
        fonts_found: googleFonts.length + fontFaceFonts.length + cssVariableFonts.length + cssFonts.length,
        logo_urls_found: logoUrls.length,
        screenshot_included: !!screenshotBase64,
        brand_pages_discovered: brandPageUrls.length,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      url: normalizedUrl,
      pages_analyzed: pages.length,
      analysis,
      extraction: {
        css_colors: [...cssCustomPropertyColors, ...semanticElementColors.filter(c => !cssCustomPropertyColors.includes(c)), ...cssRawColors.filter(c => !cssCustomPropertyColors.includes(c) && !semanticElementColors.includes(c))],
        css_custom_property_colors: cssCustomPropertyColors,
        semantic_element_colors: semanticElementColors,
        theme_color: themeColorMeta,
        css_fonts: cssFonts,
        google_fonts: googleFonts,
        font_face_fonts: fontFaceFonts,
        css_variable_fonts: cssVariableFonts,
        typekit_fonts: typekitFonts,
        logo_urls: realLogoUrls,
        image_urls: pages.flatMap(p => p.imageUrls).slice(0, 20),
        favicon_url: faviconUrl,
        screenshot_included: !!screenshotBase64,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Brand website analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Website analysis failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
