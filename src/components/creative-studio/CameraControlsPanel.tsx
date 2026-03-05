// ABOUTME: Camera controls for both still photography and video cinematography
// ABOUTME: Mode-aware: shows still cameras (DSLR, film) or video cameras (RED, ARRI, GoPro) based on generation type

import { useState, useMemo } from 'react';
import { Camera, Video, Copy, Check, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreativeStudioStore, type CameraPresetState } from '@/store/creative-studio-store';
import { useCameraOptions, type CameraOption } from '@/hooks/useCreativeStudioCameraOptions';

const APERTURE_STOPS = [1.4, 1.8, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16, 22];
const FOCAL_LENGTHS = [16, 24, 35, 40, 50, 75, 85, 100, 135, 150, 200];

const APERTURE_SLUGS: Record<number, string> = {
  1.4: 'f_1_4', 1.8: 'f_1_8', 2.0: 'f_2_0', 2.8: 'f_2_8',
  4.0: 'f_4_0', 5.6: 'f_5_6', 8.0: 'f_8_0', 11: 'f_11',
  16: 'f_16', 22: 'f_22',
};

const FOCAL_LENGTH_SLUGS: Record<number, string> = {
  16: '16mm', 24: '24mm', 35: '35mm', 40: '40mm', 50: '50mm',
  75: '75mm', 85: '85mm', 100: '100mm', 135: '135mm', 150: '150mm', 200: '200mm',
};

function lookupFragment(allOptions: CameraOption[], category: string, slug?: string): string | null {
  if (!slug) return null;
  const option = allOptions.find(o => o.category === category && o.slug === slug);
  return option?.prompt_fragment || null;
}

/** Build a prompt text segment from camera preset selections + DB options */
export function buildCameraPromptSegment(
  preset: {
    film_stock?: string; lighting_setup?: string; composition?: string; depth_of_field?: string;
    camera_body?: string; print_process?: string; color_grade?: string; film_effect?: string; shot_type?: string;
    aperture?: number; focal_length?: number; color_temperature?: number; color_temperature_preset?: string;
    frame_rate?: string;
  },
  allOptions: CameraOption[],
): string {
  // Group 1 — Camera identity: camera body
  const cameraGroup: string[] = [];
  const bodyFrag = lookupFragment(allOptions, 'camera_body', preset.camera_body);
  if (bodyFrag) cameraGroup.push(bodyFrag);
  const fpsFragment = lookupFragment(allOptions, 'frame_rate', preset.frame_rate);
  if (fpsFragment) cameraGroup.push(fpsFragment);

  // Group 2 — Film DNA: film stock
  const filmGroup: string[] = [];
  const filmFrag = lookupFragment(allOptions, 'film_stock', preset.film_stock);
  if (filmFrag) filmGroup.push(filmFrag);

  // Group 3 — Optical rendering: aperture, focal length, depth of field
  const opticalGroup: string[] = [];
  if (preset.aperture) {
    const slug = APERTURE_SLUGS[preset.aperture];
    const frag = lookupFragment(allOptions, 'aperture', slug);
    if (frag) opticalGroup.push(frag);
  }
  if (preset.focal_length) {
    const slug = FOCAL_LENGTH_SLUGS[preset.focal_length];
    const frag = lookupFragment(allOptions, 'focal_length', slug);
    if (frag) opticalGroup.push(frag);
  }
  const dofFrag = lookupFragment(allOptions, 'depth_of_field', preset.depth_of_field);
  if (dofFrag) opticalGroup.push(dofFrag);

  // Group 4 — Scene: lighting, composition, shot type
  const sceneGroup: string[] = [];
  const lightFrag = lookupFragment(allOptions, 'lighting', preset.lighting_setup);
  if (lightFrag) sceneGroup.push(lightFrag);
  const compFrag = lookupFragment(allOptions, 'composition', preset.composition);
  if (compFrag) sceneGroup.push(compFrag);
  const shotFrag = lookupFragment(allOptions, 'shot_type', preset.shot_type);
  if (shotFrag) sceneGroup.push(shotFrag);

  // Group 5 — Post-processing: print process, color grade, film effect, color temperature
  const postGroup: string[] = [];
  const printFrag = lookupFragment(allOptions, 'print_process', preset.print_process);
  if (printFrag) postGroup.push(printFrag);
  const gradeFrag = lookupFragment(allOptions, 'color_grade', preset.color_grade);
  if (gradeFrag) postGroup.push(gradeFrag);
  const effectFrag = lookupFragment(allOptions, 'film_effect', preset.film_effect);
  if (effectFrag) postGroup.push(effectFrag);
  const tempFrag = lookupFragment(allOptions, 'color_temperature', preset.color_temperature_preset);
  if (tempFrag) postGroup.push(tempFrag);

  // Period-separated groups, comma-separated within groups
  const groups = [cameraGroup, filmGroup, opticalGroup, sceneGroup, postGroup]
    .map(g => g.join(', '))
    .filter(Boolean);

  return groups.join('. ');
}

