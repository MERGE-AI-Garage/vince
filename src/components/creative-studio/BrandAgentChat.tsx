// ABOUTME: Conversational Brand Agent chat panel for natural language prompt generation
// ABOUTME: Users describe what they want, the agent builds technical prompts with camera presets

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, Camera, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CameraPreset } from '@/types/creative-studio';

interface AgentMessage {
  role: 'user' | 'agent';
  text: string;
  prompt?: string;
  camera_preset?: CameraPreset;
  recommended_model?: string;
  compliance_notes?: string[];
  reasoning?: string;
  timestamp: string;
}

interface BrandAgentChatProps {
  brandId: string;
  brandName: string;
  onApplyPrompt: (prompt: string) => void;
  onApplyCameraPreset?: (preset: CameraPreset) => void;
  onApplyModel?: (modelId: string) => void;
}

export function BrandAgentChat({
  brandId,
  brandName,
  onApplyPrompt,
  onApplyCameraPreset,
  onApplyModel,
}: BrandAgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = chatEndRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: AgentMessage = {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('brand-prompt-agent', {
        body: {
          brand_id: brandId,
          user_message: text,
        },
      });

      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data.success) throw new Error(data.error || 'Agent failed');

      const agentMsg: AgentMessage = {
        role: 'agent',
        text: data.reasoning || 'Here\'s your prompt:',
        prompt: data.prompt,
        camera_preset: data.camera_preset,
        recommended_model: data.recommended_model,
        compliance_notes: data.compliance_notes,
        reasoning: data.reasoning,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to get agent response');
      const errorMsg: AgentMessage = {
        role: 'agent',
        text: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, brandId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Vince</h3>
        <Badge variant="secondary" className="text-[9px]">{brandName}</Badge>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-2 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Bot className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">
              Describe what you need and I'll build the prompt with brand-compliant settings.
            </p>
            <div className="space-y-1.5">
              {[
                `Hero shot of the flagship product for Instagram`,
                `Lifestyle scene with the product in a natural setting`,
                `Close-up product shot for print campaign`,
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="block w-full text-left px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'agent' && (
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-1.5 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-lg rounded-br-sm px-3 py-2'
                : 'space-y-2'
            }`}>
              <p className="text-xs">{msg.text}</p>

              {/* Generated prompt */}
              {msg.prompt && (
                <div className="p-2 bg-muted/80 rounded border text-[11px] font-mono leading-relaxed text-foreground">
                  {msg.prompt}
                  <div className="flex gap-1.5 mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onApplyPrompt(msg.prompt!)}
                      className="h-6 text-[9px] gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Use Prompt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPrompt(msg.prompt!, i)}
                      className="h-6 text-[9px] gap-1"
                    >
                      {copiedIndex === i ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera preset */}
              {msg.camera_preset && (
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">
                    f/{msg.camera_preset.aperture} | {msg.camera_preset.focal_length}mm | {msg.camera_preset.lighting_setup?.replace(/_/g, ' ')}
                  </span>
                  {onApplyCameraPreset && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onApplyCameraPreset(msg.camera_preset!)}
                      className="h-5 text-[8px] px-1.5"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              )}

              {/* Compliance notes */}
              {msg.compliance_notes && msg.compliance_notes.length > 0 && (
                <div className="text-[9px] text-yellow-600 dark:text-yellow-400 space-y-0.5">
                  {msg.compliance_notes.map((note, j) => (
                    <p key={j}>- {note}</p>
                  ))}
                </div>
              )}

              {/* Recommended model */}
              {msg.recommended_model && onApplyModel && (
                <button
                  onClick={() => onApplyModel(msg.recommended_model!)}
                  className="text-[9px] text-primary hover:underline"
                >
                  Recommended: {msg.recommended_model}
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            </div>
            <div className="text-xs text-muted-foreground animate-pulse">
              Thinking...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-2">
        <div className="flex gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you need..."
            rows={1}
            className="flex-1 px-2.5 py-1.5 bg-background border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary text-xs placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 p-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
