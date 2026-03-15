// ABOUTME: Registers an uploaded image in the media library so it's discoverable via the media picker.
// ABOUTME: Supports any media folder path and works with all admin content upload flows.

import { supabase } from '@/integrations/supabase/client';
import { initializeGeminiVision, isGeminiInitialized, analyzeImage } from '@/services/media/geminiMediaAnalyzer';

interface RegisterMediaImageParams {
  url: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  folderPath?: string;
  title?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registers an uploaded image in the media library.
 * Non-blocking — errors are logged but won't fail the caller.
 */
export async function registerMediaLibraryImage({
  url,
  storagePath,
  filename,
  mimeType,
  fileSize,
  folderPath,
  title,
  source = 'upload',
  metadata,
}: RegisterMediaImageParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    let folderId: string | null = null;

    if (folderPath) {
      const { data: folder } = await supabase
        .from('media_folders')
        .select('id')
        .eq('path', folderPath)
        .single();

      if (folder) {
        folderId = folder.id;
      } else {
        console.warn(`[registerMediaLibraryImage] Folder "${folderPath}" not found, using root`);
      }
    }

    const { data: inserted, error: insertError } = await supabase.from('media').insert({
      filename,
      title: title || filename,
      url,
      storage_path: storagePath,
      thumbnail_url: url,
      mime_type: mimeType,
      file_type: 'image',
      size_bytes: fileSize,
      folder_id: folderId,
      created_by: user?.id,
      custom_metadata: {
        source,
        ...metadata,
      },
    }).select('id').single();

    if (insertError) throw insertError;

    console.log(`[registerMediaLibraryImage] Registered in media library${folderPath ? ` (${folderPath})` : ''}`);

    // Fire-and-forget: analyze image in the background without blocking the caller
    if (inserted?.id) {
      analyzeAndTagMedia(inserted.id, url, mimeType, filename, metadata?.original_image_data as string | undefined);
    }
  } catch (error) {
    console.error('[registerMediaLibraryImage] Failed to register image:', error);
  }
}

async function analyzeAndTagMedia(
  mediaId: string,
  imageUrl: string,
  mimeType: string,
  filename: string,
  originalImageData?: string
): Promise<void> {
  try {
    if (!isGeminiInitialized()) {
      const { data: apiKey } = await supabase.rpc('get_secret', { secret_name: 'GEMINI_API_KEY' });
      if (!apiKey) {
        console.warn('[registerMediaLibraryImage] GEMINI_API_KEY not found in vault, skipping AI analysis');
        return;
      }
      initializeGeminiVision(apiKey);
    }

    let base64Data: string;
    if (originalImageData) {
      base64Data = originalImageData;
    } else {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    const analysis = await analyzeImage(base64Data, mimeType, filename);

    // Fetch current custom_metadata so we can merge rather than overwrite
    const { data: current } = await supabase.from('media').select('custom_metadata').eq('id', mediaId).single();

    await supabase.from('media').update({
      title: analysis.suggestedTitle,
      description: analysis.altText,
      auto_tags: analysis.tags,
      detected_objects: analysis.detectedObjects,
      dominant_colors: analysis.dominantColors,
      ai_analysis_cost: analysis.cost,
      ai_analysis_model: analysis.model,
      synthid_detected: analysis.synthId?.detected ?? null,
      synthid_confidence: analysis.synthId?.confidence ?? null,
      synthid_generated_by: analysis.synthId?.generatedBy ?? null,
      synthid_details: analysis.synthId?.details ?? null,
      custom_metadata: {
        ...(current?.custom_metadata as Record<string, unknown> ?? {}),
        ai_analysis: {
          content_type: analysis.contentType,
          use_cases: analysis.useCases,
          confidence: analysis.confidence,
          analyzed_at: new Date().toISOString(),
        },
      },
    }).eq('id', mediaId);

    console.log(`[registerMediaLibraryImage] AI analysis complete for ${filename}`);
  } catch (err) {
    console.error('[registerMediaLibraryImage] AI auto-tagging failed:', err);
    // Never throw — caller must not be affected
  }
}
