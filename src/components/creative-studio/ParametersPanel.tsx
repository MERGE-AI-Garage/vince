// ABOUTME: Model-aware parameters panel for Creative Studio generation settings
// ABOUTME: Dynamically shows controls based on selected model (Gemini vs Imagen) capabilities

import { Settings2, Image as ImageIcon, Edit, Camera, Cpu, Thermometer, Zap, HelpCircle, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Sparkles, Loader2, Clapperboard, Stamp, Brain, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreativeStudioStore,
  type AspectRatio,
  type SafetySetting,
  type PersonGeneration,
  type EditMode,
} from '@/store/creative-studio-store';
import { useCreativeStudioModels } from '@/hooks/useCreativeStudioModels';
import { CameraControlsPanel } from '@/components/creative-studio/CameraControlsPanel';
import { useCreativeStudioEditStore, type ExpansionDirection, type EditTool } from '@/store/creative-studio-edit-store';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { DirectorModePanel, type DirectorPrompt } from './DirectorModePanel';
import type { QuickPrompt, BrandPromptTemplate } from '@/types/creative-studio';

const EXPANSION_DIRECTIONS: Array<{ id: ExpansionDirection; icon: typeof ArrowLeft; label: string }> = [
  { id: 'left', icon: ArrowLeft, label: 'Left' },
  { id: 'right', icon: ArrowRight, label: 'Right' },
  { id: 'top', icon: ArrowUp, label: 'Up' },
  { id: 'bottom', icon: ArrowDown, label: 'Down' },
];

