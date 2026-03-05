// ABOUTME: Analyzes an image using Gemini vision to recommend the best expansion direction
// ABOUTME: Returns left/right/top/bottom based on composition and subject placement

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    const imageData = image.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');

    const response = await fetch(
      `${BASE_URL}/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageData,
                },
              },
              {
                text: `Analyze this image's composition and determine which direction would benefit most from expanding the canvas. Consider:
- Where the main subject is positioned (if left of center, expanding right makes sense)
- Whether content appears cropped at any edge
- Where there's potential to extend the scene naturally
- Which direction would create the most visually appealing wider composition

Respond with ONLY one word: left, right, top, or bottom`,
              },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim() || '';

    // Extract direction from response
    let direction = 'right'; // default
    if (text.includes('left')) direction = 'left';
    else if (text.includes('right')) direction = 'right';
    else if (text.includes('top') || text.includes('up')) direction = 'top';
    else if (text.includes('bottom') || text.includes('down')) direction = 'bottom';

    return new Response(
      JSON.stringify({ direction, reasoning: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
