// ABOUTME: Chat-style panel for Gemini multi-turn image editing
// ABOUTME: Maintains conversation with thought signatures for iterative edits

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Info,
  ChevronDown,
} from 'lucide-react';

export interface ConversationTurn {
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  imageBase64?: string;
  thoughtSignature?: string;
  timestamp: string;
}

interface ConversationalEditPanelProps {
  turns: ConversationTurn[];
  onSendMessage: (message: string) => void;
  onStartFresh: () => void;
  onLoadImage: (url: string) => void;
  isGenerating: boolean;
  currentThoughtSignature?: string;
}

export function ConversationalEditPanel({
  turns,
  onSendMessage,
  onStartFresh,
  onLoadImage,
  isGenerating,
  currentThoughtSignature,
}: ConversationalEditPanelProps) {
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new turns
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isGenerating) return;
    onSendMessage(trimmed);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-xl rounded-lg border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Conversational Edit</span>
          {currentThoughtSignature && (
            <Badge variant="secondary" className="text-[8px]">Context Active</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[9px]">
            {turns.length} turns
          </Badge>
          {turns.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={onStartFresh}
              title="Start fresh conversation"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Conversation area */}
      <ScrollArea className="flex-1 px-3">
        <div ref={scrollRef} className="py-2 space-y-3">
          {turns.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground opacity-30" />
              <p className="text-xs text-muted-foreground">Start a conversation to create and refine images</p>
              <div className="flex items-start gap-1.5 mx-auto max-w-[220px] p-2 bg-muted/50 rounded-lg text-[10px] text-muted-foreground text-left">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>Describe what you want, then iteratively refine: "make the sky warmer", "add a person on the left", etc.</span>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {[
                  'A cozy cabin in a snowy forest',
                  'Modern product flat-lay on marble',
                  'Vibrant street food market',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setMessage(suggestion)}
                    className="text-[10px] px-2 py-1 rounded-full border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            turns.map((turn, i) => (
              <div
                key={i}
                className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2 space-y-1.5 ${
                    turn.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {turn.text && (
                    <p className="text-xs leading-relaxed">{turn.text}</p>
                  )}
                  {(turn.imageUrl || turn.imageBase64) && (
                    <div
                      className="relative aspect-square max-w-[150px] rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => {
                        const url = turn.imageUrl || turn.imageBase64;
                        if (url) onLoadImage(url);
                      }}
                    >
                      <img
                        src={turn.imageUrl || turn.imageBase64}
                        alt={`Turn ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0.5 left-0.5">
                        <Badge variant="secondary" className="text-[7px] bg-black/50 text-white">
                          <ImageIcon className="w-2 h-2 mr-0.5" />
                          Click to load
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className={`text-[8px] opacity-60 ${turn.role === 'user' ? 'text-right' : ''}`}>
                    {formatTime(turn.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-2 border-t border-border/30">
        <div className="flex gap-1.5">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              turns.length === 0
                ? 'Describe what you want to create...'
                : 'Describe what to change...'
            }
            rows={1}
            className="flex-1 px-2.5 py-1.5 bg-background/50 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 text-xs min-h-[32px] max-h-[80px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 80) + 'px';
            }}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={!message.trim() || isGenerating}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
