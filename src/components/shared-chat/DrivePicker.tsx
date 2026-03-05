// ABOUTME: Google Drive file picker modal for chat attachments
// ABOUTME: Currently simulates Drive API with mock files

import React from 'react';
import { DriveFile } from './types';

interface DrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: DriveFile) => void;
}

export const DrivePicker: React.FC<DrivePickerProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const MOCK_FILES: DriveFile[] = [
    {
      id: '1',
      name: 'Q3_Financial_Report.xlsx',
      type: 'sheet',
      url: 'https://docs.google.com/spreadsheets/d/mock1',
      content: 'Revenue: $1.2M, Growth: 15%, Manual processing time: 40 hours/week.'
    },
    {
      id: '2',
      name: 'Innovation_Process_v2.docx',
      type: 'doc',
      url: 'https://docs.google.com/document/d/mock2',
      content: 'Current process bottlenecks: 1. Intake form is too long. 2. Approval chain is unclear.'
    },
    {
      id: '3',
      name: 'Project_Alpha_Pitch.pptx',
      type: 'slide',
      url: 'https://docs.google.com/presentation/d/mock3',
      content: 'Slide 1: Overview. We need to automate the customer support triage using GenAI.'
    },
    {
      id: '4',
      name: 'Legacy_System_Logs.pdf',
      type: 'pdf',
      url: 'https://drive.google.com/file/d/mock4',
      content: 'Error rate: 5%. Timeouts observed in the payment gateway module.'
    }
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'sheet': return 'fa-file-excel text-success';
      case 'doc': return 'fa-file-word text-info';
      case 'slide': return 'fa-file-powerpoint text-orange-500';
      case 'pdf': return 'fa-file-pdf text-destructive';
      default: return 'fa-file text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-foreground border border-primary/30 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-primary/20 flex justify-between items-center bg-primary/30 rounded-t-xl">
          <div className="flex items-center gap-2">
            <i className="fab fa-google-drive text-xl text-white"></i>
            <h3 className="text-white font-serif font-medium">Select from Drive</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* File List */}
        <div className="flex-grow overflow-y-auto p-2">
          {MOCK_FILES.map((file) => (
            <button
              key={file.id}
              onClick={() => onSelect(file)}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-primary/50 transition-colors text-left group"
            >
              <div className="h-10 w-10 bg-primary/80 rounded flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <i className={`fas ${getIcon(file.type)} text-lg`}></i>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-muted truncate">{file.name}</p>
                <p className="text-xs text-muted/50">Modified today</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-primary/20 bg-primary/20 rounded-b-xl text-center">
          <p className="text-[10px] text-muted/40">Simulating Google Drive Picker API</p>
        </div>
      </div>
    </div>
  );
};
