// ABOUTME: Brand Shop — full-bleed AI creative production studio
// ABOUTME: Three-column layout: history sidebar, canvas + prompt bar, settings sidebar

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorCanvas } from '@/components/creative-studio/EditorCanvas';
import { HistoryPanel } from '@/components/creative-studio/HistoryPanel';
import { SamplesPanel } from '@/components/creative-studio/SamplesPanel';
import { ToolsBar } from '@/components/creative-studio/ToolsBar';
import { MaskingCanvas } from '@/components/creative-studio/MaskingCanvas';
import { MediaLibraryPanel } from '@/components/creative-studio/MediaLibraryPanel';
import { ParametersPanel } from '@/components/creative-studio/ParametersPanel';
import { VideoGenerationPanel } from '@/components/creative-studio/VideoGenerationPanel';
import { QuotaDisplay } from '@/components/creative-studio/QuotaDisplay';
import { MultiImageStagingArea, type StagedImage } from '@/components/creative-studio/MultiImageStagingArea';
import { ConversationalEditPanel, type ConversationTurn } from '@/components/creative-studio/ConversationalEditPanel';
import { UpscalePanel } from '@/components/creative-studio/UpscalePanel';
import { ExtensionDownloadPanel } from '@/components/creative-studio/ExtensionDownloadPanel';
import { VirtualTryOnPanel } from '@/components/creative-studio/VirtualTryOnPanel';
import { BrandAgentApp } from '@/components/creative-studio/BrandAgentApp';
import { PromptLibraryPanel } from '@/components/creative-studio/PromptLibraryPanel';
import { SaveAsTemplateDialog } from '@/components/creative-studio/SaveAsTemplateDialog';
import { BrandShopTopBar } from '@/components/creative-studio/BrandShopTopBar';
import { BrandIntelligenceDialog } from '@/components/creative-studio/BrandIntelligenceDialog';
import { AIGuidelinesDialog } from '@/components/creative-studio/AIGuidelinesDialog';
import type { BrandDialogView } from '@/components/creative-studio/BrandDialogNav';
import { BrandShopPromptBar, type GenerationMode } from '@/components/creative-studio/BrandShopPromptBar';
import { ModeInfoPanel } from '@/components/creative-studio/ModeInfoPanel';
import { ModelCostPanel } from '@/components/creative-studio/ModelCostPanel';
import { ModelSelector } from '@/components/creative-studio/ModelSelector';
import { useCreativeStudioStore } from '@/store/creative-studio-store';
import { useCreativeStudioModels } from '@/hooks/useCreativeStudioModels';
import { useCreativeStudioEditStore } from '@/store/creative-studio-edit-store';
import { useCreativeStudioBrands } from '@/hooks/useCreativeStudioBrands';
import { useBrandStats, useBrandDirectives } from '@/hooks/useCreativeStudioBrandIntelligence';
import { useBrandPrompts } from '@/hooks/useCreativeStudioPrompts';
import { useBrandTheme } from '@/components/creative-studio/useBrandTheme';
import { useUnifiedTheme } from '@/components/UnifiedThemeProvider';
import { useCameraOptions } from '@/hooks/useCreativeStudioCameraOptions';
import { buildCameraPromptSegment } from '@/components/creative-studio/CameraControlsPanel';
import { useMyGenerations, useInvalidateGenerations } from '@/hooks/useCreativeStudioGenerations';
import { useCreativeStudioQuota } from '@/hooks/useCreativeStudioQuota';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchImageAsBase64 } from '@/lib/image-utils';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Camera, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GenerationWithDetails } from '@/types/creative-studio';
import type { EditTool } from '@/store/creative-studio-edit-store';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { checkPromptCompliance } from '@/utils/brandComplianceCheck';
import { useBrandReferenceSuggestions } from '@/hooks/useBrandReferenceSuggestions';
import { ShowcaseModal } from '@/components/onboarding/ShowcaseModal';
import { useVinceTour } from '@/components/onboarding/VinceTour';
import { useDemoExperience } from '@/hooks/useDemoExperience';
import { CreativePackageDisplay, type PackagePart } from '@/components/creative-studio/CreativePackageDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Delimiter for camera preset text injected into the prompt textarea
const CAMERA_MARKER = '\n\n[Camera] ';

