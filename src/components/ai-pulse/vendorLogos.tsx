// ABOUTME: SVG logo components for AI vendor placeholders on AI Signal cards
// ABOUTME: Each logo is a simplified, recognizable representation of the vendor brand

import type { SVGProps } from 'react';

type LogoProps = SVGProps<SVGSVGElement> & { className?: string };

export const GoogleLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const OpenAILogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M22.28 9.37a6.18 6.18 0 0 0-.53-5.08 6.25 6.25 0 0 0-6.74-3.01A6.19 6.19 0 0 0 10.36 0a6.25 6.25 0 0 0-5.96 4.33 6.18 6.18 0 0 0-4.14 3A6.25 6.25 0 0 0 1.03 13.3a6.18 6.18 0 0 0 .53 5.08 6.25 6.25 0 0 0 6.74 3.01A6.19 6.19 0 0 0 12.95 24a6.25 6.25 0 0 0 5.96-4.33 6.18 6.18 0 0 0 4.14-3 6.25 6.25 0 0 0-.77-7.3zM12.95 22.36a4.63 4.63 0 0 1-2.97-1.08l.15-.08 4.93-2.85c.25-.14.4-.41.4-.7V11.1l2.08 1.2v6.14a4.64 4.64 0 0 1-4.59 3.92zM3.97 18.24a4.62 4.62 0 0 1-.55-3.11l.15.09 4.93 2.85c.25.14.56.14.81 0l6.02-3.48v2.4l-4.98 2.88a4.64 4.64 0 0 1-6.38-1.63zM2.68 7.88A4.62 4.62 0 0 1 5.1 5.85v5.87c0 .29.16.55.4.7l6.02 3.47-2.08 1.2L4.45 14.2a4.64 4.64 0 0 1-1.77-6.33zM19.15 11.58l-6.02-3.48 2.08-1.2 4.99 2.88a4.64 4.64 0 0 1-.72 8.37v-5.87c0-.29-.16-.55-.4-.7h.07zM21.22 8.86l-.15-.09-4.93-2.85a.81.81 0 0 0-.81 0L9.31 9.4V7l4.98-2.88a4.64 4.64 0 0 1 6.93 4.74zM8.27 12.9l-2.08-1.2V5.56a4.64 4.64 0 0 1 7.56-3.6l-.15.08-4.93 2.85c-.25.14-.4.41-.4.7v6.32zM9.31 10.8l2.68-1.55 2.68 1.55v3.1l-2.68 1.55-2.68-1.55v-3.1z" fill="currentColor" />
  </svg>
);

export const AnthropicLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M13.83 2H16.7l6.3 20h-2.87l-1.53-5.09h-7.2L9.87 22H7L13.83 2zM14.05 14.2h5.1L16.6 5.98 14.05 14.2z" fill="currentColor" />
    <path d="M4.97 2H7.84L14.14 22h-2.87L4.97 2z" fill="currentColor" />
  </svg>
);

export const MicrosoftLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
);

export const MetaLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M6.92 6.18c1.26-1.77 2.62-2.68 4.06-2.68 1.05 0 2.1.57 3.28 1.82.52.55 1.07 1.24 1.64 2.05.57-.81 1.12-1.5 1.64-2.05C18.72 4.07 19.77 3.5 20.82 3.5c1.44 0 2.37.91 2.87 2.68.28 1.02.31 2.21.31 3.46 0 2.27-.46 4.96-1.25 6.87-.92 2.22-2.3 3.99-4.44 3.99-1.05 0-2.1-.57-3.28-1.82-.52-.55-1.07-1.24-1.64-2.05-.57.81-1.12 1.5-1.64 2.05-1.18 1.25-2.23 1.82-3.28 1.82-2.14 0-3.52-1.77-4.44-3.99C3.24 14.6 3 12.27 3 9.64c0-1.25.13-2.44.4-3.46z" stroke="currentColor" strokeWidth="1.8" fill="none" />
  </svg>
);

