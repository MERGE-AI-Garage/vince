import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input sanitization for image generation prompts
// Duplicated from src/utils/imagePromptCleaning.ts (can't import in Deno)
function cleanDescriptionForImagePrompt(description: string): string {
  if (!description) return 'Professional product';

  let cleaned = description;

  // Remove metadata phrases (case-insensitive)
  const metadataPhrases = [
    'fabricated by research agents',
    'non-existent AI development platform',
    'non-existent platform',
    'non-existent tool',
    'hallucination incident',
    'serves as a record',
    'this entry serves',
    'pending review and categorization',
    'imported from AI research',
    'Tool Recon category',
  ];

  for (const phrase of metadataPhrases) {
    const regex = new RegExp(phrase, 'gi');
    cleaned = cleaned.replace(regex, '');
  }

  // Clean up whitespace and punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\.\s*\./g, '.');
  cleaned = cleaned.replace(/^[\s.,]+|[\s.,]+$/g, '');

  return cleaned || 'Professional product';
}

function shouldExcludeCategoryFromPrompt(categoryName: string | undefined): boolean {
  if (!categoryName) return false;
  const stagingCategories = ['Tool Recon', 'tool-recon'];
  return stagingCategories.some(cat =>
    categoryName.toLowerCase().includes(cat.toLowerCase())
  );
}

interface GenerateRequest {
  prompt: string;
  aspectRatio?: string;
  style?: string;
  contentType?: string;
  title?: string;
  description?: string;
  category?: string;
  brand_id?: string;
}

// Detect brand context from product name and description
const detectBrandContext = (title: string, description: string): {
  brandName?: string;
  brandStyle?: string;
  isKnownProduct?: boolean;
  productType?: string;
} => {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = `${titleLower} ${descLower}`;

  // Known company brands and their aesthetic
  const brandPatterns = {
    'google': { style: 'Google product design: clean geometric shapes, modern gradients, colorful but sophisticated, approachable', examples: 'Google Keep, Google Drive, Gmail' },
    'microsoft': { style: 'Microsoft Fluent Design: modern, clean, depth through lighting and materials, professional', examples: 'Microsoft Teams, OneDrive, Office' },
    'notion': { style: 'Notion aesthetic: minimalist, modern, clean typography, subtle colors, productivity-focused', examples: 'Notion, Coda' },
    'linear': { style: 'Linear design language: dark mode optimized, sharp geometric shapes, bold accent colors, technical', examples: 'Linear, Height' },
    'figma': { style: 'Figma visual style: colorful gradients, geometric shapes, design tool aesthetic, creative but professional', examples: 'Figma, FigJam' },
    'openai': { style: 'OpenAI aesthetic: sophisticated AI interface, clean modern design, technical but approachable', examples: 'ChatGPT, DALL-E' },
    'anthropic': { style: 'Anthropic design: modern geometric shapes, clean interface, AI-forward, professional', examples: 'Claude, Claude Code' },
    'slack': { style: 'Slack visual language: colorful, friendly, communication-focused, modern but approachable', examples: 'Slack, Discord' },
    'dropbox': { style: 'Dropbox aesthetic: clean, modern, geometric, file management focused', examples: 'Dropbox, Box' },
    'atlassian': { style: 'Atlassian design: bold colors, modern interface, productivity tools aesthetic', examples: 'Jira, Confluence, Trello' }
  };

  // Check for known brands in title or description
  for (const [brand, info] of Object.entries(brandPatterns)) {
    if (combined.includes(brand)) {
      return { brandName: brand, brandStyle: info.style, isKnownProduct: true, productType: 'branded' };
    }
  }

  // Infer product type from keywords
  if (combined.match(/\b(ai|artificial intelligence|ml|machine learning|llm|gpt|chatbot)\b/)) {
    return { productType: 'ai-tool', brandStyle: 'Modern AI tool aesthetic: clean interface, tech-forward design, sophisticated gradients, neural network inspired elements, professional but innovative' };
  }
  if (combined.match(/\b(note|notes|notebook|wiki|knowledge|docs|documentation)\b/)) {
    return { productType: 'note-taking', brandStyle: 'Note-taking app aesthetic similar to Notion or Evernote: clean, minimalist, typography-focused, productivity oriented, calm colors' };
  }
  if (combined.match(/\b(design|designer|creative|graphics|visual)\b/)) {
    return { productType: 'design-tool', brandStyle: 'Design tool aesthetic similar to Figma or Canva: colorful gradients, creative layouts, modern interface, design-forward' };
  }
  if (combined.match(/\b(developer|code|coding|programming|api|github)\b/)) {
    return { productType: 'developer-tool', brandStyle: 'Developer tool aesthetic similar to VS Code or GitHub: technical, dark mode friendly, monospace accents, precise geometric shapes' };
  }
  if (combined.match(/\b(productivity|task|project|workflow|automation)\b/)) {
    return { productType: 'productivity', brandStyle: 'Productivity tool aesthetic similar to Todoist or Asana: clean, organized, modern interface, task-focused design' };
  }

  return { productType: 'saas-product' };
};

