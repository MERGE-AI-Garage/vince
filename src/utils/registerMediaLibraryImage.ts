// ABOUTME: Registers an uploaded image in the media library so it's discoverable via the media picker.
// ABOUTME: Supports any media folder path and works with all admin content upload flows.

import { supabase } from '@/integrations/supabase/client';

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

    await supabase.from('media').insert({
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
    });

    console.log(`[registerMediaLibraryImage] Registered in media library${folderPath ? ` (${folderPath})` : ''}`);
  } catch (error) {
    console.error('[registerMediaLibraryImage] Failed to register image:', error);
  }
}
