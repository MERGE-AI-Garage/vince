// ABOUTME: Reusable chat input area with file upload, Drive picker, voice agent, and dictation
// ABOUTME: Supports configurable placeholder text, disclaimer, and voice button styles via props

import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Mic, MicOff, Paperclip, Send, Loader2, X, FileText, AudioLines } from 'lucide-react';
import { Attachment, DriveFile } from './types';
import { DrivePicker } from './DrivePicker';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStartVoice: () => void;
  onFileCollected?: (file: File) => void;
  isLoading: boolean;
  showVoiceButton?: boolean;
  showDriveButton?: boolean;
  showAttachButton?: boolean;
  showDictationButton?: boolean;
  voiceButtonLabel?: string;
  placeholder?: string;
  disclaimer?: string;
  sendButtonClassName?: string;
  inModal?: boolean;
  compact?: boolean;
}

// Check for Web Speech API availability
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onStartVoice,
  onFileCollected,
  isLoading,
  showVoiceButton = true,
  showDriveButton = true,
  showAttachButton = true,
  showDictationButton = false,
  voiceButtonLabel,
  placeholder = 'Type your message...',
  disclaimer = 'AI can make mistakes. Review responses carefully.',
  sendButtonClassName,
  inModal = false,
  compact = false,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasLoadingRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Auto-focus textarea when agent finishes responding
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      textareaRef.current?.focus();
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleDictation = useCallback(() => {
    if (!SpeechRecognition) return;

    if (isDictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = text;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interim = transcript;
        }
      }
      const combined = finalTranscript + (interim ? ' ' + interim : '');
      setText(combined);
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }
    };

    recognition.onerror = () => {
      setIsDictating(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsDictating(false);
      recognitionRef.current = null;
      textareaRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsDictating(true);
  }, [isDictating, text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (onFileCollected) {
        onFileCollected(file);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64String = (event.target.result as string).split(',')[1];
          const newAttachment: Attachment = {
            name: file.name,
            mimeType: file.type,
            data: base64String,
          };
          setAttachments(prev => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDriveSelect = (file: DriveFile) => {
    // Convert simulated Drive file to Attachment format for the chat context
    const newAttachment: Attachment = {
      name: file.name,
      mimeType: 'text/plain', // Treating content as text for this simulation
      data: btoa(file.content) // Encode mock content as base64
    };
    setAttachments(prev => [...prev, newAttachment]);
    setIsDriveOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    // Stop dictation if active
    if (isDictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
    }
    onSendMessage(text, attachments);
    setText('');
    setAttachments([]);
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // Voice button renders as a pill below the input when voiceButtonLabel is provided
  const renderAsVoicePill = showVoiceButton && voiceButtonLabel && !compact;
  const canDictate = showDictationButton && SpeechRecognition && !compact;

  return (
    <>
      <DrivePicker
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
        onSelect={handleDriveSelect}
      />

      <div className={compact
        ? "bg-muted/30 border-t p-2"
        : inModal
          ? "bg-foreground/95 backdrop-blur-md border-t border-primary/20 p-4"
          : "fixed bottom-0 left-0 right-0 bg-foreground/95 backdrop-blur-md border-t border-primary/20 p-4 z-50"
      }>
        <div className={compact ? '' : 'max-w-4xl mx-auto'}>
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${compact ? 'mb-1.5' : 'mb-3'}`}>
              {attachments.map((att, idx) => (
                <div key={idx} className="bg-primary text-muted text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-primary/30 animate-fade-in">
                  <FileText className="w-3 h-3 text-accent" />
                  <span className="max-w-[200px] truncate">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-3'}`}>
            {/* Google Drive Button - conditionally shown */}
            {showDriveButton && !compact && (
              <button
                onClick={() => setIsDriveOpen(true)}
                disabled={isLoading}
                className="h-12 w-12 flex-shrink-0 rounded-xl bg-primary/50 hover:bg-primary text-muted/70 hover:text-success border border-primary/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Add from Google Drive"
              >
                <i className="fab fa-google-drive text-lg group-hover:scale-110 transition-transform"></i>
              </button>
            )}

            {/* File Upload Button - conditionally shown */}
            {showAttachButton && !compact && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-12 w-12 flex-shrink-0 rounded-xl bg-primary/50 hover:bg-primary text-muted/70 hover:text-accent border border-primary/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                title="Upload Image or Document"
              >
                <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
            {showAttachButton && compact && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-9 w-9 flex-shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf,text/plain,text/csv,text/markdown,.md,application/zip,.zip"
              multiple
            />

            {/* Inline Voice Mode Button — only when no voiceButtonLabel (legacy behavior) */}
            {showVoiceButton && !renderAsVoicePill && (
              <button
                onClick={onStartVoice}
                disabled={isLoading}
                className={`flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden ${
                  compact
                    ? 'h-9 w-9 rounded-lg bg-purple-600 hover:bg-purple-700 text-white'
                    : 'h-12 w-12 rounded-xl bg-primary/50 hover:bg-primary text-accent hover:text-white border border-primary/30'
                }`}
                title="Start Voice Conversation"
              >
                {!compact && <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors"></div>}
                <Mic className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} group-hover:scale-110 transition-transform relative z-10`} />
              </button>
            )}

            {/* Text Input with optional dictation button */}
            <div className="flex-grow relative min-w-0">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={autoResize}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                rows={compact ? 2 : 1}
                className={`w-full resize-none disabled:opacity-50 transition-colors ${
                  compact
                    ? 'bg-background text-foreground placeholder-muted-foreground/50 rounded-lg border border-border focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none py-2 px-3 text-sm min-h-[52px] max-h-[120px]'
                    : `bg-primary/30 text-muted placeholder-muted/30 rounded-xl border border-primary/30 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none py-3 px-4 min-h-[48px] max-h-[150px] ${canDictate ? 'pr-12' : ''}`
                }`}
              />
              {/* Dictation button inside textarea */}
              {canDictate && (
                <button
                  onClick={toggleDictation}
                  disabled={isLoading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                    isDictating
                      ? 'text-red-400 bg-red-500/20 animate-pulse'
                      : 'text-muted/40 hover:text-muted/70 hover:bg-primary/20'
                  }`}
                  title={isDictating ? 'Stop dictation' : 'Dictate message'}
                >
                  {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || (!text.trim() && attachments.length === 0)}
              className={`flex-shrink-0 flex items-center justify-center transition-all ${
                sendButtonClassName
                  ? `h-9 w-9 ${isLoading ? 'opacity-40 cursor-not-allowed' : `${sendButtonClassName} hover:scale-110 active:scale-95`}`
                  : compact
                    ? `h-9 w-9 rounded-lg ${
                        isLoading
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 active:scale-95'
                      }`
                    : `h-12 w-12 rounded-xl ${
                        isLoading
                          ? 'bg-primary text-muted/30 cursor-not-allowed'
                          : 'bg-primary hover:bg-accent text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
                      }`
              }`}
            >
              {isLoading ? (
                <Loader2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
              ) : (
                <Send className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              )}
            </button>
          </div>

          {/* Voice Agent Pill Button — below input row */}
          {renderAsVoicePill && (
            <button
              onClick={onStartVoice}
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-full bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
            >
              <AudioLines className="w-4 h-4" />
              {voiceButtonLabel}
            </button>
          )}

          {disclaimer && !compact && (
            <div className="text-center mt-2">
              <p className="text-[10px] text-muted/40">{disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