const generateContextualPrompt = async (params: GenerateRequest): Promise<string> => {
  const { prompt, style = 'professional', contentType = 'use-case', title, description, category } = params;

  // Get style configuration from database
  const styleConfig = await getStylePrompt(style);

  // Detect if this is a custom user prompt using the contentType flag
  const isCustomPrompt = contentType === 'custom' && prompt && prompt.trim().length > 0;

  console.log('Prompt analysis:', {
    prompt: prompt.substring(0, 100) + '...',
    isCustomPrompt,
    hasTitle: !!title,
    hasDescription: !!description
  });

  let contextualPrompt = '';

  if (isCustomPrompt) {
    // For custom prompts: enhance with style but preserve user intent
    contextualPrompt = `Create an image: ${prompt}`;

    if (styleConfig.stylePrompt) {
      contextualPrompt += `. The visual style should be ${styleConfig.stylePrompt.toLowerCase()}`;
    }

    if (styleConfig.colorPalette && styleConfig.colorPalette.length > 0) {
      contextualPrompt += `. Use a color palette featuring ${styleConfig.colorPalette.join(', ')}`;
    }

    if (styleConfig.mood) {
      contextualPrompt += `. The overall mood should feel ${styleConfig.mood.toLowerCase()}`;
    }

  } else if (title && description) {
    // Detect brand context for intelligent prompt generation
    const brandContext = detectBrandContext(title, description);
    console.log('Brand context detected:', brandContext);

    const isLogo = contentType === 'product' || contentType === 'logo';

    if (isLogo) {
      // LOGO GENERATION - Modern app icon aesthetic
      contextualPrompt = `Create a modern app icon logo for "${title}". `;

      // Add brand-specific context if detected
      if (brandContext.isKnownProduct && brandContext.brandStyle) {
        contextualPrompt += `This is associated with ${brandContext.brandName}. Follow ${brandContext.brandStyle}. `;
      } else if (brandContext.brandStyle) {
        contextualPrompt += `${brandContext.brandStyle}. `;
      }

      contextualPrompt += `About the product: ${cleanDescriptionForImagePrompt(description).slice(0, 120)}. `;

      // Logo best practices for modern SaaS products
      contextualPrompt += `Design as a modern app icon suitable for digital products. `;
      contextualPrompt += `Use a single distinctive geometric symbol or abstract shape as the mark. `;
      contextualPrompt += `NO text in the logo - icon only. `;
      contextualPrompt += `The design must be simple enough to work at 32x32 pixels as a favicon. `;
      contextualPrompt += `Use modern gradients or bold solid colors. `;
      contextualPrompt += `The icon should be memorable, distinctive, and immediately recognizable. `;
      contextualPrompt += `Think of logos like Notion (minimalist geometric), Linear (sharp technical shapes), or Figma (bold colorful marks). `;

      if (category && !shouldExcludeCategoryFromPrompt(category)) {
        contextualPrompt += `Product category: ${category}. `;
      }

      // Apply style configuration with product focus
      if (styleConfig.colorPalette && styleConfig.colorPalette.length > 0) {
        contextualPrompt += `Color palette: ${styleConfig.colorPalette.join(', ')} or similar modern tech colors. `;
      }

      contextualPrompt += `${styleConfig.stylePrompt.toLowerCase()} applied to a modern product icon. `;

    } else {
      // HEADER GENERATION - Product marketing aesthetic
      contextualPrompt = `Create a professional product header banner for "${title}". `;

      // Add brand-specific context
      if (brandContext.isKnownProduct && brandContext.brandStyle) {
        contextualPrompt += `This is associated with ${brandContext.brandName}. Follow ${brandContext.brandStyle}. `;
      } else if (brandContext.brandStyle) {
        contextualPrompt += `${brandContext.brandStyle}. `;
      }

      contextualPrompt += `Product overview: ${cleanDescriptionForImagePrompt(description).slice(0, 180)}. `;

      // Header best practices for modern SaaS marketing
      contextualPrompt += `Show the product in action through abstract UI elements, interface mockups, or visual representations of functionality. `;
      contextualPrompt += `Use a wide banner composition (16:9 aspect ratio). `;
      contextualPrompt += `Include modern design elements like clean interfaces, subtle gradients, geometric shapes. `;
      contextualPrompt += `The image should look like professional SaaS product marketing imagery. `;
      contextualPrompt += `Think of header images from Linear, Notion, Figma, or modern AI tools. `;
      contextualPrompt += `Show visual elements that communicate what the product does and its value. `;

      if (category && !shouldExcludeCategoryFromPrompt(category)) {
        contextualPrompt += `Product category: ${category}. `;
      }

      // Apply style configuration
      contextualPrompt += `Visual style: ${styleConfig.stylePrompt.toLowerCase()}. `;

      if (styleConfig.mood) {
        contextualPrompt += `Atmosphere: ${styleConfig.mood.toLowerCase()}. `;
      }

      if (styleConfig.colorPalette && styleConfig.colorPalette.length > 0) {
        contextualPrompt += `Color scheme: ${styleConfig.colorPalette.join(', ')}. `;
      }

      if (styleConfig.designApproach) {
        contextualPrompt += `Design approach: ${styleConfig.designApproach.toLowerCase()}. `;
      }
    }

  } else {
    // Fallback for simple prompts
    contextualPrompt = `Create an image: ${prompt}. The visual style should be ${styleConfig.stylePrompt.toLowerCase()}.`;
  }

  return contextualPrompt.trim();
};