export default function CreativeStudio() {
  const [generationType, setGenerationType] = useState<GenerationMode>('image');
  const [showMaskingCanvas, setShowMaskingCanvas] = useState(false);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Page-scoped dark mode (independent of site theme)
  const { theme, setTheme } = useUnifiedTheme();

  // Gemini multi-image reference state
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);

  // Track which template was applied (cleared when prompt is manually edited)
  const [appliedTemplate, setAppliedTemplate] = useState<{ id: string; name: string; variables?: Record<string, string>; reference_collections?: string[] } | null>(null);

  // Multi-turn conversation state
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([]);
  const [currentThoughtSignature, setCurrentThoughtSignature] = useState<string | undefined>();

  // Scope warm theme tokens to body so portaled panels (sheets, popovers, dropdowns) inherit them
  useEffect(() => {
    document.body.classList.add('creative-studio');
    return () => document.body.classList.remove('creative-studio');
  }, []);

  // Studio always opens in dark mode — light mode not yet supported (WelcomeScreen is dark-only)
  useEffect(() => {
    if (theme !== 'dark') {
      setTheme('dark', { skipPersist: true });
    }
    return () => {
      const globalTheme = (localStorage.getItem('brand-lens-theme') || 'dark') as 'light' | 'dark';
      setTheme(globalTheme);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Panel state
  type RightSidebarMode = 'settings' | 'vince';
  const [rightSidebarMode, setRightSidebarMode] = useState<RightSidebarMode>('vince');
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [brandDialogView, setBrandDialogView] = useState<BrandDialogView | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(true);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(true);

  const { user } = useAuth();
  const { data: myGenerations } = useMyGenerations(50);
  const invalidateGenerations = useInvalidateGenerations();
  const queryClient = useQueryClient();
  const quotaType = generationType === 'video' ? 'text_to_video' as const : 'text_to_image' as const;
  const { data: quota } = useCreativeStudioQuota(quotaType);
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationWithDetails | null>(null);
  const [historyPackageGen, setHistoryPackageGen] = useState<GenerationWithDetails | null>(null);
  const lastGenerationIdRef = useRef<string | null>(null);

  const {
    imageParams,
    videoParams,
    selectedImageModel,
    selectedVideoModel,
    currentImage,
    currentMask: storeMask,
    currentOperation,
    currentProgress,
    currentElapsedSeconds,
    setCurrentOperation,
    setCurrentProgress,
    setCurrentError,
    updateImageParams,
    updateCameraPreset,
    updateVideoParams,
    addToHistory,
    setImageModel,
    setVideoModel,
    setCurrentImage,
    clearPrompts,
  } = useCreativeStudioStore();

  const {
    activeTool,
    selectionMode,
    currentMask,
    brushSize,
    setBrushSize,
    setCurrentMask,
  } = useCreativeStudioEditStore();

  const { data: brands } = useCreativeStudioBrands();
  const { data: cameraOptions } = useCameraOptions(undefined, 'still');
  const { data: videoCameraOptions } = useCameraOptions(undefined, 'video');
  const { data: imageModels } = useCreativeStudioModels('image');
  const { data: videoModels } = useCreativeStudioModels('video');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const selectedBrand = brands?.find((b) => b.id === selectedBrandId);
  const { data: brandTemplates } = useBrandPrompts(selectedBrandId || undefined);
  const { data: selectedBrandStats } = useBrandStats(selectedBrandId ?? undefined);
  const { data: brandDirectives } = useBrandDirectives(selectedBrandId ?? undefined);
  const brandThemeStyle = useBrandTheme(selectedBrand);

  // Smart reference suggestions based on prompt text
  const activeCollectionNames = stagedImages
    .filter(img => img.sourceCollection)
    .map(img => img.sourceCollection!);
  const referenceSuggestions = useBrandReferenceSuggestions(
    selectedBrandId || undefined,
    imageParams.prompt,
    activeCollectionNames,
  );

  // ── Demo experience (showcase modal + spotlight tour) ────────────────────────

  const {
    showcaseOpen, openShowcase, closeShowcase,
    hasSeenShowcase, hasSeenTour, markTourSeen,
  } = useDemoExperience();

  const { startTour } = useVinceTour({ onComplete: markTourSeen });

  // Auto-start showcase on first visit
  useEffect(() => {
    if (!hasSeenShowcase()) {
      const t = setTimeout(openShowcase, 1800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShowcaseClose = useCallback(() => {
    closeShowcase();
  }, [closeShowcase]);

  const handleOpenShowcase = useCallback(() => {
    openShowcase();
  }, [openShowcase]);

  const handleBrandChange = useCallback((brandId: string | null) => {
    if (brandId !== selectedBrandId) {
      clearPrompts();
      setAppliedTemplate(null);
      setStagedImages([]);
      setConversationTurns([]);
      setCurrentThoughtSignature(undefined);
    }
    setSelectedBrandId(brandId);
  }, [selectedBrandId, clearPrompts]);

  const handleToggleVince = useCallback(() => {
    if (rightSidebarMode === 'vince') {
      setRightSidebarMode('settings');
    } else {
      setRightSidebarMode('vince');
      if (!settingsDrawerOpen) setSettingsDrawerOpen(true);
    }
  }, [rightSidebarMode, settingsDrawerOpen]);

  const handleToggleStudioTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme, { skipPersist: true });
    localStorage.setItem('creative-studio-theme', newTheme);
  }, [theme, setTheme]);

  // Derived model info
  const isGemini = selectedImageModel.startsWith('gemini-');
  const selectedModelData = imageModels?.find(m => m.model_id === selectedImageModel);
  const supportsConversation = selectedModelData?.capabilities?.includes('multi_turn_edit') ?? false;
  const maxReferenceImages = selectedModelData?.parameters?.max_reference_images ?? (isGemini ? 3 : 0);

  // Auto-select a valid model if stored selection is no longer active
  useEffect(() => {
    if (imageModels && imageModels.length > 0) {
      const isValid = imageModels.some(m => m.model_id === selectedImageModel);
      if (!isValid) {
        const defaultModel = imageModels.find(m => m.is_default) || imageModels[0];
        setImageModel(defaultModel.model_id);
      }
    }
  }, [imageModels, selectedImageModel, setImageModel]);

  useEffect(() => {
    if (videoModels && videoModels.length > 0) {
      const isValid = videoModels.some(m => m.model_id === selectedVideoModel);
      if (!isValid) {
        const defaultModel = videoModels.find(m => m.is_default) || videoModels[0];
        setVideoModel(defaultModel.model_id);
      }
    }
  }, [videoModels, selectedVideoModel, setVideoModel]);

  // Clean up elapsed timer on unmount
  useEffect(() => {
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, []);

  const getStatusInfo = () => {
    switch (currentOperation) {
      case 'generating':
        return { text: 'Generating...', color: 'bg-primary', pulse: true };
      case 'processing':
        return { text: 'Processing...', color: 'bg-yellow-500', pulse: true };
      case 'uploading':
        return { text: 'Uploading...', color: 'bg-blue-500', pulse: false };
      default:
        return { text: 'Ready', color: 'bg-green-500', pulse: false };
    }
  };

  const status = getStatusInfo();

  // Auto-select latest generation after fresh generation completes
  useEffect(() => {
    if (lastGenerationIdRef.current && myGenerations?.length) {
      const gen = myGenerations.find(g => g.id === lastGenerationIdRef.current);
      if (gen) {
        setSelectedGeneration(gen);
        lastGenerationIdRef.current = null;
      }
    }
  }, [myGenerations]);

  // ── Edit tool helpers ────────────────────────────────────────────────────────

  const getEditGenerationType = (tool: EditTool) => {
    switch (tool) {
      case 'background-swap': return 'inpainting';
      case 'object-remove': return 'inpainting';
      case 'object-insert': return 'inpainting';
      case 'foreground-swap': return 'inpainting';
      case 'canvas-expand': return 'outpainting';
      case 'upscale': return 'upscaling';
      default: return 'text_to_image';
    }
  };

  const getEditMaskMode = (tool: EditTool) => {
    switch (tool) {
      case 'background-swap': return 'MASK_MODE_BACKGROUND';
      case 'object-remove': return 'MASK_MODE_FOREGROUND';
      case 'foreground-swap': return 'MASK_MODE_FOREGROUND';
      case 'object-insert': return 'MASK_MODE_USER_PROVIDED';
      default: return undefined;
    }
  };

  const getEditMode = (tool: EditTool) => {
    switch (tool) {
      case 'background-swap': return 'EDIT_MODE_BGSWAP';
      case 'object-remove': return 'EDIT_MODE_INPAINT_REMOVAL';
      case 'object-insert': return 'EDIT_MODE_INPAINT_INSERTION';
      case 'foreground-swap': return 'EDIT_MODE_BGSWAP';
      case 'canvas-expand': return 'EDIT_MODE_OUTPAINT';
      default: return undefined;
    }
  };

  const getEditToolLabel = (tool: EditTool) => {
    switch (tool) {
      case 'background-swap': return 'SWAP BACKGROUND';
      case 'object-remove': return 'REMOVE OBJECT';
      case 'object-insert': return 'INSERT OBJECT';
      case 'foreground-swap': return 'SWAP SUBJECT';
      case 'canvas-expand': return 'EXPAND CANVAS';
      case 'upscale': return 'UPSCALE';
      default: return 'GENERATE';
    }
  };

  const handleSelectGeneration = (gen: GenerationWithDetails) => {
    if (gen.generation_type === 'creative_package' && gen.copy_blocks?.length) {
      setHistoryPackageGen(gen);
      return;
    }
    setSelectedGeneration(gen);
    if (gen.output_urls?.[0]) {
      setCurrentImage(gen.output_urls[0]);
    }
  };

  // ── Conversation handling ────────────────────────────────────────────────────

  const handleConversationMessage = useCallback(async (message: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to generate content');
      return;
    }

    const userTurn: ConversationTurn = {
      role: 'user',
      text: message,
      timestamp: new Date().toISOString(),
    };
    setConversationTurns(prev => [...prev, userTurn]);

    setCurrentOperation('generating');
    setCurrentProgress(0);
    setCurrentError(null);

    const startTime = Date.now();

    try {
      const apiHistory = conversationTurns.map(turn => ({
        role: turn.role,
        text: turn.text,
        image_url: turn.imageUrl,
        thought_signature: turn.thoughtSignature,
      }));

      const request: Record<string, unknown> = {
        generation_type: 'multi_turn_edit',
        prompt: message,
        model_id: selectedImageModel,
        brand_id: selectedBrandId || undefined,
        conversation_history: apiHistory,
        thought_signature: currentThoughtSignature,
        temperature: imageParams.temperature,
      };

      // Include canvas image as input on first turn so "this" references work
      if (conversationTurns.length === 0 && currentImage) {
        request.input_image = currentImage.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');
      }

      if (stagedImages.length > 0) {
        request.reference_images = stagedImages.map(img => ({
          image: img.src,
          media_resolution: img.mediaResolution,
          reference_intent: img.referenceIntent,
          ...(img.referenceType ? { reference_type: img.referenceType } : {}),
          ...(img.sourceCollection ? { collection: img.sourceCollection } : {}),
        }));
        const stagedCollections = [...new Set(
          stagedImages.filter(img => img.sourceCollection).map(img => img.sourceCollection!)
        )];
        if (stagedCollections.length > 0) {
          request.reference_collections = stagedCollections;
        }
      }

      const response = await supabase.functions.invoke('generate-creative-image', {
        body: request,
      });

      if (response.error) throw new Error(response.error.message || 'Generation failed');
      const data = response.data;
      if (!data.success) throw new Error(data.details || data.error || 'Generation failed');

      const processingTime = Date.now() - startTime;

      const modelTurn: ConversationTurn = {
        role: 'model',
        text: data.text_response,
        imageUrl: data.output_urls?.[0],
        thoughtSignature: data.thought_signature,
        timestamp: new Date().toISOString(),
      };
      setConversationTurns(prev => [...prev, modelTurn]);

      if (data.thought_signature) {
        setCurrentThoughtSignature(data.thought_signature);
      }
      if (data.output_urls?.length > 0) {
        setCurrentImage(data.output_urls[0]);
      }
      if (data.generation_id) {
        lastGenerationIdRef.current = data.generation_id;
      }

      invalidateGenerations();
      toast.success(`Generated in ${Math.round(processingTime / 1000)}s!`);
      setCurrentProgress(100);
      setTimeout(() => {
        setCurrentProgress(0);
        setCurrentOperation('idle');
      }, 500);
    } catch (error: any) {
      console.error('Conversation generation failed:', error);
      setCurrentError(error.message);
      setCurrentProgress(0);
      setCurrentOperation('idle');
      toast.error(error.message || 'Generation failed');
    }
  }, [user, conversationTurns, currentThoughtSignature, selectedImageModel, selectedBrandId, imageParams, stagedImages, currentImage, setCurrentOperation, setCurrentProgress, setCurrentError, setCurrentImage, invalidateGenerations]);

  const handleStartFreshConversation = useCallback(() => {
    setConversationTurns([]);
    setCurrentThoughtSignature(undefined);
  }, []);

  // ── Main generation handler ──────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to generate content');
      return;
    }

    if (quota && !quota.can_generate) {
      const type = generationType === 'video' ? 'video' : 'image';
      toast.error(`Weekly ${type} quota reached. Resets Monday.`);
      return;
    }

    const isEditToolActive = activeTool !== 'select';

    if (isEditToolActive && !currentImage) {
      toast.error('Load an image first to use editing tools');
      return;
    }

    const prompt = generationType === 'video' ? videoParams.prompt : imageParams.prompt;

    if (!prompt.trim() && !isEditToolActive && generationType !== 'edit' && generationType !== 'upscale' && generationType !== 'tryon') {
      toast.error('Please enter a prompt to generate content');
      return;
    }

    if (generationType === 'edit' && !currentImage && !isEditToolActive) {
      toast.error('Please upload an image first to edit it');
      return;
    }

    // Check prompt against brand directives for obvious violations
    if (selectedBrandId && brandDirectives?.length && prompt.trim()) {
      const compliance = checkPromptCompliance(prompt, brandDirectives);
      if (!compliance.passed) {
        for (const v of compliance.violations) {
          toast.warning(`${v.directive}: "${v.matched[0]}" + "${v.matched[1]}" may conflict`, {
            duration: 6000,
          });
        }
      }
    }

    setCurrentOperation('generating');
    setCurrentProgress(0);
    setCurrentError(null);

    let elapsedSeconds = 0;
    const estimatedTime = generationType.includes('video') ? 60 : 15;
    elapsedTimerRef.current = setInterval(() => {
      elapsedSeconds++;
      const pct = Math.min(Math.round((elapsedSeconds / estimatedTime) * 100), 95);
      setCurrentProgress(pct, elapsedSeconds);
    }, 1000);

    const startTime = Date.now();

    try {
      // Camera text is already in the prompt (synced by the camera useEffect above).
      // Strip the [Camera] marker for the API — the camera directions remain as plain text.
      let finalPrompt = prompt.replace(CAMERA_MARKER, '. ');

      // Brand voice is injected server-side by the edge function when brand_id is provided

      let response;
      let data;

      if (generationType === 'video' && !isEditToolActive) {
        let videoGenType = 'text_to_video';
        if (videoParams.extensionVideo) {
          videoGenType = 'scene_extension';
        } else if (videoParams.lastFrame && videoParams.startingFrame) {
          videoGenType = 'keyframe_video';
        } else if (videoParams.startingFrame) {
          videoGenType = 'image_to_video';
        } else if (videoParams.directorMode) {
          videoGenType = 'json_prompt_video';
        } else if ((videoParams.referenceImages?.length ?? 0) > 0) {
          videoGenType = 'ingredients_to_video';
        }

        const videoRequest: Record<string, unknown> = {
          generation_type: videoGenType,
          prompt: finalPrompt,
          model_id: selectedVideoModel,
          brand_id: selectedBrandId || undefined,
          aspect_ratio: videoParams.aspectRatio,
          resolution: videoParams.resolution,
          duration: videoParams.durationSeconds,
          include_audio: videoParams.generateAudio,
          negative_prompt: videoParams.negativePrompt || undefined,
          sample_count: videoParams.sampleCount,
          seed: videoParams.seed || undefined,
        };

        if (videoParams.startingFrame) videoRequest.input_image = videoParams.startingFrame;
        if (videoParams.lastFrame) videoRequest.last_frame = videoParams.lastFrame;
        if (videoParams.extensionVideo) {
          videoRequest.source_video = videoParams.extensionVideo;
          videoRequest.target_duration = videoParams.extensionTargetSeconds;
        }
        if (videoParams.referenceImages && videoParams.referenceImages.length > 0) {
          videoRequest.reference_images = videoParams.referenceImages.map((ref: { image: string }) => ref.image);
        }
        if (videoParams.directorMode) videoRequest.json_prompt = true;
        if (videoParams.cameraControlsEnabled && videoParams.cameraPreset) {
          videoRequest.camera_preset = videoParams.cameraPreset;
        }

        console.log('Calling generate-creative-video:', videoGenType);
        response = await supabase.functions.invoke('generate-creative-video', {
          body: videoRequest,
        });

        if (response.error) {
          const detail = response.data?.details || response.data?.error;
          throw new Error(detail || response.error.message || 'Video generation failed');
        }
        data = response.data;
      } else {
        let genType = generationType === 'edit' ? 'image_edit' : 'text_to_image';
        let inputImage: string | undefined;
        let maskImage: string | undefined;
        const editStore = useCreativeStudioEditStore.getState();

        if (isEditToolActive) {
          genType = getEditGenerationType(activeTool);
          inputImage = currentImage?.replace(/^data:image\/[a-zA-Z]+;base64,/i, '') || undefined;
          maskImage = (currentMask || storeMask) || undefined;
        } else if (generationType === 'edit' && currentImage) {
          inputImage = currentImage.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');
          maskImage = (currentMask || storeMask) || undefined;
        }

        const imageRequest: Record<string, unknown> = {
          generation_type: genType,
          prompt: finalPrompt || 'Enhance this image',
          model_id: selectedImageModel,
          brand_id: selectedBrandId || undefined,
          negative_prompt: imageParams.negativePrompt || undefined,
          aspect_ratio: imageParams.aspectRatio,
          num_outputs: isEditToolActive ? 1 : imageParams.sampleCount,
          seed: imageParams.seed || undefined,
          input_image: inputImage,
          mask_image: maskImage,
          director_mode: imageParams.directorMode || undefined,
          safety_setting: imageParams.safetySetting || undefined,
          person_generation: imageParams.personGeneration || undefined,
          include_logo: imageParams.includeLogo || undefined,
          image_size: imageParams.imageSize || undefined,
          thinking_level: imageParams.thinkingLevel || undefined,
          use_grounding: (selectedModelData?.parameters?.supports_grounding && imageParams.useGrounding) || undefined,
        };

        if (imageParams.cameraControlsEnabled && imageParams.cameraPreset) {
          imageRequest.camera_preset = imageParams.cameraPreset;
        }

        // Tag template source if user applied a prompt template
        if (appliedTemplate) {
          imageRequest.template_id = appliedTemplate.id;
          imageRequest.template_name = appliedTemplate.name;
          if (appliedTemplate.variables && Object.keys(appliedTemplate.variables).length > 0) {
            imageRequest.template_variables = appliedTemplate.variables;
          }
          if (appliedTemplate.reference_collections?.length) {
            imageRequest.reference_collections = appliedTemplate.reference_collections;
          }
        }

        if (isGemini) {
          if (imageParams.temperature !== undefined) imageRequest.temperature = imageParams.temperature;
          if (stagedImages.length > 0) {
            // Upload reference images to storage concurrently for future retrieval
            const uploadResults = await Promise.allSettled(
              stagedImages.map(async (img) => {
                const blob = await fetch(img.src).then(r => r.blob());
                const fileName = `reference-images/${user.id}/${Date.now()}-${img.id}.jpg`;
                const { data: uploadData } = await supabase.storage
                  .from('creative-studio')
                  .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
                if (uploadData) {
                  const { data: urlData } = supabase.storage.from('creative-studio').getPublicUrl(uploadData.path);
                  return urlData?.publicUrl ?? null;
                }
                return null;
              })
            );
            const referenceImageUrls = uploadResults
              .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
              .map(r => r.value);
            if (referenceImageUrls.length > 0) {
              imageRequest.reference_image_urls = referenceImageUrls;
            }

            imageRequest.reference_images = stagedImages.map(img => ({
              image: img.src,
              media_resolution: img.mediaResolution,
              reference_intent: img.referenceIntent,
              ...(img.referenceType ? { reference_type: img.referenceType } : {}),
              ...(img.sourceCollection ? { collection: img.sourceCollection } : {}),
            }));

            // Merge collection names from staged images with any template-provided collections
            const stagedCollections = [...new Set(
              stagedImages.filter(img => img.sourceCollection).map(img => img.sourceCollection!)
            )];
            if (stagedCollections.length > 0) {
              const existing = (imageRequest.reference_collections as string[]) || [];
              imageRequest.reference_collections = [...new Set([...existing, ...stagedCollections])];
            }
          }
        }

        if (isEditToolActive) {
          const maskMode = getEditMaskMode(activeTool);
          const editMode = getEditMode(activeTool);
          if (maskMode) imageRequest.mask_mode = maskMode;
          if (editMode) imageRequest.edit_mode = editMode;
          if (activeTool === 'canvas-expand') {
            imageRequest.expansion_direction = editStore.expansionDirection || 'right';
            // Use padded input image so image and mask dimensions match
            if (editStore.paddedInputImage) {
              imageRequest.input_image = editStore.paddedInputImage;
            }
            // Compute aspect ratio from expanded dimensions
            const dir = editStore.expansionDirection || 'right';
            if (dir === 'left' || dir === 'right') {
              imageRequest.aspect_ratio = '3:2';
            } else {
              imageRequest.aspect_ratio = '2:3';
            }
          }
          if (activeTool === 'upscale') imageRequest.upscale_factor = editStore.upscaleFactor;
          imageRequest.mask_dilation = editStore.maskDilation;
          imageRequest.guidance_scale = editStore.guidanceScale;
        }

        console.log('Calling generate-creative-image:', genType);
        response = await supabase.functions.invoke('generate-creative-image', {
          body: imageRequest,
        });

        if (response.error) {
          const detail = response.data?.details || response.data?.error;
          throw new Error(detail || response.error.message || 'Image generation failed');
        }
        data = response.data;
      }

      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }

      if (!data.success && data.error === 'Rate limit exceeded') {
        toast.error(data.details || 'You have exceeded your weekly quota');
        setCurrentProgress(0);
        setCurrentOperation('idle');
        return;
      }

      if (!data.success) throw new Error(data.details || data.error || 'Generation failed');

      const processingTime = Date.now() - startTime;
      if (data.generation_id) lastGenerationIdRef.current = data.generation_id;

      const isVideo = generationType === 'video' && !isEditToolActive;
      setSelectedGeneration({
        id: data.generation_id || crypto.randomUUID(),
        generation_type: isVideo
          ? (videoParams.startingFrame ? 'image_to_video' : 'text_to_video')
          : isEditToolActive ? getEditGenerationType(activeTool) as any : 'text_to_image',
        model_used: isVideo ? selectedVideoModel : selectedImageModel,
        prompt_text: finalPrompt,
        output_urls: data.output_urls || [],
        media_ids: data.media_ids || [],
        status: 'completed',
        parameters: {},
        metadata: {},
        generation_time_ms: processingTime,
        created_at: new Date().toISOString(),
      });

      setAppliedTemplate(null);
      invalidateGenerations();
      queryClient.invalidateQueries({ queryKey: ['creative-studio-quota'] });

      if (data.output_urls?.length > 0 && !isVideo) {
        setCurrentImage(data.output_urls[0]);
      }

      toast.success(
        isVideo
          ? `Video generated in ${Math.round(processingTime / 1000)}s!`
          : `${data.output_urls?.length || 0} image(s) generated!`
      );

      setCurrentProgress(100);
      setTimeout(() => {
        setCurrentProgress(0);
        setCurrentOperation('idle');
      }, 500);
    } catch (error: any) {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      console.error('Generation failed:', error);
      setCurrentError(error.message);
      setCurrentProgress(0);
      setCurrentOperation('idle');
      toast.error(error.message || 'Generation failed');
    }
  };

  // ── Specialized panel generation handlers ────────────────────────────────────

  const handleUpscaleGenerate = async (params: { generation_type: 'upscaling'; input_image: string; upscale_factor: string; model_id: string }) => {
    if (!user?.id) { toast.error('You must be logged in'); return; }
    setCurrentOperation('generating');
    setCurrentProgress(0);
    try {
      const response = await supabase.functions.invoke('generate-creative-image', {
        body: {
          generation_type: params.generation_type,
          model_id: params.model_id,
          input_image: params.input_image,
          upscale_factor: params.upscale_factor === 'x4' ? 4 : 2,
          prompt: 'Upscale',
          brand_id: selectedBrandId || undefined,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data.success) throw new Error(data.details || data.error);
      if (data.output_urls?.[0]) setCurrentImage(data.output_urls[0]);
      if (data.generation_id) lastGenerationIdRef.current = data.generation_id;
      invalidateGenerations();
      toast.success('Image upscaled!');
      setCurrentProgress(100);
      setTimeout(() => { setCurrentProgress(0); setCurrentOperation('idle'); }, 500);
    } catch (error: any) {
      setCurrentError(error.message);
      setCurrentProgress(0);
      setCurrentOperation('idle');
      toast.error(error.message || 'Upscale failed');
    }
  };


  const handleTryOnGenerate = async (params: { generation_type: 'virtual_try_on'; person_image: string; garment_image: string; num_outputs: number; model_id: string }) => {
    if (!user?.id) { toast.error('You must be logged in'); return; }
    setCurrentOperation('generating');
    setCurrentProgress(0);
    try {
      const response = await supabase.functions.invoke('generate-creative-image', {
        body: {
          generation_type: params.generation_type,
          model_id: params.model_id,
          person_image: params.person_image,
          garment_image: params.garment_image,
          num_outputs: params.num_outputs,
          prompt: 'Virtual try-on',
          brand_id: selectedBrandId || undefined,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data.success) throw new Error(data.details || data.error);
      if (data.output_urls?.[0]) setCurrentImage(data.output_urls[0]);
      if (data.generation_id) lastGenerationIdRef.current = data.generation_id;
      invalidateGenerations();
      setSelectedGeneration({
        id: data.generation_id || crypto.randomUUID(),
        generation_type: 'virtual_try_on',
        model_used: params.model_id,
        prompt_text: 'Virtual try-on',
        output_urls: data.output_urls || [],
        media_ids: data.media_ids || [],
        status: 'completed',
        parameters: {},
        metadata: {},
        created_at: new Date().toISOString(),
      });
      toast.success(`${data.output_urls?.length || 0} image(s) generated!`);
      setCurrentProgress(100);
      setTimeout(() => { setCurrentProgress(0); setCurrentOperation('idle'); }, 500);
    } catch (error: any) {
      setCurrentError(error.message);
      setCurrentProgress(0);
      setCurrentOperation('idle');
      toast.error(error.message || 'Generation failed');
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────

  const currentPrompt = generationType === 'video' ? videoParams.prompt : imageParams.prompt;
  const setPrompt = generationType === 'video'
    ? (p: string) => updateVideoParams({ prompt: p })
    : (p: string) => updateImageParams({ prompt: p });

  /** Load reference images from a template into the staging area (used by Director Mode starters) */
  const handleApplyTemplateRefImages = useCallback(async (templateId: string) => {
    const template = brandTemplates?.find(t => t.id === templateId);
    if (!template?.reference_images?.length) return;
    try {
      const staged = await Promise.all(
        template.reference_images.map(async (ref) => {
          const base64 = await fetchImageAsBase64(ref.url);
          return {
            id: crypto.randomUUID(),
            src: base64,
            mediaResolution: ref.media_resolution,
            referenceIntent: ref.reference_intent,
          } as StagedImage;
        })
      );
      setStagedImages(staged);
    } catch (err) {
      console.error('Failed to load template reference images:', err);
    }
  }, [brandTemplates]);

  // Sync camera preset text into the prompt with a [Camera] marker.
  // When camera settings change, the marker block is found and replaced in-place.
  const prevCameraTextRef = useRef('');

  useEffect(() => {
    const store = useCreativeStudioStore.getState();
    const isVideo = generationType === 'video';
    const params = isVideo ? store.videoParams : store.imageParams;
    const options = isVideo ? videoCameraOptions : cameraOptions;

    let newCameraText = '';
    if (params.cameraControlsEnabled && params.cameraPreset && options) {
      newCameraText = buildCameraPromptSegment(params.cameraPreset, options);
    }

    const prevText = prevCameraTextRef.current;
    if (newCameraText === prevText) return;

    // Strip old camera block from prompt
    let basePrompt = params.prompt;
    const markerIdx = basePrompt.indexOf(CAMERA_MARKER);
    if (markerIdx >= 0) {
      basePrompt = basePrompt.slice(0, markerIdx);
    }

    // Append new camera block
    const newPrompt = newCameraText
      ? `${basePrompt}${CAMERA_MARKER}${newCameraText}`
      : basePrompt;

    prevCameraTextRef.current = newCameraText;

    if (newPrompt !== params.prompt) {
      if (isVideo) {
        store.updateVideoParams({ prompt: newPrompt });
      } else {
        store.updateImageParams({ prompt: newPrompt });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationType,
    imageParams.cameraControlsEnabled, imageParams.cameraPreset,
    videoParams.cameraControlsEnabled, videoParams.cameraPreset,
    cameraOptions, videoCameraOptions]);

  const getGenerateLabel = () => {
    if (activeTool !== 'select') return getEditToolLabel(activeTool);
    switch (generationType) {
      case 'upscale': return 'UPSCALE';
      case 'recontext': return 'RECONTEXT';
      case 'tryon': return 'TRY-ON';
      default: return generationType.toUpperCase();
    }
  };

  const getPromptPlaceholder = () => {
    if (activeTool === 'canvas-expand') return 'Describe what should appear in the expanded area...';
    if (activeTool === 'upscale') return 'Optional: describe enhancement details...';
    switch (generationType) {
      case 'image': return 'Describe the image you want to create...';
      case 'edit': return 'Describe what you want to change...';
      case 'recontext': return 'Describe the new scene for your product...';
      case 'video': return 'Describe the video you want to create...';
      default: return 'Enter your prompt...';
    }
  };

  const showPromptInput = generationType !== 'upscale' && generationType !== 'tryon' && generationType !== 'conversation';

  // ── Layout ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="h-screen flex flex-col bg-background overflow-hidden creative-studio"
      style={brandThemeStyle}
      data-brand-active={!!selectedBrand || undefined}
    >
      {/* Top bar */}
      <BrandShopTopBar
        brands={brands}
        selectedBrandId={selectedBrandId}
        onSelectBrand={handleBrandChange}
        onSetPrompt={setPrompt}
        onOpenPromptLibrary={() => setPromptLibraryOpen(true)}
        onToggleVince={handleToggleVince}
        vinceActive={rightSidebarMode === 'vince'}
        onOpenBrandDNA={() => setBrandDialogView('brand-dna')}
        onOpenCorporateDNA={() => setBrandDialogView('corporate-dna')}
        onOpenBrandStandards={() => setBrandDialogView('brand-standards')}
        onOpenGuidelines={() => setGuidelinesOpen(true)}
        onOpenMediaLibrary={() => setShowLibrary(true)}
        onStartTour={startTour}
        studioTheme={theme as 'light' | 'dark'}
        onToggleTheme={handleToggleStudioTheme}
        statusText={status.text}
        statusColor={status.color}
        statusPulse={status.pulse}
      />

      {/* ── Three-column workspace ────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* Left sidebar — History */}
        <AnimatePresence initial={false}>
          {historyDrawerOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full border-r overflow-hidden flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--cs-surface-1))', borderRightColor: 'hsl(var(--cs-border-subtle))' }}
            >
              <HistoryPanel
                onSelectGeneration={handleSelectGeneration}
                selectedId={selectedGeneration?.id}
                onClose={() => setHistoryDrawerOpen(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center — Canvas + Prompt Bar */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <main className="flex-1 flex flex-col min-h-0 relative">
            {/* Canvas */}
            <div className="flex-1 flex flex-col min-h-0 p-3 pb-0">
              <div className="flex-1 relative min-h-[200px]">
                {/* Edit Tool Status Banner */}
                <AnimatePresence>
                  {activeTool !== 'select' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg shadow-lg flex items-center gap-2 text-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="font-medium">
                        {activeTool === 'background-swap' && 'Background Swap'}
                        {activeTool === 'object-remove' && 'Object Removal'}
                        {activeTool === 'object-insert' && 'Object Insertion'}
                        {activeTool === 'foreground-swap' && 'Subject Swap'}
                        {activeTool === 'canvas-expand' && 'Canvas Expansion'}
                        {activeTool === 'upscale' && 'Upscale'}
                      </span>
                      {currentMask && (
                        <span className="ml-1 px-1.5 py-0.5 bg-primary-foreground/20 rounded text-[10px]">
                          Mask applied
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <EditorCanvas
                  selectedBrand={selectedBrand}
                  brandStats={selectedBrandStats}
                  onOpenBrandDNA={() => setBrandDialogView('brand-dna')}
                  onOpenArtDirection={() => setBrandDialogView('art-direction')}
                  onOpenPromptLibrary={() => setPromptLibraryOpen(true)}
                  onOpenBrandAgent={handleToggleVince}
                  onOpenGuidelines={() => setGuidelinesOpen(true)}
                  onQuickPromptClick={setPrompt}
                  onDemoClick={handleOpenShowcase}
                />
              </div>

              {/* Tools bar (edit mode) */}
              <AnimatePresence>
                {(generationType === 'edit' || activeTool !== 'select') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="py-2"
                  >
                    <ToolsBar />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Horizontal samples strip */}
              <AnimatePresence>
                {selectedGeneration && (selectedGeneration.output_urls?.length ?? 0) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="border-t border-border/30 overflow-hidden"
                  >
                    <div className="py-2">
                      <SamplesPanel generation={selectedGeneration} onLoadToCanvas={setCurrentImage} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Conversational Edit Panel — inline above prompt bar */}
            <AnimatePresence>
              {generationType === 'conversation' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="px-3 pb-2 max-h-[45vh] overflow-hidden"
                >
                  <ConversationalEditPanel
                    turns={conversationTurns}
                    onSendMessage={handleConversationMessage}
                    onStartFresh={handleStartFreshConversation}
                    onLoadImage={setCurrentImage}
                    isGenerating={currentOperation === 'generating'}
                    currentThoughtSignature={currentThoughtSignature}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Reference collection suggestions */}
          {referenceSuggestions.length > 0 && generationType === 'image' && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 border-t bg-muted/30">
              <span className="text-[10px] text-muted-foreground shrink-0">Refs:</span>
              {referenceSuggestions.slice(0, 3).map(({ collection, matchedOn }) => (
                <button
                  key={collection.name}
                  disabled={!!currentOperation}
                  title={matchedOn}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border bg-background hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => {
                    const newImages: StagedImage[] = collection.images.map(ref => ({
                      id: crypto.randomUUID(),
                      src: ref.url,
                      mediaResolution: ref.media_resolution,
                      referenceIntent: ref.reference_intent,
                      referenceType: ref.reference_type,
                      sourceCollection: ref.collection,
                    }));
                    const available = newImages.slice(0, maxReferenceImages - stagedImages.length);
                    if (available.length > 0) setStagedImages(prev => [...prev, ...available]);
                  }}
                >
                  {collection.primaryImage && (
                    <img src={collection.primaryImage.url} alt="" className="w-3 h-3 rounded-sm object-cover" />
                  )}
                  {collection.name}
                  <span className="text-muted-foreground">({collection.images.length})</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom prompt bar */}
          <BrandShopPromptBar
            prompt={currentPrompt}
            onPromptChange={setPrompt}
            onManualEdit={() => setAppliedTemplate(null)}
            showPromptInput={showPromptInput}
            placeholder={getPromptPlaceholder()}
            generationType={generationType}
            onModeChange={setGenerationType}
            supportsConversation={supportsConversation}
            onGenerate={handleGenerate}
            isGenerating={currentOperation === 'generating'}
            currentOperation={currentOperation}
            currentProgress={currentProgress}
            currentElapsedSeconds={currentElapsedSeconds}
            generateLabel={getGenerateLabel()}
            activeTool={activeTool}
            currentMask={currentMask}
            selectionMode={selectionMode}
            currentImage={currentImage}
            onOpenMaskingCanvas={() => setShowMaskingCanvas(true)}
            selectedBrandId={selectedBrandId}
            onSaveTemplate={() => setSaveTemplateOpen(true)}
            onToggleHistory={() => setHistoryDrawerOpen(prev => !prev)}
            historyOpen={historyDrawerOpen}
            onToggleSettings={() => setSettingsDrawerOpen(prev => !prev)}
            settingsOpen={settingsDrawerOpen}
            vinceActive={rightSidebarMode === 'vince'}
            quotaExhausted={quota ? !quota.can_generate : false}
            labMode={false}
            onToggleLabGuide={undefined}
            labGuideOpen={false}
          />
        </div>

        {/* Right sidebar — Settings or Vince */}
        <AnimatePresence initial={false}>
          {settingsDrawerOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full border-l overflow-hidden flex-shrink-0 shadow-[-2px_0_8px_rgba(0,0,0,0.04)]"
              style={{ backgroundColor: 'hsl(var(--cs-surface-1))', borderLeftColor: 'hsl(var(--cs-border-subtle))' }}
            >
              {rightSidebarMode === 'vince' ? (
                <div className="flex flex-col h-full">
                  <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                        <Camera className="h-4 w-4 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium">Vince</span>
                      <span className="text-xs text-muted-foreground">Creative Director</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setRightSidebarMode('settings')}
                      title="Back to settings"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <BrandAgentApp
                      brandId={selectedBrandId}
                      brandName={selectedBrand?.name || 'No Brand Selected'}
                      onApplyPrompt={(prompt) => {
                        setPrompt(prompt);
                        toast.success('Prompt applied from Vince');
                      }}
                      onApplyCameraPreset={(preset) => {
                        updateCameraPreset(preset);
                        updateImageParams({ cameraControlsEnabled: true });
                        toast.success('Camera preset applied');
                      }}
                      onApplyModel={(modelId) => {
                        setImageModel(modelId);
                        toast.success(`Model set to ${modelId}`);
                      }}
                      onGenerate={handleGenerate}
                      onClose={() => setRightSidebarMode('settings')}
                      onBrandCreated={(newBrandId) => {
                        setSelectedBrandId(newBrandId);
                        toast.success('Brand created — switched to new brand');
                      }}
                      onSetImage={setCurrentImage}
                    />
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Mode Info / Education */}
                    <ModeInfoPanel generationType={generationType} activeTool={activeTool} />

                    {/* Cost estimator — shows pricing for selected model */}
                    {(() => {
                      const isVideo = generationType === 'video';
                      const models = isVideo ? videoModels : imageModels;
                      const selectedId = isVideo ? selectedVideoModel : selectedImageModel;
                      const active = models?.find(m => m.model_id === selectedId);
                      return active ? <ModelCostPanel activeModel={active} allModels={models} /> : null;
                    })()}

                    {/* Model selector — between cost and reference images */}
                    {generationType !== 'video' && generationType !== 'upscale' && generationType !== 'recontext' && generationType !== 'tryon' && (
                      <ModelSelector
                        models={imageModels}
                        selectedModelId={selectedImageModel}
                        onModelChange={setImageModel}
                        label="Image Model"
                      />
                    )}

                    {/* Gemini Multi-Image Reference Staging */}
                    {isGemini && (generationType === 'image' || generationType === 'conversation') && (
                      <MultiImageStagingArea
                        images={stagedImages}
                        onChange={setStagedImages}
                        maxImages={maxReferenceImages}
                        modelName={selectedImageModel}
                        brandId={selectedBrandId || undefined}
                      />
                    )}

                    {/* Mode-specific panels */}
                    {generationType === 'video' ? (
                      <VideoGenerationPanel
                        brandId={selectedBrandId}
                        brandName={selectedBrand?.name}
                        brandQuickPrompts={selectedBrand?.quick_prompts}
                        brandTemplates={brandTemplates || undefined}
                        onApplyTemplate={(info) => setAppliedTemplate(info)}
                      />
                    ) : generationType === 'upscale' ? (
                      <UpscalePanel
                        onGenerate={handleUpscaleGenerate}
                        isGenerating={currentOperation === 'generating'}
                      />
                    ) : generationType === 'recontext' ? (
                      <ExtensionDownloadPanel />
                    ) : generationType === 'tryon' ? (
                      <VirtualTryOnPanel
                        onGenerate={handleTryOnGenerate}
                        isGenerating={currentOperation === 'generating'}
                      />
                    ) : (
                      <ParametersPanel
                        mode={generationType === 'edit' ? 'edit' : 'image'}
                        brandId={selectedBrandId}
                        brandName={selectedBrand?.name}
                        brandQuickPrompts={selectedBrand?.quick_prompts}
                        brandTemplates={brandTemplates || undefined}
                        onApplyTemplate={(info) => setAppliedTemplate(info)}
                        onApplyReferenceImages={handleApplyTemplateRefImages}
                      />
                    )}

                    <div className="border-t pt-3">
                      <QuotaDisplay labMode={false} />
                    </div>
                  </div>
                </ScrollArea>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* ── Dialogs and overlays ──────────────────────────────────────────────── */}

      {/* Masking Canvas Dialog */}
      {currentImage && (
        <MaskingCanvas
          open={showMaskingCanvas}
          onOpenChange={setShowMaskingCanvas}
          imageUrl={currentImage}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          existingMask={currentMask}
          onApply={setCurrentMask}
        />
      )}

      {/* Media Library Panel */}
      <MediaLibraryPanel
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelectImage={setCurrentImage}
      />

      {/* Prompt Library Sheet Panel */}
      <PromptLibraryPanel
        open={promptLibraryOpen}
        onOpenChange={setPromptLibraryOpen}
        brandId={selectedBrandId}
        brandName={selectedBrand?.name || 'No Brand Selected'}
        onApplyPrompt={(prompt) => {
          setPrompt(prompt);
          setPromptLibraryOpen(false);
        }}
        onApplyTemplate={(info) => setAppliedTemplate(info)}
        onApplyModel={(modelId) => {
          setImageModel(modelId);
        }}
        onApplyReferenceImages={setStagedImages}
        onApplyLockedParameters={(params) => {
          if (params.include_logo !== undefined) {
            updateImageParams({ includeLogo: !!params.include_logo });
          }
          if (params.aspect_ratio && typeof params.aspect_ratio === 'string') {
            updateImageParams({ aspectRatio: params.aspect_ratio as any });
          }
        }}
      />

      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        brandId={selectedBrandId}
        brandName={selectedBrand?.name || ''}
        prompt={currentPrompt}
        model={generationType === 'video' ? selectedVideoModel : selectedImageModel}
        stagedImages={stagedImages}
      />

      {/* Brand intelligence — single unified dialog, no open/close animation between views */}
      {selectedBrand && (
        <BrandIntelligenceDialog
          brand={selectedBrand}
          open={brandDialogView !== null}
          onOpenChange={(open) => { if (!open) setBrandDialogView(null); }}
          initialView={brandDialogView ?? 'brand-dna'}
        />
      )}

      {/* AI Guidelines Dialog */}
      {selectedBrand && (
        <AIGuidelinesDialog
          brand={selectedBrand}
          open={guidelinesOpen}
          onOpenChange={setGuidelinesOpen}
        />
      )}

      {/* Demo showcase modal — onStartTour opens Vince voice mode */}
      <ShowcaseModal
        open={showcaseOpen}
        onClose={handleShowcaseClose}
        onStartTour={handleToggleVince}
      />

      {/* Creative package history viewer */}
      <Dialog open={!!historyPackageGen} onOpenChange={(open) => !open && setHistoryPackageGen(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Creative Package</DialogTitle>
          </DialogHeader>
          {historyPackageGen && (
            <CreativePackageDisplay
              parts={historyPackageGen.copy_blocks as PackagePart[]}
              imageUrls={historyPackageGen.output_urls || []}
              latencyMs={historyPackageGen.generation_time_ms || 0}
              brief={historyPackageGen.prompt_text}
              deliverableNames={historyPackageGen.metadata?.deliverable_names as string[] | undefined}
              brandName={historyPackageGen.brand?.name ?? ''}
              model={historyPackageGen.model_used ?? ''}
              onLoadToCanvas={setCurrentImage}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
