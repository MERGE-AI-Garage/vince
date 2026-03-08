// ABOUTME: Admin dashboard for Brand Lens platform management.
// ABOUTME: Tabs for models, brands, generations, analytics, and settings.

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sparkles,
  Settings,
  Image,
  Video,
  Palette,
  BarChart3,
  Users,
  DollarSign,
  Loader2,
  ExternalLink,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Star,
  StarOff,
  Pencil,
  TrendingUp,
  History,
  Brain,
  Camera,
  MoreHorizontal,
  Globe,
  Bell,
  MessageSquare,
  Chrome,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { GoogleLogo, MergeLogo } from '@/components/ai-pulse/vendorLogos';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { ExtensionTab } from '@/components/creative-studio/ExtensionTab';
import { WelcomeImagesTab } from '@/components/creative-studio/WelcomeImagesTab';
import { cn } from '@/lib/utils';
import { CARD_BASE, CARD_HOVER } from '@/lib/guidelines-constants';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminHeroHeader from '@/components/headers/AdminHeroHeader';
import type { ModelType, ModelCapability, ModelParameters } from '@/types/creative-studio';
import { useBrandLensAdminTour } from '@/components/onboarding/BrandLensAdminTour';

import {
  useAllCreativeStudioModels,
  useCreateModel,
  useUpdateModel,
  useToggleModelActive,
  useSetDefaultModel,
  useDeleteModel,
} from '@/hooks/useCreativeStudioModels';
import {
  useAllCreativeStudioBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useToggleBrandActive,
  useSetDefaultBrand,
} from '@/hooks/useCreativeStudioBrands';
import {
  useGenerationStats,
} from '@/hooks/useCreativeStudioGenerations';
import {
  useCostSettings,
  useUpdateCostSetting,
} from '@/hooks/useCreativeStudioQuota';
import { GenerationsTab } from '@/components/creative-studio/GenerationsTab';
import { QuotasTab } from '@/components/creative-studio/QuotasTab';
import { AnalyticsTab } from '@/components/creative-studio/AnalyticsTab';
import { AuditTrailTab } from '@/components/creative-studio/AuditTrailTab';
import { PromptHistoryTab } from '@/components/creative-studio/PromptHistoryTab';
import { BrandIntelligenceTab } from '@/components/creative-studio/BrandIntelligenceTab';
import { BrandEditorDialog } from '@/components/creative-studio/BrandEditorDialog';
import { BrandDNABuilder } from '@/components/creative-studio/BrandDNABuilder';
import { CameraPresetAdmin } from '@/components/creative-studio/CameraPresetAdmin';
import { BrandDNAPrompts } from '@/components/creative-studio/BrandDNAPrompts';
import { BrandCard } from '@/components/creative-studio/BrandCard';

const HERO_IMAGES = [
  '/images/admin-hero-1.jpeg',
  '/images/admin-hero-2.jpeg',
];

