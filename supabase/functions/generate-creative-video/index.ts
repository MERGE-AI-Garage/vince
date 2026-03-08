// ABOUTME: Edge Function for Creative Studio video generation via Google Veo API
// ABOUTME: Supports text-to-video, image-to-video, keyframe, scene extension, and reference image modes

import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

type VideoGenerationType = 'text_to_video' | 'image_to_video' | 'scene_extension' | 'keyframe_video' | 'ingredients_to_video' | 'json_prompt_video';

interface GenerateVideoRequest {
  generation_type: VideoGenerationType;
  prompt: string;
  model_id?: string;
  brand_id?: string;
  aspect_ratio?: string;
  resolution?: string;
  duration?: number;
  input_image?: string;
  include_audio?: boolean;
  negative_prompt?: string;
  sample_count?: number;
  seed?: number;
  last_frame?: string;
  source_video?: string;
  target_duration?: number;
  reference_images?: string[];
  // Camera preset selections (slug values from creative_studio_camera_options)
  camera_preset?: Record<string, unknown>;
  // Lab exercise tracking
  lab_module_id?: string;
  lab_program_id?: string;
}

function log(step: string, message: string, data?: unknown) {
  const entry = data ? `[${step}] ${message}: ${JSON.stringify(data).substring(0, 500)}` : `[${step}] ${message}`;
  console.log(entry);
}

