// ABOUTME: Sanitizes Gemini API responses for reliable JSON parsing
// ABOUTME: Handles invisible characters, smart quotes, code fences, and trailing text

/**
 * Clean and parse a JSON string from Gemini's output.
 * Handles common issues: BOM, zero-width chars, smart quotes,
 * code fences, leading/trailing non-JSON text.
 */
export function parseGeminiJSON<T = unknown>(raw: string): T {
  let text = raw.trim();

  // Strip invisible Unicode characters that break JSON.parse
  // (BOM, zero-width chars, control chars, directional marks, invisible formatters)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFEFF\u200B-\u200F\u2028\u2029\u2060-\u206F]/g, '');
  // Replace non-breaking spaces with regular spaces
  text = text.replace(/\u00A0/g, ' ');

  // Replace smart/curly quotes with straight quotes
  text = text.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  text = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'");

  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // If the response starts with non-JSON text, find the JSON object
  if (!text.startsWith('{') && !text.startsWith('[')) {
    const jsonStart = text.indexOf('{');
    if (jsonStart !== -1) {
      text = text.substring(jsonStart);
    }
  }

  // Trim trailing non-JSON text after the closing brace
  // String-aware to avoid counting braces inside JSON string values
  if (text.startsWith('{')) {
    let depth = 0;
    let lastBrace = -1;
    let inString = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (ch === '\\') { i++; continue; }
        if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { lastBrace = i; break; }
      }
    }
    if (lastBrace !== -1 && lastBrace < text.length - 1) {
      text = text.substring(0, lastBrace + 1);
    }
  }

  // Remove trailing commas before ] or } (common Gemini error)
  text = text.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(text);
  } catch (firstErr) {
    // Escape raw newlines/tabs inside JSON string values.
    // Gemini with responseMimeType:'application/json' sometimes outputs literal
    // newlines inside string values (from double-JSON encoding). These are invalid
    // in JSON strings and must be escaped.
    const escaped = escapeRawNewlinesInStrings(text);
    if (escaped !== text) {
      try {
        return JSON.parse(escaped);
      } catch {
        // Fall through
      }
    }
    // Attempt repair: close any unclosed arrays/objects from truncated output
    const repaired = repairTruncatedJSON(text);
    if (repaired !== text) {
      try {
        return JSON.parse(repaired);
      } catch {
        // Fall through to original error
      }
    }
    throw firstErr;
  }
}

/**
 * Attempts to close unclosed JSON structures from truncated Gemini output.
 * Walks the string tracking open brackets/braces (string-aware) and appends
 * whatever closing characters are needed.
 */
function repairTruncatedJSON(text: string): string {
  const stack: string[] = [];
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  if (stack.length === 0) return text;

  // Trim any trailing partial value (incomplete string, number, etc.)
  let trimmed = text;
  if (inString) {
    // Find the last unescaped quote and truncate after it, closing the string
    const lastQuote = trimmed.lastIndexOf('"');
    if (lastQuote > 0) {
      trimmed = trimmed.substring(0, lastQuote + 1);
    }
  }

  // Remove any trailing comma or colon from a partial entry
  trimmed = trimmed.replace(/[,:\s]+$/, '');
  // Remove trailing commas before we close
  trimmed = trimmed.replace(/,\s*([\]}])/g, '$1');

  // Append closing brackets/braces in reverse order
  return trimmed + stack.reverse().join('');
}

/**
 * Walks a JSON string and escapes raw newlines/tabs/carriage returns that
 * appear inside string values. These are invalid in JSON but Gemini sometimes
 * outputs them when content_markdown contains multi-line text.
 */
function escapeRawNewlinesInStrings(text: string): string {
  let result = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\' && i + 1 < text.length) {
        result += ch + text[++i];
        continue;
      }
      if (ch === '"') { inString = false; result += ch; continue; }
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
      result += ch;
    } else {
      if (ch === '"') inString = true;
      result += ch;
    }
  }
  return result;
}
