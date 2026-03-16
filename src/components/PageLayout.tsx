// ABOUTME: Page layout wrapper for Vince.
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
    <div className={cn("min-h-screen bg-background", className)}>
      <Navigation />
      <div className="pt-16 flex-1">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
