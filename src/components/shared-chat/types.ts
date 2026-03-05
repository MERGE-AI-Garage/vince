// ABOUTME: Shared types for chat components used by Scout and Eddie
// ABOUTME: Defines message structure, attachments, and agent configuration

import { LucideIcon } from 'lucide-react';

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
  geminiFileUri?: string; // URI from Gemini File Upload API (for PDFs)
  geminiFileName?: string; // File name from Gemini (for cleanup)
}

export interface DriveFile {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'slide' | 'pdf';
  url: string;
  content: string; // Simulated content
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
  isVoice?: boolean;
}

export interface AgentConfig {
  name: string;
  role: string;
  icon: LucideIcon;
  keywords: string[];
  completionMarker: string;
  placeholder?: string;
  disclaimer?: string;
}
