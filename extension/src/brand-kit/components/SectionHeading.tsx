// ABOUTME: Consistent section heading styled with Fraunces for the sidebar
// ABOUTME: Used across all brand guideline sections for visual consistency

interface SectionHeadingProps {
  children: React.ReactNode;
  sub?: boolean;
}

export function SectionHeading({ children, sub }: SectionHeadingProps) {
  return (
    <h2
      style={{
        fontFamily: 'Fraunces, serif',
        color: '#00856C',
        fontSize: sub ? '16px' : '20px',
        fontWeight: sub ? 500 : 600,
        margin: 0,
        lineHeight: 1.3,
      }}
    >
      {children}
    </h2>
  );
}