export default function CreativeStudioAdmin() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('brands');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const { startAdminTour } = useBrandLensAdminTour();

  // Data queries
  const { data: models, isLoading: modelsLoading, refetch: refetchModels } = useAllCreativeStudioModels();
  const { data: brands, isLoading: brandsLoading, refetch: refetchBrands } = useAllCreativeStudioBrands();
  const { data: stats } = useGenerationStats(30);
  const { data: costSettings, isLoading: settingsLoading } = useCostSettings();

  // Bulk-fetch which brands have DNA profiles (avoids N+1 queries)
  const { data: brandProfileIds } = useQuery({
    queryKey: ['creative-studio-brand-profiles', 'brand-ids'],
    queryFn: async () => {
      const { data } = await supabase
        .from('creative_studio_brand_profiles')
        .select('brand_id');
      return new Set((data || []).map(r => r.brand_id));
    },
    staleTime: 30_000,
  });

  // Active brands for the Brand DNA tab selector
  const activeBrands = useMemo(
    () => brands?.filter(b => b.is_active) || [],
    [brands]
  );
  const effectiveBrandId = selectedBrandId || activeBrands[0]?.id || null;

  // Mutations
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const toggleModelActive = useToggleModelActive();
  const setDefaultModel = useSetDefaultModel();
  const deleteModel = useDeleteModel();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const toggleBrandActive = useToggleBrandActive();
  const setDefaultBrand = useSetDefaultBrand();
  const updateCostSetting = useUpdateCostSetting();

  // Model CRUD state
  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [deleteModelConfirm, setDeleteModelConfirm] = useState<string | null>(null);

  const IMAGE_CAPABILITIES: ModelCapability[] = [
    'text_to_image', 'inpainting', 'outpainting', 'upscaling',
    'masking', 'editing', 'multi_turn_edit', 'multi_image_fusion',
    'typographic_rendering', 'grounding', 'reference_images',
    'product_recontext', 'virtual_try_on',
  ];

  const VIDEO_CAPABILITIES: ModelCapability[] = [
    'text_to_video', 'image_to_video', 'audio_generation',
    'keyframe_video', 'scene_extension', 'video_inpainting',
    'json_prompt', 'reference_images',
  ];

  const ALL_CAPABILITIES: ModelCapability[] = [
    ...new Set([...IMAGE_CAPABILITIES, ...VIDEO_CAPABILITIES]),
  ];

  const [modelForm, setModelForm] = useState({
    name: '',
    model_id: '',
    model_type: 'image' as ModelType,
    provider: 'google',
    description: '',
    capabilities: [] as string[],
    parameters: {} as Record<string, unknown>,
    cost_per_generation: 0.01,
    is_active: true,
    is_default: false,
    sort_order: 0,
  });

  const handleOpenModelEditor = (modelId?: string) => {
    if (modelId) {
      const model = models?.find(m => m.id === modelId);
      if (model) {
        setModelForm({
          name: model.name,
          model_id: model.model_id,
          model_type: model.model_type,
          provider: model.provider,
          description: model.description || '',
          capabilities: [...model.capabilities],
          parameters: { ...model.parameters },
          cost_per_generation: model.cost_per_generation,
          is_active: model.is_active,
          is_default: model.is_default,
          sort_order: model.sort_order,
        });
        setEditingModelId(modelId);
      }
    } else {
      const nextOrder = (models?.length ?? 0) + 1;
      setModelForm({
        name: '',
        model_id: '',
        model_type: 'image',
        provider: 'google',
        description: '',
        capabilities: [],
        parameters: {},
        cost_per_generation: 0.01,
        is_active: true,
        is_default: false,
        sort_order: nextOrder,
      });
      setIsCreatingModel(true);
    }
  };

  const handleSaveModel = async () => {
    try {
      if (editingModelId) {
        await updateModel.mutateAsync({ id: editingModelId, updates: modelForm });
        setEditingModelId(null);
        toast.success('Model updated');
      } else {
        await createModel.mutateAsync(modelForm);
        setIsCreatingModel(false);
        toast.success('Model created');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save model');
    }
  };

  const handleDeleteModel = async () => {
    if (!deleteModelConfirm) return;
    try {
      await deleteModel.mutateAsync(deleteModelConfirm);
      setDeleteModelConfirm(null);
      toast.success('Model deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete model');
    }
  };

  const toggleCapability = (cap: string) => {
    setModelForm(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  // Brand CRUD state
  const [brandEditorOpen, setBrandEditorOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<import('@/types/creative-studio').CreativeStudioBrand | null>(null);
  const [deleteBrandConfirm, setDeleteBrandConfirm] = useState<string | null>(null);
  const [dnaBuilderBrand, setDnaBuilderBrand] = useState<import('@/types/creative-studio').CreativeStudioBrand | null>(null);

  const handleOpenBrandEditor = (brandId?: string) => {
    if (brandId) {
      const brand = brands?.find(b => b.id === brandId);
      if (brand) {
        setEditingBrand(brand);
      }
    } else {
      setEditingBrand(null);
    }
    setBrandEditorOpen(true);
  };

  const handleSaveBrand = async (data: import('@/types/creative-studio').UpdateBrandInput) => {
    try {
      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand.id, updates: data });
        toast.success('Brand updated');
      } else {
        const created = await createBrand.mutateAsync(data as import('@/types/creative-studio').CreateBrandInput);
        toast.success(`${created.name} created`, {
          action: {
            label: 'Run Brand DNA Builder',
            onClick: () => setDnaBuilderBrand(created),
          },
        });
      }
      setBrandEditorOpen(false);
      setEditingBrand(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save brand');
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteBrandConfirm) return;
    try {
      await deleteBrand.mutateAsync(deleteBrandConfirm);
      setDeleteBrandConfirm(null);
      toast.success('Brand deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete brand');
    }
  };

  const handleToggleModel = async (id: string, currentActive: boolean) => {
    try {
      await toggleModelActive.mutateAsync({ id, is_active: !currentActive });
      toast.success(`Model ${currentActive ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update model');
    }
  };

  const handleSetDefaultModel = async (id: string, model_type: 'image' | 'video') => {
    try {
      await setDefaultModel.mutateAsync({ id, model_type });
      toast.success('Default model updated');
    } catch (error) {
      toast.error('Failed to set default model');
    }
  };

  const handleToggleBrand = async (id: string, currentActive: boolean) => {
    try {
      await toggleBrandActive.mutateAsync({ id, is_active: !currentActive });
      toast.success(`Brand ${currentActive ? 'disabled' : 'enabled'}`);
    } catch (error) {
      toast.error('Failed to update brand');
    }
  };

  const handleSetDefaultBrand = async (id: string) => {
    try {
      await setDefaultBrand.mutateAsync(id);
      toast.success('Default brand updated');
    } catch (error) {
      toast.error('Failed to set default brand');
    }
  };

  // Settings form — buffered local state with Save/Cancel
  const [settingsForm, setSettingsForm] = useState({
    default_image_weekly_limit: 20,
    default_video_weekly_limit: 5,
    image_cost: 0.075,
    video_cost: 0.50,
    budget_alert_threshold: 500,
    admin_email_alerts: true,
  });

  useEffect(() => {
    if (costSettings) {
      setSettingsForm({
        default_image_weekly_limit: costSettings.default_image_weekly_limit,
        default_video_weekly_limit: costSettings.default_video_weekly_limit,
        image_cost: costSettings.image_cost,
        video_cost: costSettings.video_cost,
        budget_alert_threshold: costSettings.budget_alert_threshold,
        admin_email_alerts: costSettings.admin_email_alerts,
      });
    }
  }, [costSettings]);

  const settingsDirty = useMemo(() => {
    if (!costSettings) return false;
    return (
      settingsForm.default_image_weekly_limit !== costSettings.default_image_weekly_limit ||
      settingsForm.default_video_weekly_limit !== costSettings.default_video_weekly_limit ||
      settingsForm.image_cost !== costSettings.image_cost ||
      settingsForm.video_cost !== costSettings.video_cost ||
      settingsForm.budget_alert_threshold !== costSettings.budget_alert_threshold ||
      settingsForm.admin_email_alerts !== costSettings.admin_email_alerts
    );
  }, [settingsForm, costSettings]);

  const handleSaveSettings = async () => {
    if (!costSettings) return;
    try {
      const updates: Array<{ key: string; value: string | number | boolean }> = [];
      if (settingsForm.default_image_weekly_limit !== costSettings.default_image_weekly_limit)
        updates.push({ key: 'default_image_weekly_limit', value: settingsForm.default_image_weekly_limit });
      if (settingsForm.default_video_weekly_limit !== costSettings.default_video_weekly_limit)
        updates.push({ key: 'default_video_weekly_limit', value: settingsForm.default_video_weekly_limit });
      if (settingsForm.image_cost !== costSettings.image_cost)
        updates.push({ key: 'image_cost', value: settingsForm.image_cost });
      if (settingsForm.video_cost !== costSettings.video_cost)
        updates.push({ key: 'video_cost', value: settingsForm.video_cost });
      if (settingsForm.budget_alert_threshold !== costSettings.budget_alert_threshold)
        updates.push({ key: 'budget_alert_threshold', value: settingsForm.budget_alert_threshold });
      if (settingsForm.admin_email_alerts !== costSettings.admin_email_alerts)
        updates.push({ key: 'admin_email_alerts', value: settingsForm.admin_email_alerts });

      for (const { key, value } of updates) {
        await updateCostSetting.mutateAsync({ setting_key: key, setting_value: value });
      }
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    if (costSettings) {
      setSettingsForm({
        default_image_weekly_limit: costSettings.default_image_weekly_limit,
        default_video_weekly_limit: costSettings.default_video_weekly_limit,
        image_cost: costSettings.image_cost,
        video_cost: costSettings.video_cost,
        budget_alert_threshold: costSettings.budget_alert_threshold,
        admin_email_alerts: costSettings.admin_email_alerts,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageLayout>
      {/* Full-bleed cinematic hero — outside container for edge-to-edge layout */}
      <AdminHeroHeader
        icon={Sparkles}
        title="Brand Lens Admin"
        description="Brand-aware AI generation across image and video — multi-model pipelines, creative governance, and real-time cost analytics"
        backTo={{ path: '/', label: 'Back to Studio' }}
        backgroundImages={HERO_IMAGES}
        cinematic
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={startAdminTour}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Admin Tour
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
              <a href="/creative-studio" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Studio
              </a>
            </Button>
          </div>
        }
        stats={[
          {
            icon: Image,
            color: 'blue',
            value: stats?.image_generations ?? 0,
            label: 'Images',
            detail: '30-day generations',
            onClick: () => setActiveTab('generations'),
          },
          {
            icon: Video,
            color: 'teal',
            value: stats?.video_generations ?? 0,
            label: 'Videos',
            detail: '30-day generations',
            onClick: () => setActiveTab('generations'),
          },
          {
            icon: Users,
            color: 'green',
            value: stats?.unique_users ?? 0,
            label: 'Users',
            detail: 'Active this period',
            onClick: () => setActiveTab('quotas'),
          },
          {
            icon: DollarSign,
            color: 'amber',
            value: `$${(stats?.total_estimated_cost ?? 0).toFixed(2)}`,
            label: 'Cost',
            detail: 'Estimated 30-day',
            onClick: () => setActiveTab('analytics'),
          },
        ]}
      />

      <div className="container mx-auto px-6 pb-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="brands" data-tour="admin-brands-tab">
                <Palette className="h-3.5 w-3.5" />
                Brands
              </TabsTrigger>
              <TabsTrigger value="intelligence" data-tour="admin-intelligence-tab">
                <Brain className="h-3.5 w-3.5" />
                Brand DNA
              </TabsTrigger>
              <TabsTrigger value="camera">
                <Camera className="h-3.5 w-3.5" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="models" data-tour="admin-models-tab">
                <Sparkles className="h-3.5 w-3.5" />
                Models
              </TabsTrigger>
              <TabsTrigger value="generations">
                <Image className="h-3.5 w-3.5" />
                Generations
              </TabsTrigger>
              <TabsTrigger value="analytics" data-tour="admin-analytics-tab">
                <TrendingUp className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="quotas">
                <Users className="h-3.5 w-3.5" />
                User Quotas
              </TabsTrigger>
              <TabsTrigger value="audit">
                <History className="h-3.5 w-3.5" />
                Audit Trail
              </TabsTrigger>
              <TabsTrigger value="prompt-history">
                <MessageSquare className="h-3.5 w-3.5" />
                Prompt History
              </TabsTrigger>
              <TabsTrigger value="extension">
                <Chrome className="h-3.5 w-3.5" />
                Extension
              </TabsTrigger>
              <TabsTrigger value="welcome">
                <Image className="h-3.5 w-3.5" />
                Welcome Page
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

          </div>

          {/* Models Tab */}
          <TabsContent value="models">
            <div className="space-y-6">
              <TabHeroHeader
                gradientLight="from-[#f1f3f4] via-[#e8eaed] to-[#dadce0]"
                gradientDark="dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]"
                watermark={<GoogleLogo className="w-full h-full" />}
                watermarkSmall={<MergeLogo className="w-full h-full" />}
                badgeIcon={<GoogleLogo className="w-5 h-5 text-gray-800 dark:text-white/80" />}
                badgeLabel="Google Vertex AI"
                title="AI Models"
                subtitle="Curated Vertex AI models for image and video generation — capabilities, cost-per-generation pricing, and rate limits"
                actions={
                  <>
                    <Button variant="outline" size="sm" onClick={() => refetchModels()} className="bg-white/60 dark:bg-white/10 border-gray-300/60 dark:border-white/20">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button onClick={() => handleOpenModelEditor()} className="gap-2 shadow-md">
                      <Plus className="h-4 w-4" />
                      Add Model
                    </Button>
                  </>
                }
              />

              {modelsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Image Models Section */}
                  {(() => {
                    const imageModels = models?.filter(m => m.model_type === 'image') || [];
                    const videoModels = models?.filter(m => m.model_type === 'video') || [];
                    return (
                      <>
                        {/* Image Models Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <Image className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h3 className="font-semibold">Image Models</h3>
                            <Badge variant="outline" className="text-xs">{imageModels.length}</Badge>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {imageModels.map((model) => (
                              <div
                                key={model.id}
                                className={cn(
                                  'group relative flex overflow-hidden rounded-xl',
                                  'border border-border/40 bg-card/80 backdrop-blur-sm',
                                  'hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5',
                                  'transition-all duration-300',
                                  !model.is_active && 'opacity-50',
                                  model.is_default && 'ring-1 ring-primary/30',
                                )}
                              >
                                {/* Gradient accent strip */}
                                <div className="w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 shrink-0" />

                                <div className="flex-1 p-4 space-y-3 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm truncate">{model.name}</h4>
                                        {model.is_default && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                                      </div>
                                      <p className="text-[10px] text-muted-foreground font-mono truncate">{model.model_id}</p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-[10px] shrink-0',
                                        model.is_active
                                          ? 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400'
                                          : 'bg-muted text-muted-foreground',
                                      )}
                                    >
                                      {model.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>

                                  {model.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{model.description}</p>
                                  )}

                                  <div className="flex flex-wrap gap-1">
                                    {model.capabilities.slice(0, 4).map((cap) => (
                                      <Badge key={cap} variant="outline" className="text-[9px] py-0 px-1.5 bg-muted/30">
                                        {cap.replace(/_/g, ' ')}
                                      </Badge>
                                    ))}
                                    {model.capabilities.length > 4 && (
                                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-muted/30">
                                        +{model.capabilities.length - 4}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                                      <DollarSign className="h-3 w-3" />
                                      {model.cost_per_generation.toFixed(3)}
                                      <span className="text-muted-foreground font-normal">/img</span>
                                    </span>
                                    {(model.parameters as any)?.rate_limit_per_minute && (
                                      <span className="text-muted-foreground">
                                        {(model.parameters as any).rate_limit_per_minute} req/min
                                      </span>
                                    )}
                                    {(model.parameters as any)?.max_sample_count > 1 && (
                                      <span className="text-muted-foreground">
                                        ×{(model.parameters as any).max_sample_count} max
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                                    <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => handleOpenModelEditor(model.id)}>
                                      <Pencil className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                    {!model.is_default && (
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleSetDefaultModel(model.id, model.model_type)} title="Set as default">
                                        <StarOff className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Switch checked={model.is_active} onCheckedChange={() => handleToggleModel(model.id, model.is_active)} />
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteModelConfirm(model.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Video Models Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                              <Video className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h3 className="font-semibold">Video Models</h3>
                            <Badge variant="outline" className="text-xs">{videoModels.length}</Badge>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {videoModels.map((model) => {
                              const params = model.parameters as any;
                              const pricingTiers = params?.pricing_tiers || [];
                              return (
                                <div
                                  key={model.id}
                                  className={cn(
                                    'group relative flex overflow-hidden rounded-xl',
                                    'border border-border/40 bg-card/80 backdrop-blur-sm',
                                    'hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5',
                                    'transition-all duration-300',
                                    !model.is_active && 'opacity-50',
                                    model.is_default && 'ring-1 ring-primary/30',
                                  )}
                                >
                                  {/* Gradient accent strip */}
                                  <div className="w-1.5 bg-gradient-to-b from-purple-500 to-pink-600 shrink-0" />

                                  <div className="flex-1 p-4 space-y-3 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium text-sm truncate">{model.name}</h4>
                                          {model.is_default && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-mono truncate">{model.model_id}</p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-[10px] shrink-0',
                                          model.is_active
                                            ? 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400'
                                            : 'bg-muted text-muted-foreground',
                                        )}
                                      >
                                        {model.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>

                                    {model.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{model.description}</p>
                                    )}

                                    {/* Pricing tiers */}
                                    {pricingTiers.length > 0 && (
                                      <div className="bg-muted/30 rounded-md p-2 space-y-0.5">
                                        {pricingTiers.map((tier: any) => (
                                          <div key={tier.label} className="flex items-center justify-between text-[10px]">
                                            <span className="text-muted-foreground">{tier.label}</span>
                                            <span className="font-medium text-purple-600 dark:text-purple-400 tabular-nums">
                                              ${tier.per_second.toFixed(2)}/sec
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-1">
                                      {params?.supports_audio && (
                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                          audio
                                        </Badge>
                                      )}
                                      {params?.supports_4k && (
                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                          4K
                                        </Badge>
                                      )}
                                      {params?.durations && (
                                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-muted/30">
                                          {params.durations.join('/')}s
                                        </Badge>
                                      )}
                                      {model.capabilities.slice(0, 3).map((cap) => (
                                        <Badge key={cap} variant="outline" className="text-[9px] py-0 px-1.5 bg-muted/30">
                                          {cap.replace(/_/g, ' ')}
                                        </Badge>
                                      ))}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs">
                                      <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                                        <DollarSign className="h-3 w-3" />
                                        {params?.cost_per_second
                                          ? `${params.cost_per_second.toFixed(2)}`
                                          : model.cost_per_generation.toFixed(2)}
                                        <span className="text-muted-foreground font-normal">
                                          {params?.cost_per_second ? '/sec' : '/gen'}
                                        </span>
                                      </span>
                                      {params?.rate_limit_per_minute && (
                                        <span className="text-muted-foreground">
                                          {params.rate_limit_per_minute} req/min
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1 pt-2 border-t border-border/30">
                                      <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => handleOpenModelEditor(model.id)}>
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      {!model.is_default && (
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleSetDefaultModel(model.id, model.model_type)} title="Set as default">
                                          <StarOff className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Switch checked={model.is_active} onCheckedChange={() => handleToggleModel(model.id, model.is_active)} />
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteModelConfirm(model.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands">
            <div className="space-y-6">
              <TabHeroHeader
                gradientLight="from-[#0D1B16] via-[#133B34] to-[#1a4f40]"
                gradientDark="dark:from-[#0D1B16] dark:via-[#133B34] dark:to-[#1a4f40]"
                forceLightText
                watermark={<Palette className="w-full h-full" />}
                watermarkSmall={<MergeLogo className="w-full h-full" />}
                badgeIcon={<Palette className="w-4 h-4 text-white/80" />}
                badgeLabel="Brand Management"
                title="Brands"
                subtitle="Visual systems, color palettes, logo libraries, and creative direction presets"
                actions={
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => refetchBrands()} className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={() => handleOpenBrandEditor()} className="gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                      <Plus className="h-4 w-4" />
                      Add Brand
                    </Button>
                  </div>
                }
              />

              {brandsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !brands || brands.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Palette className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No brands yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                      Brands define visual identity for AI-generated content — colors, fonts, tone of voice,
                      and logo placement. Add your first brand to get started.
                    </p>
                    <Button size="sm" onClick={() => handleOpenBrandEditor()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Brand
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {brands.map((brand) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      hasDna={!!brandProfileIds?.has(brand.id)}
                      onEdit={handleOpenBrandEditor}
                      onBuildDna={setDnaBuilderBrand}
                      onSetDefault={handleSetDefaultBrand}
                      onDelete={setDeleteBrandConfirm}
                      onToggleActive={handleToggleBrand}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Generations Tab */}
          <TabsContent value="generations">
            <GenerationsTab />
          </TabsContent>

          {/* Quotas Tab */}
          <TabsContent value="quotas">
            <QuotasTab />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit">
            <AuditTrailTab />
          </TabsContent>

          {/* Prompt History Tab */}
          <TabsContent value="prompt-history">
            <PromptHistoryTab />
          </TabsContent>

          {/* Brand Intelligence Tab */}
          <TabsContent value="intelligence">
            {activeBrands.length > 1 && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground font-medium">Brand:</span>
                <div className="flex items-center gap-1.5">
                  {activeBrands.map(brand => {
                    const isSelected = brand.id === effectiveBrandId;
                    return (
                      <button
                        key={brand.id}
                        onClick={() => setSelectedBrandId(brand.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt=""
                            className={cn('w-4 h-4 rounded object-contain', isSelected && 'brightness-0 invert')}
                          />
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : brand.primary_color }}
                          />
                        )}
                        {brand.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <BrandIntelligenceTab brandId={effectiveBrandId} />
          </TabsContent>

          {/* Camera Presets Tab */}
          <TabsContent value="camera">
            <CameraPresetAdmin />
          </TabsContent>

          {/* Extension Tab */}
          <TabsContent value="extension">
            <ExtensionTab />
          </TabsContent>

          {/* Welcome Page Tab */}
          <TabsContent value="welcome">
            <div className="space-y-6">
              <TabHeroHeader
                gradientLight="from-[#e6f4ea] via-[#d4ede0] to-[#c2e6d6]"
                gradientDark="dark:from-[#0D1B16] dark:via-[#132B22] dark:to-[#1a3a2e]"
                watermark={<Image className="w-full h-full" />}
                watermarkSmall={<MergeLogo className="w-full h-full" />}
                badgeIcon={<Image className="w-4 h-4 text-gray-700 dark:text-white/80" />}
                badgeLabel="Welcome Page"
                title="Welcome Page Images"
                subtitle="Gemini-generated icon images for the system welcome screen — hero banner and 8 capability cards"
              />
              <WelcomeImagesTab />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <TabHeroHeader
                gradientLight="from-[#f0f0f1] via-[#e6e6e7] to-[#dadadc]"
                gradientDark="dark:from-[#1a1a1b] dark:via-[#1f1f20] dark:to-[#252526]"
                watermark={<Settings className="w-full h-full" />}
                watermarkSmall={<MergeLogo className="w-full h-full" />}
                badgeIcon={<Settings className="w-4 h-4 text-gray-700 dark:text-white/80" />}
                badgeLabel="Configuration"
                title="Settings"
                subtitle="Platform-wide defaults for cost governance, budget alerting, generation quotas, and brand generation prompts"
                actions={
                  settingsDirty ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleResetSettings} className="bg-white/60 dark:bg-white/10 border-gray-300/60 dark:border-white/20">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveSettings} disabled={updateCostSetting.isPending} className="shadow-md">
                        {updateCostSetting.isPending ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </>
                  ) : undefined
                }
              />

              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : costSettings && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left column — Quotas + Costs */}
                    <div className="lg:col-span-3 space-y-6">
                      {/* Quota Defaults */}
                      <div className="flex overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
                        <div className="w-1.5 bg-gradient-to-b from-blue-400 to-blue-600 shrink-0" />
                        <div className="flex-1 p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold">Quota Defaults</h3>
                              <p className="text-xs text-muted-foreground">Weekly generation limits for new users</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Weekly Image Limit</Label>
                              <Input
                                type="number"
                                value={settingsForm.default_image_weekly_limit}
                                onChange={(e) => setSettingsForm(prev => ({
                                  ...prev,
                                  default_image_weekly_limit: parseInt(e.target.value) || 0,
                                }))}
                              />
                              <p className="text-[10px] text-muted-foreground">Per user per week</p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Weekly Video Limit</Label>
                              <Input
                                type="number"
                                value={settingsForm.default_video_weekly_limit}
                                onChange={(e) => setSettingsForm(prev => ({
                                  ...prev,
                                  default_video_weekly_limit: parseInt(e.target.value) || 0,
                                }))}
                              />
                              <p className="text-[10px] text-muted-foreground">Per user per week</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost Configuration */}
                      <div className="flex overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
                        <div className="w-1.5 bg-gradient-to-b from-amber-400 to-amber-600 shrink-0" />
                        <div className="flex-1 p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <DollarSign className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold">Cost Configuration</h3>
                              <p className="text-xs text-muted-foreground">Average cost estimates for budget tracking</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Image Cost (USD)</Label>
                              <Input
                                type="number"
                                step="0.001"
                                value={settingsForm.image_cost}
                                onChange={(e) => setSettingsForm(prev => ({
                                  ...prev,
                                  image_cost: parseFloat(e.target.value) || 0,
                                }))}
                              />
                              <p className="text-[10px] text-muted-foreground">Per image generation</p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Video Cost (USD)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={settingsForm.video_cost}
                                onChange={(e) => setSettingsForm(prev => ({
                                  ...prev,
                                  video_cost: parseFloat(e.target.value) || 0,
                                }))}
                              />
                              <p className="text-[10px] text-muted-foreground">Per video generation</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right column — Alerts */}
                    <div className="lg:col-span-2">
                      <div className="flex overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm h-full">
                        <div className="w-1.5 bg-gradient-to-b from-orange-400 to-red-500 shrink-0" />
                        <div className="flex-1 p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                              <Bell className="h-4 w-4 text-orange-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold">Alerts & Monitoring</h3>
                              <p className="text-xs text-muted-foreground">Budget notifications</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Budget Alert Threshold (USD)</Label>
                              <Input
                                type="number"
                                value={settingsForm.budget_alert_threshold}
                                onChange={(e) => setSettingsForm(prev => ({
                                  ...prev,
                                  budget_alert_threshold: parseFloat(e.target.value) || 0,
                                }))}
                              />
                              <p className="text-[10px] text-muted-foreground">Monthly budget threshold</p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Admin Email Alerts</Label>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={settingsForm.admin_email_alerts}
                                  onCheckedChange={(checked) => setSettingsForm(prev => ({
                                    ...prev,
                                    admin_email_alerts: checked,
                                  }))}
                                />
                                <span className="text-sm">
                                  {settingsForm.admin_email_alerts ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Send alerts when thresholds are exceeded
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Brand DNA Prompts */}
                  <BrandDNAPrompts />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Model Create/Edit Dialog */}
        <Dialog
          open={isCreatingModel || !!editingModelId}
          onOpenChange={() => { setIsCreatingModel(false); setEditingModelId(null); }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingModelId ? 'Edit Model' : 'Add Model'}
              </DialogTitle>
              <DialogDescription>
                Configure AI model settings for Brand Lens
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={modelForm.name}
                  onChange={(e) => setModelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Gemini 3 Pro Image"
                />
              </div>

              <div className="space-y-2">
                <Label>Model ID</Label>
                <Input
                  value={modelForm.model_id}
                  onChange={(e) => setModelForm(prev => ({ ...prev, model_id: e.target.value }))}
                  placeholder="gemini-3-pro-image-preview"
                />
                <p className="text-xs text-muted-foreground">The API model identifier</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={modelForm.model_type}
                    onValueChange={(value: ModelType) => setModelForm(prev => ({ ...prev, model_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input
                    value={modelForm.provider}
                    onChange={(e) => setModelForm(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="google"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={modelForm.description}
                  onChange={(e) => setModelForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of model strengths and use cases"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Capabilities</Label>
                <div className="flex flex-wrap gap-2">
                  {(modelForm.model_type === 'image' ? IMAGE_CAPABILITIES : VIDEO_CAPABILITIES)
                    .map((cap) => (
                      <Button
                        key={cap}
                        type="button"
                        variant={modelForm.capabilities.includes(cap) ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => toggleCapability(cap)}
                      >
                        {cap.replace(/_/g, ' ')}
                      </Button>
                    ))}
                </div>
              </div>

              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Pricing & Limits</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost per Generation (USD)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={modelForm.cost_per_generation}
                      onChange={(e) => setModelForm(prev => ({
                        ...prev,
                        cost_per_generation: parseFloat(e.target.value) || 0,
                      }))}
                    />
                    <p className="text-[10px] text-muted-foreground">Default cost shown in model picker</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Unit</Label>
                    <Select
                      value={(modelForm.parameters as any)?.cost_unit || 'per_image'}
                      onValueChange={(value) => setModelForm(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, cost_unit: value },
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_image">Per Image</SelectItem>
                        <SelectItem value="per_second">Per Second</SelectItem>
                        <SelectItem value="per_generation">Per Generation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rate Limit (req/min)</Label>
                    <Input
                      type="number"
                      value={(modelForm.parameters as any)?.rate_limit_per_minute ?? ''}
                      onChange={(e) => setModelForm(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          rate_limit_per_minute: parseInt(e.target.value) || undefined,
                        },
                      }))}
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={modelForm.sort_order}
                      onChange={(e) => setModelForm(prev => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))}
                    />
                  </div>
                </div>

                {/* Duration-based pricing (video models) */}
                {(modelForm.parameters as any)?.cost_unit === 'per_second' && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="text-xs font-medium text-muted-foreground">Duration-Based Pricing</div>

                    <div className="space-y-2">
                      <Label className="text-xs">Available Durations (seconds)</Label>
                      <div className="flex gap-2">
                        {[4, 6, 8].map((d) => {
                          const durations: number[] = (modelForm.parameters as any)?.durations || [];
                          const active = durations.includes(d);
                          return (
                            <Button
                              key={d}
                              type="button"
                              variant={active ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs h-7 w-10"
                              onClick={() => {
                                const next = active
                                  ? durations.filter(x => x !== d)
                                  : [...durations, d].sort((a, b) => a - b);
                                setModelForm(prev => ({
                                  ...prev,
                                  parameters: { ...prev.parameters, durations: next },
                                }));
                              }}
                            >
                              {d}s
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Resolution Pricing Tiers</Label>
                      <p className="text-[10px] text-muted-foreground">
                        Per-second rate for each resolution. Shown in the cost calculator.
                      </p>
                      {((modelForm.parameters as any)?.pricing_tiers || []).map((tier: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={tier.label}
                            onChange={(e) => {
                              const tiers = [...((modelForm.parameters as any)?.pricing_tiers || [])];
                              tiers[i] = { ...tiers[i], label: e.target.value };
                              setModelForm(prev => ({
                                ...prev,
                                parameters: { ...prev.parameters, pricing_tiers: tiers },
                              }));
                            }}
                            placeholder="720p / 1080p"
                            className="flex-1 h-8 text-xs"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={tier.per_second}
                              onChange={(e) => {
                                const tiers = [...((modelForm.parameters as any)?.pricing_tiers || [])];
                                tiers[i] = { ...tiers[i], per_second: parseFloat(e.target.value) || 0 };
                                setModelForm(prev => ({
                                  ...prev,
                                  parameters: { ...prev.parameters, pricing_tiers: tiers },
                                }));
                              }}
                              className="w-20 h-8 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">/s</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => {
                              const tiers = ((modelForm.parameters as any)?.pricing_tiers || []).filter((_: any, j: number) => j !== i);
                              setModelForm(prev => ({
                                ...prev,
                                parameters: { ...prev.parameters, pricing_tiers: tiers },
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          const tiers = [...((modelForm.parameters as any)?.pricing_tiers || []), { label: '', per_second: 0 }];
                          setModelForm(prev => ({
                            ...prev,
                            parameters: { ...prev.parameters, pricing_tiers: tiers },
                          }));
                        }}
                      >
                        + Add Tier
                      </Button>
                    </div>

                    {/* Fallback single rate if no tiers */}
                    {!((modelForm.parameters as any)?.pricing_tiers?.length > 0) && (
                      <div className="space-y-2">
                        <Label className="text-xs">Base Rate ($/sec)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(modelForm.parameters as any)?.cost_per_second ?? ''}
                          onChange={(e) => setModelForm(prev => ({
                            ...prev,
                            parameters: {
                              ...prev.parameters,
                              cost_per_second: parseFloat(e.target.value) || 0,
                            },
                          }))}
                          placeholder="0.40"
                          className="w-32"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Single rate for all resolutions. Use tiers above for per-resolution pricing.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Image per-sample info */}
                {(modelForm.parameters as any)?.cost_unit === 'per_image' && (modelForm.parameters as any)?.max_sample_count > 1 && (
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <div className="text-xs text-muted-foreground">
                      Max {(modelForm.parameters as any).max_sample_count} images per prompt ·
                      {' '}${modelForm.cost_per_generation.toFixed(3)} × {(modelForm.parameters as any).max_sample_count}
                      {' '}= ${(modelForm.cost_per_generation * (modelForm.parameters as any).max_sample_count).toFixed(3)} max per generation
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={modelForm.is_active}
                  onCheckedChange={(checked) => setModelForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Set as Default</Label>
                <Switch
                  checked={modelForm.is_default}
                  onCheckedChange={(checked) => setModelForm(prev => ({ ...prev, is_default: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreatingModel(false); setEditingModelId(null); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveModel}
                disabled={createModel.isPending || updateModel.isPending || !modelForm.name || !modelForm.model_id}
              >
                {createModel.isPending || updateModel.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Model Delete Confirmation */}
        <Dialog open={!!deleteModelConfirm} onOpenChange={() => setDeleteModelConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Model</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this model? This action cannot be undone.
                Existing generations referencing this model will not be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModelConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteModel}
                disabled={deleteModel.isPending}
              >
                {deleteModel.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Brand Create/Edit Dialog */}
        <BrandEditorDialog
          open={brandEditorOpen}
          brand={editingBrand}
          onClose={() => { setBrandEditorOpen(false); setEditingBrand(null); }}
          onSave={handleSaveBrand}
          saving={createBrand.isPending || updateBrand.isPending}
        />

        {/* Brand DNA Builder (opened from post-creation toast or card action) */}
        {dnaBuilderBrand && (
          <BrandDNABuilder
            brandId={dnaBuilderBrand.id}
            brandName={dnaBuilderBrand.name}
            brandSlug={dnaBuilderBrand.slug}
            brandPrimaryColor={dnaBuilderBrand.primary_color}
            existingWebsiteUrl={dnaBuilderBrand.website_url}
            existingBrandVoice={dnaBuilderBrand.brand_voice}
            existingVisualIdentity={dnaBuilderBrand.visual_identity}
            open={!!dnaBuilderBrand}
            onOpenChange={(open) => { if (!open) setDnaBuilderBrand(null); }}
          />
        )}

        {/* Brand Delete Confirmation */}
        <Dialog open={!!deleteBrandConfirm} onOpenChange={() => setDeleteBrandConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Brand</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this brand? This action cannot be undone.
                Quick prompts associated with this brand will also be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteBrandConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBrand}
                disabled={deleteBrand.isPending}
              >
                {deleteBrand.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