// Poll a long-running operation for completion
async function pollForCompletion(
  operationName: string,
  apiKey: string,
  maxAttempts = 120,
  intervalMs = 5000
): Promise<{ videoUris?: string[]; error?: string }> {
  const pollUrl = `${BASE_URL}/${operationName}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    log('POLL', `Attempt ${attempt + 1}/${maxAttempts}`, { operationName });

    const response = await fetch(pollUrl, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('POLL', 'Poll request failed', { status: response.status, error: errorText.substring(0, 300) });
      return { error: `Poll failed: ${response.status} - ${errorText.substring(0, 200)}` };
    }

    const data = await response.json();

    if (data.done) {
      if (data.error) {
        log('POLL', 'Operation completed with error', { error: data.error });
        return { error: data.error.message || 'Video generation failed' };
      }

      // Extract ALL video URIs — API returns generatedSamples (REST) or generatedVideos (SDK)
      const samples =
        data.response?.generateVideoResponse?.generatedSamples
        || data.response?.generatedSamples
        || data.response?.generatedVideos
        || data.result?.generateVideoResponse?.generatedSamples
        || data.result?.generatedVideos;

      if (Array.isArray(samples) && samples.length > 0) {
        const videoUris = samples
          .map((s: Record<string, unknown>) => (s.video as Record<string, unknown>)?.uri as string)
          .filter(Boolean);
        if (videoUris.length > 0) {
          log('POLL', `Video generation complete: ${videoUris.length} video(s)`, {
            firstUri: videoUris[0].substring(0, 100),
          });
          return { videoUris };
        }
      }

      // Log full response structure to diagnose URI extraction failures
      log('POLL', 'No video URI in completed response', {
        responseKeys: Object.keys(data.response || data.result || {}),
        responseSnippet: JSON.stringify(data.response || data.result || {}).substring(0, 500),
      });
      return { error: 'No video URI in completed response' };
    }

    // Not done yet, wait and retry
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return { error: `Timeout after ${maxAttempts * intervalMs / 1000}s waiting for video generation` };
}

serve(async (req) => {
  log('INIT', 'Generate creative video function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let currentStep = 'INIT';

  try {
    // ── Step 1: Parse request ──────────────────────────────────────────
    currentStep = 'PARSE';
    const request = await req.json() as GenerateVideoRequest;
    const {
      generation_type,
      prompt,
      model_id,
      brand_id,
      aspect_ratio = '16:9',
      resolution = '720p',
      duration = 8,
      input_image,
      include_audio = false,
      negative_prompt,
      sample_count = 1,
      seed,
      last_frame,
      source_video,
      target_duration,
      reference_images,
      camera_preset,
      lab_module_id,
      lab_program_id,
    } = request;

    log('PARSE', 'Request parsed', { generation_type, prompt: prompt?.substring(0, 50), aspect_ratio, resolution, duration, include_audio });

    // ── Step 2: Validate ───────────────────────────────────────────────
    currentStep = 'VALIDATE';
    if (!prompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (generation_type === 'image_to_video' && !input_image) {
      return new Response(
        JSON.stringify({ success: false, error: 'Input image is required for image-to-video generation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    log('VALIDATE', 'Inputs validated');

    // ── Step 3: Initialize Supabase ────────────────────────────────────
    currentStep = 'SUPABASE_INIT';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    log('SUPABASE_INIT', 'Supabase client created');

    // ── Step 4: Authenticate user ──────────────────────────────────────
    currentStep = 'AUTH';
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log('AUTH', 'Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      log('AUTH', 'Authentication failed', { error: authError?.message });
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    log('AUTH', 'User authenticated', { userId: user.id });

    // ── Step 5: Check quota ────────────────────────────────────────────
    currentStep = 'QUOTA';
    const isLabGeneration = !!lab_module_id;
    const { data: quotaData, error: quotaError } = isLabGeneration
      ? await supabase.rpc('can_user_generate_lab', { p_user_id: user.id })
      : await supabase.rpc('can_user_generate_creative', {
          p_user_id: user.id,
          p_generation_type: generation_type,
        });

    if (quotaError) {
      log('QUOTA', 'Quota check failed', { error: quotaError.message, code: quotaError.code });
      throw new Error(`Quota check failed: ${quotaError.message}`);
    }

    const quotaCheck = Array.isArray(quotaData) ? quotaData[0] : quotaData;

    if (!quotaCheck) {
      log('QUOTA', 'No quota data returned');
      throw new Error('Quota check returned no data');
    }

    if (!quotaCheck.can_generate) {
      const resetDate = new Date(quotaCheck.period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      log('QUOTA', 'Rate limit exceeded', { remaining: quotaCheck.remaining, limit: quotaCheck.limit_value });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          details: `You've used all ${quotaCheck.limit_value} of your weekly video generations. Your quota resets on ${resetDate}.`,
          quota: {
            remaining: 0,
            limit: quotaCheck.limit_value,
            reset_date: quotaCheck.period_end,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    log('QUOTA', 'Quota check passed', { remaining: quotaCheck.remaining });

    // ── Step 6: Get user name ──────────────────────────────────────────
    currentStep = 'USER_NAME';
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const userName = userRole?.first_name && userRole?.last_name
      ? `${userRole.first_name}_${userRole.last_name}`
      : user.email?.split('@')[0] || user.id;

    log('USER_NAME', 'User name resolved', { userName });

    // ── Step 7: Get model details ──────────────────────────────────────
    currentStep = 'MODEL';
    let modelUsed = 'veo-3.1-fast-generate-preview';
    let costPerGeneration = 0.80;
    let modelUuid: string | null = null;

    if (model_id) {
      // Frontend sends model_id as a string name (e.g. 'veo-3.1-fast-generate-001'),
      // not a UUID. Look up by the model_id column, not the id (UUID) column.
      const { data: model, error: modelError } = await supabase
        .from('creative_studio_models')
        .select('id, model_id, cost_per_generation')
        .eq('model_id', model_id)
        .single();

      if (modelError) {
        log('MODEL', 'Model lookup failed', { error: modelError.message, model_id });
      }

      if (model) {
        modelUuid = model.id;
        modelUsed = model.model_id;
        costPerGeneration = Number(model.cost_per_generation);
      }
    }

    log('MODEL', 'Model resolved', { modelUsed, modelUuid, costPerGeneration });

    // ── Step 8: Create generation record ───────────────────────────────
    currentStep = 'GEN_RECORD';
    const { data: generation, error: genError } = await supabase
      .from('creative_studio_generations')
      .insert({
        user_id: user.id,
        brand_id: brand_id || null,
        generation_type,
        model_id: modelUuid,
        model_used: modelUsed,
        prompt_text: prompt,
        parameters: {
          aspect_ratio,
          resolution,
          duration,
          include_audio,
          negative_prompt: negative_prompt || null,
          sample_count,
          seed: seed || null,
          ...(camera_preset ? { camera_preset } : {}),
        },
        input_image_url: input_image ? 'base64_provided' : null,
        status: 'processing',
        estimated_cost_usd: costPerGeneration * sample_count,
        ...(isLabGeneration ? { metadata: { lab_module_id, lab_program_id } } : {}),
      })
      .select('id')
      .single();

    if (genError) {
      log('GEN_RECORD', 'Failed to create generation record', { error: genError.message });
      throw new Error('Failed to create generation record');
    }

    log('GEN_RECORD', 'Generation record created', { id: generation.id });

    const startTime = Date.now();

    // ── Step 9: Get API key ────────────────────────────────────────────
    currentStep = 'API_KEY';
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      log('API_KEY', 'GEMINI_API_KEY not found in environment');
      await supabase
        .from('creative_studio_generations')
        .update({ status: 'failed', error_message: 'Server configuration error: Missing API key', completed_at: new Date().toISOString() })
        .eq('id', generation.id);
      throw new Error('Missing Gemini API Key');
    }

    log('API_KEY', 'API key found');

    // ── Step 10: Build and send API request ────────────────────────────
    currentStep = 'API_CALL';

    // Veo uses predictLongRunning endpoint via Gemini API
    const endpoint = `${BASE_URL}/models/${modelUsed}:predictLongRunning`;

    const stripImageDataUri = (s: string) => s.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/i, '');
    const stripVideoDataUri = (s: string) => s.replace(/^data:video\/[a-zA-Z0-9+]+;base64,/i, '');

    const instance: Record<string, unknown> = {
      prompt: prompt,
    };

    // Add input image for image-to-video or keyframe start (inlineData format)
    if (input_image && (generation_type === 'image_to_video' || generation_type === 'keyframe_video')) {
      instance.image = {
        inlineData: { mimeType: 'image/png', data: stripImageDataUri(input_image) },
      };
    }

    // Add source video for scene extension (inlineData format)
    if (source_video && generation_type === 'scene_extension') {
      instance.video = {
        inlineData: { mimeType: 'video/mp4', data: stripVideoDataUri(source_video) },
      };
    }

    // Determine personGeneration based on mode
    // Text-based modes (text_to_video, json_prompt_video, scene_extension) require 'allow_all' for Veo 3.1
    // Image-based modes (image_to_video, keyframe_video, ingredients_to_video) require 'allow_adult'
    const textBasedModes: VideoGenerationType[] = ['text_to_video', 'json_prompt_video', 'scene_extension'];
    const personGen = textBasedModes.includes(generation_type) ? 'allow_all' : 'allow_adult';

    // Resolve duration — Veo only accepts exactly 4, 6, or 8 seconds
    const effectiveDuration = target_duration || duration;
    const effectiveResolution = generation_type === 'scene_extension' ? '720p' : resolution;
    // Snap requested duration to nearest valid Veo value
    const validDurations = [4, 6, 8];
    const snappedDuration = validDurations.reduce((prev, curr) =>
      Math.abs(curr - effectiveDuration) < Math.abs(prev - effectiveDuration) ? curr : prev
    );
    // High-res and extensions require exactly 8s
    const finalDuration = (effectiveResolution === '1080p' || effectiveResolution === '4k') ? 8 : snappedDuration;
    if (snappedDuration !== effectiveDuration) {
      log('API_CALL', 'Duration snapped to nearest valid Veo value', { requested: effectiveDuration, snapped: snappedDuration, final: finalDuration });
    }

    // json_prompt_video only supports sampleCount = 1
    const effectiveSampleCount = generation_type === 'json_prompt_video' ? 1 : sample_count;
    // Veo 3 generates audio natively — no explicit parameter needed

    const parameters: Record<string, unknown> = {
      aspectRatio: aspect_ratio,
      personGeneration: personGen,
      ...(effectiveResolution ? { resolution: effectiveResolution } : {}),
      ...(finalDuration ? { durationSeconds: finalDuration } : {}),
      ...(negative_prompt ? { negativePrompt: negative_prompt } : {}),
      ...(effectiveSampleCount > 1 ? { sampleCount: effectiveSampleCount } : {}),
      ...(seed ? { seed } : {}),
    };

    // Add last frame for keyframe interpolation (goes in parameters, not instance)
    if (last_frame && generation_type === 'keyframe_video') {
      parameters.lastFrame = {
        inlineData: { mimeType: 'image/png', data: stripImageDataUri(last_frame) },
      };
    }

    // Add reference images (Veo 3.1 Quality only — fast model silently skips)
    if (reference_images && reference_images.length > 0) {
      if (modelUsed.includes('fast')) {
        log('API_CALL', 'Reference images skipped — not supported by fast model, use quality model');
      } else {
        // Reference images require 8-second videos
        if (parameters.durationSeconds !== 8) {
          parameters.durationSeconds = 8;
          log('API_CALL', 'Duration forced to 8s for reference image generation');
        }
        parameters.referenceImages = reference_images.slice(0, 3).map((img: string) => ({
          image: {
            inlineData: { mimeType: 'image/png', data: stripImageDataUri(img) },
          },
          referenceType: 'asset',
        }));
      }
    }

    const requestBody = {
      instances: [instance],
      parameters,
    };

    log('API_CALL', 'Making request to Veo API', {
      endpoint, modelUsed,
      parameterKeys: Object.keys(parameters),
      instanceKeys: Object.keys(instance),
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const initialResponseTime = Date.now() - startTime;
    log('API_CALL', 'Initial response received', { status: response.status, timeMs: initialResponseTime });

    if (!response.ok) {
      const errorText = await response.text();
      log('API_CALL', 'Veo API error', { status: response.status, error: errorText.substring(0, 500) });

      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: `Veo API error: ${response.status} - ${errorText.substring(0, 1000)}`,
          generation_time_ms: initialResponseTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);

      throw new Error(`Veo API error: ${response.status}`);
    }

    const operationData = await response.json();

    // Check for error in response body (Google sometimes returns 200 with error object)
    if (operationData.error) {
      const errorMessage = operationData.error.message || JSON.stringify(operationData.error).substring(0, 500);
      log('API_CALL', 'API returned error in response body', { error: errorMessage, code: operationData.error.code });
      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: `Veo API error: ${errorMessage}`,
          generation_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);
      throw new Error(`Veo API error: ${errorMessage}`);
    }

    log('API_CALL', 'Operation started', { operationName: operationData.name });

    // ── Step 11: Poll for completion ───────────────────────────────────
    currentStep = 'POLL';

    if (!operationData.name) {
      log('POLL', 'No operation name in response', { responseKeys: Object.keys(operationData) });
      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: 'No operation name returned by Veo API',
          generation_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);
      throw new Error('No operation name returned');
    }

    const pollResult = await pollForCompletion(operationData.name, apiKey);
    const responseTime = Date.now() - startTime;

    if (pollResult.error) {
      log('POLL', 'Video generation failed', { error: pollResult.error });
      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: pollResult.error,
          generation_time_ms: responseTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);
      throw new Error(pollResult.error);
    }

    if (!pollResult.videoUris || pollResult.videoUris.length === 0) {
      log('POLL', 'No video URIs after polling');
      await supabase
        .from('creative_studio_generations')
        .update({
          status: 'failed',
          error_message: 'No video URI after successful generation',
          generation_time_ms: responseTime,
          completed_at: new Date().toISOString(),
        })
        .eq('id', generation.id);
      throw new Error('No video in response');
    }

    log('POLL', `${pollResult.videoUris.length} video(s) ready`, { totalTimeMs: responseTime });

    // ── Step 12: Download and upload video ─────────────────────────────
    currentStep = 'UPLOAD';
    const outputUrls: string[] = [];
    const mediaIds: string[] = [];

    // Get or create Creative Studio folder
    const { data: studioFolder } = await supabase
      .from('media_folders')
      .select('id')
      .eq('path', '/Creative Studio')
      .single();

    const studioFolderId = studioFolder?.id;

    const userFolderPath = `/Creative Studio/${userName}`;
    let { data: userFolder } = await supabase
      .from('media_folders')
      .select('id')
      .eq('path', userFolderPath)
      .single();

    if (!userFolder && studioFolderId) {
      const { data: newFolder } = await supabase
        .from('media_folders')
        .insert({
          name: userName,
          path: userFolderPath,
          parent_id: studioFolderId,
          description: `Creative Studio outputs for ${userName}`,
          color: '#8b5cf6',
          icon: 'palette',
          created_by: user.id,
        })
        .select('id')
        .single();

      userFolder = newFolder;
    }

    // Create or get videos subfolder
    const videosFolderPath = `${userFolderPath}/videos`;
    let { data: videosFolder } = await supabase
      .from('media_folders')
      .select('id')
      .eq('path', videosFolderPath)
      .single();

    if (!videosFolder && userFolder) {
      const { data: newVideosFolder } = await supabase
        .from('media_folders')
        .insert({
          name: 'videos',
          path: videosFolderPath,
          parent_id: userFolder.id,
          description: `AI-generated videos for ${userName}`,
          color: '#ec4899',
          icon: 'video',
          created_by: user.id,
        })
        .select('id')
        .single();

      videosFolder = newVideosFolder;
    }

    let folderId = videosFolder?.id || userFolder?.id || studioFolderId || null;

    // Lab subfolder: /Creative Studio/{userName}/Labs/{labName}
    let labFolderName: string | null = null;
    if (isLabGeneration && userFolder?.id) {
      const { data: labModule } = await supabase
        .from('program_modules')
        .select('title')
        .eq('id', lab_module_id)
        .single();
      labFolderName = labModule?.title?.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || 'Lab';

      const { data: labsParent } = await supabase
        .from('media_folders')
        .select('id')
        .eq('parent_id', userFolder.id)
        .eq('name', 'Labs')
        .single();

      let labsParentId = labsParent?.id;
      if (!labsParentId) {
        const { data: newLabsParent } = await supabase
          .from('media_folders')
          .insert({
            name: 'Labs',
            parent_id: userFolder.id,
            description: `Lab exercise outputs for ${userName}`,
            color: '#8b5cf6',
            icon: 'flask',
            created_by: user.id,
          })
          .select('id')
          .single();
        labsParentId = newLabsParent?.id;
      }

      if (labsParentId) {
        const { data: labFolder } = await supabase
          .from('media_folders')
          .select('id')
          .eq('parent_id', labsParentId)
          .eq('name', labFolderName)
          .single();

        if (labFolder) {
          folderId = labFolder.id;
        } else {
          const { data: newLabFolder } = await supabase
            .from('media_folders')
            .insert({
              name: labFolderName,
              parent_id: labsParentId,
              description: `Lab: ${labFolderName}`,
              color: '#8b5cf6',
              icon: 'flask',
              created_by: user.id,
            })
            .select('id')
            .single();
          if (newLabFolder) folderId = newLabFolder.id;
        }
      }
    }

    const baseTimestamp = Date.now();

    for (let i = 0; i < pollResult.videoUris.length; i++) {
      const videoUri = pollResult.videoUris[i];
      const timestamp = baseTimestamp + i;

      log('UPLOAD', `Downloading video ${i + 1}/${pollResult.videoUris.length}`);
      const videoResponse = await fetch(videoUri, {
        headers: { 'x-goog-api-key': apiKey },
      });

      if (videoResponse.ok) {
        const videoBlob = await videoResponse.blob();
        const mimeType = videoResponse.headers.get('content-type') || 'video/mp4';
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const storagePath = isLabGeneration && labFolderName
          ? `creative-studio/${userName}/labs/${labFolderName}/${timestamp}-${i}.${extension}`
          : `creative-studio/${userName}/videos/${timestamp}-${i}.${extension}`;

        log('UPLOAD', `Uploading video ${i + 1} to storage`, { storagePath, sizeBytes: videoBlob.size });

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, videoBlob, {
            contentType: mimeType,
            upsert: false,
          });

        if (uploadError) {
          log('UPLOAD', `Upload failed for video ${i + 1}, using external URI`, { error: uploadError.message });
          outputUrls.push(videoUri);
        } else {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(storagePath);

          if (urlData?.publicUrl) {
            outputUrls.push(urlData.publicUrl);

            const { data: mediaRecord } = await supabase
              .from('media')
              .insert({
                filename: `${generation_type}-${timestamp}-${i}.${extension}`,
                title: `Creative Studio - ${generation_type.replace(/_/g, ' ')}`,
                description: prompt.substring(0, 200),
                url: urlData.publicUrl,
                storage_path: storagePath,
                mime_type: mimeType,
                file_type: 'video',
                size_bytes: videoBlob.size,
                folder_id: folderId,
                created_by: user.id,
                auto_tags: isLabGeneration
                  ? ['creative-studio', 'ai-generated', 'lab', generation_type]
                  : ['creative-studio', 'ai-generated', generation_type],
                custom_metadata: {
                  generation_type: 'creative_studio',
                  generation_id: generation.id,
                  prompt: prompt.substring(0, 2000),
                  model_used: modelUsed,
                  duration,
                  ...(isLabGeneration ? { lab_module_id, lab_program_id, lab_name: labFolderName } : {}),
                },
              })
              .select('id')
              .single();

            if (mediaRecord) {
              mediaIds.push(mediaRecord.id);
            }
          }
        }
      } else {
        log('UPLOAD', `Could not download video ${i + 1}, storing external URI`, { status: videoResponse.status });
        outputUrls.push(videoUri);

        const { data: mediaRecord } = await supabase
          .from('media')
          .insert({
            filename: `${generation_type}-${timestamp}-${i}.mp4`,
            title: `Creative Studio - ${generation_type.replace(/_/g, ' ')}`,
            description: prompt.substring(0, 200),
            url: videoUri,
            storage_path: null,
            mime_type: 'video/mp4',
            file_type: 'video',
            folder_id: folderId,
            created_by: user.id,
            auto_tags: isLabGeneration
              ? ['creative-studio', 'ai-generated', 'lab', generation_type]
              : ['creative-studio', 'ai-generated', generation_type],
            custom_metadata: {
              generation_type: 'creative_studio',
              generation_id: generation.id,
              prompt: prompt.substring(0, 2000),
              model_used: modelUsed,
              duration,
              external_url: true,
              ...(isLabGeneration ? { lab_module_id, lab_program_id, lab_name: labFolderName } : {}),
            },
          })
          .select('id')
          .single();

        if (mediaRecord) {
          mediaIds.push(mediaRecord.id);
        }
      }
    }

    log('UPLOAD', `Stored ${outputUrls.length} video(s)`);

    // ── Step 13: Finalize ──────────────────────────────────────────────
    currentStep = 'FINALIZE';

    await supabase
      .from('creative_studio_generations')
      .update({
        status: 'completed',
        output_urls: outputUrls,
        media_ids: mediaIds,
        generation_time_ms: responseTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id);

    if (isLabGeneration) {
      await supabase.rpc('increment_lab_quota', { p_user_id: user.id });
      await supabase.rpc('append_lab_generation', {
        p_user_id: user.id,
        p_module_id: lab_module_id,
        p_program_id: lab_program_id,
        p_generation_id: generation.id,
      });
    } else {
      await supabase.rpc('increment_creative_quota', {
        p_user_id: user.id,
        p_generation_type: generation_type,
      });
    }

    log('FINALIZE', 'Video generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        generation_id: generation.id,
        output_urls: outputUrls,
        media_ids: mediaIds,
        generation_time_ms: responseTime,
        quota: {
          remaining: (quotaCheck.remaining || 0) - 1,
          limit: quotaCheck.limit_value,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log('ERROR', `Failed at step ${currentStep}`, { message: error.message, stack: error.stack?.substring(0, 300) });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate video',
        details: error.message,
        step: currentStep,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
