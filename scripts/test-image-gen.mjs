// Quick test: authenticate and generate an image via the edge function
const SUPABASE_URL = 'https://foolpmhiedplyftbiocb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvb2xwbWhpZWRwbHlmdGJpb2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTA0NzcsImV4cCI6MjA4ODMyNjQ3N30.HuAbOrT5cdTb_zc1eyAj5KjAYL44HVs1vDSKjmqwL7w';

async function main() {
  // Authenticate
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@brandlens.dev', password: 'BrandLens2026!' })
  });
  const auth = await authRes.json();
  if (!auth.access_token) { console.log('Auth failed:', auth); return; }
  console.log('Auth OK');

  // Generate image
  console.log('Generating image...');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-creative-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      generation_type: 'text_to_image',
      prompt: 'A professional photo of a fresh Subway sandwich on a wooden cutting board, studio lighting',
      model_id: 'gemini-2.5-flash-image',
      brand_id: 'e9b5bcb5-5de5-4d64-9b82-1c63a2636792',
      aspect_ratio: '16:9',
      num_outputs: 1
    })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Success:', data.success);
  console.log('Images:', data.images?.length || 0);
  if (data.error) console.log('Error:', data.error);
  if (data.generation_time_ms) console.log('Time:', data.generation_time_ms + 'ms');
  if (data.images?.[0]) console.log('Image URL prefix:', data.images[0].substring(0, 80) + '...');
  // Log full response keys
  console.log('Response keys:', Object.keys(data));
  if (data.output_urls) console.log('output_urls:', data.output_urls?.length);
  if (data.generation_id) console.log('generation_id:', data.generation_id);
  if (data.model_used) console.log('model_used:', data.model_used);
  // Log raw response for debugging
  const safeData = { ...data };
  if (safeData.images) safeData.images = `[${safeData.images.length} items]`;
  console.log('Full response:', JSON.stringify(safeData, null, 2).substring(0, 500));
}

main().catch(e => console.error(e));
