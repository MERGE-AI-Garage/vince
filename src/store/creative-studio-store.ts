// ABOUTME: Zustand store for Creative Studio generation state
// ABOUTME: Manages models, parameters, history, and current operation state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AspectRatio = '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | '1:4' | '4:1' | '1:8' | '8:1';
export type VideoAspectRatio = '16:9' | '9:16';
export type VideoResolution = '720p' | '1080p' | '4k';
export type SafetySetting = 'block_none' | 'block_few' | 'block_some' | 'block_most';
export type PersonGeneration = 'dont_allow' | 'allow_adult';
export type EditMode = 'inpainting-insert' | 'inpainting-remove' | 'outpainting' | 'product-image' | 'upscale';
export type ReferenceType = 'asset' | 'style';

export interface CameraPresetState {
  film_stock?: string;
  lighting_setup?: string;
  composition?: string;
  depth_of_field?: string;
  camera_body?: string;
  print_process?: string;
  color_grade?: string;
  film_effect?: string;
  shot_type?: string;
  aperture?: number;
  focal_length?: number;
  color_temperature?: number;
  color_temperature_preset?: string;
  frame_rate?: string;
}

export interface GenerationRecord {
  id: string;
  type: 'image' | 'video';
  modelUsed: string;
  prompt: string;
  parameters: Record<string, any>;
  inputImage?: string;
  outputUrls: string[];
  outputBase64: string[];
  generatedAt: Date;
  processingTime: number;
  status: 'pending' | 'completed' | 'failed';
  favorited?: boolean;
  tags?: string[];
  notes?: string;
}

interface GenerationState {
  // Current operation
  currentOperation: 'idle' | 'generating' | 'uploading' | 'processing';
  currentProgress: number;
  currentError: string | null;
  currentElapsedSeconds: number;

  // Model selection
  selectedImageModel: string;
  selectedVideoModel: string;

  // Image generation parameters
  imageParams: {
    prompt: string;
    directorMode?: boolean;
    sampleCount: number;
    aspectRatio: AspectRatio;
    safetySetting: SafetySetting;
    personGeneration: PersonGeneration;
    seed?: number;
    negativePrompt: string;
    // Gemini-specific
    temperature?: number;
    // Camera preset selections (slugs from creative_studio_camera_options)
    cameraPreset?: CameraPresetState;
    cameraControlsEnabled: boolean;
    // Inject brand logo as reference image during generation
    includeLogo: boolean;
    // Output resolution (only relevant for models with configurable sizes)
    imageSize: string;
    // Thinking budget level (only relevant for models with supports_thinking)
    thinkingLevel?: string;
    // Enable Google Search grounding (only relevant for models with supports_grounding)
    useGrounding: boolean;
  };

  // Image editing parameters
  editParams: {
    editMode: EditMode;
    maskMode: 'background' | 'foreground' | 'semantic';
    maskDilation: number;
    guidanceScale: number;
  };

  // Video generation parameters
  videoParams: {
    prompt: string;
    durationSeconds: number;
    aspectRatio: VideoAspectRatio;
    resolution: VideoResolution;
    sampleCount: number;
    generateAudio: boolean;
    seed?: number;
    negativePrompt: string;
    startingFrame?: string;
    lastFrame?: string;
    extensionVideo?: string;
    extensionTargetSeconds?: number;
    directorMode?: boolean;
    referenceImages?: Array<{
      image: string;
      type: ReferenceType;
    }>;
    cameraPreset?: CameraPresetState;
    cameraControlsEnabled: boolean;
  };

  // Current canvas/editing state
  currentImage: string | null;
  currentMask: string | null;

  // History
  history: GenerationRecord[];
  currentHistoryIndex: number;

  // Selected items
  selectedSamples: string[];

  // Actions
  setCurrentOperation: (operation: GenerationState['currentOperation']) => void;
  setCurrentProgress: (progress: number, elapsedSeconds?: number) => void;
  setCurrentError: (error: string | null) => void;

  setImageModel: (model: string) => void;
  setVideoModel: (model: string) => void;

  updateImageParams: (params: Partial<GenerationState['imageParams']>) => void;
  updateCameraPreset: (preset: Partial<CameraPresetState> | undefined) => void;
  updateVideoCameraPreset: (preset: Partial<CameraPresetState> | undefined) => void;
  updateEditParams: (params: Partial<GenerationState['editParams']>) => void;
  updateVideoParams: (params: Partial<GenerationState['videoParams']>) => void;

  setCurrentImage: (image: string | null) => void;
  setCurrentMask: (mask: string | null) => void;

