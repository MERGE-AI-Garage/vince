// ABOUTME: Detail dialog for reviewing a single agent conversation transcript
// ABOUTME: Shows conversation messages with metadata badges and user/assistant avatars

import { format } from 'date-fns';
import { MessageSquare, User, Bot, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { ConversationRecord, ConversationMessage } from '@/services/conversationService';

interface ConversationDetailDialogProps {
  conversation: ConversationRecord | null;
  agentLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationDetailDialog({ conversation, agentLabel, open, onOpenChange }: ConversationDetailDialogProps) {
  if (!conversation) return null;

  const messages = conversation.messages ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            Conversation — {conversation.user_name || 'Unknown User'}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground pt-1">
            <span>{format(new Date(conversation.created_at), 'MMM d, yyyy h:mm a')}</span>
            {conversation.user_email && (
              <span className="text-xs">({conversation.user_email})</span>
            )}
          </div>
        </DialogHeader>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          <Badge variant="outline" className="bg-muted/50">
            <MessageSquare className="mr-1 h-3 w-3" />
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </Badge>
          {conversation.tool_calls_count > 0 && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
              <Wrench className="mr-1 h-3 w-3" />
              {conversation.tool_calls_count} tool call{conversation.tool_calls_count !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-2">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages recorded for this conversation.
            </p>
          ) : (
            messages.map((msg: ConversationMessage, i: number) => (
              <div key={i} className="flex gap-3">
                <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {msg.role === 'user' ? conversation.user_name || 'User' : agentLabel}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-muted-foreground/60">
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
