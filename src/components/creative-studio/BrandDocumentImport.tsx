// ABOUTME: Dialog for importing brand documents (PDFs, PPTX, text) and extracting brand data via Gemini
// ABOUTME: Multi-tab upload (file, Google Drive, paste) → Gemini extraction → review → synthesis

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain, Upload, Loader2, FileText, X, CheckCircle, FolderOpen, AlertCircle, Wand2, Check,
  Sparkles, BookOpen, Palette, Camera, Building2, FileBarChart, ChevronRight, Lightbulb,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGenerateBrandStarters,
  useCreateBrandPrompt,
  type GeneratedStarter,
} from '@/hooks/useCreativeStudioPrompts';
import { useGoogleDrivePicker } from '@/hooks/useGoogleDrivePicker';

interface BrandDocumentImportProps {
  brandId: string;
  brandName: string;
  brandSlug?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QueuedDocument {
  filename: string;
  content: string;         // base64, text, or storage URL
  content_type: 'pdf' | 'pptx' | 'docx' | 'text' | 'image';
  mime_type: string;
  document_type_hint: string;
  size: number;            // bytes, for display
  status: 'queued' | 'uploading' | 'analyzing' | 'complete' | 'failed';
  error?: string;
  analysis?: Record<string, unknown>;
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'photography_guide', label: 'Photography Guide' },
  { value: 'brand_style_guide', label: 'Brand Style Guide' },
  { value: 'product_catalog', label: 'Product Catalog' },
  { value: 'template_spec', label: 'Template Spec' },
  { value: 'corporate_brochure', label: 'Corporate Brochure' },
  { value: 'csr_report', label: 'CSR / Sustainability Report' },
  { value: 'annual_report', label: 'Annual / Integrated Report' },
  { value: 'pitch_deck', label: 'Pitch Deck / Sales Deck' },
  { value: 'dei_report', label: 'DEI / Inclusion Report' },
  { value: 'investor_presentation', label: 'Investor Presentation' },
  { value: 'capabilities_overview', label: 'Capabilities / About Us' },
];

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

const ACCEPTED_EXTENSIONS = '.pdf,.pptx,.docx,.txt,.md';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_INLINE_SIZE = 1.5 * 1024 * 1024; // 1.5MB — larger files go to storage

const RECOMMENDED_DOCUMENTS = [
  { icon: Palette, label: 'Brand Style Guides', description: 'Logo usage, color systems, typography, visual standards' },
  { icon: Camera, label: 'Photography Guides', description: 'Art direction, lighting, composition, retouching specs' },
  { icon: BookOpen, label: 'Product Catalogs', description: 'Product lines, features, naming conventions, specs' },
  { icon: Building2, label: 'Corporate Brochures', description: 'Company positioning, value props, messaging pillars' },
  { icon: FileBarChart, label: 'Annual Reports', description: 'Executive messaging, corporate narrative, brand voice' },
  { icon: FileText, label: 'Pitch Decks', description: 'Sales positioning, competitive differentiators, audience targeting' },
];

const PIPELINE_STEPS = [
  { num: 1, label: 'Upload', detail: 'Add brand documents from files, Google Drive, or paste' },
  { num: 2, label: 'Classify', detail: 'AI identifies each document type for targeted extraction' },
  { num: 3, label: 'Extract', detail: 'Gemini reads each document, pulling brand data into structured sections' },
  { num: 4, label: 'Review', detail: 'Preview extracted brand data before it merges into the profile' },
  { num: 5, label: 'Synthesize', detail: 'All analyses merge into a unified Brand DNA profile' },
];
const MAX_FILES = 10;

function inferContentType(mimeType: string, filename: string): QueuedDocument['content_type'] {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('presentationml') || filename.endsWith('.pptx')) return 'pptx';
  if (mimeType.includes('wordprocessingml') || filename.endsWith('.docx')) return 'docx';
  if (mimeType.startsWith('image/')) return 'image';
  return 'text';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Chunked base64 encoding to avoid stack overflow on large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

