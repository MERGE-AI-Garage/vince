// ABOUTME: Video generation panel for Creative Studio with all Veo 3.1 capabilities
// ABOUTME: Modes: text-to-video, image-to-video, keyframe, director mode, extend, with 4K and audio controls

import { useState, useEffect, useMemo } from 'react';
import {
  Upload, X, Volume2, VolumeX, Image as ImageIcon,
  Clapperboard, AlertTriangle, Timer, Film, ArrowRight, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DirectorModePanel, type DirectorPrompt } from './DirectorModePanel';
import { AssetPicker } from './AssetPicker';
import { CameraControlsPanel } from './CameraControlsPanel';
import { convertGcsUri } from '@/lib/image-utils';

import {
  useCreativeStudioStore,
  type VideoAspectRatio,
  type VideoResolution,
  type ReferenceType,
} from '@/store/creative-studio-store';
import { useCreativeStudioModels } from '@/hooks/useCreativeStudioModels';
import { ModelSelector } from '@/components/creative-studio/ModelSelector';

type VideoMode = 'text-to-video' | 'image-to-video' | 'keyframe-video' | 'extend-video';

const MODE_DESCRIPTIONS: Record<VideoMode, string> = {
  'text-to-video': 'Generate video from text description',
  'image-to-video': 'Animate from a starting image (8s fixed)',
  'keyframe-video': 'Morph between first and last frame (8s fixed)',
  'extend-video': 'Extend existing video up to 148 seconds',
};

interface VideoGenerationPanelProps {
  brandId?: string | null;
  brandName?: string;
  brandQuickPrompts?: import('@/types/creative-studio').QuickPrompt[];
  brandTemplates?: import('@/types/creative-studio').BrandPromptTemplate[];
  onApplyTemplate?: (info: { id: string; name: string; variables?: Record<string, string>; reference_collections?: string[] }) => void;
}

