// ABOUTME: Page layout wrapper for Brand Lens.
// ABOUTME: Provides consistent page structure with nav bar and content area.

import { ReactNode } from 'react';
import Navigation from '@/components/ui/navigation';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'gradient';
  hideFooter?: boolean;
}

const PageLayout = ({ children, className = '' }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className={cn("pt-16 flex-1", className)}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
