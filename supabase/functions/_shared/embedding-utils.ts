// ABOUTME: Shared utility for generating embeddings and vectorizing brand profile chunks.
// ABOUTME: Uses gemini-embedding-2-preview (768-dim) via Generative Language API with pgvector storage.

const EMBEDDING_MODEL = 'gemini-embedding-2-preview';
const EMBEDDING_DIMS = 768;
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

export async function getEmbedding(
  geminiApiKey: string,
  text: string,
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_QUERY',
): Promise<number[]> {
  const response = await fetch(EMBEDDING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      output_dimensionality: EMBEDDING_DIMS,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown');
    throw new Error(`Embedding API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.embedding?.values ?? [];
}

// deno-lint-ignore no-explicit-any
export async function vectorizeBrandProfile(
  geminiApiKey: string,
  supabase: any,
  brandId: string,
  profile: Record<string, unknown>,
): Promise<void> {
  // Delete existing memory before re-ingesting so re-running synthesis is idempotent
  await supabase.from('creative_studio_brand_memory').delete().eq('brand_id', brandId);

  const chunks: Array<{ category: string; content: string }> = [];

  if (profile.photography_style) {
    chunks.push({
      category: 'photography_style',
      content: `Photography Guidelines: ${JSON.stringify(profile.photography_style)}`,
    });
  }
  const visualDna = profile.visual_dna as Record<string, unknown> | undefined;
  if (visualDna?.donts) {
    chunks.push({
      category: 'compliance',
      content: `Visual Don'ts: ${(visualDna.donts as string[]).join(', ')}`,
    });
  }
  if (visualDna?.dos) {
    chunks.push({
      category: 'compliance',
      content: `Visual Dos: ${(visualDna.dos as string[]).join(', ')}`,
    });
  }
  if (visualDna?.signature_style) {
    chunks.push({
      category: 'visual_dna',
      content: `Signature Style: ${visualDna.signature_style}`,
    });
  }
  if (visualDna?.key_differentiators) {
    chunks.push({
      category: 'visual_dna',
      content: `Key Visual Differentiators: ${JSON.stringify(visualDna.key_differentiators)}`,
    });
  }
  if (profile.tone_of_voice) {
    chunks.push({
      category: 'tone_of_voice',
      content: `Copywriting Tone: ${JSON.stringify(profile.tone_of_voice)}`,
    });
  }
  if (profile.color_profile) {
    chunks.push({
      category: 'color_profile',
      content: `Color Rules: ${JSON.stringify(profile.color_profile)}`,
    });
  }
  if (profile.composition_rules) {
    chunks.push({
      category: 'composition_rules',
      content: `Composition Rules: ${JSON.stringify(profile.composition_rules)}`,
    });
  }
  if (profile.brand_identity) {
    chunks.push({
      category: 'brand_identity',
      content: `Brand Identity: ${JSON.stringify(profile.brand_identity)}`,
    });
  }
  if (profile.typography) {
    chunks.push({
      category: 'typography',
      content: `Typography: ${JSON.stringify(profile.typography)}`,
    });
  }

  for (const chunk of chunks) {
    const vector = await getEmbedding(geminiApiKey, chunk.content, 'RETRIEVAL_DOCUMENT');
    if (!vector.length) continue;
    const { error } = await supabase.from('creative_studio_brand_memory').insert({
      brand_id: brandId,
      category: chunk.category,
      content: chunk.content,
      embedding: `[${vector.join(',')}]`,
    });
    if (error) throw new Error(`Insert failed for category ${chunk.category}: ${error.message}`);
  }
}
