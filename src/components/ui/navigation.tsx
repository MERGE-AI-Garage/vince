// ABOUTME: Top navigation bar for Vince.
// ABOUTME: Minimal nav with brand name, studio links, and sign out.

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Palette, Settings, FolderOpen, BookOpen } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const DOCS_URL = '/docs/';

const Navigation = () => {
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/92 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Vince
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/studio"><Palette className="w-4 h-4 mr-1.5" />Studio</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/campaigns"><FolderOpen className="w-4 h-4 mr-1.5" />Campaigns</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin"><Settings className="w-4 h-4 mr-1.5" />Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                <BookOpen className="w-4 h-4 mr-1.5" />Docs
              </a>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