  addToHistory: (record: GenerationRecord) => void;
  loadFromHistory: (index: number) => void;
  clearHistory: () => void;
  deleteFromHistory: (id: string) => void;
  toggleFavorite: (id: string) => void;

  toggleSampleSelection: (id: string) => void;
  clearSampleSelection: () => void;

  reset: () => void;
  clearPrompts: () => void;
}

const initialImageParams: GenerationState['imageParams'] = {
  prompt: '',
  directorMode: false,
  sampleCount: 1,
  aspectRatio: '1:1',
  safetySetting: 'block_some',
  personGeneration: 'allow_adult',
  negativePrompt: '',
  cameraControlsEnabled: false,
  includeLogo: false,
  imageSize: '2K',
  useGrounding: false,
};

const initialEditParams: GenerationState['editParams'] = {
  editMode: 'inpainting-remove',
  maskMode: 'background',
  maskDilation: 0.03,
  guidanceScale: 7.5,
};

const initialVideoParams: GenerationState['videoParams'] = {
  prompt: '',
  durationSeconds: 8,
  aspectRatio: '16:9',
  resolution: '1080p',
  sampleCount: 1,
  generateAudio: false,
  negativePrompt: '',
  directorMode: false,
  cameraControlsEnabled: false,
};

export const useCreativeStudioStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      currentOperation: 'idle',
      currentProgress: 0,
      currentError: null,
      currentElapsedSeconds: 0,

      selectedImageModel: 'gemini-3-pro-image-preview',
      selectedVideoModel: 'veo-3.1-generate-preview',

      imageParams: { ...initialImageParams },
      editParams: { ...initialEditParams },
      videoParams: { ...initialVideoParams },

      currentImage: null,
      currentMask: null,

      history: [],
      currentHistoryIndex: -1,

      selectedSamples: [],

      setCurrentOperation: (operation) => set({
        currentOperation: operation,
        currentElapsedSeconds: operation === 'idle' ? 0 : get().currentElapsedSeconds
      }),

      setCurrentProgress: (progress, elapsedSeconds) => set({
        currentProgress: progress,
        ...(elapsedSeconds !== undefined && { currentElapsedSeconds: elapsedSeconds })
      }),

      setCurrentError: (error) => set({ currentError: error }),

      setImageModel: (model) => set({ selectedImageModel: model }),

      setVideoModel: (model) => set({ selectedVideoModel: model }),

      updateImageParams: (params) =>
        set((state) => ({
          imageParams: {
            ...state.imageParams,
            ...params,
            sampleCount: params.sampleCount ? Math.min(Math.max(params.sampleCount, 1), 8) : state.imageParams.sampleCount,
          },
        })),

      updateCameraPreset: (preset) =>
        set((state) => ({
          imageParams: {
            ...state.imageParams,
            cameraPreset: preset === undefined ? undefined : {
              ...state.imageParams.cameraPreset,
              ...preset,
            },
          },
        })),

      updateVideoCameraPreset: (preset) =>
        set((state) => ({
          videoParams: {
            ...state.videoParams,
            cameraPreset: preset === undefined ? undefined : {
              ...state.videoParams.cameraPreset,
              ...preset,
            },
          },
        })),

      updateEditParams: (params) =>
        set((state) => ({
          editParams: { ...state.editParams, ...params },
        })),

      updateVideoParams: (params) =>
        set((state) => ({
          videoParams: {
            ...state.videoParams,
            ...params,
            sampleCount: params.sampleCount ? Math.min(Math.max(params.sampleCount, 1), 4) : state.videoParams.sampleCount,
            durationSeconds: params.durationSeconds ? Math.min(Math.max(params.durationSeconds, 4), 8) : state.videoParams.durationSeconds,
          },
        })),

      setCurrentImage: (image) => set({ currentImage: image }),
      setCurrentMask: (mask) => set({ currentMask: mask }),

      addToHistory: (record) =>
        set((state) => ({
          history: [record, ...state.history],
          currentHistoryIndex: 0,
        })),

      loadFromHistory: (index) => {
        const record = get().history[index];
        if (!record) return;

        set({
          currentHistoryIndex: index,
          currentImage: record.inputImage || record.outputUrls[0] || null,
        });

        if (record.type === 'image') {
          set((state) => ({
            imageParams: {
              ...state.imageParams,
              prompt: record.prompt,
              ...record.parameters,
            },
          }));
        } else if (record.type === 'video') {
          set((state) => ({
            videoParams: {
              ...state.videoParams,
              prompt: record.prompt,
              ...record.parameters,
            },
          }));
        }
      },

      clearHistory: () => set({ history: [], currentHistoryIndex: -1 }),

      deleteFromHistory: (id) =>
        set((state) => {
          const newHistory = state.history.filter((record) => record.id !== id);
          const deletedIndex = state.history.findIndex((record) => record.id === id);

          let newIndex = state.currentHistoryIndex;
          if (deletedIndex !== -1 && deletedIndex <= state.currentHistoryIndex) {
            newIndex = Math.max(0, state.currentHistoryIndex - 1);
          }
          if (newHistory.length === 0) {
            newIndex = -1;
          }

          return {
            history: newHistory,
            currentHistoryIndex: newIndex,
          };
        }),

      toggleFavorite: (id) =>
        set((state) => ({
          history: state.history.map((record) =>
            record.id === id
              ? { ...record, favorited: !record.favorited }
              : record
          ),
        })),

      toggleSampleSelection: (id) =>
        set((state) => ({
          selectedSamples: state.selectedSamples.includes(id)
            ? state.selectedSamples.filter((s) => s !== id)
            : [...state.selectedSamples, id],
        })),

      clearSampleSelection: () => set({ selectedSamples: [] }),

      reset: () =>
        set({
          currentOperation: 'idle',
          currentProgress: 0,
          currentError: null,
          currentElapsedSeconds: 0,
          imageParams: { ...initialImageParams },
          editParams: { ...initialEditParams },
          videoParams: { ...initialVideoParams },
          currentImage: null,
          currentMask: null,
          selectedSamples: [],
        }),

      clearPrompts: () =>
        set((state) => ({
          imageParams: { ...state.imageParams, prompt: '' },
          videoParams: { ...state.videoParams, prompt: '' },
        })),
    }),
    {
      name: 'creative-studio-generation-store',
      version: 7,
      migrate: (persisted: Record<string, unknown>, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          // Fix deprecated video model IDs (-001 → -preview)
          if (typeof state.selectedVideoModel === 'string' && state.selectedVideoModel.endsWith('-001')) {
            state.selectedVideoModel = state.selectedVideoModel.replace(/-001$/, '-preview');
          }
          // Remove unsupported thinkingLevel from imageParams
          if (state.imageParams && typeof state.imageParams === 'object') {
            const params = state.imageParams as Record<string, unknown>;
            delete params.thinkingLevel;
            delete params.temperature;
          }
        }
        if (version < 3) {
          // Add cameraControlsEnabled defaults
          if (state.imageParams && typeof state.imageParams === 'object') {
            const params = state.imageParams as Record<string, unknown>;
            if (params.cameraControlsEnabled === undefined) {
              params.cameraControlsEnabled = false;
            }
          }
          if (state.videoParams && typeof state.videoParams === 'object') {
            const params = state.videoParams as Record<string, unknown>;
            if (params.cameraControlsEnabled === undefined) {
              params.cameraControlsEnabled = false;
            }
          }
        }
        if (version < 4) {
          // Add directorMode default for imageParams
          if (state.imageParams && typeof state.imageParams === 'object') {
            const params = state.imageParams as Record<string, unknown>;
            if (params.directorMode === undefined) {
              params.directorMode = false;
            }
          }
        }
        if (version < 5) {
          if (state.imageParams && typeof state.imageParams === 'object') {
            const params = state.imageParams as Record<string, unknown>;
            if (params.includeLogo === undefined) {
              params.includeLogo = false;
            }
          }
        }
        if (version < 6) {
          if (state.imageParams && typeof state.imageParams === 'object') {
            const params = state.imageParams as Record<string, unknown>;
            if (params.imageSize === undefined) {
              params.imageSize = '2K';
            }
          }
        }
        if (version < 7) {
          if (state.imageParams && typeof state.imageParams === 'object') {
            const params = state.imageParams as Record<string, unknown>;
            if (params.useGrounding === undefined) {
              params.useGrounding = false;
            }
          }
        }
        return state;
      },
      partialize: (state) => ({
        selectedImageModel: state.selectedImageModel,
        selectedVideoModel: state.selectedVideoModel,
        imageParams: state.imageParams,
        videoParams: {
          prompt: state.videoParams.prompt,
          durationSeconds: state.videoParams.durationSeconds,
          aspectRatio: state.videoParams.aspectRatio,
          resolution: state.videoParams.resolution,
          sampleCount: state.videoParams.sampleCount,
          generateAudio: state.videoParams.generateAudio,
          seed: state.videoParams.seed,
          negativePrompt: state.videoParams.negativePrompt,
          directorMode: state.videoParams.directorMode,
          cameraPreset: state.videoParams.cameraPreset,
          cameraControlsEnabled: state.videoParams.cameraControlsEnabled,
        },
      }),
    }
  )
);
