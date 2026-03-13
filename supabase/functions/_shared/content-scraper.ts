// ABOUTME: Deep content scraper that extracts structured text, images, and videos from web pages
// ABOUTME: Preserves headings, lists, code blocks, document structure, and YouTube embeds for AI processing

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

export interface ScrapedImage {
  url: string;
  alt: string;
  nearestHeading: string;
}

export interface ScrapedVideo {
  url: string;
  videoId: string;
  title: string;
  nearestHeading: string;
}

export interface ScrapedContent {
  title: string;
  url: string;
  text: string;
  headings: string[];
  links: string[];
  images: ScrapedImage[];
  videos: ScrapedVideo[];
  charCount: number;
  success: boolean;
  error?: string;
}

const NOISE_TAGS = ['script', 'style', 'nav', 'footer', 'noscript', 'svg', 'iframe', 'aside'];
const HEADER_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const BLOCK_TAGS = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'LI', 'TR', 'BLOCKQUOTE', 'PRE', 'CODE', 'DT', 'DD']);

const YOUTUBE_EMBED_RE = /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9_-]{11})/;
const YOUTUBE_WATCH_RE = /(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// URL path segments that indicate decorative/UI images rather than content images
const DECORATIVE_IMAGE_RE = /(?:\/(?:icon|logo|avatar|badge|sprite|favicon|thumb|thumbnail|arrow|bullet|spacer|pixel|tracking|button|nav|menu|social|share|emoji|flag|rating|star|close|search|hamburger|caret|chevron|dropdown)s?[\/_.-])|(?:[_-](?:icon|logo|avatar|badge|sprite|thumb|xs|xxs)s?\.)/i;

const OPAQUE_REDIRECT_HOSTS = [
  'vertexaisearch.cloud.google.com',
  'www.google.com',
];

/**
 * Resolves a URL through redirects via HEAD request.
 * Returns the final URL, or null if the URL is an opaque redirect
 * that can't be resolved (e.g., Google Search grounding redirect URLs).
 */
export async function resolveUrl(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (!OPAQUE_REDIRECT_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
      return url;
    }
  } catch {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Vince-Bot/1.0)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    const finalUrl = response.url;
    const finalHost = new URL(finalUrl).hostname;

    if (OPAQUE_REDIRECT_HOSTS.some(h => finalHost === h || finalHost.endsWith('.' + h))) {
      console.warn(`[Content Scraper] Opaque redirect could not be resolved: ${url}`);
      return null;
    }

    console.log(`[Content Scraper] Resolved redirect: ${url.substring(0, 80)}... → ${finalUrl}`);
    return finalUrl;
  } catch (err: any) {
    console.warn(`[Content Scraper] Failed to resolve redirect ${url.substring(0, 80)}: ${err.message}`);
    return null;
  }
}

/**
 * Validates a YouTube video ID via oEmbed and returns enriched metadata.
 * Returns null if the video is unavailable, private, or deleted.
 */
async function validateYouTubeVideo(
  videoId: string,
): Promise<{ title: string; durationLabel: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null; // 401/403/404 = unavailable
    const data = await response.json();
    return {
      title: data.title || '',
      durationLabel: '', // oEmbed doesn't include duration, but confirms video is live
    };
  } catch {
    return null; // network error or timeout — treat as unvalidated, don't discard
  }
}

/**
 * Scrapes a URL and extracts structured text content.
 * Preserves headings, paragraphs, list items, and code blocks.
 * Resolves opaque redirect URLs before scraping.
 * Retries once on transient failures.
 */