export const AmazonLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M13.96 14.42c-1.42 1.05-3.47 1.6-5.24 1.6a9.49 9.49 0 0 1-6.41-2.44c-.13-.12-.01-.28.15-.19a12.9 12.9 0 0 0 6.41 1.7c1.57 0 3.3-.33 4.89-.99.24-.1.44.16.2.32z" fill="#FF9900" />
    <path d="M14.65 13.63c-.18-.23-1.2-.11-1.65-.05-.14.02-.16-.1-.04-.2.81-.57 2.14-.4 2.3-.21.15.19-.04 1.52-.8 2.16-.12.1-.23.05-.18-.08.17-.43.56-1.4.37-1.62z" fill="#FF9900" />
    <path d="M13.04 4.29v-1a.3.3 0 0 1 .31-.31h5.42a.3.3 0 0 1 .31.31v.85c0 .18-.15.41-.41.77l-2.81 4.01c1.04-.03 2.15.13 3.09.66.21.12.27.3.29.47v1.13c0 .18-.2.39-.4.28a6.24 6.24 0 0 0-5.72.01c-.19.1-.39-.11-.39-.29V10.1c0-.2.01-.53.2-.83l3.25-4.67h-2.83a.3.3 0 0 1-.31-.31zM4.97 11.5h-1.65a.3.3 0 0 1-.29-.28V3.3a.3.3 0 0 1 .31-.3h1.53c.17.01.3.14.31.3v1.03h.03C5.6 3.28 6.3 2.8 7.23 2.8c.94 0 1.53.49 1.95 1.54.39-1.05 1.2-1.54 2.09-1.54.63 0 1.32.26 1.74.85.48.65.38 1.6.38 2.44v5.16a.3.3 0 0 1-.31.3h-1.65a.3.3 0 0 1-.3-.3V6.6c0-.33.03-1.15-.04-1.45-.11-.5-.44-.65-.87-.65-.36 0-.73.24-.88.63-.15.38-.14 1.02-.14 1.47v4.66a.3.3 0 0 1-.31.3H7.24a.3.3 0 0 1-.3-.3V6.6c0-.87.14-2.14-.91-2.14-1.07 0-1.03 1.24-1.03 2.14v4.61a.3.3 0 0 1-.31.3z" fill="currentColor" />
  </svg>
);

export const AppleLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" fill="currentColor" />
  </svg>
);

export const AdobeLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M9.07 2H2v20l7.07-20zM14.93 2H22v20l-7.07-20zM12 9.47L16.2 22h-3.07l-1.23-3.87H8.8L12 9.47z" fill="currentColor" />
  </svg>
);

export const NvidiaLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M8.95 8.57V6.55c.17-.01.34-.02.51-.02 4.28-.1 6.8 3.72 6.8 3.72s-2.82 4.14-5.82 4.14c-.53 0-1.02-.11-1.49-.3V9.35c1.75.22 2.11.85 3.16 2.58l2.35-1.98S12.64 8.5 9.47 8.5c-.17 0-.35.02-.52.07zM8.95 4.2v1.62l.51-.06c5.6-.33 8.93 4.54 8.93 4.54s-3.83 5.05-7.82 5.05c-.56 0-1.1-.08-1.62-.25v1.32c.45.08.91.14 1.39.14 3.69 0 6.37-1.92 8.95-4.15.43.34 2.18 1.18 2.54 1.54-2.45 2.01-8.13 4.05-11.38 4.05-.52 0-1.01-.05-1.5-.14v1.49h14.4V4.2H8.95zM8.95 14.1v.56c-.35-.14-.7-.33-1.03-.58-2.66-2.02-3.61-5.76-3.61-5.76s2.33-2.54 4.64-2.82v1.76C7.34 7.67 5.87 9.72 5.87 9.72s.79 2.57 3.08 4.38z" fill="#76B900" />
  </svg>
);

export const RunwayLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <text x="12" y="16" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor" fontFamily="system-ui">R</text>
  </svg>
);

export const MidjourneyLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 4L4 8v8l8 4 8-4V8l-8-4zm0 2.5L17.5 9.5 12 12.5 6.5 9.5 12 6.5zM6 10.5l5 2.5v5l-5-2.5v-5zm12 0v5l-5 2.5v-5l5-2.5z" fill="currentColor" />
  </svg>
);

export const StabilityAILogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
  </svg>
);

export const HuggingFaceLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FFD21E" />
    <circle cx="8.5" cy="10" r="1.5" fill="#1A1A1A" />
    <circle cx="15.5" cy="10" r="1.5" fill="#1A1A1A" />
    <path d="M7.5 14.5c0 0 1.5 3 4.5 3s4.5-3 4.5-3" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

export const CohereLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c1.66 0 3.22-.45 4.56-1.24l-1.12-1.68A6.97 6.97 0 0 1 12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7c0 1.14-.27 2.22-.76 3.17l1.68 1.12A8.97 8.97 0 0 0 21 12c0-4.97-4.03-9-9-9z" fill="currentColor" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export const PerplexityLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 2v20M4 7l8 5 8-5M4 17l8-5 8 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const SalesforceLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M10.05 5.06a4.36 4.36 0 0 1 3.21-1.41c1.7 0 3.18.97 3.91 2.39a4.94 4.94 0 0 1 2.07-.45c2.76 0 5 2.24 5 5s-2.24 5-5 5a5 5 0 0 1-1.06-.12 4.02 4.02 0 0 1-3.53 2.11c-.72 0-1.4-.19-1.99-.53a4.7 4.7 0 0 1-4.02 2.3c-2.15 0-3.97-1.44-4.53-3.41A4.5 4.5 0 0 1 .25 11.6c0-2.49 2.01-4.5 4.5-4.5.43 0 .85.06 1.24.18a4.36 4.36 0 0 1 4.06-2.22z" fill="currentColor" />
  </svg>
);

