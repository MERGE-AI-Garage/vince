// ABOUTME: Dialog for creating and editing brand agent directives
// ABOUTME: Supports rules, forbidden combinations, required elements with dynamic list management

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { AgentDirective } from '@/types/creative-studio';
import {
  useCreateAgentDirective,
  useUpdateAgentDirective,
  type CreateDirectiveInput,
} from '@/hooks/useCreativeStudioDirectives';

interface AgentDirectiveEditorProps {
  brandId: string;
  directive?: AgentDirective | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RuleEntry = { rule: string; severity: 'error' | 'warning' | 'info'; category?: string };
type ForbiddenEntry = { items: string[]; reason: string };
type RequiredEntry = { element: string; when?: string };

export function AgentDirectiveEditor({ brandId, directive, open, onOpenChange }: AgentDirectiveEditorProps) {
  const createMutation = useCreateAgentDirective();
  const updateMutation = useUpdateAgentDirective();

  const isEdit = !!directive;

  const [name, setName] = useState('');
  const [persona, setPersona] = useState('');
  const [toneGuidelines, setToneGuidelines] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [rules, setRules] = useState<RuleEntry[]>([]);
  const [forbidden, setForbidden] = useState<ForbiddenEntry[]>([]);
  const [required, setRequired] = useState<RequiredEntry[]>([]);

  useEffect(() => {
    if (directive) {
      setName(directive.name);
      setPersona(directive.persona);
      setToneGuidelines(directive.tone_guidelines || '');
      setIsActive(directive.is_active);
      setRules(directive.rules || []);
      setForbidden(directive.forbidden_combinations || []);
      setRequired(directive.required_elements || []);
    } else {
      setName('');
      setPersona('');
      setToneGuidelines('');
      setIsActive(true);
      setRules([{ rule: '', severity: 'warning', category: '' }]);
      setForbidden([]);
      setRequired([]);
    }
  }, [directive, open]);

  const handleSave = async () => {
    if (!name.trim() || !persona.trim()) {
      toast.error('Name and persona are required');
      return;
    }

    const cleanedRules = rules.filter(r => r.rule.trim());
    const cleanedForbidden = forbidden.filter(f => f.items.length > 0 && f.reason.trim());
    const cleanedRequired = required.filter(r => r.element.trim());

    try {
      if (isEdit && directive) {
        await updateMutation.mutateAsync({
          id: directive.id,
          brandId,
          updates: {
            name: name.trim(),
            persona: persona.trim(),
            tone_guidelines: toneGuidelines.trim() || undefined,
            is_active: isActive,
            rules: cleanedRules,
            forbidden_combinations: cleanedForbidden.length > 0 ? cleanedForbidden : undefined,
            required_elements: cleanedRequired.length > 0 ? cleanedRequired : undefined,
          },
        });
        toast.success('Directive updated');
      } else {
        const input: CreateDirectiveInput = {
          brand_id: brandId,
          name: name.trim(),
          persona: persona.trim(),
          rules: cleanedRules,
          is_active: isActive,
        };
        if (toneGuidelines.trim()) input.tone_guidelines = toneGuidelines.trim();
        if (cleanedForbidden.length > 0) input.forbidden_combinations = cleanedForbidden;
        if (cleanedRequired.length > 0) input.required_elements = cleanedRequired;

        await createMutation.mutateAsync(input);
        toast.success('Directive created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to save directive: ${String(err)}`);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {isEdit ? 'Edit Directive' : 'Create Directive'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Basic info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Food Stylist Rules" />
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label className="text-sm">Active</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Persona</Label>
                <Input value={persona} onChange={e => setPersona(e.target.value)} placeholder="e.g., Senior Food Stylist with 20 years of brand photography experience" />
              </div>

              <div className="space-y-2">
                <Label>Tone Guidelines</Label>
                <Textarea value={toneGuidelines} onChange={e => setToneGuidelines(e.target.value)} placeholder="Overall creative direction and tone for this brand..." rows={3} />
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Rules</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRules([...rules, { rule: '', severity: 'warning', category: '' }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Rule
                </Button>
              </div>

              {rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={rule.rule}
                      onChange={e => {
                        const updated = [...rules];
                        updated[i] = { ...updated[i], rule: e.target.value };
                        setRules(updated);
                      }}
                      placeholder="Describe the rule..."
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Select
                        value={rule.severity}
                        onValueChange={(val: 'error' | 'warning' | 'info') => {
                          const updated = [...rules];
                          updated[i] = { ...updated[i], severity: val };
                          setRules(updated);
                        }}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="error">
                            <Badge variant="destructive" className="text-[10px]">Error</Badge>
                          </SelectItem>
                          <SelectItem value="warning">
                            <Badge className="text-[10px] bg-amber-500">Warning</Badge>
                          </SelectItem>
                          <SelectItem value="info">
                            <Badge variant="secondary" className="text-[10px]">Info</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={rule.category || ''}
                        onChange={e => {
                          const updated = [...rules];
                          updated[i] = { ...updated[i], category: e.target.value };
                          setRules(updated);
                        }}
                        placeholder="Category (optional)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setRules(rules.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Forbidden Combinations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Forbidden Combinations</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForbidden([...forbidden, { items: [], reason: '' }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {forbidden.map((combo, i) => (
                <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={combo.items.join(', ')}
                      onChange={e => {
                        const updated = [...forbidden];
                        updated[i] = { ...updated[i], items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                        setForbidden(updated);
                      }}
                      placeholder="Items (comma-separated)"
                      className="text-sm"
                    />
                    <Input
                      value={combo.reason}
                      onChange={e => {
                        const updated = [...forbidden];
                        updated[i] = { ...updated[i], reason: e.target.value };
                        setForbidden(updated);
                      }}
                      placeholder="Reason this combination is forbidden..."
                      className="text-sm"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setForbidden(forbidden.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Required Elements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Required Elements</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRequired([...required, { element: '', when: '' }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {required.map((req, i) => (
                <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={req.element}
                      onChange={e => {
                        const updated = [...required];
                        updated[i] = { ...updated[i], element: e.target.value };
                        setRequired(updated);
                      }}
                      placeholder="Required element..."
                      className="text-sm"
                    />
                    <Input
                      value={req.when || ''}
                      onChange={e => {
                        const updated = [...required];
                        updated[i] = { ...updated[i], when: e.target.value };
                        setRequired(updated);
                      }}
                      placeholder="When required (optional condition)..."
                      className="text-sm"
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setRequired(required.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Update Directive' : 'Create Directive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
