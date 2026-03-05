// ABOUTME: Decorative inline SVG illustrations for Brand Intelligence section headers
// ABOUTME: Geometric/organic motifs themed with platform emerald, positioned as subtle card accents

const BASE_CLASS = 'absolute top-0 right-0 h-20 w-40 opacity-[0.12] pointer-events-none text-emerald-600 dark:text-emerald-400';

export function VisualDNAArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Double helix / DNA strand */}
      <path d="M100 8 Q120 20 110 32 Q100 44 120 56" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M120 8 Q100 20 110 32 Q120 44 100 56" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Cross-links */}
      <line x1="104" y1="14" x2="116" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="107" y1="23" x2="113" y2="23" stroke="currentColor" strokeWidth="1.5" />
      <line x1="107" y1="41" x2="113" y2="41" stroke="currentColor" strokeWidth="1.5" />
      <line x1="104" y1="50" x2="116" y2="50" stroke="currentColor" strokeWidth="1.5" />
      {/* Floating nodes */}
      <circle cx="140" cy="20" r="3" fill="currentColor" />
      <circle cx="148" cy="36" r="2" fill="currentColor" />
      <circle cx="136" cy="48" r="2.5" fill="currentColor" />
      <circle cx="88" cy="24" r="2" fill="currentColor" />
      <circle cx="82" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}

export function IntelligenceSourcesArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Network graph — connected nodes representing sources feeding into center */}
      <circle cx="130" cy="32" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="14" r="4" fill="currentColor" />
      <circle cx="152" cy="16" r="3" fill="currentColor" />
      <circle cx="148" cy="50" r="3.5" fill="currentColor" />
      <circle cx="104" cy="52" r="3" fill="currentColor" />
      <circle cx="86" cy="34" r="2.5" fill="currentColor" />
      {/* Connection lines */}
      <line x1="104" y1="14" x2="125" y2="28" stroke="currentColor" strokeWidth="1.5" />
      <line x1="149" y1="18" x2="135" y2="28" stroke="currentColor" strokeWidth="1.5" />
      <line x1="146" y1="48" x2="134" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <line x1="107" y1="50" x2="125" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <line x1="89" y1="34" x2="124" y2="32" stroke="currentColor" strokeWidth="1" />
      {/* Radiating arcs */}
      <path d="M120 26 Q130 22 140 26" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M120 38 Q130 42 140 38" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function GenerationPromptArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Flowing layers representing prompt sections stacking */}
      <path d="M80 48 Q105 42 120 48 Q135 54 160 48" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M80 38 Q105 32 120 38 Q135 44 160 38" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M80 28 Q105 22 120 28 Q135 34 160 28" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M80 18 Q105 12 120 18 Q135 24 160 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Spark/wand accent */}
      <circle cx="92" cy="12" r="2" fill="currentColor" />
      <line x1="92" y1="6" x2="92" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="86" y1="12" x2="88" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="88" y1="8" x2="89.5" y2="9.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function AgentDirectivesArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Shield shape with rule lines */}
      <path d="M124 10 L140 16 L140 36 Q140 48 124 54 Q108 48 108 36 L108 16 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Rule lines inside shield */}
      <line x1="115" y1="24" x2="133" y2="24" stroke="currentColor" strokeWidth="1.5" />
      <line x1="115" y1="32" x2="133" y2="32" stroke="currentColor" strokeWidth="1.5" />
      <line x1="118" y1="40" x2="130" y2="40" stroke="currentColor" strokeWidth="1.5" />
      {/* Check mark accent */}
      <path d="M118 28 L122 31.5 L130 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Floating dots */}
      <circle cx="96" cy="20" r="2" fill="currentColor" />
      <circle cx="150" cy="28" r="1.5" fill="currentColor" />
      <circle cx="98" cy="44" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ToolApprovalsArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Grid of approval checkboxes */}
      <rect x="96" y="12" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M99 18 L102 21 L106 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="114" y="12" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M117 18 L120 21 L124 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="132" y="12" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="96" y="30" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M99 36 L102 39 L106 33" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="114" y="30" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="132" y="30" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M135 36 L138 39 L142 33" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Scope indicator lines */}
      <rect x="96" y="48" width="48" height="6" rx="3" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="96" y="48" width="30" height="6" rx="3" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function PromptTemplatesArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Stacked card/template layers */}
      <rect x="108" y="6" width="40" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(3 128 30)" />
      <rect x="104" y="8" width="40" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-2 124 32)" />
      <rect x="100" y="10" width="40" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Content lines on top card */}
      <line x1="108" y1="22" x2="132" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="108" y1="30" x2="128" y2="30" stroke="currentColor" strokeWidth="1" />
      <line x1="108" y1="36" x2="130" y2="36" stroke="currentColor" strokeWidth="1" />
      <line x1="108" y1="42" x2="124" y2="42" stroke="currentColor" strokeWidth="1" />
      {/* Camera/preset icon */}
      <circle cx="152" cy="18" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="152" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

export function ReferenceImagesArt() {
  return (
    <svg viewBox="0 0 160 64" className={BASE_CLASS} aria-hidden="true">
      {/* Image grid mosaic */}
      <rect x="88" y="8" width="22" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="114" y="8" width="22" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="140" y="8" width="16" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="88" y="34" width="16" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="108" y="34" width="28" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="140" y="34" width="16" height="22" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Mountain/landscape in one tile */}
      <path d="M116 50 L120 40 L126 46 L130 38 L134 50" fill="none" stroke="currentColor" strokeWidth="1" />
      {/* Sun in another */}
      <circle cx="99" cy="42" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function ReferenceCollectionsArt() {
  return (
    <svg viewBox="0 0 120 48" className="absolute top-0 right-0 h-16 w-28 opacity-[0.12] pointer-events-none text-emerald-600 dark:text-emerald-400" aria-hidden="true">
      {/* Grouped collection clusters */}
      <rect x="40" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.4" />
      <rect x="58" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.6" />
      <rect x="76" y="4" width="14" height="14" rx="3" fill="currentColor" opacity="0.3" />
      <rect x="40" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.5" />
      <rect x="58" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.4" />
      <rect x="76" y="22" width="14" height="14" rx="3" fill="currentColor" opacity="0.7" />
      {/* Grouping bracket */}
      <path d="M36 6 L32 6 L32 34 L36 34" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M94 6 L98 6 L98 34 L94 34" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
