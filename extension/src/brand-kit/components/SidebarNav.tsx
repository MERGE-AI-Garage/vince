// ABOUTME: Sticky dropdown navigation with section names for the brand guidelines
// ABOUTME: Shows current section and allows jumping to any section via dropdown

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Section {
  id: string;
  name: string;
}

interface SidebarNavProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export function SidebarNav({ sections, activeSection, onSectionClick }: SidebarNavProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeName = sections.find(s => s.id === activeSection)?.name || sections[0]?.name;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'sticky',
        top: 40,
        zIndex: 30,
        background: '#133B34',
        borderBottom: '1px solid rgba(234, 232, 227, 0.1)',
        fontFamily: 'Epilogue, system-ui, sans-serif',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
          color: '#EAE8E3', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          fontFamily: 'Epilogue, system-ui, sans-serif',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="./icons/icon-16.png" alt="" width={16} height={16} style={{ borderRadius: '50%' }} />
          {activeName}
        </span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', opacity: 0.7 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#133B34', borderBottom: '1px solid rgba(234, 232, 227, 0.15)',
          maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => { onSectionClick(section.id); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '8px 16px',
                background: activeSection === section.id ? 'rgba(0, 133, 108, 0.3)' : 'none',
                border: 'none', color: activeSection === section.id ? '#1ED75F' : '#EAE8E3',
                cursor: 'pointer', fontSize: '12px',
                fontWeight: activeSection === section.id ? 600 : 400,
                textAlign: 'left', fontFamily: 'Epilogue, system-ui, sans-serif',
                borderLeft: activeSection === section.id ? '3px solid #1ED75F' : '3px solid transparent',
              }}
            >
              {section.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