async function getStylePrompt(styleName: string): Promise<{
  stylePrompt: string;
  colorPalette?: string[];
  mood?: string;
  designApproach?: string;
  avoid?: string;
}> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Fetching style configuration for: ${styleName}`);
    const styleKey = `image_generation_style_${styleName}`;
    console.log(`Looking for database key: ${styleKey}`);

    const { data: styleData, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', styleKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error(`Database error fetching style ${styleName}:`, error);
    }

    console.log(`Style query result:`, { styleData, error });

    if (styleData?.value) {
      console.log(`Found database style for ${styleName}:`, JSON.stringify(styleData.value, null, 2));

      const styleConfig = styleData.value;

      return {
        stylePrompt: styleConfig.style_prompt || getDefaultStylePrompt(styleName),
        colorPalette: styleConfig.color_palette,
        mood: styleConfig.mood,
        designApproach: styleConfig.design_approach,
        avoid: styleConfig.avoid
      };
    }

    console.log(`No database style found for ${styleName}, using default`);
    return { stylePrompt: getDefaultStylePrompt(styleName) };
  } catch (error) {
    console.error(`Failed to fetch style ${styleName} from database:`, error);
    return { stylePrompt: getDefaultStylePrompt(styleName) };
  }
}

function getDefaultStylePrompt(styleName: string): string {
  const defaults = {
    professional: "professional, modern, clean, corporate aesthetic with business-appropriate colors and sophisticated layout",
    tech: "futuristic, high-tech, digital, innovative with sleek interfaces and cutting-edge visual design",
    creative: "artistic, colorful, dynamic, inspiring with bold expressive design and creative energy",
    minimal: "minimalist, simple, elegant, subtle with clean lines and sophisticated simplicity",
    merge: "professional yet approachable, health and wellness focused, sophisticated with warmth, featuring Viridian Green and Dark Green accents, curious and transformative aesthetic with Built Different energy"
  };

  return defaults[styleName as keyof typeof defaults] || defaults.professional;
}

serve(async (req) => {
  console.log('Generate header image function called')

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, aspectRatio = '16:9', style = 'professional', contentType, title, description, category, brand_id } = await req.json() as GenerateRequest

    console.log('Request params:', { prompt, aspectRatio, style, contentType, title, description, category })

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    console.log('Environment check - API Key exists:', !!apiKey)

    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      throw new Error('Missing Gemini API Key')
    }

    // Generate contextual prompt optimized for Gemini
    const contextualPrompt = await generateContextualPrompt({
      prompt, style, contentType, title, description, category, aspectRatio
    });

    console.log('Generated contextual prompt:', contextualPrompt)

    const startTime = Date.now();

    // Use Gemini 3 Pro Image (Nano Banana Pro) - better quality and text rendering
    // https://ai.google.dev/gemini-api/docs/image-generation
    const model = 'gemini-3-pro-image-preview';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Map aspect ratios to Gemini format
    const geminiAspectRatio = aspectRatio; // Gemini supports: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9

    const requestBody = {
      contents: [{
        parts: [{
          text: contextualPrompt
        }]
      }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: geminiAspectRatio,
          imageSize: "2K" // Use 2K for better quality without 4K cost (1K, 2K, 4K available)
        }
      }
    }

    console.log('Making request to Gemini Image Generation API...')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Gemini API response status:', response.status)
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      console.error('Gemini API status:', response.status)

      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini API response received')

    // Extract image from Gemini response
    // Response format: { candidates: [{ content: { parts: [{ inlineData: { mimeType, data } }] } }] }
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('Invalid response structure:', data)
      throw new Error('Invalid response from Gemini API')
    }

    const imagePart = data.candidates[0].content.parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
      console.error('No image data in response:', data)
      throw new Error('No image data in Gemini response')
    }

    const base64Image = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    console.log('Successfully generated image with Gemini')

    // Initialize Supabase for storage and tracking
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from request headers if available
    const authHeader = req.headers.get('authorization');
    let userId = 'system';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch (error) {
        console.log('Could not extract user from token, using system');
      }
    }

    // Convert base64 to blob for storage
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBuffer], { type: mimeType });

    // Generate unique filename matching manual upload structure
    const timestamp = Date.now();
    const extension = mimeType.split('/')[1] || 'png';

    // Determine path based on content type to match manual uploads
    // Logos go to products/logos/, headers go to products/headers/
    const isLogo = contentType === 'product' || contentType === 'logo';
    const folder = isLogo ? 'products/logos' : 'products/headers';
    const imageName = `${folder}/${timestamp}.${extension}`;

    let storagePath = '';
    let publicImageUrl = imageUrl; // Fallback to base64
    let fileSize = imageBuffer.length;

    try {
      // Upload to Supabase Storage - same bucket as manual uploads
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(imageName, imageBlob, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      } else {
        storagePath = uploadData.path;
        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(imageName);

        if (urlData?.publicUrl) {
          publicImageUrl = urlData.publicUrl;
          console.log('Image uploaded to storage:', storagePath);
        }
      }
    } catch (storageError) {
      console.error('Storage error:', storageError);
      // Continue with base64 fallback
    }

    // Save to creative_studio_generations table
    const { data: generationRecord, error: dbError } = await supabase
      .from('creative_studio_generations')
      .insert({
        user_id: userId !== 'system' ? userId : null,
        brand_id: brand_id || null,
        generation_type: 'header_image',
        model_used: model,
        prompt_text: contextualPrompt,
        parameters: {
          original_prompt: prompt,
          aspectRatio,
          imageSize: '2K',
          style,
          contentType,
          title,
          description,
          category,
        },
        output_urls: [publicImageUrl],
        status: 'completed',
        generation_time_ms: responseTime,
        metadata: {
          endpoint: 'gemini-image-generation',
          mimeType,
          storage_path: storagePath,
        },
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
    } else {
      console.log('Image generation recorded in database:', generationRecord?.id);
    }

    // Add to media library for discoverability via "Select from Media Library"
    try {
      // Get or create "Product Images" folder
      let folderId: string | null = null;
      const { data: existingFolder } = await supabase
        .from('media_folders')
        .select('id')
        .eq('path', '/Product Images')
        .single();

      if (existingFolder) {
        folderId = existingFolder.id;
      } else {
        // Create folder if it doesn't exist (defensive - should exist from migration)
        const { data: newFolder } = await supabase
          .from('media_folders')
          .insert({
            name: 'Product Images',
            parent_id: null,
            description: 'Images for product cards including AI-generated logos and headers',
            color: '#8b5cf6',
            icon: 'image'
          })
          .select('id')
          .single();

        if (newFolder) folderId = newFolder.id;
      }

      // Insert into media table
      const filename = `${timestamp}.${extension}`;
      await supabase
        .from('media')
        .insert({
          filename,
          title: title || (prompt ? prompt.slice(0, 100) : 'AI Generated Image'),
          description: prompt || '',
          url: publicImageUrl,
          storage_path: publicImageUrl,
          thumbnail_url: publicImageUrl,
          mime_type: mimeType,
          file_type: 'image',
          size_bytes: fileSize,
          folder_id: folderId,
          custom_metadata: {
            source: 'gemini-ai',
            ai_generation_id: generationRecord?.id,
            model_used: model,
            content_type: contentType,
            style_used: style,
            category: category,
            generation_time_ms: responseTime,
            original_prompt: prompt,
            expanded_prompt: contextualPrompt,
            aspect_ratio: aspectRatio
          },
          created_by: userId !== 'system' ? userId : null,
        });

      console.log('Image added to media library in Product Images folder');
    } catch (mediaError) {
      // Don't fail the generation if media insert fails
      console.error('Failed to add to media library:', mediaError);
    }

    return new Response(
      JSON.stringify({
        imageUrl: publicImageUrl,
        prompt: contextualPrompt,
        aspectRatio,
        style,
        contentType
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in generate-header-image function:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to generate image',
        details: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})
