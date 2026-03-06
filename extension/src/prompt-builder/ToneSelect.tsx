// ABOUTME: Tone emphasis selector based on MERGE brand voice principles
// ABOUTME: Elegant pill selector with active state highlighting

const TONES = [
  { id: 'balanced', label: 'Balanced', description: 'Equal weight across all voice qualities' },
  { id: 'clarity', label: 'Clarity with Character', description: 'Clear and purposeful with distinct personality' },
  { id: 'poetic', label: 'Poetic Precision', description: 'Measured language with literary quality' },
  { id: 'emotion', label: 'Emotion + Function', description: 'Heart-forward messaging that still delivers' },
  { id: 'brave', label: 'Brave, Never Boastful', description: 'Confident without ego, bold without noise' },
];

interface ToneSelectProps {
  value: string;
  onChange: (tone: string) => void;
}

export function ToneSelect({ value, onChange }: ToneSelectProps) {
  const activeTone = TONES.find(t => t.id === value);

  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '10px',
        fontWeight: 600,
        color: '#8fa89e',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        Voice emphasis
      </label>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
      }}>
        {TONES.map((tone) => {
          const isActive = value === tone.id;
          return (
            <button
              key={tone.id}
              onClick={() => onChange(tone.id)}
              style={{
                padding: '5px 11px',
                borderRadius: '16px',
                border: `1.5px solid ${isActive ? '#00856C' : 'rgba(19, 59, 52, 0.08)'}`,
                background: isActive ? 'rgba(0, 133, 108, 0.06)' : '#fff',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'Epilogue, system-ui, sans-serif',
                color: isActive ? '#00856C' : '#636466',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 1px 3px rgba(0, 133, 108, 0.08)' : 'none',
              }}
            >
              {tone.label}
            </button>
          );
        })}
      </div>
      {activeTone && activeTone.id !== 'balanced' && (
        <div style={{
          marginTop: '6px',
          fontSize: '10px',
          color: '#8fa89e',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          {activeTone.description}
        </div>
      )}
    </div>
  );
}
