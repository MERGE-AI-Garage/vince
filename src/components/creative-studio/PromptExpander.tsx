// ABOUTME: Prompt enhancement presets (inspired by Google Flow "Expand" feature)
// ABOUTME: Popover with preset and custom prompt templates that augment the user's prompt

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Image, Video, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ExpanderCategory = 'image' | 'video' | 'both';

interface PromptExpanderRecord {
  id: string;
  name: string;
  content: string;
  category: ExpanderCategory;
  is_preset: boolean;
}

interface PromptExpanderProps {
  currentPrompt: string;
  onExpandPrompt: (expanded: string) => void;
  mode: 'image' | 'video';
}

const CATEGORY_ICONS: Record<ExpanderCategory, React.ReactNode> = {
  image: <Image className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  both: <Layers className="w-3 h-3" />,
};

export function PromptExpander({ currentPrompt, onExpandPrompt, mode }: PromptExpanderProps) {
  const { user } = useAuth();
  const [expanders, setExpanders] = useState<PromptExpanderRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ExpanderCategory>('both');

  useEffect(() => {
    if (!open) return;
    loadExpanders();
  }, [open]);

  const loadExpanders = async () => {
    const { data, error } = await supabase
      .from('creative_studio_prompt_expanders' as any)
      .select('id, name, content, category, is_preset')
      .or(`category.eq.${mode},category.eq.both`)
      .order('is_preset', { ascending: false })
      .order('name');

    if (error) {
      console.error('Failed to load expanders:', error);
      return;
    }
    setExpanders((data as any[]) ?? []);
  };

  const handleSelect = (expander: PromptExpanderRecord) => {
    const separator = currentPrompt.trim() ? '. ' : '';
    onExpandPrompt(currentPrompt.trim() + separator + expander.content);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newContent.trim() || !user) return;

    const { error } = await supabase
      .from('creative_studio_prompt_expanders' as any)
      .insert({
        user_id: user.id,
        name: newName.trim(),
        content: newContent.trim(),
        category: newCategory,
        is_preset: false,
      });

    if (error) {
      toast.error('Failed to create expander');
      return;
    }

    toast.success('Expander created');
    setNewName('');
    setNewContent('');
    setNewCategory('both');
    setShowCreateDialog(false);
    loadExpanders();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('creative_studio_prompt_expanders' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete expander');
      return;
    }
    setExpanders(prev => prev.filter(e => e.id !== id));
  };

  const presets = expanders.filter(e => e.is_preset);
  const custom = expanders.filter(e => !e.is_preset);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'absolute top-2 left-2 p-1.5 rounded-md transition-all',
                  'text-muted-foreground/50 hover:text-primary hover:bg-primary/10',
                  open && 'text-primary bg-primary/10'
                )}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Expand prompt with style presets
          </TooltipContent>
        </Tooltip>

        <PopoverContent side="top" align="start" className="w-80 p-0">
          <div className="p-3 border-b">
            <h4 className="text-sm font-medium">Prompt Expanders</h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Add style and quality modifiers to your prompt
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* Presets */}
            {presets.length > 0 && (
              <div className="p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground px-1 mb-1">Presets</p>
                {presets.map((expander) => (
                  <button
                    key={expander.id}
                    onClick={() => handleSelect(expander)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-xs font-medium">{expander.name}</span>
                      <Badge variant="outline" className="text-[8px] ml-auto gap-0.5 px-1 py-0">
                        {CATEGORY_ICONS[expander.category]}
                        {expander.category}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 pl-5 line-clamp-2">
                      {expander.content}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Custom */}
            {custom.length > 0 && (
              <div className="p-2 border-t">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground px-1 mb-1">Custom</p>
                {custom.map((expander) => (
                  <div
                    key={expander.id}
                    className="flex items-start gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <button
                      onClick={() => handleSelect(expander)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{expander.name}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {expander.content}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(expander.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create new */}
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                setShowCreateDialog(true);
              }}
              className="w-full h-8 text-xs gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Create Expander
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Expander Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Prompt Expander</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Retro Poster"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Content</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Describe the style, mood, lighting, composition..."
                rows={4}
                className="text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                This text will be appended to your prompt when selected.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as ExpanderCategory)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (Image + Video)</SelectItem>
                  <SelectItem value="image">Image Only</SelectItem>
                  <SelectItem value="video">Video Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || !newContent.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
