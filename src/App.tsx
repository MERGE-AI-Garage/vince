// ABOUTME: Root application component with auth-gated routing.
// ABOUTME: Wraps routes in AuthProvider, redirects unauthenticated users to login.

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UnifiedThemeProvider } from '@/components/UnifiedThemeProvider';
import Login from '@/pages/Login';
import { lazy, Suspense } from 'react';

const CreativeStudio = lazy(() => import('@/pages/CreativeStudio'));
const CreativeStudioAdmin = lazy(() => import('@/pages/CreativeStudioAdmin'));
const VinceControlPanel = lazy(() => import('@/pages/VinceControlPanel'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><CreativeStudio /></ProtectedRoute>} />
        <Route path="/studio" element={<ProtectedRoute><CreativeStudio /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><CreativeStudioAdmin /></ProtectedRoute>} />
        <Route path="/vince" element={<ProtectedRoute><VinceControlPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <UnifiedThemeProvider defaultTheme="dark">
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </AuthProvider>
    </UnifiedThemeProvider>
  );
}