// Recursively checks if a data structure has any non-empty values
function hasPopulatedFields(data: unknown): boolean {
  if (data === null || data === undefined) return false;
  if (typeof data === 'string') return data.trim().length > 0;
  if (typeof data === 'number') return true;
  if (typeof data === 'boolean') return true;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') {
    return Object.values(data as Record<string, unknown>).some(v => hasPopulatedFields(v));
  }
  return false;
}

// Profile sections Gemini can extract — for the review step
const PROFILE_SECTIONS = [
  { key: 'photography_style', label: 'Photography Style' },
  { key: 'composition_rules', label: 'Composition Rules' },
  { key: 'product_catalog', label: 'Product Catalog' },
  { key: 'brand_identity', label: 'Brand Identity' },
  { key: 'tone_of_voice', label: 'Tone of Voice' },
  { key: 'color_profile', label: 'Color Profile' },
  { key: 'visual_dna', label: 'Visual DNA' },
  { key: 'typography', label: 'Typography' },
  { key: 'brand_story', label: 'Brand Story' },
];

export function BrandDocumentImport({ brandId, brandName, brandSlug, open, onOpenChange }: BrandDocumentImportProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    openPicker, reset: resetPicker, selectedFile: driveFile,
    extractedText: driveText, fileData: driveFileData, fileMimeType: driveFileMimeType,
    isLoading: isDriveLoading,
  } = useGoogleDrivePicker();

  // State
  const [documents, setDocuments] = useState<QueuedDocument[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [pasteFilename, setPasteFilename] = useState('');
  const [inputTab, setInputTab] = useState<'upload' | 'gdrive' | 'paste'>('upload');
  const [step, setStep] = useState<'upload' | 'classify' | 'processing' | 'review' | 'synthesize' | 'done'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Quick Starters generation from Brand DNA
  const generateStartersMutation = useGenerateBrandStarters();
  const createPromptMutation = useCreateBrandPrompt();
  const [generatedStarters, setGeneratedStarters] = useState<GeneratedStarter[] | null>(null);
  const [starterSelection, setStarterSelection] = useState<Set<number>>(new Set());
  const [savingStarters, setSavingStarters] = useState(false);

  const folder = `brands/${brandSlug || brandId}/documents`;

  const resetState = () => {
    setDocuments([]);
    setPasteText('');
    setPasteFilename('');
    setInputTab('upload');
    setStep('upload');
    setIsProcessing(false);
    setIsClassifying(false);
    setIsSynthesizing(false);
    setDragOver(false);
    setGeneratedStarters(null);
    setStarterSelection(new Set());
    setSavingStarters(false);
    resetPicker();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  // --- Upload to Supabase Storage for large files ---
  const uploadToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  // --- Add files from file input ---
  const addFiles = async (files: File[]) => {
    const validFiles = files.filter(f => {
      const isValidType = ACCEPTED_FILE_TYPES.includes(f.type) ||
        f.name.endsWith('.md') || f.name.endsWith('.txt');
      if (!isValidType) {
        toast.error(`${f.name}: unsupported file type`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: exceeds 50MB limit`);
        return false;
      }
      return true;
    });

    const remaining = MAX_FILES - documents.length;
    const toAdd = validFiles.slice(0, remaining);
    if (toAdd.length < validFiles.length) {
      toast.error(`Maximum ${MAX_FILES} documents. ${validFiles.length - toAdd.length} skipped.`);
    }

    for (const file of toAdd) {
      const contentType = inferContentType(file.type, file.name);

      let content: string;
      if (contentType === 'text') {
        // Text files — read as string
        content = await file.text();
      } else if (file.size > MAX_INLINE_SIZE) {
        // Large binary — upload to storage, pass URL
        try {
          const newDoc: QueuedDocument = {
            filename: file.name,
            content: '',
            content_type: contentType,
            mime_type: file.type || 'application/octet-stream',
            document_type_hint: 'general',
            size: file.size,
            status: 'uploading',
          };
          setDocuments(prev => [...prev, newDoc]);

          const url = await uploadToStorage(file);
          setDocuments(prev => prev.map(d =>
            d.filename === file.name && d.status === 'uploading'
              ? { ...d, content: url, status: 'queued' }
              : d
          ));
          continue; // Skip the normal add below
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
          setDocuments(prev => prev.filter(d => !(d.filename === file.name && d.status === 'uploading')));
          continue;
        }
      } else {
        // Small binary — inline base64
        const buffer = await file.arrayBuffer();
        content = arrayBufferToBase64(buffer);
      }

      const newDoc: QueuedDocument = {
        filename: file.name,
        content,
        content_type: contentType,
        mime_type: file.type || 'text/plain',
        document_type_hint: 'general',
        size: file.size,
        status: 'queued',
      };
      setDocuments(prev => [...prev, newDoc]);
    }

    if (toAdd.length > 0) {
      toast.success(`Added ${toAdd.length} document${toAdd.length > 1 ? 's' : ''}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFiles(files);
    e.target.value = '';
  };

  // --- Add from Google Drive ---
  const addDriveFile = () => {
    if (!driveFile) return;

    if (driveFileData && driveFileMimeType) {
      // Binary file from Drive (PDF, PPTX, etc.)
      const newDoc: QueuedDocument = {
        filename: driveFile.name,
        content: driveFileData, // already base64
        content_type: inferContentType(driveFileMimeType, driveFile.name),
        mime_type: driveFileMimeType,
        document_type_hint: 'general',
        size: Math.round(driveFileData.length * 0.75), // approximate decoded size
        status: 'queued',
      };
      setDocuments(prev => [...prev, newDoc]);
      toast.success(`Added ${driveFile.name} from Google Drive`);
    } else if (driveText) {
      // Text content from Drive (Google Docs, Slides export)
      const newDoc: QueuedDocument = {
        filename: driveFile.name,
        content: driveText,
        content_type: 'text',
        mime_type: 'text/plain',
        document_type_hint: 'general',
        size: new Blob([driveText]).size,
        status: 'queued',
      };
      setDocuments(prev => [...prev, newDoc]);
      toast.success(`Added ${driveFile.name} from Google Drive`);
    }
    resetPicker();
  };

  // --- Add pasted text ---
  const addPastedText = () => {
    if (!pasteText.trim()) {
      toast.error('Enter some text to add');
      return;
    }
    const filename = pasteFilename.trim() || `pasted-text-${Date.now()}.txt`;
    const newDoc: QueuedDocument = {
      filename,
      content: pasteText,
      content_type: 'text',
      mime_type: 'text/plain',
      document_type_hint: 'general',
      size: new Blob([pasteText]).size,
      status: 'queued',
    };
    setDocuments(prev => [...prev, newDoc]);
    setPasteText('');
    setPasteFilename('');
    toast.success(`Added "${filename}"`);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // --- Auto-classify documents before full analysis ---
  const handleClassify = async () => {
    const docsToClassify = documents.filter(d => d.status === 'queued');
    if (docsToClassify.length === 0) return;

    setStep('classify');
    setIsClassifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand-documents', {
        body: {
          brand_id: brandId,
          documents: docsToClassify.map(d => ({
            content: d.content,
            content_type: d.content_type,
            mime_type: d.mime_type,
            filename: d.filename,
          })),
          classify_only: true,
        },
      });

      if (error) throw error;

      if (data?.success && data.classifications) {
        setDocuments(prev => prev.map(d => {
          const classification = data.classifications.find(
            (c: { filename: string; document_type: string; confidence: number }) => c.filename === d.filename
          );
          if (classification && classification.confidence > 0.3) {
            return { ...d, document_type_hint: classification.document_type };
          }
          return d;
        }));
      }
    } catch (err) {
      console.error('Classification failed:', err);
      toast.error('Auto-classification failed — please select document types manually.');
    } finally {
      setIsClassifying(false);
    }
  };

  const updateDocumentType = (index: number, hint: string) => {
    setDocuments(prev => prev.map((d, i) => i === index ? { ...d, document_type_hint: hint } : d));
  };

  // --- Process documents with edge function ---
  const handleProcess = async () => {
    const docsToProcess = documents.filter(d => d.status === 'queued');
    if (docsToProcess.length === 0) {
      toast.error('No documents to process');
      return;
    }

    setStep('processing');
    setIsProcessing(true);

    // Mark all queued docs as analyzing
    setDocuments(prev => prev.map(d =>
      d.status === 'queued' ? { ...d, status: 'analyzing' as const } : d
    ));

    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand-documents', {
        body: {
          brand_id: brandId,
          documents: docsToProcess.map(d => ({
            content: d.content,
            content_type: d.content_type,
            mime_type: d.mime_type,
            filename: d.filename,
            document_type_hint: d.document_type_hint,
          })),
        },
      });

      if (error) throw error;

      if (data?.success && data.results) {
        // Update each document with its result
        const results = data.results as Array<{
          filename: string;
          analysis: Record<string, unknown>;
          document_type: string;
          document_summary: string;
          error?: string;
        }>;

        setDocuments(prev => prev.map(d => {
          const result = results.find(r => r.filename === d.filename);
          if (!result) return d;

          if (result.error) {
            return { ...d, status: 'failed' as const, error: result.error };
          }
          return {
            ...d,
            status: 'complete' as const,
            analysis: result.analysis,
            document_type_hint: result.document_type || d.document_type_hint,
          };
        }));

        const analyzed = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;

        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-analyses', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-stats', brandId] });

        if (analyzed > 0) {
          toast.success(`Analyzed ${analyzed} document${analyzed !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`);
          setStep('review');
        } else {
          toast.error('All documents failed to process');
          setStep('upload');
        }
      } else {
        throw new Error(data?.error || 'Analysis failed');
      }
    } catch (err) {
      toast.error(`Analysis failed: ${String(err)}`);
      setDocuments(prev => prev.map(d =>
        d.status === 'analyzing' ? { ...d, status: 'failed' as const, error: String(err) } : d
      ));
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Synthesize brand profile ---
  const handleSynthesize = async () => {
    setStep('synthesize');
    setIsSynthesizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('synthesize-brand-profile', {
        body: { brand_id: brandId },
      });

      if (error) throw error;

      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brandId] });
        queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-stats', brandId] });
        setStep('done');
        toast.success(`Brand profile synthesized — Confidence: ${Math.round((data.confidence_score || 0) * 100)}%`);
      } else {
        throw new Error(data?.error || 'Synthesis failed');
      }
    } catch (err) {
      toast.error(`Synthesis failed: ${String(err)}`);
      setStep('review');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // --- Computed ---
  const queuedCount = documents.filter(d => d.status === 'queued').length;
  const completedDocs = documents.filter(d => d.status === 'complete' && d.analysis);
  const anyUploading = documents.some(d => d.status === 'uploading');

  // Merge all extracted sections across all completed documents for review
  const extractedSections: Array<{ key: string; label: string; data: unknown; sources: string[] }> = [];
  for (const section of PROFILE_SECTIONS) {
    const sources: string[] = [];
    let mergedData: unknown = null;

    for (const doc of completedDocs) {
      const value = doc.analysis?.[section.key];
      if (value !== null && value !== undefined) {
        sources.push(doc.filename);
        // Use the last non-null value (or merge if we want to get fancy later)
        mergedData = value;
      }
    }

    if (mergedData !== null && hasPopulatedFields(mergedData)) {
      extractedSections.push({ key: section.key, label: section.label, data: mergedData, sources });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            Brand Intelligence Import
          </DialogTitle>
          <DialogDescription className="text-sm">
            Feed <strong className="text-foreground">{brandName}</strong>'s brand documents to Gemini — it extracts visual identity, tone of voice,
            photography standards, product specs, and more into a structured Brand DNA profile.
          </DialogDescription>
        </DialogHeader>

        {/* Pipeline stepper */}
        <div className="flex items-center gap-1 py-2 px-1">
          {PIPELINE_STEPS.map((ps, i) => {
            const stepOrder = ['upload', 'classify', 'processing', 'review', 'synthesize', 'done'];
            const currentIdx = stepOrder.indexOf(step);
            const isActive = ps.num - 1 === currentIdx || (step === 'done' && ps.num === 5);
            const isComplete = ps.num - 1 < currentIdx || step === 'done';
            return (
              <TooltipProvider key={ps.num} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                        isActive ? 'bg-primary text-primary-foreground shadow-sm' :
                        isComplete ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isComplete && !isActive ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <span className="w-3.5 text-center">{ps.num}</span>
                        )}
                        <span>{ps.label}</span>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-48">
                    {ps.detail}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        <div className="space-y-4">
          {/* ═══ Step: Upload ═══ */}
          {step === 'upload' && (
            <>
              {/* Guidance section — shown when no documents queued yet */}
              {documents.length === 0 && (
                <div className="space-y-3">
                  {/* What the system does */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10">
                    <div className="flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium">How Brand Intelligence Import works</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Upload brand documents and Gemini will read each one to extract structured brand data — visual identity,
                          color systems, typography, photography standards, tone of voice, product details, and corporate messaging.
                          The extracted data is merged into a unified <strong className="text-foreground">Brand DNA profile</strong> that
                          powers AI-generated creative across the platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended document types */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best documents to upload</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {RECOMMENDED_DOCUMENTS.map((doc) => (
                        <div key={doc.label} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <doc.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{doc.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-snug">{doc.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Tip:</strong> The more detailed the source material, the richer
                      the extraction. Official brand guidelines PDFs produce the best results. You can always
                      add more documents later — each import builds on the existing profile.
                    </p>
                  </div>
                </div>
              )}

              <Tabs value={inputTab} onValueChange={(v) => setInputTab(v as typeof inputTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="gdrive">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Google Drive
                  </TabsTrigger>
                  <TabsTrigger value="paste">
                    <FileText className="w-4 h-4 mr-2" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>

                {/* File Upload Tab */}
                <TabsContent value="upload" className="space-y-2">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Drop documents here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, PPTX, DOCX, TXT, MD — up to 50MB each, {MAX_FILES} files max
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </TabsContent>

                {/* Google Drive Tab */}
                <TabsContent value="gdrive" className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={openPicker}
                    disabled={isDriveLoading}
                    className="w-full"
                  >
                    {isDriveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading from Drive...
                      </>
                    ) : (
                      <>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Browse Google Drive
                      </>
                    )}
                  </Button>

                  {driveFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{driveFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {driveText ? `${driveText.length} characters (text)` :
                           driveFileData ? `${formatFileSize(Math.round(driveFileData.length * 0.75))} (binary)` :
                           'Loading...'}
                        </p>
                      </div>
                      <Button size="sm" onClick={addDriveFile} disabled={!driveText && !driveFileData}>
                        Add
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Google Docs and Slides are exported as text. PDFs and other binary files are sent directly to Gemini for analysis.
                  </p>
                </TabsContent>

                {/* Paste Text Tab */}
                <TabsContent value="paste" className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Paste excerpts from brand guidelines, creative briefs, messaging frameworks, or any text that defines the brand.
                  </p>
                  <div className="space-y-2">
                    <Label>Document name (optional)</Label>
                    <input
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={pasteFilename}
                      onChange={e => setPasteFilename(e.target.value)}
                      placeholder="e.g., brand-guidelines-excerpt.txt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      placeholder="Paste brand guidelines, photography rules, style specs, messaging frameworks..."
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={addPastedText}
                    disabled={!pasteText.trim()}
                  >
                    Add to Queue
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Document Queue */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{documents.length} document{documents.length !== 1 ? 's' : ''} queued</Label>
                    <span className="text-[10px] text-muted-foreground">{MAX_FILES - documents.length} slot{MAX_FILES - documents.length !== 1 ? 's' : ''} remaining</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)} · {doc.content_type.toUpperCase()}
                          </p>
                        </div>
                        <Select value={doc.document_type_hint} onValueChange={(v) => updateDocumentType(i, v)}>
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {doc.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <button
                          onClick={() => removeDocument(i)}
                          className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ Step: Classify ═══ */}
          {step === 'classify' && (
            <div className="space-y-4">
              {isClassifying ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="font-medium">Classifying documents...</span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm">
                      We've identified the document types below. Please confirm or change before processing.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {documents.filter(d => d.status === 'queued').map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                        <Select value={doc.document_type_hint} onValueChange={(v) => updateDocumentType(documents.indexOf(doc), v)}>
                          <SelectTrigger className="h-8 w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ Step: Processing ═══ */}
          {step === 'processing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="font-medium">Analyzing documents with Gemini...</span>
              </div>
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                    {doc.status === 'analyzing' && <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />}
                    {doc.status === 'complete' && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                    {doc.status === 'failed' && <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                    <span className="truncate flex-1">{doc.filename}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {doc.status === 'analyzing' ? 'Analyzing...' : doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Large documents may take 30-60 seconds each.
              </p>
            </div>
          )}

          {/* ═══ Step: Review ═══ */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Per-document summaries */}
              <div className="space-y-2">
                <Label>Processed Documents</Label>
                {documents.filter(d => d.status === 'complete').map((doc, i) => (
                  <div key={i} className="p-2 bg-muted/50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-medium truncate">{doc.filename}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {(doc.analysis?.document_type as string) || doc.document_type_hint}
                      </Badge>
                    </div>
                    {doc.analysis?.document_summary && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {doc.analysis.document_summary as string}
                      </p>
                    )}
                  </div>
                ))}
                {documents.filter(d => d.status === 'failed').map((doc, i) => (
                  <div key={`f-${i}`} className="p-2 bg-destructive/5 border border-destructive/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <span className="font-medium truncate">{doc.filename}</span>
                    </div>
                    <p className="text-xs text-destructive mt-1 ml-6">{doc.error}</p>
                  </div>
                ))}
              </div>

              {/* Extracted sections (read-only confirmation) */}
              {extractedSections.length > 0 && (
                <div className="space-y-2">
                  <Label>Extracted Brand Data</Label>
                  <p className="text-xs text-muted-foreground">
                    {extractedSections.length} section{extractedSections.length !== 1 ? 's' : ''} extracted — these will be merged into the brand profile.
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {extractedSections.map(section => (
                      <div
                        key={section.key}
                        className="p-3 rounded-lg border bg-card border-border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="font-medium text-sm">{section.label}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            from: {section.sources.join(', ')}
                          </span>
                        </div>
                        <div className="mt-1 ml-6 text-xs text-muted-foreground max-h-20 overflow-hidden">
                          <pre className="whitespace-pre-wrap font-mono">
                            {JSON.stringify(section.data, null, 2).slice(0, 300)}
                            {JSON.stringify(section.data, null, 2).length > 300 ? '...' : ''}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Step: Synthesize ═══ */}
          {step === 'synthesize' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <div className="text-center space-y-1">
                <p className="font-medium">Synthesizing brand profile...</p>
                <p className="text-sm text-muted-foreground">
                  Merging document analyses with existing brand data
                </p>
              </div>
            </div>
          )}

          {/* ═══ Step: Done ═══ */}
          {step === 'done' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Brand profile updated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {completedDocs.length} document{completedDocs.length !== 1 ? 's' : ''} analyzed and merged into {brandName}'s brand profile. You can import more documents at any time.
                </p>
              </div>

              {/* Quick Starters generation */}
              {!generatedStarters && (
                <div className="p-4 border border-dashed rounded-lg space-y-2">
                  <p className="text-sm font-medium">Generate Quick Starters?</p>
                  <p className="text-xs text-muted-foreground">
                    Create Director Mode Quick Starters from {brandName}'s Brand DNA — AI-crafted creative briefs tailored to the brand's products and visual style.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const starters = await generateStartersMutation.mutateAsync(brandId);
                        setGeneratedStarters(starters);
                        setStarterSelection(new Set(starters.map((_, i) => i)));
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to generate starters');
                      }
                    }}
                    disabled={generateStartersMutation.isPending}
                  >
                    {generateStartersMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Generating starters...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3 mr-1" />
                        Generate Quick Starters from Brand DNA
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Inline starter preview */}
              {generatedStarters && generatedStarters.length > 0 && (
                <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Wand2 className="h-4 w-4 text-purple-500" />
                      {generatedStarters.length} Quick Starters Generated
                    </p>
                    <button
                      onClick={() => {
                        if (starterSelection.size === generatedStarters.length) {
                          setStarterSelection(new Set());
                        } else {
                          setStarterSelection(new Set(generatedStarters.map((_, i) => i)));
                        }
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {starterSelection.size === generatedStarters.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-1.5">
                      {generatedStarters.map((starter, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            starterSelection.has(i) ? 'bg-purple-500/10' : 'opacity-50'
                          }`}
                          onClick={() => {
                            setStarterSelection(prev => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }}
                        >
                          <Checkbox
                            checked={starterSelection.has(i)}
                            onCheckedChange={() => {
                              setStarterSelection(prev => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i);
                                else next.add(i);
                                return next;
                              });
                            }}
                            className="shrink-0"
                          />
                          <span className="text-xs font-medium truncate">{starter.name}</span>
                          <span className="text-[10px] text-muted-foreground capitalize shrink-0">{starter.category}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Button
                    size="sm"
                    onClick={async () => {
                      setSavingStarters(true);
                      try {
                        let count = 0;
                        for (const index of starterSelection) {
                          const s = generatedStarters[index];
                          if (!s) continue;
                          await createPromptMutation.mutateAsync({
                            brand_id: brandId,
                            name: s.name,
                            description: s.description || undefined,
                            category: s.category || undefined,
                            prompt_template: s.prompt_template,
                            camera_preset: s.camera_preset || undefined,
                            is_auto_generated: true,
                          });
                          count++;
                        }
                        toast.success(`${count} Quick Starters saved — find them in Director Mode`);
                        setGeneratedStarters(null);
                        setStarterSelection(new Set());
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to save starters');
                      } finally {
                        setSavingStarters(false);
                      }
                    }}
                    disabled={savingStarters || starterSelection.size === 0}
                  >
                    {savingStarters ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Save {starterSelection.size} Starter{starterSelection.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {step === 'done' ? 'Done' : 'Close'}
          </Button>
          {step === 'upload' && (
            <Button
              onClick={handleClassify}
              disabled={isClassifying || anyUploading || queuedCount === 0}
            >
              {isClassifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Classifying...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Classify {queuedCount} Document{queuedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
          {step === 'classify' && !isClassifying && (
            <Button
              onClick={handleProcess}
              disabled={isProcessing || queuedCount === 0}
            >
              <Brain className="h-4 w-4 mr-2" />
              Process {queuedCount} Document{queuedCount !== 1 ? 's' : ''}
            </Button>
          )}
          {step === 'review' && (
            <Button onClick={handleSynthesize} disabled={isSynthesizing || completedDocs.length === 0}>
              {isSynthesizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Confirm & Synthesize
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
