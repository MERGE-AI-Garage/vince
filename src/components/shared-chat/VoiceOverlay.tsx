// ABOUTME: Voice mode fullscreen interface with live waveform visualization
// ABOUTME: Displays real-time transcription with configurable agent name and keywords

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Upload, CheckCircle } from 'lucide-react';
import { ScoutVisualizer, VisualizerStyle, LightPillarSettings, ClassicWaveSettings, Codrops3DOrbSettings, VrmAvatarSettings } from './visualizers';
import { HyperspeedSettings } from './visualizers/HyperspeedVisualizer';

// Transcript item from live service
export interface TranscriptItem {
  id: string;
  text: string;
  role: 'user' | 'model';
  isFinal: boolean;
}

interface VoiceOverlayProps {
  isActive: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  volumeRef: React.MutableRefObject<number>;
  transcript: TranscriptItem[];
  // Configurable props
  agentName?: string;
  agentLabel?: string;  // e.g., "Project Intake" or "Executive Briefing"
  keywords?: string[];
  completionMarker?: string;
  // Visualizer settings
  visualizerStyle?: VisualizerStyle;
  backgroundColor?: string;
  lightPillarSettings?: LightPillarSettings;
  classicWaveSettings?: ClassicWaveSettings;
  hyperspeedSettings?: HyperspeedSettings;
  codrops3DOrbSettings?: Codrops3DOrbSettings;
  vrmAvatarSettings?: VrmAvatarSettings;
}

