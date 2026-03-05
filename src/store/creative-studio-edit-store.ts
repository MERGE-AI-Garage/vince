// ABOUTME: Zustand store for Creative Studio image editing tools
// ABOUTME: Manages active tool, selection mode, mask state, and tool parameters

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EditTool =
  | 'select'
  | 'background-swap'
  | 'object-remove'
  | 'object-insert'
  | 'foreground-swap'
  | 'canvas-expand'
  | 'upscale';

export type ImageMaskMode =
  | 'MASK_MODE_BACKGROUND'
  | 'MASK_MODE_FOREGROUND'
  | 'MASK_MODE_SEMANTIC';

export type ExpansionDirection = 'left' | 'right' | 'top' | 'bottom';

interface EditToolState {
  // Tool selection
  activeTool: EditTool;
  selectionMode: 'smart' | 'manual' | 'none';
  selectedMaskMode: ImageMaskMode | null;

  // Mask state
  currentMask: string | null;
  maskInverted: boolean;

  // Canvas expansion
  canvasExpanded: boolean;
  expansionDirection: ExpansionDirection | null;
  paddedInputImage: string | null;

  // Tool parameters
  brushSize: number;
  maskDilation: number;
  guidanceScale: number;
  upscaleFactor: 'x2' | 'x4';

  // Actions
  setActiveTool: (tool: EditTool) => void;
  setSelectionMode: (mode: 'smart' | 'manual' | 'none') => void;
  setSelectedMaskMode: (mode: ImageMaskMode | null) => void;
  setCurrentMask: (mask: string | null) => void;
  setMaskInverted: (inverted: boolean) => void;
  setExpansionDirection: (direction: ExpansionDirection | null) => void;
  setPaddedInputImage: (image: string | null) => void;
  setBrushSize: (size: number) => void;
  setMaskDilation: (dilation: number) => void;
  setGuidanceScale: (scale: number) => void;
  setUpscaleFactor: (factor: 'x2' | 'x4') => void;
  resetEditState: () => void;
}

export const useCreativeStudioEditStore = create<EditToolState>()(
  persist(
    (set) => ({
      activeTool: 'select',
      selectionMode: 'smart',
      selectedMaskMode: null,
      currentMask: null,
      maskInverted: false,
      canvasExpanded: false,
      expansionDirection: null,
      paddedInputImage: null,
      brushSize: 30,
      maskDilation: 0.03,
      guidanceScale: 7.5,
      upscaleFactor: 'x2',

      setActiveTool: (tool) => set((state) => {
        // Reset selection mode based on tool
        let selectionMode: 'smart' | 'manual' | 'none' = 'smart';

        if (tool === 'select' || tool === 'upscale') {
          selectionMode = 'none';
        } else if (tool === 'object-insert' || tool === 'canvas-expand') {
          selectionMode = 'manual';
        }

        return {
          activeTool: tool,
          selectionMode,
          currentMask: null,
          expansionDirection: null,
          paddedInputImage: null,
        };
      }),

      setSelectionMode: (mode) => set({ selectionMode: mode }),
      setSelectedMaskMode: (mode) => set({ selectedMaskMode: mode }),
      setCurrentMask: (mask) => set({ currentMask: mask }),
      setMaskInverted: (inverted) => set({ maskInverted: inverted }),
      setExpansionDirection: (direction) => set({ expansionDirection: direction }),
      setPaddedInputImage: (image) => set({ paddedInputImage: image }),
      setBrushSize: (size) => set({ brushSize: Math.min(Math.max(size, 5), 100) }),
      setMaskDilation: (dilation) => set({ maskDilation: Math.min(Math.max(dilation, 0), 1) }),
      setGuidanceScale: (scale) => set({ guidanceScale: Math.min(Math.max(scale, 1), 20) }),
      setUpscaleFactor: (factor) => set({ upscaleFactor: factor }),

      resetEditState: () => set({
        activeTool: 'select',
        selectionMode: 'smart',
        selectedMaskMode: null,
        currentMask: null,
        maskInverted: false,
        canvasExpanded: false,
        expansionDirection: null,
        paddedInputImage: null,
      }),
    }),
    {
      name: 'creative-studio-edit-tools',
      partialize: (state) => ({
        brushSize: state.brushSize,
        maskDilation: state.maskDilation,
        guidanceScale: state.guidanceScale,
        upscaleFactor: state.upscaleFactor,
      }),
    }
  )
);
