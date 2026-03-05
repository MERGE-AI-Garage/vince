// ABOUTME: MITCH AI tutor sidebar panel for lab exercises in Creative Studio
// ABOUTME: Text-only chat grounded in lab instructions and evaluation criteria

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, X, Loader2, FlaskConical, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/components/shared-chat/ChatMessage';
import type { Message } from '@/components/shared-chat/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  createTutorConversation,
  sendTutorMessage,
  generateTutorGreeting,
  type TutorContext,
} from '@/services/tutor';
import type { ProgramModule, EnablementProgram, LabConfig } from '@/hooks/useEnablementPrograms';

interface LabTutorPanelProps {
  module: ProgramModule;
  program: EnablementProgram;
  labConfig: LabConfig;
  onClose: () => void;
  generationCount?: number;
  evaluationScore?: number | null;
  evaluationFeedback?: string | null;
}

const LAB_QUICK_PROMPTS = [
  'How can I improve my composition?',
  'What makes a strong product shot?',
  'Help me refine my prompt',
  'Explain this evaluation criterion',
];

export function LabTutorPanel({ module, program, labConfig, onClose, generationCount = 0, evaluationScore, evaluationFeedback }: LabTutorPanelProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

  const learnerName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Student'
    : 'Student';

  const tutorContext: TutorContext = useMemo(() => ({
    userId: user?.id || '',
    moduleId: module.id,
    moduleTitle: module.title,
    moduleType: 'exercise',
    contentMarkdown: [
      module.content_markdown || '',
      `\n\n## Lab Exercise: ${labConfig.title}`,
      `\nObjective: ${labConfig.objective}`,
      `\nInstructions:\n${labConfig.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `\nEvaluation Criteria:\n${labConfig.evaluation_criteria.map(c => `- ${c.name} (${Math.round(c.weight * 100)}%): ${c.description}`).join('\n')}`,
      `\n\n## Student Progress`,
      `\nGenerations so far: ${generationCount}`,
      `\nMinimum required: ${labConfig.constraints?.min_generations || 1}`,
      evaluationScore != null ? `\nEvaluation score: ${evaluationScore}/100` : '',
      evaluationFeedback ? `\nEvaluation feedback: ${evaluationFeedback}` : '',
    ].join(''),
    programId: program.id,
    programName: program.name,
    learnerName,
    learnerTitle: profile?.title || undefined,
    learnerDepartment: profile?.department || undefined,
    learnerExperienceLevel: profile?.experience_level || undefined,
    learnerTools: (profile?.current_tools as string[]) || undefined,
    learnerInterests: (profile?.interests as string[]) || undefined,
  }), [
    user?.id, module.id, module.title, module.content_markdown,
    labConfig.title, labConfig.objective, labConfig.instructions, labConfig.evaluation_criteria,
    labConfig.constraints?.min_generations, generationCount, evaluationScore, evaluationFeedback,
    program.id, program.name, learnerName,
    profile?.title, profile?.department, profile?.experience_level,
    profile?.current_tools, profile?.interests,
  ]);

  // Initialize conversation and greeting on mount
  useEffect(() => {
    if (!user || conversationId) return;

    let cancelled = false;
    (async () => {
      try {
        const id = await createTutorConversation(user.id, module.id, program.id);
        if (cancelled) return;
        setConversationId(id);

        const greeting = await generateTutorGreeting(tutorContext);
        if (cancelled) return;
        setMessages([
          { id: uuidv4(), role: 'model', content: greeting, timestamp: new Date() },
        ]);
      } catch (err) {
        console.error('[LabTutor] Failed to initialize:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, module.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input after loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !user || !conversationId) return;

    const userMsg: Message = {
      id: uuidv4(), role: 'user', content: text, timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const streamingId = uuidv4();
    setMessages((prev) => [
      ...prev,
      { id: streamingId, role: 'model', content: '', timestamp: new Date(), isStreaming: true },
    ]);

    try {
      const response = await sendTutorMessage(
        text, conversationId, user.id, tutorContext,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, content: m.content + chunk } : m),
          );
        },
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId ? { ...m, content: response.content, isStreaming: false } : m,
        ),
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[LabTutor] Send error:', errorMsg, err);
      lastFailedMessageRef.current = text;

      let displayMsg: string;
      if (errorMsg.includes('Not authenticated') || errorMsg.includes('401')) {
        displayMsg = 'Your session expired — please refresh the page and try again.';
      } else if (errorMsg.includes('Stream ended without')) {
        displayMsg = "Mitch didn't respond — please try again.";
      } else {
        displayMsg = `Something went wrong: ${errorMsg}`;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? { ...m, content: displayMsg, isStreaming: false, isError: true }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId, tutorContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleRetry = useCallback((messageId: string) => {
    const failedText = lastFailedMessageRef.current;
    if (failedText) {
      lastFailedMessageRef.current = null;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      handleSendMessage(failedText);
    }
  }, [handleSendMessage]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          <span className="text-sm font-medium">MITCH</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1 text-amber-600 border-amber-300">
            <FlaskConical className="w-2.5 h-2.5" />
            Lab
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          aria-label="Close tutor"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            agentName="Mitch"
            agentIcon={Sparkles}
            compact
            onRetry={msg.isError ? () => handleRetry(msg.id) : undefined}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {!isLoading && (
        <div className="flex flex-wrap gap-1 px-2 py-2 border-t bg-muted/10 flex-shrink-0">
          {LAB_QUICK_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="text-[11px] h-auto py-1 px-2 bg-background"
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-muted/30 p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Mitch about the lab..."
            disabled={isLoading || !conversationId}
            className="text-sm h-9"
          />
          <Button
            size="icon"
            className="h-9 w-9 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim() || !conversationId}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