function EditToolControls({
  activeTool,
  expansionDirection,
  setExpansionDirection,
  setActiveTool,
  editParams,
  updateEditParams,
  ParamLabel,
}: {
  activeTool: EditTool;
  expansionDirection: ExpansionDirection | null;
  setExpansionDirection: (dir: ExpansionDirection | null) => void;
  setActiveTool: (tool: EditTool) => void;
  editParams: { editMode: string; maskMode: string; maskDilation: number; guidanceScale: number };
  updateEditParams: (params: Record<string, unknown>) => void;
  ParamLabel: React.ComponentType<{ children: React.ReactNode; tip: string; icon?: React.ReactNode }>;
}) {
  const { upscaleFactor, setUpscaleFactor } = useCreativeStudioEditStore();
  const { currentImage } = useCreativeStudioStore();
  const [detectingDirection, setDetectingDirection] = useState(false);

  const handleAutoDetect = async () => {
    if (!currentImage) return;
    setDetectingDirection(true);
    try {
      let imageBase64: string;

      if (currentImage.startsWith('data:')) {
        imageBase64 = currentImage.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');
      } else {
        // Fetch the URL and convert to base64
        const response = await fetch(currentImage);
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        imageBase64 = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/i, '');
      }

      const { data, error } = await supabase.functions.invoke('analyze-expansion-direction', {
        body: { image: imageBase64 },
      });
      if (error) throw error;
      if (data?.direction) {
        setExpansionDirection(data.direction as ExpansionDirection);
      }
    } catch {
      // Fallback: default to right
      setExpansionDirection('right');
    } finally {
      setDetectingDirection(false);
    }
  };

  // Canvas Expand controls
  if (activeTool === 'canvas-expand') {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Expand Direction</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {EXPANSION_DIRECTIONS.map((dir) => {
              const isActive = expansionDirection === dir.id;
              return (
                <button
                  key={dir.id}
                  onClick={() => setExpansionDirection(dir.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all border text-xs font-medium',
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : 'bg-card/80 border-border hover:border-primary hover:bg-primary/10'
                  )}
                >
                  <dir.icon className="w-4 h-4" />
                  {dir.label}
                </button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={handleAutoDetect}
            disabled={detectingDirection || !currentImage}
          >
            {detectingDirection ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Auto-detect best direction</>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ParamLabel tip="How closely the output follows your prompt. Higher = more literal, lower = more creative.">Guidance Scale</ParamLabel>
            <span className="text-xs text-muted-foreground">{editParams.guidanceScale.toFixed(1)}</span>
          </div>
          <Slider
            value={[editParams.guidanceScale]}
            onValueChange={([value]) => updateEditParams({ guidanceScale: value })}
            min={1}
            max={20}
            step={0.5}
            className="w-full"
          />
        </div>

        <div className="p-2 bg-muted/50 rounded border">
          <p className="text-[10px] text-muted-foreground">
            Describe what should appear in the expanded area in the prompt bar below. The image will extend 50% in the chosen direction.
          </p>
        </div>
      </>
    );
  }

  // Upscale controls
  if (activeTool === 'upscale') {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Upscale Factor</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['x2', 'x4'] as const).map((factor) => {
              const isActive = upscaleFactor === factor;
              return (
                <button
                  key={factor}
                  onClick={() => setUpscaleFactor(factor)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg transition-all border font-medium',
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : 'bg-card/80 border-border hover:border-primary hover:bg-primary/10'
                  )}
                >
                  <span className="text-lg">{factor.toUpperCase()}</span>
                  <span className="text-[10px] opacity-80">{factor === 'x2' ? 'Standard' : 'Maximum'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-2 bg-muted/50 rounded border">
          <p className="text-[10px] text-muted-foreground">
            Upscale enhances resolution while preserving details. X2 doubles dimensions, X4 quadruples them.
          </p>
        </div>
      </>
    );
  }

  // Inpainting / other tools: show mask controls
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Mask Mode</Label>
        <Select
          value={editParams.maskMode}
          onValueChange={(value: 'background' | 'foreground' | 'semantic') =>
            updateEditParams({ maskMode: value })
          }
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="background">Background</SelectItem>
            <SelectItem value="foreground">Foreground</SelectItem>
            <SelectItem value="semantic">Semantic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <ParamLabel tip="Expands the mask boundary. Higher values create softer transitions between edited and original areas.">Mask Dilation</ParamLabel>
          <span className="text-xs text-muted-foreground">{editParams.maskDilation.toFixed(2)}</span>
        </div>
        <Slider
          value={[editParams.maskDilation]}
          onValueChange={([value]) => updateEditParams({ maskDilation: value })}
          min={0}
          max={0.1}
          step={0.01}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <ParamLabel tip="How closely the output follows your prompt. Higher = more literal, lower = more creative.">Guidance Scale</ParamLabel>
          <span className="text-xs text-muted-foreground">{editParams.guidanceScale.toFixed(1)}</span>
        </div>
        <Slider
          value={[editParams.guidanceScale]}
          onValueChange={([value]) => updateEditParams({ guidanceScale: value })}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />
      </div>

      <div className="p-2 bg-muted/50 rounded border">
        <p className="text-[10px] text-muted-foreground">
          <strong>Tips:</strong>
        </p>
        <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
          <li>- Inpaint: Paint mask over area to change</li>
          <li>- Remove: Paint over objects to delete</li>
          <li>- Higher guidance = closer to prompt</li>
        </ul>
      </div>
    </>
  );
}

interface ParametersPanelProps {
  mode?: 'image' | 'edit';
  brandId?: string | null;
  brandName?: string;
  brandQuickPrompts?: QuickPrompt[];
  brandTemplates?: BrandPromptTemplate[];
  onApplyTemplate?: (info: { id: string; name: string; variables?: Record<string, string>; reference_collections?: string[] }) => void;
  onApplyReferenceImages?: (templateId: string) => void;
}

const IMAGEN_ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '4:3', label: '4:3 (Landscape)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
];

const GEMINI_ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '3:2', label: '3:2 (Landscape)' },
  { value: '2:3', label: '2:3 (Portrait)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '4:3', label: '4:3 (Landscape)' },
  { value: '4:5', label: '4:5 (Portrait)' },
  { value: '5:4', label: '5:4 (Landscape)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '21:9', label: '21:9 (Ultra-wide)' },
];

const ASPECT_RATIO_LABELS: Record<string, string> = {
  '1:1': '1:1 (Square)', '3:2': '3:2 (Landscape)', '2:3': '2:3 (Portrait)',
  '3:4': '3:4 (Portrait)', '4:3': '4:3 (Landscape)', '4:5': '4:5 (Portrait)',
  '5:4': '5:4 (Landscape)', '9:16': '9:16 (Vertical)', '16:9': '16:9 (Widescreen)',
  '21:9': '21:9 (Ultra-wide)', '1:4': '1:4 (Tall Banner)', '4:1': '4:1 (Wide Banner)',
  '1:8': '1:8 (Extra Tall)', '8:1': '8:1 (Extra Wide)',
};

export function ParametersPanel({ mode = 'image', brandId, brandName, brandQuickPrompts, brandTemplates, onApplyTemplate, onApplyReferenceImages }: ParametersPanelProps) {
  const {
    imageParams,
    editParams,
    selectedImageModel,
    setImageModel,
    updateImageParams,
    updateEditParams,
  } = useCreativeStudioStore();

  const directorMode = imageParams.directorMode ?? false;

  const [directorPrompt, setDirectorPrompt] = useState<DirectorPrompt>({
    scene_description: '',
    camera_movement: '',
    lighting: '',
    lens: '',
    subject_attributes: '',
    dialogue: '',
  });

  // Sync director fields to imageParams.prompt (image-relevant fields only)
  useEffect(() => {
    if (!directorMode) return;
    const parts: string[] = [];
    if (directorPrompt.scene_description) parts.push(directorPrompt.scene_description);
    if (directorPrompt.lighting) parts.push(`Lighting: ${directorPrompt.lighting.replace(/_/g, ' ')}`);
    if (directorPrompt.lens) parts.push(`Lens: ${directorPrompt.lens.replace(/_/g, ' ')}`);
    if (directorPrompt.subject_attributes) parts.push(`Subject: ${directorPrompt.subject_attributes}`);
    if (parts.length > 0) {
      updateImageParams({ prompt: parts.join('. ') });
    }
  }, [directorMode, directorPrompt, updateImageParams]);

  const {
    activeTool, setActiveTool,
    expansionDirection, setExpansionDirection,
    upscaleFactor, setUpscaleFactor,
  } = useCreativeStudioEditStore();
  const { data: imageModels } = useCreativeStudioModels('image');
  const selectedModel = imageModels?.find(m => m.model_id === selectedImageModel);

  const isGemini = selectedImageModel.startsWith('gemini-');
  const isGeminiPro = selectedImageModel.includes('gemini-3-pro');

  // Use DB-stored aspect ratios when available, fall back to static lists
  const modelAspectRatios = selectedModel?.parameters?.aspect_ratios as string[] | undefined;
  const aspectRatios = modelAspectRatios
    ? modelAspectRatios.map(ar => ({ value: ar as AspectRatio, label: ASPECT_RATIO_LABELS[ar] || ar }))
    : isGemini ? GEMINI_ASPECT_RATIOS : IMAGEN_ASPECT_RATIOS;
  const maxSamples = selectedModel?.parameters?.max_sample_count ?? 4;
  const modelImageSizes = selectedModel?.parameters?.image_sizes as string[] | undefined;
  const modelThinkingLevels = selectedModel?.parameters?.supports_thinking
    ? (selectedModel.parameters.thinking_levels as string[] | undefined)
    : undefined;
  const modelSupportsGrounding = !!selectedModel?.parameters?.supports_grounding;

  // Clamp sampleCount if model changed and current value exceeds max
  const effectiveSampleCount = Math.min(imageParams.sampleCount, maxSamples);

  const ParamLabel = ({ children, tip, icon }: { children: React.ReactNode; tip: string; icon?: React.ReactNode }) => (
    <div className="flex items-center gap-1">
      {icon}
      <Label className="text-xs text-muted-foreground">{children}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px] text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Settings2 className="w-4 h-4 text-primary" />
        <span>Parameters</span>
      </div>

      {/* Director Mode Toggle */}
      {mode !== 'edit' && (
        <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Clapperboard className="w-3 h-3 text-primary" />
            <Label className="text-xs">Director Mode</Label>
          </div>
          <Switch
            checked={directorMode}
            onCheckedChange={(checked) => updateImageParams({ directorMode: checked })}
          />
        </div>
      )}

      {/* Include Brand Logo Toggle — only when a brand is selected */}
      {mode !== 'edit' && brandId && (
        <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Stamp className="w-3 h-3 text-primary" />
            <Label className="text-xs">Include Logo</Label>
          </div>
          <Switch
            checked={imageParams.includeLogo ?? false}
            onCheckedChange={(checked) => updateImageParams({ includeLogo: checked })}
          />
        </div>
      )}

      {/* Director Mode Panel */}
      {directorMode && mode !== 'edit' && (
        <DirectorModePanel
          value={directorPrompt}
          onChange={setDirectorPrompt}
          mediaType="image"
          brandId={brandId}
          brandName={brandName}
          brandQuickPrompts={brandQuickPrompts}
          brandTemplates={brandTemplates}
          onApplyTemplate={onApplyTemplate}
          onApplyReferenceImages={onApplyReferenceImages}
        />
      )}

      <Tabs defaultValue={mode === 'edit' ? 'edit' : 'image'} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="image">
            <ImageIcon className="w-3 h-3" />
            Image
          </TabsTrigger>
          <TabsTrigger value="camera">
            <Camera className="w-3 h-3" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Edit className="w-3 h-3" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="space-y-4 mt-3">
          {/* Gemini: Temperature */}
          {isGemini && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  Temperature
                </Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {(imageParams.temperature ?? 1.0).toFixed(1)}
                </span>
              </div>
              <Slider
                value={[imageParams.temperature ?? 1.0]}
                onValueChange={([value]) => updateImageParams({ temperature: value })}
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
              <p className="text-[9px] text-muted-foreground">
                Lower = precise, higher = creative
              </p>
            </div>
          )}

          {/* Sample Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <ParamLabel tip="Generate multiple variations. More outputs = higher API cost.">Samples</ParamLabel>
              <span className="text-xs text-muted-foreground">{effectiveSampleCount}</span>
            </div>
            {maxSamples > 1 ? (
              <>
                <Slider
                  value={[effectiveSampleCount]}
                  onValueChange={([value]) => updateImageParams({ sampleCount: value })}
                  min={1}
                  max={maxSamples}
                  step={1}
                  className="w-full"
                />
                {isGeminiPro && effectiveSampleCount > 1 && (
                  <p className="text-[10px] text-muted-foreground">Each sample is a parallel API call</p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded border text-[10px] text-muted-foreground">
                <Zap className="w-3 h-3" />
                Fixed at 1 sample for this model
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <ParamLabel tip="Controls output dimensions. 16:9 for landscape, 9:16 for portrait, 1:1 for social.">Aspect Ratio</ParamLabel>
            <Select
              value={imageParams.aspectRatio}
              onValueChange={(value: AspectRatio) => updateImageParams({ aspectRatio: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ar) => (
                  <SelectItem key={ar.value} value={ar.value}>
                    {ar.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Size — only for models with configurable resolution */}
          {modelImageSizes && modelImageSizes.length > 1 && (
            <div className="space-y-2">
              <ParamLabel tip="Controls output resolution. Higher = sharper but slower and more expensive.">Image Size</ParamLabel>
              <Select
                value={imageParams.imageSize || '2K'}
                onValueChange={(value: string) => updateImageParams({ imageSize: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelImageSizes.map((size: string) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Thinking Level — only for models with thinking support */}
          {modelThinkingLevels && modelThinkingLevels.length > 0 && (
            <div className="space-y-2">
              <ParamLabel tip="Controls how much reasoning the model does before generating. Higher = better quality but slower and more expensive." icon={<Brain className="w-3 h-3" />}>Thinking Level</ParamLabel>
              <Select
                value={imageParams.thinkingLevel || modelThinkingLevels[0]}
                onValueChange={(value: string) => updateImageParams({ thinkingLevel: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelThinkingLevels.map((level: string) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search Grounding — only for models with grounding support */}
          {modelSupportsGrounding && (
            <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-primary" />
                <Label className="text-xs">Search Grounding</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] text-xs">
                    Enables Google Search to ground image generation in real-world visual references and current information.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={imageParams.useGrounding ?? false}
                onCheckedChange={(checked) => updateImageParams({ useGrounding: checked })}
              />
            </div>
          )}

          {/* Safety Setting - Imagen only */}
          {!isGemini && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Safety Level</Label>
              <Select
                value={imageParams.safetySetting}
                onValueChange={(value: SafetySetting) => updateImageParams({ safetySetting: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block_none">None</SelectItem>
                  <SelectItem value="block_few">Low</SelectItem>
                  <SelectItem value="block_some">Medium</SelectItem>
                  <SelectItem value="block_most">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Person Generation */}
          <div className="space-y-2">
            <ParamLabel tip="Controls whether AI can generate images of people. 'Allow Adults' needed for portraits.">Person Generation</ParamLabel>
            <Select
              value={imageParams.personGeneration}
              onValueChange={(value: PersonGeneration) => updateImageParams({ personGeneration: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dont_allow">Don't Allow</SelectItem>
                <SelectItem value="allow_adult">Allow Adults</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seed */}
          <div className="space-y-2">
            <ParamLabel tip="Set a number for reproducible results. Same seed + same prompt = similar output.">Seed (optional)</ParamLabel>
            <Input
              type="number"
              value={imageParams.seed ?? ''}
              onChange={(e) => updateImageParams({ seed: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Random"
              className="h-8 text-xs"
            />
          </div>

          {/* Negative Prompt - Imagen only */}
          {!isGemini && (
            <div className="space-y-2">
              <ParamLabel tip="Describe what you DON'T want. E.g. 'blurry, low quality, text, watermark'">Negative Prompt</ParamLabel>
              <Textarea
                value={imageParams.negativePrompt}
                onChange={(e) => updateImageParams({ negativePrompt: e.target.value })}
                placeholder="What to avoid..."
                className="h-16 text-xs resize-none"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="camera" className="mt-3">
          <CameraControlsPanel />
        </TabsContent>

        <TabsContent value="edit" className="space-y-4 mt-3">
          <EditToolControls
            activeTool={activeTool}
            expansionDirection={expansionDirection}
            setExpansionDirection={setExpansionDirection}
            setActiveTool={setActiveTool}
            editParams={editParams}
            updateEditParams={updateEditParams}
            ParamLabel={ParamLabel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