const NONE_VALUE = '__none__';

interface CameraControlsPanelProps {
  mediaType?: 'still' | 'video';
}

/** Reusable dropdown for a camera option category */
function CameraDropdown({
  label,
  value,
  options,
  onChange,
  showDescription,
}: {
  label: string;
  value: string | undefined;
  options: CameraOption[] | undefined;
  onChange: (slug: string | undefined) => void;
  showDescription?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={value || NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : v)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          {options?.map((opt) => (
            <SelectItem key={opt.slug} value={opt.slug}>
              {showDescription && opt.description ? (
                <div className="flex flex-col">
                  <span className="text-xs">{opt.display_name}</span>
                  <span className="text-[9px] text-muted-foreground">{opt.description}</span>
                </div>
              ) : (
                opt.display_name
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CameraControlsPanel({ mediaType = 'still' }: CameraControlsPanelProps) {
  const isVideo = mediaType === 'video';

  const {
    imageParams, videoParams,
    updateCameraPreset, updateVideoCameraPreset,
    updateImageParams, updateVideoParams,
  } = useCreativeStudioStore();

  const preset: CameraPresetState = isVideo
    ? (videoParams.cameraPreset || {})
    : (imageParams.cameraPreset || {});

  const enabled = isVideo
    ? videoParams.cameraControlsEnabled
    : imageParams.cameraControlsEnabled;

  const setEnabled = (on: boolean) => {
    if (isVideo) {
      updateVideoParams({ cameraControlsEnabled: on });
    } else {
      updateImageParams({ cameraControlsEnabled: on });
    }
  };

  const updatePreset = isVideo ? updateVideoCameraPreset : updateCameraPreset;

  // Fetch options filtered by media type
  const { data: filmStocks } = useCameraOptions('film_stock', mediaType);
  const { data: cameraBodies } = useCameraOptions('camera_body', mediaType);
  const { data: lightingSetups } = useCameraOptions('lighting', mediaType);
  const { data: compositions } = useCameraOptions('composition', mediaType);
  const { data: depthOfFields } = useCameraOptions('depth_of_field', mediaType);
  const { data: printProcesses } = useCameraOptions('print_process', mediaType);
  const { data: colorGrades } = useCameraOptions('color_grade', mediaType);
  const { data: filmEffects } = useCameraOptions('film_effect', mediaType);
  const { data: shotTypes } = useCameraOptions('shot_type', mediaType);
  const { data: colorTemps } = useCameraOptions('color_temperature', mediaType);
  const { data: frameRates } = useCameraOptions('frame_rate', mediaType);
  const { data: allOptions } = useCameraOptions(undefined, mediaType);

  const [copied, setCopied] = useState(false);

  const update = (field: string, val: unknown) => {
    updatePreset({ [field]: val || undefined });
  };

  const handleReset = () => {
    updatePreset(undefined);
  };

  const handleCopy = async () => {
    if (!promptSegment) return;
    await navigator.clipboard.writeText(promptSegment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promptSegment = useMemo(() => {
    return buildCameraPromptSegment(preset, allOptions || []);
  }, [preset, allOptions]);

  const hasAnySettings = Object.values(preset).some(v => v !== undefined);

  const nearestApertureIndex = preset.aperture
    ? APERTURE_STOPS.reduce((best, stop, i) =>
        Math.abs(stop - preset.aperture!) < Math.abs(APERTURE_STOPS[best] - preset.aperture!) ? i : best, 0)
    : -1;

  const nearestFocalIndex = preset.focal_length
    ? FOCAL_LENGTHS.reduce((best, fl, i) =>
        Math.abs(fl - preset.focal_length!) < Math.abs(FOCAL_LENGTHS[best] - preset.focal_length!) ? i : best, 0)
    : -1;

  const ModeIcon = isVideo ? Video : Camera;

  return (
    <div className="space-y-3">
      {/* Header with on/off toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModeIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {isVideo ? 'Video Camera' : 'Camera Controls'}
          </h3>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            className="scale-75"
          />
        </div>
        {enabled && hasAnySettings && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={handleReset}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {!enabled && (
        <p className="text-[10px] text-muted-foreground">
          {isVideo
            ? 'Enable to apply video camera body and cinematic look to generation.'
            : 'Enable to apply camera body, film stock, and photographic settings.'}
        </p>
      )}

      {enabled && (
        <>
          {/* Camera Body — both modes */}
          <CameraDropdown
            label={isVideo ? 'Video Camera' : 'Camera Body'}
            value={preset.camera_body}
            options={cameraBodies}
            onChange={(v) => update('camera_body', v)}
            showDescription
          />

          {/* Frame Rate — video only */}
          {isVideo && frameRates && frameRates.length > 0 && (
            <CameraDropdown
              label="Frame Rate"
              value={preset.frame_rate}
              options={frameRates}
              onChange={(v) => update('frame_rate', v)}
              showDescription
            />
          )}

          {/* Film Stock — still only */}
          {!isVideo && (
            <CameraDropdown
              label="Film Stock"
              value={preset.film_stock}
              options={filmStocks}
              onChange={(v) => update('film_stock', v)}
              showDescription
            />
          )}

          {/* Lighting — still only (video uses Director Mode) */}
          {!isVideo && (
            <CameraDropdown
              label="Lighting"
              value={preset.lighting_setup}
              options={lightingSetups}
              onChange={(v) => update('lighting_setup', v)}
            />
          )}

          {/* Composition — still only */}
          {!isVideo && (
            <CameraDropdown
              label="Composition"
              value={preset.composition}
              options={compositions}
              onChange={(v) => update('composition', v)}
            />
          )}

          {/* Depth of Field — both modes */}
          <CameraDropdown
            label="Depth of Field"
            value={preset.depth_of_field}
            options={depthOfFields}
            onChange={(v) => update('depth_of_field', v)}
          />

          {/* Shot Type — still only (video uses Director Mode scene description) */}
          {!isVideo && (
            <CameraDropdown
              label="Shot Type"
              value={preset.shot_type}
              options={shotTypes}
              onChange={(v) => update('shot_type', v)}
            />
          )}

          {/* Print Process — still only */}
          {!isVideo && (
            <CameraDropdown
              label="Print Process"
              value={preset.print_process}
              options={printProcesses}
              onChange={(v) => update('print_process', v)}
              showDescription
            />
          )}

          {/* Color Grade — both modes */}
          <CameraDropdown
            label="Color Grade"
            value={preset.color_grade}
            options={colorGrades}
            onChange={(v) => update('color_grade', v)}
          />

          {/* Film Effect — both modes */}
          <CameraDropdown
            label="Film Effect"
            value={preset.film_effect}
            options={filmEffects}
            onChange={(v) => update('film_effect', v)}
          />

          {/* Aperture — still only */}
          {!isVideo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Aperture</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {nearestApertureIndex >= 0 ? `f/${APERTURE_STOPS[nearestApertureIndex]}` : '—'}
                </span>
              </div>
              <Slider
                value={[nearestApertureIndex >= 0 ? nearestApertureIndex : 3]}
                onValueChange={([i]) => update('aperture', APERTURE_STOPS[i])}
                min={0}
                max={APERTURE_STOPS.length - 1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[8px] text-muted-foreground">
                <span>Bokeh</span>
                <span>Sharp</span>
              </div>
            </div>
          )}

          {/* Focal Length — still only */}
          {!isVideo && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Focal Length</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {nearestFocalIndex >= 0 ? `${FOCAL_LENGTHS[nearestFocalIndex]}mm` : '—'}
                </span>
              </div>
              <Slider
                value={[nearestFocalIndex >= 0 ? nearestFocalIndex : 3]}
                onValueChange={([i]) => update('focal_length', FOCAL_LENGTHS[i])}
                min={0}
                max={FOCAL_LENGTHS.length - 1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[8px] text-muted-foreground">
                <span>Wide</span>
                <span>Telephoto</span>
              </div>
            </div>
          )}

          {/* Color Temperature — still only */}
          {!isVideo && (
            <CameraDropdown
              label="Color Temperature"
              value={preset.color_temperature_preset}
              options={colorTemps}
              onChange={(v) => update('color_temperature_preset', v)}
              showDescription
            />
          )}

          {/* Prompt Preview */}
          {promptSegment && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1.5 right-1.5 h-6 w-6 p-0"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </Button>
              <div className="p-2 pr-8 bg-muted/50 rounded-lg text-[11px] text-muted-foreground font-mono leading-relaxed min-h-[3rem] max-h-48 overflow-y-auto resize-y">
                {promptSegment}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
