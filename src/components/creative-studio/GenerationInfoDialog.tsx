// ABOUTME: Wide two-panel dialog showing generation details (outputs, prompt, model, parameters)
// ABOUTME: Left panel: image gallery with download/open/fullscreen. Right panel: metadata and settings.

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Copy, Check, Image, Video, Clapperboard,
  BookMarked, Camera, Download, ExternalLink, Maximize2,
  Sparkles, Brain, Type, List,
} from 'lucide-react';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { ImageLightbox } from './ImageLightbox';
import type { GenerationWithDetails, CameraPreset } from '@/types/creative-studio';

interface GenerationInfoDialogProps {
  generation: GenerationWithDetails | null;
  onClose: () => void;
}

function convertGcsUri(uri: string) {
  if (uri.startsWith('gs://')) {
    return uri.replace('gs://', 'https://storage.googleapis.com/');
  }
  return uri;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatGenerationType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatModelName(model: string) {
  const names: Record<string, string> = {
    'gemini-3.1-flash-image-preview': 'Gemini 3.1 Flash (Nano Banana 2)',
    'gemini-3-pro-image-preview': 'Gemini 3 Pro (Nano Banana Pro)',
    'gemini-2.5-flash-image': 'Gemini 2.5 Flash (Nano Banana)',
    'gemini-2.5-flash-preview-image-generation': 'Gemini 2.5 Flash (Nano Banana)',
    'imagen-4.0-generate-001': 'Imagen 4 Standard',
    'imagen-4.0-fast-generate-001': 'Imagen 4 Fast',
    'imagen-4.0-ultra-generate-001': 'Imagen 4 Ultra',
    'imagen-3.0-capability-001': 'Imagen 3 Editing',
    'veo-3.1-generate-preview': 'Veo 3.1',
    'veo-3.0-generate-preview': 'Veo 3.0',
  };
  return names[model] || model;
}

export function GenerationInfoDialog({ generation, onClose }: GenerationInfoDialogProps) {
  const [copied, setCopied] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [refLightboxOpen, setRefLightboxOpen] = useState(false);
  const [refLightboxIndex, setRefLightboxIndex] = useState(0);

  if (!generation) return null;

  const isVideo = generation.generation_type.includes('video');
  const outputUrls = (generation.output_urls || []).map(convertGcsUri);
  const params = generation.parameters || {};
  const numOutputs = Number(params.num_outputs || params.sample_count) || outputUrls.length;
  const directorMode = params.director_mode === true;
  const cameraPreset = params.camera_preset as CameraPreset | undefined;
  const hasCameraSettings = cameraPreset && Object.keys(cameraPreset).length > 0;
  const meta = (generation.metadata || {}) as Record<string, unknown>;
  const templateName = meta.template_name as string | undefined;
  const referenceImageUrls = (meta.reference_image_urls as string[] | undefined) || [];
  const referenceIntents = (params.reference_intents as string[] | undefined) || [];

  const handleCopyPrompt = async () => {
    if (!generation.prompt_text) return;
    await navigator.clipboard.writeText(generation.prompt_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generation-${index + 1}.${isVideo ? 'mp4' : 'png'}`;
    link.click();
  };

  const handleDownloadAll = () => {
    outputUrls.forEach((url, i) => handleDownload(url, i));
  };

  const handleOpenInTab = (url: string) => {
    window.open(url, '_blank');
  };

  const handleFullscreen = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const statusColor = {
    completed: 'bg-purple-500/10 text-purple-600 border-purple-200',
    processing: 'bg-amber-500/10 text-amber-600 border-amber-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
    pending: 'bg-gray-500/10 text-gray-500 border-gray-200',
  }[generation.status] || 'bg-gray-500/10 text-gray-500 border-gray-200';

  const totalCost = generation.estimated_cost_usd ? Number(generation.estimated_cost_usd) : null;
  const costPerUnit = totalCost && outputUrls.length > 1 ? totalCost / outputUrls.length : null;

  const headerChips: { label: string; icon: React.ReactNode; color: string }[] = [];
  if (directorMode) headerChips.push({ label: 'Director Mode', icon: <Sparkles className="h-3 w-3" />, color: 'bg-purple-500/10 text-purple-600 border-purple-200' });
  if (params.include_audio) headerChips.push({ label: 'Audio', icon: <Video className="h-3 w-3" />, color: 'bg-blue-500/10 text-blue-600 border-blue-200' });
  if (params.thinking_level) headerChips.push({ label: `Thinking: ${params.thinking_level}`, icon: <Brain className="h-3 w-3" />, color: 'bg-amber-500/10 text-amber-600 border-amber-200' });

  return (
    <Dialog open={!!generation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl border-border/60 shadow-xl">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <DialogTitle className="text-base font-medium shrink-0">Generation Details</DialogTitle>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(generation.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerChips.map((chip) => (
                <Badge key={chip.label} variant="outline" className={`${chip.color} text-[11px] font-medium px-2.5 py-0.5 rounded-full`}>
                  {chip.icon}
                  <span className="ml-1">{chip.label}</span>
                </Badge>
              ))}
              <Badge variant="outline" className={`${statusColor} text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize`}>
                {generation.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Two-panel body */}
        <div className="flex flex-col md:flex-row min-h-0" style={{ height: 'calc(85vh - 64px)' }}>
          {/* Left panel — Visuals */}
          <div className="md:w-[42%] p-4 border-r overflow-y-auto bg-muted/20 shrink-0 min-h-0">
            <div className="space-y-4">
              {outputUrls.length > 0 && (
                <div className={`grid gap-2 ${outputUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {outputUrls.map((url, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-black/5 group cursor-pointer ring-1 ring-black/[0.06]" onClick={() => handleFullscreen(i)}>
                      {isVideo ? (
                        <video
                          src={url}
                          className={`w-full object-cover ${outputUrls.length === 1 ? 'h-[340px]' : 'h-[170px]'}`}
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Output ${i + 1}`}
                          className={`w-full object-cover ${outputUrls.length === 1 ? 'h-[340px]' : 'h-[170px]'}`}
                        />
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleFullscreen(i); }}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                          title="Fullscreen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenInTab(url); }}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(url, i); }}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Sample number */}
                      {outputUrls.length > 1 && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white font-medium">
                          {i + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-2">
                {outputUrls.length > 1 && (
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={handleDownloadAll}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download All ({outputUrls.length})
                  </Button>
                )}
                {outputUrls.length === 1 && (
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleDownload(outputUrls[0], 0)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setSaveTemplateOpen(true)}>
                  <BookMarked className="h-3.5 w-3.5 mr-1.5" />
                  Save as Template
                </Button>
              </div>

              {/* Camera settings — compact 2-column grid */}
              {hasCameraSettings && (
                <div className="space-y-2">
                  <SectionLabel icon={isVideo ? <Clapperboard className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}>
                    {isVideo ? 'Camera & Production' : 'Camera & Photography'}
                  </SectionLabel>
                  <div className="rounded-lg border border-border/40 bg-card shadow-sm p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(cameraPreset!).filter(([, val]) => val != null).map(([key, val]) => (
                        <div key={key} className="min-w-0">
                          <div className="text-[10px] text-muted-foreground/70 mb-0.5">
                            {CAMERA_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </div>
                          <div className="text-xs font-medium text-foreground truncate">
                            {formatCameraValue(key, val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reference images */}
              {referenceImageUrls.length > 0 && (
                <div className="space-y-2.5">
                  <SectionLabel icon={<Image className="h-3.5 w-3.5" />}>Reference Images ({referenceImageUrls.length})</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {referenceImageUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative rounded-lg overflow-hidden bg-muted group cursor-pointer border border-border/40 shadow-sm"
                        onClick={() => { setRefLightboxIndex(i); setRefLightboxOpen(true); }}
                      >
                        <img
                          src={url}
                          alt={`Reference ${i + 1}`}
                          className="w-full h-16 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                          <span className="text-[10px] text-white/90 capitalize font-medium">
                            {referenceIntents[i] || 'subject'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {outputUrls.length === 0 && generation.status === 'failed' && (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">
                  No outputs generated
                </div>
              )}
            </div>
          </div>

          {/* Right panel — Prompt & Metadata */}
          <div className="md:w-[58%] overflow-y-auto min-h-0">
            <div className="p-5 space-y-5">
              {/* Prompt */}
              {generation.prompt_text && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SectionLabel icon={<Type className="h-3.5 w-3.5" />}>Prompt</SectionLabel>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={handleCopyPrompt}>
                      {copied ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
                    </Button>
                  </div>
                  <div className="relative">
                    <div
                      className="rounded-lg border border-border/40 bg-muted/30 shadow-sm p-4 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto"
                      style={{ height: '180px', minHeight: '100px', maxHeight: '50vh', resize: 'vertical' }}
                    >
                      {generation.prompt_text}
                    </div>
                    <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/40 tabular-nums">
                      {generation.prompt_text.length} chars
                    </span>
                  </div>
                </div>
              )}

              {/* Negative prompt */}
              {generation.negative_prompt && (
                <div className="space-y-2">
                  <SectionLabel>Negative Prompt</SectionLabel>
                  <div className="rounded-lg bg-red-50/50 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/20 shadow-sm p-3 text-xs font-mono leading-relaxed">
                    {generation.negative_prompt}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2">
                <SectionLabel icon={<List className="h-3.5 w-3.5" />}>Details</SectionLabel>
                <div className="rounded-lg border border-border/40 overflow-hidden bg-card shadow-sm">
                  <table className="w-full">
                    <tbody className="divide-y divide-border/20">
                      <MetaRow label="Model" value={formatModelName(generation.model_used)} emphasis />
                      <MetaRow label="Type" value={formatGenerationType(generation.generation_type)} emphasis />
                      {Array.isArray(meta.deliverable_names) && (meta.deliverable_names as string[]).length > 0 && (
                        <MetaRow label="Deliverables" value={(meta.deliverable_names as string[]).join(', ')} emphasis />
                      )}
                      <MetaRow label="Aspect Ratio" value={String(params.aspect_ratio || '—')} />
                      <MetaRow label="Outputs" value={`${outputUrls.length}/${numOutputs} generated`} />
                      {generation.generation_time_ms != null && (
                        <MetaRow label="Generation Time" value={`${(generation.generation_time_ms / 1000).toFixed(1)}s`} />
                      )}
                      {totalCost != null && (
                        <MetaRow
                          label="Cost"
                          value={costPerUnit ? `$${totalCost.toFixed(4)} total ($${costPerUnit.toFixed(4)} each)` : `$${totalCost.toFixed(4)}`}
                          emphasis
                        />
                      )}
                      {generation.brand && (
                        <MetaRow label="Brand" value={generation.brand.name} emphasis />
                      )}
                      {templateName && (
                        <MetaRow label="Template" value={templateName} emphasis />
                      )}
                      {params.safety_setting && (
                        <MetaRow label="Safety" value={String(params.safety_setting).replace(/_/g, ' ')} />
                      )}
                      {params.person_generation && (
                        <MetaRow label="Person Generation" value={String(params.person_generation).replace(/_/g, ' ')} />
                      )}
                      {params.seed != null && (
                        <MetaRow label="Seed" value={String(params.seed)} />
                      )}
                      {params.temperature != null && (
                        <MetaRow label="Temperature" value={String(params.temperature)} />
                      )}
                      {params.guidance_scale != null && (
                        <MetaRow label="Guidance Scale" value={String(params.guidance_scale)} />
                      )}
                      {params.resolution && (
                        <MetaRow label="Resolution" value={String(params.resolution)} />
                      )}
                      {params.duration != null && (
                        <MetaRow label="Duration" value={`${params.duration}s`} />
                      )}
                      {params.reference_image_count != null && Number(params.reference_image_count) > 0 && (
                        <MetaRow label="Reference Images" value={`${params.reference_image_count} used`} />
                      )}
                      {params.reference_intents && Array.isArray(params.reference_intents) && (
                        <MetaRow label="Reference Intents" value={(params.reference_intents as string[]).join(', ')} />
                      )}
                      {params.conversation_turns != null && (
                        <MetaRow label="Chat Turns" value={String(params.conversation_turns)} />
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error message */}
              {generation.error_message && (
                <div className="space-y-2">
                  <SectionLabel className="text-destructive">Error</SectionLabel>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 shadow-sm p-3 text-xs">
                    {generation.error_message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        brandId={generation.brand_id ?? null}
        brandName={generation.brand?.name}
        prompt={generation.prompt_text || ''}
        model={generation.model_used}
        cameraPreset={cameraPreset}
      />

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        urls={outputUrls}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        isVideo={isVideo}
      />

      {referenceImageUrls.length > 0 && (
        <ImageLightbox
          open={refLightboxOpen}
          onOpenChange={setRefLightboxOpen}
          urls={referenceImageUrls}
          currentIndex={refLightboxIndex}
          onIndexChange={setRefLightboxIndex}
        />
      )}
    </Dialog>
  );
}

function SectionLabel({ children, icon, className }: { children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 ${className || ''}`}>
      {icon}
      {children}
    </h3>
  );
}

function MetaRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <tr>
      <td className="py-2.5 px-4 w-[38%] text-xs text-muted-foreground">
        {label}
      </td>
      <td className={`py-2.5 px-4 text-[13px] ${emphasis ? 'font-medium text-foreground' : 'text-foreground/80'}`}>
        {value}
      </td>
    </tr>
  );
}

const CAMERA_LABELS: Record<string, string> = {
  camera_body: 'Camera Body',
  film_stock: 'Film Stock',
  aperture: 'Aperture',
  focal_length: 'Focal Length',
  shutter_speed: 'Shutter Speed',
  lighting_setup: 'Lighting',
  composition: 'Composition',
  depth_of_field: 'Depth of Field',
  shot_type: 'Shot Type',
  print_process: 'Print Process',
  color_grade: 'Color Grade',
  film_effect: 'Film Effect',
  color_temperature_preset: 'Color Temp',
  color_temperature: 'Color Temp (K)',
  frame_rate: 'Frame Rate',
};

function formatCameraValue(key: string, value: unknown): string {
  if (key === 'aperture' && typeof value === 'number') return `f/${value}`;
  if (key === 'focal_length' && typeof value === 'number') return `${value}mm`;
  if (key === 'color_temperature' && typeof value === 'number') return `${value}K`;
  if (key === 'camera_body' && typeof value === 'string') return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (typeof value === 'string') return value.replace(/\b\w/g, c => c.toUpperCase());
  return String(value);
}
