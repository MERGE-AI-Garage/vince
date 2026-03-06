// ABOUTME: Reusable chat message bubble component for AI assistants
// ABOUTME: Supports configurable agent name, icon, and styling via props

import React from 'react';
import { User, Brain, Paperclip, RotateCw, LucideIcon } from 'lucide-react';
import { Message } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  agentName?: string;
  agentIcon?: LucideIcon;
  userAvatarUrl?: string;
  compact?: boolean;
  onRetry?: () => void;
  markdownComponents?: Record<string, React.ComponentType<any>>;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  agentName = 'Assistant',
  agentIcon: AgentIcon = Brain,
  userAvatarUrl,
  compact = false,
  onRetry,
  markdownComponents,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${compact ? 'mb-2' : 'mb-4'} ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex ${isUser ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[95%]'} ${isUser ? 'flex-row-reverse' : 'flex-row'} ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${compact ? 'h-6 w-6' : 'h-8 w-8'} rounded-full flex items-center justify-center overflow-hidden ${
            isUser ? 'bg-muted' : 'bg-gradient-to-br from-merge-viridian-green to-merge-dark-green'
          } shadow-md`}>
          {isUser ? (
            userAvatarUrl ? (
              <img src={userAvatarUrl} alt="You" className="w-full h-full object-cover" />
            ) : (
              <User className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
            )
          ) : (
            <AgentIcon className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          <div className={`rounded-xl shadow-sm leading-relaxed overflow-hidden ${
              compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
            } ${
              isUser
                ? 'bg-merge-viridian-green text-white rounded-tr-sm'
                : 'bg-card border border-border text-foreground rounded-tl-sm'
            }`}>

            {/* Attachments Display */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="bg-black/20 rounded p-2 flex items-center gap-2 text-xs">
                    <Paperclip className="w-4 h-4 text-accent" />
                    <span className="truncate max-w-[150px]">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Markdown Content */}
            <div className={`prose prose-sm max-w-full break-words
              ${compact ? 'text-xs [&>*]:text-xs' : ''}
              prose-p:my-1 prose-p:leading-relaxed
              prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:first:mt-0
              ${compact
                ? 'prose-h1:text-xs prose-h2:text-xs prose-h3:text-xs'
                : 'prose-h1:text-base prose-h2:text-sm prose-h3:text-sm'
              }
              prose-ul:my-1.5 prose-ul:pl-4 prose-li:my-0.5
              prose-strong:font-semibold
              prose-hr:my-3 prose-hr:border-border/50
              prose-code:text-xs prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded
              prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/30 prose-pre:text-xs prose-pre:overflow-x-auto
              ${isUser ? 'prose-invert' : 'prose-headings:text-foreground'}
            `}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Streaming indicator — animated dots when waiting, blinking cursor once text arrives */}
            {message.isStreaming && !message.content && (
              <div className="flex items-center gap-1.5 py-1">
                <span className="text-xs text-muted-foreground/70">{agentName} is thinking</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00856C] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00856C] animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00856C] animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
                </span>
              </div>
            )}
            {message.isStreaming && message.content && (
              <span className="inline-block w-2 h-4 ml-1 bg-accent animate-pulse align-middle"></span>
            )}

            {/* Retry Button */}
            {message.isError && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>

          <span className="text-[10px] text-muted-foreground/80 mt-1 px-1">
            {message.role === 'model' ? agentName : 'You'} • {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
      </div>
    </div>
  );
};
