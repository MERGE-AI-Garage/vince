// ABOUTME: Educational admin panel for camera & photography presets
// ABOUTME: Organizes options into 4 photography pillars with hardcoded educational content, manufacturer badges, and film swatches

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Film,
  Sun,
  Palette,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Info,
  CircleDot,
  Focus,
  Layers,
  LayoutGrid,
  Crop,
  Sparkles,
  Stamp,
  Thermometer,
  Clapperboard,
  BookOpen,
  Eye,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeroHeader from '@/components/headers/AdminHeroHeader';
import {
  useAllCameraOptions,
  useCreateCameraOption,
  useUpdateCameraOption,
  useToggleCameraOption,
  useDeleteCameraOption,
  type CameraOption,
  type CameraOptionCategory,
  type CameraMediaType,
  type CreateCameraOptionInput,
  type UpdateCameraOptionInput,
} from '@/hooks/useCreativeStudioCameraOptions';
import type { LucideIcon } from 'lucide-react';

// ── Photography Pillars ───────────────────────────────────────────────────────

interface Pillar {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  accentClasses: { bg: string; border: string; text: string; icon: string };
  categories: CameraOptionCategory[];
}

const PILLARS: Pillar[] = [
  {
    id: 'identity',
    title: 'Camera & Film Identity',
    description: 'The camera body and film stock establish the foundational look — sensor color science, grain structure, and dynamic range that persist throughout the image.',
    icon: Film,
    color: 'amber',
    accentClasses: {
      bg: 'bg-amber-500/8',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      icon: 'bg-amber-500/15',
    },
    categories: ['camera_body', 'film_stock', 'frame_rate'],
  },
  {
    id: 'optics',
    title: 'Optics & Focus',
    description: 'Focal length determines perspective compression and field of view. Aperture controls depth of field — what\'s sharp versus what dissolves into bokeh.',
    icon: Focus,
    color: 'sky',
    accentClasses: {
      bg: 'bg-sky-500/8',
      border: 'border-sky-500/20',
      text: 'text-sky-400',
      icon: 'bg-sky-500/15',
    },
    categories: ['aperture', 'focal_length', 'depth_of_field'],
  },
  {
    id: 'scene',
    title: 'Scene Direction',
    description: 'How the scene is lit, composed, and framed. These are the director of photography\'s decisions made before the shutter opens.',
    icon: Sun,
    color: 'emerald',
    accentClasses: {
      bg: 'bg-emerald-500/8',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      icon: 'bg-emerald-500/15',
    },
    categories: ['lighting', 'composition', 'shot_type'],
  },
  {
    id: 'post',
    title: 'Post Production',
    description: 'Color grading, film effects, print processes, and color temperature set the emotional tone of the finished image.',
    icon: Palette,
    color: 'purple',
    accentClasses: {
      bg: 'bg-purple-500/8',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      icon: 'bg-purple-500/15',
    },
    categories: ['color_grade', 'film_effect', 'print_process', 'color_temperature'],
  },
];

// ── Category Educational Metadata ─────────────────────────────────────────────

interface CategoryMeta {
  icon: LucideIcon;
  label: string;
  education: string;
  promptNote: string;
}