export async function scrapePageContent(
  url: string,
  maxChars = 80000,
  timeoutMs = 20000,
): Promise<ScrapedContent> {
  const empty: ScrapedContent = { title: '', url, text: '', headings: [], links: [], images: [], videos: [], charCount: 0, success: false };

  // Resolve redirect URLs before scraping
  const resolvedUrl = await resolveUrl(url);
  if (!resolvedUrl) {
    return { ...empty, error: 'Opaque redirect URL could not be resolved' };
  }
  if (resolvedUrl !== url) {
    url = resolvedUrl;
    empty.url = url;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Vince-Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        if (attempt === 0 && response.status >= 500) continue; // retry server errors
        return { ...empty, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc) return { ...empty, error: 'Failed to parse HTML' };

      // Extract YouTube videos BEFORE noise removal strips iframes
      const videos: ScrapedVideo[] = [];
      const seenVideoIds = new Set<string>();

      // Helper: find nearest heading by walking backwards through DOM
      const findNearestHeading = (el: any): string => {
        let prev = el.previousElementSibling || el.parentElement;
        while (prev) {
          if (HEADER_TAGS.has(prev.tagName?.toUpperCase() || '')) {
            return prev.textContent?.trim() || '';
          }
          prev = prev.previousElementSibling || prev.parentElement;
        }
        return '';
      };

      // 1. Standard YouTube iframes
      doc.querySelectorAll('iframe[src]').forEach((iframe: any) => {
        const src = iframe.getAttribute('src') || '';
        const match = src.match(YOUTUBE_EMBED_RE);
        if (match && !seenVideoIds.has(match[1])) {
          seenVideoIds.add(match[1]);
          videos.push({
            url: `https://www.youtube.com/embed/${match[1]}`,
            videoId: match[1],
            title: iframe.getAttribute('title') || '',
            nearestHeading: findNearestHeading(iframe),
          });
        }
      });

      // 2. Custom YouTube web components (gws-youtube-video, youtube-video)
      doc.querySelectorAll('[video-id]').forEach((el: any) => {
        const tag = el.tagName?.toLowerCase() || '';
        if (!tag.includes('youtube') && !tag.includes('video')) return;
        const videoId = el.getAttribute('video-id') || '';
        if (videoId.length === 11 && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          videos.push({
            url: `https://www.youtube.com/embed/${videoId}`,
            videoId,
            title: el.getAttribute('label') || el.getAttribute('title') || '',
            nearestHeading: findNearestHeading(el),
          });
        }
      });

      // 3. YouTube URLs from JSON-LD VideoObject structured data
      doc.querySelectorAll('script[type="application/ld+json"]').forEach((script: any) => {
        try {
          const data = JSON.parse(script.textContent || '');
          // Walk JSON-LD graph to find VideoObject entries with YouTube URLs
          const extractVideos = (obj: any): void => {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) { obj.forEach(extractVideos); return; }
            const type = obj['@type'];
            if (type === 'VideoObject' || type === 'Video') {
              const contentUrl = obj.contentUrl || obj.embedUrl || obj.url || '';
              const match = contentUrl.match(YOUTUBE_WATCH_RE) || contentUrl.match(YOUTUBE_EMBED_RE);
              if (match && !seenVideoIds.has(match[1])) {
                seenVideoIds.add(match[1]);
                videos.push({
                  url: `https://www.youtube.com/embed/${match[1]}`,
                  videoId: match[1],
                  title: obj.name || obj.description || '',
                  nearestHeading: '',
                });
              }
            }
            // Recurse into nested objects (e.g., @graph arrays)
            for (const val of Object.values(obj)) {
              if (typeof val === 'object') extractVideos(val);
            }
          };
          extractVideos(data);
        } catch { /* skip malformed JSON-LD */ }
      });

      // Remove noise elements
      for (const tag of NOISE_TAGS) {
        doc.querySelectorAll(tag).forEach((el: any) => el.remove());
      }

      // Extract title
      const title = doc.querySelector('title')?.textContent?.trim() || '';

      // Find the best content root
      const root = doc.querySelector('article')
        || doc.querySelector('main')
        || doc.querySelector('[role="main"]')
        || doc.querySelector('.content')
        || doc.querySelector('#content')
        || doc.querySelector('body');

      if (!root) return { ...empty, title, error: 'No content root found' };

      // Walk the DOM and extract structured text + images
      const lines: string[] = [];
      const headings: string[] = [];
      const images: ScrapedImage[] = [];
      walkNode(root, lines, headings, images, url);

      // Extract same-domain content links for subpage discovery
      const links: string[] = [];
      try {
        const base = new URL(url);
        const anchors = root.querySelectorAll('a[href]');
        const seen = new Set<string>();
        for (const anchor of anchors) {
          const href = (anchor as any).getAttribute('href') || '';
          if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
          try {
            const absUrl = new URL(href, url).href.split('#')[0]; // strip fragments
            const linkUrl = new URL(absUrl);
            if (linkUrl.hostname === base.hostname && !seen.has(absUrl) && absUrl !== url) {
              seen.add(absUrl);
              links.push(absUrl);
            }
          } catch { /* skip invalid URLs */ }
        }
      } catch { /* skip if base URL parse fails */ }

      // Extract YouTube links from <a> tags (supplements iframe extraction)
      try {
        const anchors = root.querySelectorAll('a[href]');
        for (const anchor of anchors) {
          const href = (anchor as any).getAttribute('href') || '';
          const match = href.match(YOUTUBE_WATCH_RE);
          if (match) {
            const videoId = match[1];
            if (!seenVideoIds.has(videoId)) {
              seenVideoIds.add(videoId);
              const linkText = (anchor as any).textContent?.trim() || '';
              videos.push({
                url: `https://www.youtube.com/embed/${videoId}`,
                videoId,
                title: linkText,
                nearestHeading: headings.length > 0 ? headings[headings.length - 1] : '',
              });
            }
          }
        }
      } catch { /* skip if YouTube link extraction fails */ }

      // Validate YouTube videos via oEmbed — remove dead/private ones, enrich titles
      if (videos.length > 0) {
        const validationResults = await Promise.allSettled(
          videos.map(v => validateYouTubeVideo(v.videoId))
        );
        for (let i = validationResults.length - 1; i >= 0; i--) {
          const result = validationResults[i];
          if (result.status === 'fulfilled' && result.value === null) {
            console.warn(`[Content Scraper] Removing unavailable YouTube video: ${videos[i].videoId}`);
            videos.splice(i, 1);
          } else if (result.status === 'fulfilled' && result.value) {
            // Enrich title from oEmbed if scrape didn't capture one
            if (!videos[i].title && result.value.title) {
              videos[i].title = result.value.title;
            }
          }
        }
      }

      // Join, collapse excessive blank lines, and truncate
      let text = lines.join('\n')
        .replace(/\n{4,}/g, '\n\n\n')
        .trim();

      if (text.length > maxChars) {
        text = text.substring(0, maxChars) + '\n\n[...truncated at ' + maxChars.toLocaleString() + ' chars]';
      }

      console.log(`[Content Scraper] ${url}: ${images.length} images, ${videos.length} videos captured`);

      return {
        title,
        url,
        text,
        headings,
        links,
        images,
        videos,
        charCount: text.length,
        success: true,
      };
    } catch (err: any) {
      if (attempt === 0 && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        console.warn(`[Content Scraper] Timeout on ${url}, retrying...`);
        continue;
      }
      return { ...empty, error: err.message };
    }
  }

  return { ...empty, error: 'Failed after 2 attempts' };
}