export function VideoGenerationPanel({ brandId, brandName, brandQuickPrompts, brandTemplates, onApplyTemplate }: VideoGenerationPanelProps) {
  const {
    selectedVideoModel,
    setVideoModel,
    videoParams,
    updateVideoParams,
    currentImage,
  } = useCreativeStudioStore();

  const { data: videoModels } = useCreativeStudioModels('video');

  const durationSeconds = videoParams.durationSeconds;
  const resolution = videoParams.resolution;
  const generateAudio = videoParams.generateAudio;
  const directorMode = videoParams.directorMode ?? false;

  const [videoMode, setVideoMode] = useState<VideoMode>('text-to-video');
  const [directorPrompt, setDirectorPrompt] = useState<DirectorPrompt>({
    scene_description: '',
    camera_movement: '',
    lighting: '',
    lens: '',
    subject_attributes: '',
    dialogue: '',
  });

  // Sync director prompt to video prompt
  useEffect(() => {
    if (!directorMode) return;
    const parts: string[] = [];
    if (directorPrompt.scene_description) parts.push(directorPrompt.scene_description);
    if (directorPrompt.camera_movement) parts.push(`Camera: ${directorPrompt.camera_movement.replace(/_/g, ' ')}`);
    if (directorPrompt.lighting) parts.push(`Lighting: ${directorPrompt.lighting.replace(/_/g, ' ')}`);
    if (directorPrompt.lens) parts.push(`Lens: ${directorPrompt.lens.replace(/_/g, ' ')}`);
    if (directorPrompt.subject_attributes) parts.push(`Subject: ${directorPrompt.subject_attributes}`);
    if (directorPrompt.dialogue) parts.push(`Dialogue: "${directorPrompt.dialogue}"`);
    if (parts.length > 0) {
      updateVideoParams({ prompt: parts.join('. ') });
    }
  }, [directorMode, directorPrompt, updateVideoParams]);

  // Clear mode-specific params when switching modes
  useEffect(() => {
    const updates: Partial<typeof videoParams> = {
      negativePrompt: '',
    };

    if (videoMode !== 'extend-video') {
      updates.extensionVideo = undefined;
      updates.extensionTargetSeconds = undefined;
    }
    if (videoMode !== 'image-to-video' && videoMode !== 'keyframe-video') {
      updates.startingFrame = undefined;
    }
    if (videoMode !== 'keyframe-video') {
      updates.lastFrame = undefined;
    }

    updateVideoParams(updates);
  }, [videoMode, updateVideoParams]);

  // Snap duration to valid Veo 3.1 values
  useEffect(() => {
    if (videoMode === 'extend-video') return;
    // Image-to-video and keyframe always lock to 8s
    if (videoMode === 'image-to-video' || videoMode === 'keyframe-video') {
      if (durationSeconds !== 8) updateVideoParams({ durationSeconds: 8 });
      return;
    }
    const validDurations = [4, 6, 8];
    if (!validDurations.includes(durationSeconds)) {
      const nearest = validDurations.reduce((prev, curr) =>
        Math.abs(curr - durationSeconds) < Math.abs(prev - durationSeconds) ? curr : prev
      );
      updateVideoParams({ durationSeconds: nearest });
    }
  }, [selectedVideoModel, videoMode, durationSeconds, updateVideoParams]);

  // Director Mode only supports 1 video per generation (Veo API constraint)
  useEffect(() => {
    if (directorMode && videoParams.sampleCount > 1) {
      updateVideoParams({ sampleCount: 1 });
    }
  }, [directorMode, videoParams.sampleCount, updateVideoParams]);

  const startingFrame = videoParams.startingFrame;
  const lastFrame = videoParams.lastFrame;
  const extensionVideo = videoParams.extensionVideo;
  const extensionTargetSeconds = videoParams.extensionTargetSeconds ?? 15;
  const referenceImages = videoParams.referenceImages || [];

  const removeReferenceImage = (index: number) => {
    updateVideoParams({
      referenceImages: referenceImages.filter((_, i) => i !== index),
    });
  };

  const updateReferenceType = (index: number, type: ReferenceType) => {
    updateVideoParams({
      referenceImages: referenceImages.map((ref, i) =>
        i === index ? { ...ref, type } : ref
      ),
    });
  };

  const useCurrentImageAsStartingFrame = () => {
    if (currentImage) {
      const base64 = currentImage.includes('base64,')
        ? currentImage.split('base64,')[1]
        : currentImage;
      updateVideoParams({ startingFrame: base64, referenceImages: [] });
      setVideoMode('image-to-video');
    }
  };

  const clearStartingFrame = () => {
    updateVideoParams({ startingFrame: undefined });
    if (videoMode === 'image-to-video') setVideoMode('text-to-video');
  };

  const clearLastFrame = () => {
    updateVideoParams({ lastFrame: undefined });
    if (videoMode === 'keyframe-video') setVideoMode('image-to-video');
  };

  const clearExtensionVideo = () => {
    updateVideoParams({ extensionVideo: undefined, extensionTargetSeconds: undefined });
    setVideoMode('text-to-video');
  };

  const selectedModelData = videoModels?.find(m => m.model_id === selectedVideoModel);
  const supportsAudio = selectedModelData?.capabilities.includes('audio_generation') ||
    selectedModelData?.parameters?.supports_audio || false;
  const supports4k = selectedModelData?.parameters?.supports_4k || selectedVideoModel.includes('preview');

  // Scene extension calculations
  const extensionIterations = useMemo(() => {
    if (videoMode !== 'extend-video') return 0;
    return Math.ceil(Math.max(0, extensionTargetSeconds - 8) / 7);
  }, [videoMode, extensionTargetSeconds]);

  const actualExtensionDuration = useMemo(() => {
    return 8 + (extensionIterations * 7);
  }, [extensionIterations]);

  // Duration is locked for image-to-video and keyframe modes
  const durationLocked = videoMode === 'image-to-video' || videoMode === 'keyframe-video';

  const ParamLabel = ({ children, tip }: { children: React.ReactNode; tip: string }) => (
    <div className="flex items-center gap-1">
      <Label className="text-xs">{children}</Label>
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
      {/* Video model selector with educational hover card */}
      <ModelSelector
        models={videoModels}
        selectedModelId={selectedVideoModel}
        onModelChange={setVideoModel}
        label="Video Model"
      />

      {/* Generation Mode */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs">Generation Mode</Label>
        <Select value={videoMode} onValueChange={(value) => setVideoMode(value as VideoMode)}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text-to-video">Text to Video</SelectItem>
            <SelectItem value="image-to-video">Image to Video</SelectItem>
            <SelectItem value="keyframe-video">Keyframe (First + Last)</SelectItem>
            <SelectItem value="extend-video">Extend Video</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          {MODE_DESCRIPTIONS[videoMode]}
        </p>
      </div>

      {/* Director Mode Toggle */}
      {(videoMode === 'text-to-video' || videoMode === 'image-to-video') && (
        <div className="flex items-center justify-between p-2 border rounded bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Clapperboard className="w-3 h-3 text-primary" />
            <Label className="text-xs">Director Mode</Label>
          </div>
          <Switch
            checked={directorMode}
            onCheckedChange={(checked) => updateVideoParams({ directorMode: checked })}
          />
        </div>
      )}

      {/* Director Mode Panel */}
      {directorMode && (videoMode === 'text-to-video' || videoMode === 'image-to-video') && (
        <DirectorModePanel
          value={directorPrompt}
          onChange={setDirectorPrompt}
          brandId={brandId}
          brandName={brandName}
          brandQuickPrompts={brandQuickPrompts}
          brandTemplates={brandTemplates}
          onApplyTemplate={onApplyTemplate}
        />
      )}

      {/* Video Camera Controls */}
      <div className="border-t pt-3">
        <CameraControlsPanel mediaType="video" />
      </div>

      {/* Image to Video / Keyframe - Starting Frame */}
      {(videoMode === 'image-to-video' || videoMode === 'keyframe-video') && (
        <div className="space-y-2">
          <Label className="text-xs">
            {videoMode === 'keyframe-video' ? 'First Frame' : 'Starting Image'}
          </Label>

          {startingFrame ? (
            <div className="relative aspect-video bg-muted rounded-lg border overflow-hidden group">
              <img
                src={`data:image/png;base64,${startingFrame}`}
                alt="Starting frame"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="destructive" onClick={clearStartingFrame}>
                  <X className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <AssetPicker
                mediaType="image"
                outputFormat="base64"
                disabled={referenceImages.length > 0}
                onSelect={(base64) => {
                  updateVideoParams({ startingFrame: base64, referenceImages: [] });
                  if (videoMode !== 'keyframe-video') setVideoMode('image-to-video');
                }}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-4 flex flex-col gap-1"
                    disabled={referenceImages.length > 0}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px]">Upload</span>
                  </Button>
                }
              />
              {currentImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useCurrentImageAsStartingFrame}
                  className="h-auto py-4 flex flex-col gap-1"
                  disabled={referenceImages.length > 0}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[10px]">Use Canvas</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Keyframe - Last Frame */}
      {videoMode === 'keyframe-video' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <Label className="text-xs">Last Frame</Label>
          </div>

          {lastFrame ? (
            <div className="relative aspect-video bg-muted rounded-lg border overflow-hidden group">
              <img
                src={`data:image/png;base64,${lastFrame}`}
                alt="Last frame"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="destructive" onClick={clearLastFrame}>
                  <X className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          ) : (
            <AssetPicker
              mediaType="image"
              outputFormat="base64"
              onSelect={(base64) => updateVideoParams({ lastFrame: base64 })}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-auto py-4 flex flex-col gap-1"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px]">Upload Last Frame</span>
                </Button>
              }
            />
          )}

          {startingFrame && lastFrame && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border">
              <div className="w-12 h-8 bg-muted rounded overflow-hidden">
                <img src={`data:image/png;base64,${startingFrame}`} alt="" className="w-full h-full object-cover" />
              </div>
              <Film className="w-3 h-3 text-muted-foreground" />
              <div className="text-[10px] text-muted-foreground">8s morph</div>
              <Film className="w-3 h-3 text-muted-foreground" />
              <div className="w-12 h-8 bg-muted rounded overflow-hidden">
                <img src={`data:image/png;base64,${lastFrame}`} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extend Video - Video Selection */}
      {videoMode === 'extend-video' && (
        <div className="space-y-2">
          <Label className="text-xs">Video to Extend</Label>

          {extensionVideo ? (
            <div className="space-y-2">
              <div className="relative aspect-video bg-muted rounded-lg border overflow-hidden group">
                <video
                  src={convertGcsUri(extensionVideo)}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                />
                <div className="absolute top-1 right-1">
                  <Button size="sm" variant="destructive" onClick={clearExtensionVideo}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Target Duration Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    Target Duration
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">{extensionTargetSeconds}s</span>
                </div>
                <Slider
                  value={[extensionTargetSeconds]}
                  onValueChange={([value]) => updateVideoParams({ extensionTargetSeconds: value })}
                  min={15}
                  max={148}
                  step={7}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>{extensionIterations} iteration{extensionIterations !== 1 ? 's' : ''}</span>
                  <span>Actual: ~{actualExtensionDuration}s</span>
                </div>
              </div>

              {/* Extension Warning */}
              <div className="flex items-start gap-1.5 p-2 border border-yellow-500/30 bg-yellow-500/10 rounded text-[10px] text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Output forced to 720p. Each iteration adds ~2-4 min processing time.</span>
              </div>
            </div>
          ) : (
            <AssetPicker
              mediaType="video"
              outputFormat="url"
              onSelect={(url) => {
                updateVideoParams({ extensionVideo: url });
              }}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-auto py-4 flex flex-col gap-1"
                >
                  <Film className="w-4 h-4" />
                  <span className="text-[10px]">Select Video to Extend</span>
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Reference Images (ingredients) - text-to-video only */}
      {videoMode === 'text-to-video' && !startingFrame && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ParamLabel tip="Visual ingredients for Veo. Upload up to 3 images to guide subject appearance, style, or composition. Requires Veo 3.1 Quality model.">Reference Images</ParamLabel>
            <Badge variant="secondary" className="text-[9px]">{referenceImages.length}/3</Badge>
          </div>

          {referenceImages.length > 0 && selectedVideoModel.includes('fast') && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Reference images require Veo 3.1 Quality. Switch model to generate.
            </div>
          )}

          {referenceImages.length > 0 && (
            <div className="grid grid-cols-3 gap-1">
              {referenceImages.map((ref, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded overflow-hidden border">
                    <img
                      src={`data:image/png;base64,${ref.image}`}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeReferenceImage(index)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <Select
                    value={ref.type}
                    onValueChange={(v) => updateReferenceType(index, v as ReferenceType)}
                  >
                    <SelectTrigger className="h-5 mt-0.5 text-[8px] border-0 bg-muted rounded-sm px-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset" className="text-[10px]">Asset</SelectItem>
                      <SelectItem value="style" className="text-[10px]">Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {referenceImages.length < 3 && (
            <AssetPicker
              mediaType="image"
              outputFormat="base64"
              disabled={referenceImages.length >= 3}
              onSelect={(base64) => {
                updateVideoParams({
                  referenceImages: [...referenceImages, { image: base64, type: 'asset' as ReferenceType }],
                });
              }}
            />
          )}
        </div>
      )}

      {/* Duration */}
      {videoMode !== 'extend-video' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <ParamLabel tip="Video length in seconds. 1080p and 4K require 8 seconds. Image-to-video and keyframe are fixed at 8s.">Duration</ParamLabel>
            <span className="text-xs text-muted-foreground">{videoParams.durationSeconds}s</span>
          </div>
          {durationLocked ? (
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded border text-[10px] text-muted-foreground">
              <Film className="w-3 h-3" />
              Fixed at 8s for {videoMode === 'keyframe-video' ? 'keyframe' : 'image-to-video'}
            </div>
          ) : (
            <Select
              value={videoParams.durationSeconds.toString()}
              onValueChange={(value) => updateVideoParams({ durationSeconds: parseInt(value) })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 seconds</SelectItem>
                <SelectItem value="6">6 seconds</SelectItem>
                <SelectItem value="8">8 seconds</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <ParamLabel tip="16:9 for landscape/widescreen, 9:16 for portrait/vertical (TikTok, Reels).">Aspect Ratio</ParamLabel>
        <Select
          value={videoParams.aspectRatio}
          onValueChange={(value: VideoAspectRatio) => updateVideoParams({ aspectRatio: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <ParamLabel tip="720p is fast. 1080p and 4K are higher quality but require 8s duration and take longer to generate.">Resolution</ParamLabel>
        <Select
          value={videoParams.resolution}
          onValueChange={(value: VideoResolution) => updateVideoParams({ resolution: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="720p">720p (HD)</SelectItem>
            <SelectItem value="1080p">1080p (Full HD)</SelectItem>
            {supports4k && (
              <SelectItem value="4k">4K (Ultra HD)</SelectItem>
            )}
          </SelectContent>
        </Select>
        {resolution === '4k' as VideoResolution && (
          <div className="flex items-start gap-1.5 text-[10px] text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>4K has a 10 req/min limit. Generation takes significantly longer.</span>
          </div>
        )}
      </div>

      {/* Number of Videos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <ParamLabel tip="Generate multiple variations of the same prompt. Each video is generated independently.">Videos to Generate</ParamLabel>
          <span className="text-xs text-muted-foreground">
            {videoParams.sampleCount}
            {directorMode && <span className="ml-1 opacity-60">(Director Mode: 1 max)</span>}
          </span>
        </div>
        <Slider
          value={[videoParams.sampleCount]}
          onValueChange={([value]) => updateVideoParams({ sampleCount: value })}
          min={1}
          max={directorMode ? 1 : 4}
          step={1}
          disabled={directorMode}
          className="w-full"
        />
      </div>

      {/* Audio Generation */}
      {supportsAudio && (
        <div className="space-y-2 p-2 border rounded bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {videoParams.generateAudio ? (
                <Volume2 className="w-3 h-3 text-primary" />
              ) : (
                <VolumeX className="w-3 h-3 text-muted-foreground" />
              )}
              <ParamLabel tip="Veo generates dialogue, sound effects, and ambient audio from your prompt. Use quotes for speech, [SFX:] for effects.">Generate Audio</ParamLabel>
            </div>
            <Switch
              checked={videoParams.generateAudio}
              onCheckedChange={(checked) => updateVideoParams({ generateAudio: checked })}
            />
          </div>

          {videoParams.generateAudio && (
            <p className="text-[10px] text-muted-foreground">
              48kHz stereo. Describe audio in your prompt or add dialogue in Director Mode.
            </p>
          )}
        </div>
      )}

      {/* Negative Prompt */}
      <div className="space-y-2">
        <ParamLabel tip="Describe what you DON'T want in the video. E.g. 'blurry, shaky camera, text overlay'">Negative Prompt</ParamLabel>
        <Textarea
          value={videoParams.negativePrompt}
          onChange={(e) => updateVideoParams({ negativePrompt: e.target.value })}
          placeholder="What to avoid..."
          rows={2}
          className="resize-none text-xs"
        />
      </div>

      {/* Generation Summary */}
      <div className="p-2 bg-muted/50 rounded border space-y-1">
        <p className="text-[10px] font-medium">Summary:</p>
        <ul className="text-[10px] text-muted-foreground space-y-0.5">
          <li>Mode: {videoMode.replace(/-/g, ' ')}{directorMode ? ' (Director)' : ''}</li>
          {startingFrame && <li>First frame: set</li>}
          {lastFrame && <li>Last frame: set</li>}
          {referenceImages.length > 0 && <li>References: {referenceImages.length} image(s)</li>}
          {videoMode === 'extend-video' ? (
            <li>Target: ~{actualExtensionDuration}s ({extensionIterations} iterations)</li>
          ) : (
            <li>Duration: {videoParams.durationSeconds}s</li>
          )}
          <li>Videos: {videoParams.sampleCount}</li>
          <li>Resolution: {videoParams.resolution}</li>
          {supportsAudio && videoParams.generateAudio && <li>Audio: 48kHz stereo</li>}
          <li>Est. time: {videoParams.sampleCount * 2}-{videoParams.sampleCount * 4} min</li>
        </ul>
      </div>
    </div>
  );
}