export const GrammarlyLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="10" fill="#15C39A" />
    <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm3 6.75h-2.25V15h-1.5v-2.25H9v-1.5h2.25V9h1.5v2.25H15v1.5z" fill="white" />
  </svg>
);

export const FigmaLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M8 24c2.21 0 4-1.79 4-4v-4H8c-2.21 0-4 1.79-4 4s1.79 4 4 4z" fill="#0ACF83" />
    <path d="M4 12c0-2.21 1.79-4 4-4h4v8H8c-2.21 0-4-1.79-4-4z" fill="#A259FF" />
    <path d="M4 4c0-2.21 1.79-4 4-4h4v8H8C5.79 8 4 6.21 4 4z" fill="#F24E1E" />
    <path d="M12 0h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-4V0z" fill="#FF7262" />
    <path d="M20 12c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z" fill="#1ABCFE" />
  </svg>
);

export const SlackLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M5.04 15.16a2.12 2.12 0 1 1-2.12-2.12h2.12v2.12zm1.07 0a2.12 2.12 0 1 1 4.24 0v5.3a2.12 2.12 0 1 1-4.24 0v-5.3z" fill="#E01E5A" />
    <path d="M8.84 5.04a2.12 2.12 0 1 1 2.12-2.12v2.12H8.84zm0 1.07a2.12 2.12 0 1 1 0 4.24h-5.3a2.12 2.12 0 1 1 0-4.24h5.3z" fill="#36C5F0" />
    <path d="M18.96 8.84a2.12 2.12 0 1 1 2.12 2.12h-2.12V8.84zm-1.07 0a2.12 2.12 0 1 1-4.24 0v-5.3a2.12 2.12 0 1 1 4.24 0v5.3z" fill="#2EB67D" />
    <path d="M15.16 18.96a2.12 2.12 0 1 1-2.12 2.12v-2.12h2.12zm0-1.07a2.12 2.12 0 1 1 0-4.24h5.3a2.12 2.12 0 1 1 0 4.24h-5.3z" fill="#ECB22E" />
  </svg>
);

export const NotionLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M4.46 3.89l10.2-.74c1.25-.1 1.57-.04 2.36.53l3.25 2.27c.53.38.7.5.7.92v12.46c0 .79-.29 1.26-1.3 1.33l-11.87.7c-.75.04-1.12-.08-1.5-.55L3.3 17.2c-.44-.6-.63-.99-.63-1.46V5.15c0-.6.29-1.16 1.3-1.26h.49z" fill="currentColor" />
    <path d="M14.66 3.15l-10.2.74C3.46 3.99 3.17 4.55 3.17 5.15v10.59c0 .47.19.86.63 1.46l2.8 3.61c.38.47.75.59 1.5.55l11.87-.7c1.01-.07 1.3-.54 1.3-1.33V6.87c0-.42-.17-.54-.7-.92L17.32 3.68c-.79-.57-1.11-.63-2.36-.53h-.3z" fill="white" stroke="currentColor" strokeWidth=".5" />
    <path d="M9.14 7.76c-.04.62 0 .62.48.65l.74.13v8.58c.63.34 1.21.53 1.7.53.79 0 .99-.24 1.57-.99l3.4-5.2V16l-1.09.22s0 .62.87.62l2.38-.14c.04-.62 0-.62-.49-.65l-.73-.2V7.22l-1-.07c-.04.62-.35.99-.87.99l-2.66 4.06V7.83L12.27 7.6s0-.62-.87-.62L9.14 7.11v.65z" fill="currentColor" />
  </svg>
);

export const LovableLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF385C" />
  </svg>
);

export const MergeLogo = (props: LogoProps) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M3 19V5h4l5 7.5L17 5h4v14h-3V9.5l-5 7.5h-2l-5-7.5V19H3z" fill="currentColor" />
  </svg>
);

// Map vendor keys to their logo components
export const VENDOR_LOGOS: Record<string, React.ComponentType<LogoProps>> = {
  google: GoogleLogo,
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  microsoft: MicrosoftLogo,
  meta: MetaLogo,
  amazon: AmazonLogo,
  apple: AppleLogo,
  adobe: AdobeLogo,
  nvidia: NvidiaLogo,
  runway: RunwayLogo,
  midjourney: MidjourneyLogo,
  'stability-ai': StabilityAILogo,
  'hugging-face': HuggingFaceLogo,
  cohere: CohereLogo,
  perplexity: PerplexityLogo,
  salesforce: SalesforceLogo,
  grammarly: GrammarlyLogo,
  figma: FigmaLogo,
  slack: SlackLogo,
  notion: NotionLogo,
  lovable: LovableLogo,
  merge: MergeLogo,
};