// Default keywords for highlighting
const DEFAULT_KEYWORDS = [
  "who", "what", "where", "when", "why", "how",
  "idea", "problem", "goal", "solution", "outcome", "result",
  "help", "improve", "automate", "build", "create",
  "cost", "time", "save", "value", "roi", "impact"
];

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  isActive,
  onClose,
  onFileUpload,
  volumeRef,
  transcript,
  agentName = 'Assistant',
  agentLabel = 'Voice Mode',
  keywords = DEFAULT_KEYWORDS,
  completionMarker = '**COMPLETE**',
  visualizerStyle = 'classic_wave',
  backgroundColor = '#000000',
  lightPillarSettings,
  classicWaveSettings,
  hyperspeedSettings,
  codrops3DOrbSettings,
  vrmAvatarSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const agentTextRef = useRef<HTMLDivElement>(null);

  // Get the most recent partial/final transcripts
  const currentModel = transcript.find(t => t.id === 'current-model');
  const currentUser = transcript.find(t => t.id === 'current-user');

  // Filter out completion markdown from display
  const filterCompletionMarkdown = (text: string): string => {
    if (!text) return "";
    const completionIndex = text.indexOf(completionMarker);
    if (completionIndex !== -1) {
      return text.substring(0, completionIndex).trim();
    }
    return text;
  };

  // Determine active speaker
  const modelText = filterCompletionMarkdown(currentModel?.text || "");
  const userText = currentUser?.text || "";
  const isUserSpeaking = userText.trim().length > 0;
  const isModelSpeaking = modelText.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileUpload(file);
      setUploadedFileName(file.name);
      setTimeout(() => setUploadedFileName(null), 3000);
    }
  };

  // Helper to highlight keywords
  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    // Sort keywords by length descending to match longer phrases first
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`\\b(${sortedKeywords.join('|')})\\b`, 'gi');
    const parts = text.split(pattern);

    return (
      <>
        {parts.map((part, i) => {
          if (part.match(pattern)) {
            return (
              <span
                key={i}
                className="text-accent font-bold drop-shadow-[0_0_8px_hsl(var(--accent)/0.4)] font-fraunces"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {part}
              </span>
            );
          }
          return (
            <span key={i} className="font-fraunces" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {part}
            </span>
          );
        })}
      </>
    );
  };

  // Auto-scroll agent text to bottom when it changes
  useEffect(() => {
    if (agentTextRef.current && modelText) {
      agentTextRef.current.scrollTop = agentTextRef.current.scrollHeight;
    }
  }, [modelText]);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-[100] text-white overflow-hidden flex flex-col"
      style={{ backgroundColor }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-black to-black opacity-90"></div>

      {/* Top Bar */}
      <div className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-xs tracking-widest text-accent font-bold uppercase">Live Connection Active</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/plain,text/csv"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/80 hover:bg-primary hover:border-accent transition-all shadow-lg cursor-pointer backdrop-blur-md"
          >
            <Upload className="w-4 h-4 text-accent group-hover:text-primary-foreground transition-colors" />
            <span className="text-foreground group-hover:text-primary-foreground font-medium text-xs tracking-wide transition-colors">UPLOAD</span>
          </button>
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-6 py-2 rounded-full border border-accent/30 bg-primary/80 hover:bg-accent hover:border-accent transition-all shadow-lg cursor-pointer backdrop-blur-md"
          >
            <MessageSquare className="w-4 h-4 text-accent group-hover:text-accent-foreground transition-colors" />
            <span className="text-foreground group-hover:text-accent-foreground font-medium text-xs tracking-wide transition-colors">SWITCH TO CHAT</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col items-center justify-start pt-8 relative z-10 w-full max-w-4xl mx-auto px-6 gap-8">

        {/* TOP: Agent Text */}
        <div
          ref={agentTextRef}
          className="w-full text-center flex flex-col items-center justify-start max-h-[400px] overflow-y-auto transition-all duration-300 scrollbar-hide"
        >
           {isModelSpeaking ? (
             <div className="animate-fade-in-up px-4 pb-4">
               <p className="text-xs text-accent font-bold mb-3 tracking-[0.3em] uppercase flex items-center justify-center gap-2">
                  <span className="h-1 w-1 bg-accent rounded-full"></span> {agentLabel}
               </p>
              <p className="text-2xl md:text-4xl text-white font-fraunces font-light leading-tight drop-shadow-lg" style={{ fontFamily: "'Fraunces', serif", letterSpacing: '-0.02em' }}>
                 {renderHighlightedText(modelText)}
              </p>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center opacity-30">
               {/* Optional Placeholder or Empty Space */}
             </div>
           )}
        </div>

        {/* CENTER: Pluggable Visualizer */}
        <ScoutVisualizer
          style={visualizerStyle}
          isActive={isActive}
          volumeRef={volumeRef}
          isUserSpeaking={isUserSpeaking}
          lightPillarSettings={lightPillarSettings}
          classicWaveSettings={classicWaveSettings}
          hyperspeedSettings={hyperspeedSettings}
          codrops3DOrbSettings={codrops3DOrbSettings}
          vrmAvatarSettings={vrmAvatarSettings}
        />

        {/* BOTTOM: USER (You) */}
        <div className="w-full text-center flex flex-col items-center justify-start min-h-[100px] transition-all duration-300">
           {isUserSpeaking ? (
             <div className="animate-fade-in-down">
                <p className="text-xl md:text-2xl text-cyan-100 font-light leading-relaxed opacity-90 font-epilogue">
                    "{userText}"
                </p>
                <p className="text-[10px] text-cyan-500 font-bold mt-2 tracking-[0.2em] uppercase">
                    You
                </p>
             </div>
           ) : (
             <p className="text-sm text-muted-foreground/50 tracking-widest uppercase animate-pulse mt-4">
                 {transcript.length === 0 ? "Connecting..." : "Listening..."}
             </p>
           )}
        </div>

      </div>

      {/* Upload Confirmation Toast */}
      {uploadedFileName && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/90 border border-accent shadow-lg backdrop-blur-md">
            <CheckCircle className="w-5 h-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">File Uploaded</span>
              <span className="text-xs text-foreground">{uploadedFileName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        /* Hide scrollbar while keeping scroll functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 12s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.4s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
