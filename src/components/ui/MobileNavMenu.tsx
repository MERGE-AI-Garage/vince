// ABOUTME: Sheet-based mobile navigation drawer for main site links
// ABOUTME: Slides in from the left on screens below md breakpoint

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { FlaskConical, type LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

interface LabsItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

interface MobileNavMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[];
  siteTitle?: string;
  labsItems?: LabsItem[];
}

export function MobileNavMenu({ open, onOpenChange, navItems, siteTitle, labsItems }: MobileNavMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left font-fraunces">{siteTitle || 'AI Garage'}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => onOpenChange(false)}
              className="px-3 py-2.5 rounded-md text-sm font-epilogue transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
          {labsItems && labsItems.length > 0 && (
            <>
              <div className="border-t my-2" />
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="h-3 w-3" />
                Labs
              </div>
              {labsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => onOpenChange(false)}
                    className="px-3 py-2.5 rounded-md text-sm font-epilogue transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