/**
 * Recursively walks DOM nodes and extracts structured text.
 * Preserves heading hierarchy, list structure, code blocks, and images.
 */
function walkNode(
  node: any,
  lines: string[],
  headings: string[],
  images: ScrapedImage[],
  baseUrl: string,
): void {
  if (!node) return;

  // Text node
  if (node.nodeType === 3) {
    const text = node.textContent?.replace(/\s+/g, ' ') || '';
    if (text.trim()) lines.push(text.trim());
    return;
  }

  // Element node
  if (node.nodeType !== 1) return;

  const tag = node.tagName?.toUpperCase() || '';

  // Headings — preserve with markdown markers
  if (HEADER_TAGS.has(tag)) {
    const level = parseInt(tag[1]);
    const prefix = '#'.repeat(level);
    const text = node.textContent?.trim() || '';
    if (text) {
      lines.push('');
      lines.push(`${prefix} ${text}`);
      lines.push('');
      headings.push(text);
    }
    return;
  }

  // Images — emit as markdown with absolute URL
  if (tag === 'IMG') {
    const src = node.getAttribute('src') || '';
    const alt = node.getAttribute('alt') || '';
    if (!src || src.startsWith('data:')) return;

    // Skip tiny images via HTML attributes (icons, tracking pixels)
    const width = parseInt(node.getAttribute('width') || '0');
    const height = parseInt(node.getAttribute('height') || '0');
    if ((width > 0 && width < 50) || (height > 0 && height < 50)) return;

    // Skip images with decorative CSS roles or ARIA attributes
    const role = node.getAttribute('role') || '';
    const ariaHidden = node.getAttribute('aria-hidden') || '';
    if (role === 'presentation' || role === 'none' || ariaHidden === 'true') return;

    // Resolve relative URLs
    let absoluteUrl = src;
    try {
      absoluteUrl = new URL(src, baseUrl).href;
    } catch { /* use src as-is */ }

    // Skip SVGs and decorative/UI image URL patterns
    if (absoluteUrl.endsWith('.svg')) return;
    if (DECORATIVE_IMAGE_RE.test(absoluteUrl)) return;

    lines.push('');
    lines.push(`![${alt}](${absoluteUrl})`);
    lines.push('');
    images.push({
      url: absoluteUrl,
      alt,
      nearestHeading: headings.length > 0 ? headings[headings.length - 1] : '',
    });
    return;
  }

  // Code blocks — preserve as fenced
  if (tag === 'PRE') {
    const code = node.textContent?.trim() || '';
    if (code) {
      lines.push('');
      lines.push('```');
      lines.push(code);
      lines.push('```');
      lines.push('');
    }
    return;
  }

  // List items — prefix with bullet/number
  if (tag === 'LI') {
    const parent = node.parentElement?.tagName?.toUpperCase();
    const prefix = parent === 'OL' ? '1.' : '-';
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (text) lines.push(`${prefix} ${text}`);
    return;
  }

  // Table rows — join cells with pipes
  if (tag === 'TR') {
    const cells = node.querySelectorAll('td, th');
    const cellTexts: string[] = [];
    cells.forEach((cell: any) => {
      cellTexts.push(cell.textContent?.trim() || '');
    });
    if (cellTexts.some(t => t)) lines.push(`| ${cellTexts.join(' | ')} |`);
    return;
  }

  // Blockquotes
  if (tag === 'BLOCKQUOTE') {
    const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (text) {
      lines.push('');
      lines.push(`> ${text}`);
      lines.push('');
    }
    return;
  }

  // Block elements — add newlines
  if (BLOCK_TAGS.has(tag)) {
    const children = node.childNodes;
    for (const child of children) {
      walkNode(child, lines, headings, images, baseUrl);
    }
    lines.push('');
    return;
  }

  // All other elements — recurse into children
  const children = node.childNodes;
  for (const child of children) {
    walkNode(child, lines, headings, images, baseUrl);
  }
}

/**
 * Scrapes multiple URLs and returns combined content.
 */
export async function scrapeMultipleUrls(
  urls: string[],
  maxCharsPerUrl = 80000,
): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];
  for (const url of urls) {
    const result = await scrapePageContent(url, maxCharsPerUrl);
    results.push(result);
    console.log(`[Content Scraper] ${url}: ${result.success ? `${result.charCount} chars, ${result.headings.length} headings, ${result.images.length} images, ${result.videos.length} videos` : result.error}`);
  }
  return results;
}
