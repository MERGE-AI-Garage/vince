// ABOUTME: Collapsible educational panel showing descriptions and tips for each Creative Studio mode
// ABOUTME: Reads current generation type and active edit tool to display contextual guidance

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationMode } from '@/components/creative-studio/BrandShopPromptBar';
import type { EditTool } from '@/store/creative-studio-edit-store';

interface ModeInfo {
  title: string;
  description: string;
  tips: string[];
}

const MODE_INFO: Record<string, ModeInfo> = {
  image: {
    title: 'Text to Image',
    description: 'Generate images from text descriptions. Supports Gemini (conversational, multi-turn, up to 14 reference images) and Imagen (high-fidelity, fast, multiple samples).',
    tips: [
      'Be specific about composition, lighting, and style',
      'Use Gemini Pro for complex scenes with reasoning',
      'Use Imagen 4.0 for photorealistic product shots',
      'Add reference images for style or subject consistency',
    ],
  },
  edit: {
    title: 'Edit Image',
    description: 'Modify images using AI-powered editing tools. Paint masks to define edit areas, then describe changes.',
    tips: [
      'Load an image to canvas first, then select an edit tool',
      'Use the masking canvas for precise area selection',
      'Higher guidance scale = closer adherence to your prompt',
    ],
  },
  video: {
    title: 'Video Generation',
    description: 'Create videos with Veo 3.1. Supports text-to-video, image animation, keyframe interpolation, scene extension, and ingredient-based generation with reference images.',
    tips: [
      'Use quotes for dialogue: "Hello!" she said',
      'Describe sound effects: [SFX: thunder rumbles]',
      'Enable audio for dialogue, SFX, and ambient sound',
      'Add up to 3 reference images as visual ingredients',
      'Director Mode gives structured control over camera, lighting, and lens',
    ],
  },
  upscale: {
    title: 'Upscale Image',
    description: 'Enhance image resolution up to 4x using Imagen upscaling (max 17MP output). No prompt needed.',
    tips: [
      'Load an image to the canvas first',
      '2x is recommended for most use cases',
      '4x produces very large files — use for print',
    ],
  },
  recontext: {
    title: 'Product Recontext',
    description: 'Place your product in a new scene. Upload a product photo and describe the desired setting. AI preserves the product and generates a matching environment.',
    tips: [
      'Use a clean product photo with simple background',
      'Describe the scene in detail: surface, lighting, props',
      'Works best with isolated product shots',
    ],
  },
  tryon: {
    title: 'Virtual Try-On',
    description: 'See how clothing looks on a person. Upload a person photo and a garment image. AI composites the garment onto the person naturally.',
    tips: [
      'Person photo should show full or half body, front-facing',
      'Garment image should be a flat lay or mannequin shot',
      'Works best with tops, dresses, and outerwear',
    ],
  },
  conversation: {
    title: 'Chat Edit (Gemini Pro)',
    description: 'Multi-turn conversational image editing with Gemini Pro. Describe changes in natural language and iterate — Gemini remembers the conversation context.',
    tips: [
      'Load an image to canvas first — it becomes your starting point',
      'Add reference images for style, subjects, or elements to composite',
      'Each turn builds on previous context — be specific about changes',
      '"Start Fresh" resets the conversation history',
    ],
  },
};

const EDIT_TOOL_INFO: Record<string, ModeInfo> = {
  'background-swap': {
    title: 'Background Swap',
    description: 'Replace the background while preserving the main subject. AI automatically detects and masks the foreground.',
    tips: [
      'Describe the new background in detail',
      'Works best when the subject has clear edges',
      'No masking needed — AI handles segmentation',
    ],
  },
  'object-remove': {
    title: 'Object Removal',
    description: 'Remove unwanted objects from an image. Paint over the area to remove and AI fills it naturally.',
    tips: [
      'Paint a mask over the object to remove',
      'Slightly overpaint edges for cleaner results',
      'AI inpaints the area to match surroundings',
    ],
  },
  'object-insert': {
    title: 'Object Insertion',
    description: 'Add objects to a specific area. Paint a mask where you want the object and describe what to place there.',
    tips: [
      'Paint the area where the object should appear',
      'Describe the object and how it should blend',
      'Match lighting and perspective in your description',
    ],
  },
  'foreground-swap': {
    title: 'Subject Swap',
    description: 'Replace the main subject while keeping the background. Describe the new subject to place in the scene.',
    tips: [
      'Describe the replacement subject clearly',
      'Background and lighting are preserved',
      'Works best with distinct foreground subjects',
    ],
  },
  'canvas-expand': {
    title: 'Canvas Expansion',
    description: 'Extend an image beyond its borders (outpainting). Choose a direction and describe what should fill the expanded area.',
    tips: [
      'Select expansion direction: left, right, up, or down',
      'Describe what should appear in the expanded area',
      'The AI matches style, perspective, and lighting',
    ],
  },
  upscale: {
    title: 'Upscale',
    description: 'Enhance image resolution using Imagen upscaling. Select 2x or 4x factor.',
    tips: [
      'No prompt needed for upscaling',
      '2x is fast and suitable for web',
      '4x for print-quality output (max 17MP)',
    ],
  },
};

interface ModeInfoPanelProps {
  generationType: GenerationMode;
  activeTool: EditTool | 'select';
}

export function ModeInfoPanel({ generationType, activeTool }: ModeInfoPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Show edit tool info when a tool is active, otherwise show mode info
  const info = activeTool !== 'select'
    ? EDIT_TOOL_INFO[activeTool]
    : MODE_INFO[generationType];

  if (!info) return null;

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <Info className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">{info.title}</span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {info.description}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
              <Lightbulb className="w-3 h-3" />
              Tips
            </div>
            <ul className="space-y-0.5">
              {info.tips.map((tip, i) => (
                <li key={i} className="text-[10px] text-muted-foreground pl-4 relative">
                  <span className="absolute left-1 top-0">-</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
