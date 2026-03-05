// ABOUTME: Pill-style navigation between Brand DNA, Corporate DNA, and Brand Standards dialogs
// ABOUTME: Frosted glass styling that adapts to light/dark branded headers

export type BrandDialogView = 'brand-dna' | 'corporate-dna' | 'brand-standards';

interface BrandDialogNavProps {
  activeView: BrandDialogView;
  onNavigate: (view: BrandDialogView) => void;
  headerTextLight: boolean;
}

const NAV_ITEMS: { view: BrandDialogView; label: string }[] = [
  { view: 'brand-dna', label: 'Brand DNA' },
  { view: 'corporate-dna', label: 'Corporate DNA' },
  { view: 'brand-standards', label: 'Brand Guidelines' },
];

export function BrandDialogNav({ activeView, onNavigate, headerTextLight }: BrandDialogNavProps) {
  const textBase = headerTextLight ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  return (
    <nav
      className="flex items-center gap-0.5 rounded-full px-1 py-0.5 mt-1"
      style={{ backgroundColor: headerTextLight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
    >
      {NAV_ITEMS.map((item, i) => {
        const isActive = item.view === activeView;
        return (
          <span key={item.view} className="flex items-center">
            {i > 0 && (
              <span
                className="text-[8px] mx-0.5 select-none"
                style={{ color: `${textBase}0.3)` }}
              >
                ·
              </span>
            )}
            <button
              onClick={() => !isActive && onNavigate(item.view)}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium font-product-sans tracking-wide transition-all duration-150"
              style={{
                backgroundColor: isActive
                  ? (headerTextLight ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)')
                  : 'transparent',
                color: isActive
                  ? `${textBase}0.95)`
                  : `${textBase}0.55)`,
                cursor: isActive ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = headerTextLight
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)';
                  e.currentTarget.style.color = `${textBase}0.85)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = `${textBase}0.55)`;
                }
              }}
            >
              {item.label}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
