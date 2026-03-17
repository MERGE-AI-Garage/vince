# Vince Brand Memory — RAG Architecture

**Date:** 2026-03-10
**Status:** Complete ✓
**Hackathon context:** Gemini Live Agent Challenge

---

## Problem

Vince dumps the entire brand profile (visual_dna, photography_style, color_profile,
composition_rules, product_catalog, brand_identity, tone_of_voice, typography) as raw JSON
into the Gemini Live system instruction on every voice session start.

- **~3,000–5,000 tokens** consumed by brand profile JSON at session start
- Increases Time-To-First-Byte (TTFB) for Live session connection
- JSON in the sliding context window dilutes model attention on actual conversation
- Doesn't scale to enterprise brand books (50+ page PDFs)

---

## Solution

Replace the "god prompt" with a vectorized brand memory store (pgvector + Gemini Embedding 2).

**Two access patterns:**

1. **Active recall**: Vince calls `recall_brand_guidelines` tool before generating assets, retrieving only the semantically relevant rules for the task at hand
2. **Invisible RAG**: `generate-creative-package` edge function automatically fetches relevant brand rules before constructing the image generation prompt — failsafe even if Vince doesn't use the tool

---

## Architecture

### Embedding Model
- **Model:** `gemini-embedding-2-preview` (launched March 10, 2026 — same day we built this)
- **API:** Generative Language REST API (`v1beta`) with `x-goog-api-key` header auth
- **Output dimensions:** 768 (via `output_dimensionality: 768` — Matryoshka truncation)
- **Task types:** `RETRIEVAL_DOCUMENT` for ingestion, `RETRIEVAL_QUERY` for search
- 768 dims runs comfortably on Supabase Micro tier with HNSW indexing

### Storage
- **Table:** `creative_studio_brand_memory`
- One row per semantic chunk of brand guidelines
- Categories: `photography_style`, `compliance` (dos + donts as separate chunks), `tone_of_voice`, `visual_dna` (signature style + differentiators), `color_profile`, `composition_rules`, `brand_identity`, `typography`
- **10 chunks** per brand after synthesis
- HNSW index (`vector_cosine_ops`) for fast similarity search

### Ingestion
- Triggered automatically when `synthesize_brand_profile` saves a profile
- **Awaited** (not fire-and-forget) — Deno edge functions terminate on response, so async calls must complete before returning
- Merges existing stored profile with new synthesis output before vectorizing — ensures chunks are always populated even if a synthesis run produces sparse results
- Re-running synthesis re-vectorizes the brand (delete + reinsert, idempotent)
- Embedding vector stored as formatted string `[x,y,z,...]` for pgvector compatibility

### Retrieval
- RPC: `match_brand_memory(query_embedding, threshold, count, brand_id, category?)`
- Cosine similarity via `<=>` operator
- Threshold: 0.5 (adjustable based on testing)
- Top 3–4 results returned per query

---

## Files Changed

| File | Change |
|------|--------|
| Supabase DB | `creative_studio_brand_memory` table, HNSW index, `match_brand_memory` RPC |
| `supabase/functions/_shared/embedding-utils.ts` | `getEmbedding()` + `vectorizeBrandProfile()` using `gemini-embedding-2-preview` |
| `supabase/functions/synthesize-brand-profile/index.ts` | Awaited vectorization after profile save; merges existing profile as fallback |
| `supabase/functions/brand-prompt-agent/index.ts` | `recall_brand_guidelines` tool (declaration + execution) |
| `src/services/brand-agent/brandAgentLiveService.ts` | `buildVoiceSystemInstruction` — removed JSON dumps, added memory protocol |
| `supabase/functions/generate-creative-package/index.ts` | Invisible RAG: auto-fetch brand rules before image prompt construction |

---

## Key Implementation Notes

- **`--no-verify-jwt` flag required** for `synthesize-brand-profile` on every deploy — the gateway handles auth at the app layer; omitting this flag causes 401 before the function runs
- **`gemini-embedding-2-preview` launched March 10, 2026** — `text-embedding-004` was removed from the API around the same time; always use the model listed in `embedding-utils.ts`
- **Vector format**: Supabase JS client requires embeddings as a formatted string `[x,y,z,...]` for pgvector inserts, not a raw JS array
- **Deno edge function lifecycle**: Async work must be awaited before the Response is returned — fire-and-forget promises are killed when the function exits

---

## Demo Talking Point

> "Vince no longer has the full brand book loaded in memory. Instead, he actively searches
> his brand memory — backed by Gemini Embedding 2 (which launched today) and pgvector — to
> retrieve exactly the rules he needs for each generation. This is how Vince scales to
> enterprise brand books."

**In-demo voice interaction to highlight the pattern:**
> "Vince, before you create this LinkedIn ad — check your memory for our photography rules."

Vince calls `recall_brand_guidelines("LinkedIn post photography and visual rules")`,
returns the top matching chunks, narrates them, then proceeds to generate.

---

## What We Explicitly Did NOT Do

- **Supabase Realtime replacement** — awaited pattern works reliably for demo
- **AudioWorklet migration** — ScriptProcessorNode deprecated but stable; too risky pre-demo
- **Retry/backoff** — out of scope
- **Ingestion UI** — re-run synthesis to populate memory; no new UI needed

---

## Testing Checklist

- [x] `creative_studio_brand_memory` table visible in Supabase Table Editor
- [x] After running `synthesize_brand_profile`, 10 rows appear with non-null embeddings
- [ ] Voice: "Vince, what are our photography rules?" triggers `recall_brand_guidelines` tool call
- [ ] System prompt token count measurably reduced (target: ~500 tokens vs previous ~3–5K)
- [ ] Creative package generation: edge function logs show brand rules appended from memory