const CATEGORY_META: Record<CameraOptionCategory, CategoryMeta> = {
  camera_body: {
    icon: Camera,
    label: 'Camera Body',
    education: 'The camera body determines sensor format, dynamic range, and inherent color science. A RED Komodo renders fundamentally differently than a Leica M11 — the model knows these differences and applies them.',
    promptNote: 'Appended as: "shot on RED Komodo 8K" or "captured on Leica M11"',
  },
  film_stock: {
    icon: Film,
    label: 'Film Stock',
    education: 'Film stock emulation is one of the most powerful aesthetic controls in AI image generation. Each stock has a characteristic color palette, grain pattern, contrast curve, and highlight response that the model faithfully reproduces.',
    promptNote: 'Appended as: "Kodak Portra 400, warm skin tones, fine grain" or "Fuji Velvia 50, saturated greens"',
  },
  aperture: {
    icon: CircleDot,
    label: 'Aperture',
    education: 'Aperture (f-stop) controls depth of field. f/1.4 produces extreme background blur (bokeh) ideal for portraits. f/8–f/16 renders everything sharp from foreground to background, essential for architecture and landscape.',
    promptNote: 'Appended as: "f/1.4 aperture, shallow depth of field" or "f/11, everything in focus"',
  },
  focal_length: {
    icon: Focus,
    label: 'Focal Length',
    education: 'Focal length determines perspective. Wide angles (16–24mm) exaggerate spatial depth. A 50mm matches human vision. Telephoto (85–200mm) compresses depth and is naturally flattering for portraits and editorial work.',
    promptNote: 'Appended as: "85mm lens, natural perspective compression" or "24mm wide angle, expanded space"',
  },
  depth_of_field: {
    icon: Layers,
    label: 'Depth of Field',
    education: 'Depth of field describes how much of the scene stays in sharp focus. Shallow DoF isolates subjects against a blurred environment. Deep DoF is the standard in documentary, architectural, and street photography.',
    promptNote: 'Appended as: "shallow depth of field, background bokeh" or "deep focus, sharp throughout"',
  },
  lighting: {
    icon: Sun,
    label: 'Lighting',
    education: 'Lighting direction, quality, and color temperature are fundamental to photographic mood. Soft diffused window light reads as natural and intimate. Hard directional strobe reads as editorial and high-fashion.',
    promptNote: 'Appended as: "soft window light, directional" or "hard strobe, high-key editorial"',
  },
  composition: {
    icon: LayoutGrid,
    label: 'Composition',
    education: 'Compositional rules guide where subjects are placed in the frame. Rule of thirds creates dynamic tension. Centered symmetry conveys authority. Leading lines draw the eye toward the subject.',
    promptNote: 'Appended as: "rule of thirds composition" or "centered symmetrical framing, formal"',
  },
  shot_type: {
    icon: Crop,
    label: 'Shot Type',
    education: 'Shot type defines the camera-to-subject distance. A close-up creates intimacy and emotional connection. A wide establishing shot provides context and scale. Medium shots are the workhorse of editorial and commercial photography.',
    promptNote: 'Appended as: "extreme close-up, tight crop on face" or "wide establishing shot, environmental context"',
  },
  color_grade: {
    icon: Palette,
    label: 'Color Grade',
    education: 'Color grading is the final mood-setting step in post production. The teal-and-orange look is the cinematic blockbuster standard. Bleach bypass desaturates and boosts contrast for gritty documentary aesthetics.',
    promptNote: 'Appended as: "cinematic teal and orange color grade" or "bleach bypass, desaturated contrast"',
  },
  film_effect: {
    icon: Sparkles,
    label: 'Film Effect',
    education: 'Film effects layer analogue artifacts — halation, grain, vignetting, light leaks — that signal authenticity and evoke a specific photographic era. These details are highly legible to generative models.',
    promptNote: 'Appended as: "35mm film halation, visible grain, slight vignette" or "expired film, light leak artifacts"',
  },
  print_process: {
    icon: Stamp,
    label: 'Print Process',
    education: 'Historical print processes like cyanotype, daguerreotype, and platinum-palladium have distinct tonal ranges and physical textures that the model recognizes and renders with remarkable accuracy.',
    promptNote: 'Appended as: "cyanotype print process, prussian blue tones" or "daguerreotype, silver-mirror surface"',
  },
  color_temperature: {
    icon: Thermometer,
    label: 'Color Temperature',
    education: 'Color temperature (measured in Kelvin) describes how warm or cool the light source is. Tungsten at 3200K produces warm orange-amber. Daylight at 5500K is neutral. Open shade at 8000K shifts the image toward cool blue.',
    promptNote: 'Appended as: "3200K tungsten lighting, warm amber cast" or "8000K open shade, cool blue-violet"',
  },
  frame_rate: {
    icon: Clapperboard,
    label: 'Frame Rate',
    education: 'Frame rate shapes how motion is perceived in video content. 24fps is the cinematic standard — filmic, slightly imperfect, emotional. 60fps is hyper-real and clinical, used in sports broadcast and news.',
    promptNote: 'Video only. Appended as: "24fps cinematic motion" or "60fps high frame rate"',
  },
};

// ── Manufacturer Brand Styles ─────────────────────────────────────────────────

interface ManufacturerStyle {
  bg: string;
  text: string;
  border: string;
}

const MANUFACTURER_STYLES: Record<string, ManufacturerStyle> = {
  'arri':       { bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-500/30' },
  'red':        { bg: 'bg-red-500/10',     text: 'text-red-300',     border: 'border-red-500/30' },
  'sony':       { bg: 'bg-slate-500/10',   text: 'text-slate-300',   border: 'border-slate-500/30' },
  'leica':      { bg: 'bg-red-600/10',     text: 'text-red-300',     border: 'border-red-600/30' },
  'canon':      { bg: 'bg-red-700/10',     text: 'text-red-400',     border: 'border-red-700/30' },
  'nikon':      { bg: 'bg-yellow-500/10',  text: 'text-yellow-300',  border: 'border-yellow-500/30' },
  'hasselblad': { bg: 'bg-orange-500/10',  text: 'text-orange-300',  border: 'border-orange-500/30' },
  'phase one':  { bg: 'bg-indigo-500/10',  text: 'text-indigo-300',  border: 'border-indigo-500/30' },
  'fuji':       { bg: 'bg-teal-500/10',    text: 'text-teal-300',    border: 'border-teal-500/30' },
  'fujifilm':   { bg: 'bg-teal-500/10',    text: 'text-teal-300',    border: 'border-teal-500/30' },
  'kodak':      { bg: 'bg-yellow-600/10',  text: 'text-yellow-300',  border: 'border-yellow-600/30' },
  'ilford':     { bg: 'bg-zinc-500/10',    text: 'text-zinc-300',    border: 'border-zinc-500/30' },
  'lomography': { bg: 'bg-pink-500/10',    text: 'text-pink-300',    border: 'border-pink-500/30' },
  'mamiya':     { bg: 'bg-purple-500/10',  text: 'text-purple-300',  border: 'border-purple-500/30' },
  'contax':     { bg: 'bg-gray-500/10',    text: 'text-gray-300',    border: 'border-gray-500/30' },
  'pentax':     { bg: 'bg-blue-700/10',    text: 'text-blue-300',    border: 'border-blue-700/30' },
  'olympus':    { bg: 'bg-cyan-600/10',    text: 'text-cyan-300',    border: 'border-cyan-600/30' },
  'blackmagic': { bg: 'bg-gray-700/10',    text: 'text-gray-300',    border: 'border-gray-700/30' },
};

function getManufacturerStyle(displayName: string): ManufacturerStyle | null {
  const lower = displayName.toLowerCase();
  for (const [key, style] of Object.entries(MANUFACTURER_STYLES)) {
    if (lower.includes(key)) return style;
  }
  return null;
}

function getManufacturerName(displayName: string): string | null {
  const lower = displayName.toLowerCase();
  for (const key of Object.keys(MANUFACTURER_STYLES)) {
    if (lower.includes(key)) {
      return key.charAt(0).toUpperCase() + key.slice(1);
    }
  }
  return null;
}

// ── Film Stock Color Swatches ─────────────────────────────────────────────────
// 4 characteristic stops: highlights → midtones → shadows → deep shadows

const FILM_SWATCHES: Record<string, [string, string, string, string]> = {
  kodak_portra_400:  ['#e8d5b8', '#c4956a', '#7a4f2e', '#2a1a10'],
  kodak_portra_800:  ['#e2cca0', '#be8c5a', '#7a4428', '#1e1008'],
  kodak_ektar_100:   ['#f0d4a0', '#e0801a', '#9b3a10', '#1a0a06'],
  kodak_gold_200:    ['#f2e0a0', '#d4a040', '#8a5020', '#1e1208'],
  kodak_tri_x:       ['#d8d8d8', '#8c8c8c', '#3a3a3a', '#080808'],
  kodak_tmax_400:    ['#e0e0e0', '#949494', '#404040', '#0a0a0a'],
  fuji_velvia_50:    ['#a8d8b0', '#2a9c5c', '#0e5c30', '#041a0e'],
  fuji_velvia_100:   ['#b0d4c0', '#38a068', '#0a5e38', '#041810'],
  fuji_provia_100f:  ['#c8d8e8', '#7aaac8', '#3a6080', '#0a1e2a'],
  fuji_superia_400:  ['#d0e0d0', '#88b888', '#3a6840', '#0e1e10'],
  ilford_hp5:        ['#d0d0d0', '#909090', '#484848', '#0a0a0a'],
  ilford_delta_3200: ['#c8c8c8', '#7a7a7a', '#383838', '#060606'],
  ilford_fp4:        ['#dcdcdc', '#a0a0a0', '#505050', '#0c0c0c'],
  cinestill_800t:    ['#e8c8d0', '#c07888', '#8a3050', '#200810'],
  cinestill_50d:     ['#d4e4f0', '#7aa8d0', '#3a6898', '#081830'],
  lomochrome_purple: ['#d0a8e0', '#9050b8', '#500878', '#180420'],
};

function getFilmSwatch(slug: string): [string, string, string, string] | null {
  return FILM_SWATCHES[slug] || null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEDIA_TYPES: { value: CameraMediaType; label: string }[] = [
  { value: 'still', label: 'Still' },
  { value: 'video', label: 'Video' },
  { value: 'both', label: 'Both' },
];

const CATEGORIES_LIST: { value: CameraOptionCategory; label: string }[] = [
  { value: 'film_stock', label: 'Film Stock' },
  { value: 'camera_body', label: 'Camera Body' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'composition', label: 'Composition' },
  { value: 'depth_of_field', label: 'Depth of Field' },
  { value: 'print_process', label: 'Print Process' },
  { value: 'color_grade', label: 'Color Grade' },
  { value: 'film_effect', label: 'Film Effect' },
  { value: 'shot_type', label: 'Shot Type' },
  { value: 'aperture', label: 'Aperture' },
  { value: 'focal_length', label: 'Focal Length' },
  { value: 'color_temperature', label: 'Color Temp' },
  { value: 'frame_rate', label: 'Frame Rate' },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CameraIntelligenceAdmin() {
  const { data: options, isLoading } = useAllCameraOptions();
  const createMutation = useCreateCameraOption();
  const updateMutation = useUpdateCameraOption();
  const toggleMutation = useToggleCameraOption();
  const deleteMutation = useDeleteCameraOption();

  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set(['identity']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [createDialogCategory, setCreateDialogCategory] = useState<CameraOptionCategory | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [educationDismissed, setEducationDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('vince_camera_education_dismissed');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const togglePillar = (id: string) => {
    setExpandedPillars(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dismissEducation = (category: string) => {
    setEducationDismissed(prev => {
      const next = new Set(prev);
      next.add(category);
      try { localStorage.setItem('vince_camera_education_dismissed', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, is_active: !currentActive });
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
      setExpandedOptionId(null);
      toast.success('Option deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleInlineUpdate = async (id: string, updates: UpdateCameraOptionInput) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      toast.success('Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleSaveNew = async (data: CreateCameraOptionInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Option created');
      setCreateDialogCategory(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    }
  };

  const optionsByCategory = (options || []).reduce<Record<string, CameraOption[]>>((acc, o) => {
    if (!acc[o.category]) acc[o.category] = [];
    acc[o.category].push(o);
    return acc;
  }, {});

  const totalActive = (options || []).filter(o => o.is_active).length;
  const totalCount = (options || []).length;
  const categoryCount = Object.keys(optionsByCategory).length;

  return (
    <div className="space-y-0">
      <AdminHeroHeader
        icon={Camera}
        title="Camera Intelligence"
        description="Define the photographic vocabulary that shapes every AI-generated image in Creative Studio"
        eyebrow="Photography Controls"
        stats={[
          { icon: Film, color: 'amber', value: totalCount, label: 'Total options' },
          { icon: Eye, color: 'teal', value: totalActive, label: 'Active', detail: `${totalCount - totalActive} hidden` },
          { icon: LayoutGrid, color: 'blue', value: categoryCount, label: 'Categories' },
        ]}
        actions={
          <Button
            size="sm"
            onClick={() => setCreateDialogCategory(null)}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Option
          </Button>
        }
      />

      {/* Photography concept banner */}
      <div className="px-6 pt-5 pb-1">
        <div className="flex gap-3 rounded-xl border border-[#00856C]/20 bg-[#00856C]/5 px-5 py-4">
          <BookOpen className="h-4 w-4 text-[#1ED75F]/70 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">Photography vocabulary drives image quality</p>
            <p className="text-xs text-white/45 leading-relaxed">
              Google Imagen and Gemini are trained on real photography terminology. Using f-stops, focal lengths,
              film stocks, and lighting setups in prompts produces dramatically more precise results than describing
              the effect you want. These settings translate directly into the prompt fragments sent to the model.
            </p>
          </div>
        </div>
      </div>

      {/* Pillar sections */}
      <div className="px-6 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : (
          PILLARS.map(pillar => {
            const PillarIcon = pillar.icon;
            const isExpanded = expandedPillars.has(pillar.id);
            const pillarTotal = pillar.categories.reduce((sum, cat) => sum + (optionsByCategory[cat]?.length || 0), 0);
            const pillarActive = pillar.categories.reduce((sum, cat) =>
              sum + (optionsByCategory[cat]?.filter(o => o.is_active).length || 0), 0);

            return (
              <div
                key={pillar.id}
                className={`rounded-xl border transition-colors ${pillar.accentClasses.border} ${isExpanded ? pillar.accentClasses.bg : 'bg-white/[0.02] border-white/[0.07]'}`}
              >
                {/* Pillar header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => togglePillar(pillar.id)}
                >
                  <div className={`w-10 h-10 rounded-xl ${isExpanded ? pillar.accentClasses.icon : 'bg-white/[0.06]'} flex items-center justify-center shrink-0 transition-colors`}>
                    <PillarIcon className={`h-5 w-5 ${isExpanded ? pillar.accentClasses.text : 'text-white/40'} transition-colors`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-fraunces text-base font-semibold text-white/90">{pillar.title}</h3>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 border-current ${pillar.accentClasses.text} font-mono`}>
                          {pillarActive}/{pillarTotal}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 font-epilogue leading-relaxed line-clamp-1">
                      {pillar.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-white/25 font-epilogue">
                      {pillar.categories.length} categories
                    </span>
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-white/30" />
                      : <ChevronRight className="h-4 w-4 text-white/30" />
                    }
                  </div>
                </button>

                {/* Expanded pillar content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06]">
                    <p className="text-xs text-white/40 font-epilogue leading-relaxed pt-3 px-1">
                      {pillar.description}
                    </p>
                    {pillar.categories.map(cat => {
                      const meta = CATEGORY_META[cat];
                      const CategoryIcon = meta.icon;
                      const catOptions = optionsByCategory[cat] || [];
                      const catKey = `${pillar.id}-${cat}`;
                      const isCatExpanded = expandedCategories.has(catKey);
                      const activeCount = catOptions.filter(o => o.is_active).length;
                      const isEduDismissed = educationDismissed.has(cat);

                      return (
                        <div key={cat} className="rounded-lg border border-white/[0.07] bg-[#0D1B16]/60">
                          {/* Category header */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <button
                              className="flex items-center gap-3 flex-1 text-left"
                              onClick={() => toggleCategory(catKey)}
                            >
                              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                                <CategoryIcon className="h-3.5 w-3.5 text-white/50" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white/80">{meta.label}</span>
                                  <span className="text-[10px] text-white/30 font-mono">
                                    {activeCount}/{catOptions.length}
                                  </span>
                                  {catOptions.length === 0 && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-white/25 border-white/10">
                                      empty
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {isCatExpanded
                                ? <ChevronDown className="h-3.5 w-3.5 text-white/25 shrink-0" />
                                : <ChevronRight className="h-3.5 w-3.5 text-white/25 shrink-0" />
                              }
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-white/30 hover:text-white/70 shrink-0"
                              onClick={() => setCreateDialogCategory(cat)}
                              title={`Add ${meta.label} option`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Category content */}
                          {isCatExpanded && (
                            <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-3">
                              {/* Education callout */}
                              {!isEduDismissed && (
                                <div className="flex gap-2.5 rounded-lg border border-blue-500/15 bg-blue-500/5 px-3.5 py-2.5">
                                  <Info className="h-3.5 w-3.5 text-blue-400/70 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-[11px] text-white/55 leading-relaxed">{meta.education}</p>
                                    <p className="text-[10px] text-white/30 font-mono">{meta.promptNote}</p>
                                  </div>
                                  <button
                                    onClick={() => dismissEducation(cat)}
                                    className="text-white/20 hover:text-white/50 transition-colors shrink-0"
                                    title="Dismiss"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}

                              {/* Option tiles */}
                              {catOptions.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-6 text-center">
                                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                                    <CategoryIcon className="h-5 w-5 text-white/20" />
                                  </div>
                                  <p className="text-xs text-white/30">No {meta.label.toLowerCase()} options configured</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] gap-1 border-white/10 text-white/50 hover:text-white/80"
                                    onClick={() => setCreateDialogCategory(cat)}
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add first option
                                  </Button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {catOptions.map(opt => (
                                    <OptionTile
                                      key={opt.id}
                                      option={opt}
                                      category={cat}
                                      expanded={expandedOptionId === opt.id}
                                      onToggleExpand={() => setExpandedOptionId(expandedOptionId === opt.id ? null : opt.id)}
                                      onToggleActive={() => handleToggle(opt.id, opt.is_active)}
                                      onUpdate={(updates) => handleInlineUpdate(opt.id, updates)}
                                      onDelete={() => setDeleteConfirm(opt.id)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create dialog */}
      <CreateOptionDialog
        open={createDialogCategory !== undefined && createDialogCategory !== null || createDialogCategory === null && false}
        openUntyped={createDialogCategory !== undefined}
        defaultCategory={createDialogCategory}
        onClose={() => setCreateDialogCategory(undefined as any)}
        onSave={handleSaveNew}
        saving={createMutation.isPending}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Camera Option</DialogTitle>
            <DialogDescription>
              This option will be permanently removed. Existing templates using this option will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Option Tile ───────────────────────────────────────────────────────────────

interface OptionTileProps {
  option: CameraOption;
  category: CameraOptionCategory;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  onUpdate: (updates: UpdateCameraOptionInput) => void;
  onDelete: () => void;
}

function OptionTile({ option, category, expanded, onToggleExpand, onToggleActive, onUpdate, onDelete }: OptionTileProps) {
  const mfgStyle = getManufacturerStyle(option.display_name);
  const mfgName = getManufacturerName(option.display_name);
  const swatch = category === 'film_stock' ? getFilmSwatch(option.slug) : null;

  const handleCopyFragment = () => {
    navigator.clipboard.writeText(option.prompt_fragment);
    toast.success('Prompt fragment copied');
  };

  return (
    <div className={`rounded-lg border transition-all ${
      option.is_active
        ? 'border-white/[0.09] bg-white/[0.03]'
        : 'border-white/[0.04] bg-transparent opacity-40'
    } ${expanded ? 'border-white/[0.14]' : ''}`}>
      {/* Tile header */}
      <div className="flex items-start gap-2.5 p-3">
        {/* Film swatch or category icon */}
        <div className="shrink-0 mt-0.5">
          {swatch ? (
            <div className="flex rounded overflow-hidden w-6 h-6" title="Film color signature">
              {swatch.map((color, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: color }} />
              ))}
            </div>
          ) : (
            <div className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center">
              {(() => {
                const Icon = CATEGORY_META[category].icon;
                return <Icon className="h-3 w-3 text-white/30" />;
              })()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/80 leading-tight">{option.display_name}</p>
          {mfgName && mfgStyle && (
            <div className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${mfgStyle.bg} ${mfgStyle.text} ${mfgStyle.border}`}>
              {mfgName}
            </div>
          )}
          {!mfgName && option.description && (
            <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1 font-epilogue">{option.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Switch
            checked={option.is_active}
            onCheckedChange={onToggleActive}
            className="scale-[0.65] origin-right"
          />
          <button
            onClick={onToggleExpand}
            className="text-white/25 hover:text-white/60 transition-colors p-0.5"
          >
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
            }
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/[0.06] space-y-3">
          {/* Description */}
          <div className="space-y-1 pt-2">
            <label className="text-[9px] font-medium text-white/30 uppercase tracking-wider">Description</label>
            <InlineEdit
              value={option.description || ''}
              onSave={(val) => onUpdate({ description: val || null })}
              className="text-[11px] text-white/50"
              placeholder="Add a description…"
            />
          </div>

          {/* Prompt fragment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-medium text-white/30 uppercase tracking-wider">Prompt Fragment</label>
              <button
                onClick={handleCopyFragment}
                className="text-white/25 hover:text-white/60 transition-colors"
                title="Copy prompt fragment"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <InlineEdit
              value={option.prompt_fragment}
              onSave={(val) => onUpdate({ prompt_fragment: val })}
              multiline
              className="text-[10px] font-mono text-white/40"
            />
          </div>

          {/* Media type + sort + delete */}
          <div className="flex items-center gap-2 pt-1">
            <Select
              value={option.media_type}
              onValueChange={(val: CameraMediaType) => onUpdate({ media_type: val })}
            >
              <SelectTrigger className="h-6 text-[10px] w-20 bg-white/[0.04] border-white/[0.08]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_TYPES.map(mt => (
                  <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[9px] text-white/20 font-mono flex-1">
              {option.category}/{option.slug}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-400/50 hover:text-red-400 hover:bg-red-400/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline Edit ───────────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  multiline = false,
  className = '',
  placeholder = '',
}: {
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
  }, [draft, value, onSave]);

  const cancel = () => { setDraft(value); setEditing(false); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); save(); }
    if (e.key === 'Enter' && multiline && e.metaKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') cancel();
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className={`text-left cursor-text hover:bg-white/[0.04] rounded px-1 -mx-1 transition-colors w-full ${className}`}
        title="Click to edit"
      >
        {value || <span className="text-white/20 italic">{placeholder || 'Click to edit'}</span>}
      </button>
    );
  }

  if (multiline) {
    return (
      <div className="flex flex-col gap-1">
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          className="text-xs font-mono resize-none min-h-[56px] bg-white/[0.04] border-white/[0.1]"
        />
        <div className="flex gap-1 justify-end">
          <span className="text-[9px] text-white/20 mr-auto">⌘↵ save · Esc cancel</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onMouseDown={(e) => { e.preventDefault(); cancel(); }}>
            <X className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onMouseDown={(e) => { e.preventDefault(); save(); }}>
            <Check className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={save}
      className={`h-7 text-xs bg-white/[0.04] border-white/[0.1] ${className}`}
    />
  );
}

// ── Create Option Dialog ──────────────────────────────────────────────────────

interface CreateOptionDialogProps {
  open: boolean;
  openUntyped: boolean;
  defaultCategory: CameraOptionCategory | null;
  onClose: () => void;
  onSave: (data: CreateCameraOptionInput) => Promise<void>;
  saving: boolean;
}

function CreateOptionDialog({ openUntyped, defaultCategory, onClose, onSave, saving }: CreateOptionDialogProps) {
  const [category, setCategory] = useState<string>(defaultCategory || '');
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [promptFragment, setPromptFragment] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [mediaType, setMediaType] = useState<CameraMediaType>('both');
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (openUntyped) {
      setCategory(defaultCategory || '');
      setSlug('');
      setDisplayName('');
      setDescription('');
      setPromptFragment('');
      setSortOrder(0);
      setIsActive(true);
      setMediaType('both');
      setAutoSlug(true);
    }
  }, [openUntyped, defaultCategory]);

  const handleNameChange = (name: string) => {
    setDisplayName(name);
    if (autoSlug) setSlug(slugify(name));
  };

  const handleSave = () => {
    if (!displayName.trim() || !promptFragment.trim() || !category || !slug.trim()) return;
    onSave({
      category,
      slug: slug.trim(),
      display_name: displayName.trim(),
      description: description.trim() || undefined,
      prompt_fragment: promptFragment.trim(),
      sort_order: sortOrder,
      is_active: isActive,
      media_type: mediaType,
    });
  };

  const defaultCategoryLabel = defaultCategory ? CATEGORY_META[defaultCategory]?.label : null;

  return (
    <Dialog open={openUntyped} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="w-4 h-4 text-[#1ED75F]" />
            Add Camera Option
            {defaultCategoryLabel && (
              <Badge variant="outline" className="text-[10px] ml-1">{defaultCategoryLabel}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Define a new photographic preset that will be available in Creative Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_LIST.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
                placeholder="e.g., kodak_portra_400"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Display Name *</Label>
            <Input
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Kodak Portra 400"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the visual effect…"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Prompt Fragment *</Label>
            <Textarea
              value={promptFragment}
              onChange={(e) => setPromptFragment(e.target.value)}
              className="h-20 text-xs font-mono resize-none"
              placeholder="The text appended verbatim to the image generation prompt…"
            />
            <p className="text-[9px] text-muted-foreground">
              This exact text is injected into the prompt when this option is selected.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Media Type</Label>
              <Select value={mediaType} onValueChange={(v: CameraMediaType) => setMediaType(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEDIA_TYPES.map(mt => (
                    <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Active</Label>
              <div className="flex items-center gap-2 pt-1.5">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-xs text-muted-foreground">{isActive ? 'Visible' : 'Hidden'}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !displayName.trim() || !promptFragment.trim() || !category || !slug.trim()}
            className="gap-1"
          >
            <Camera className="w-3 h-3" />
            {saving ? 'Saving…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
