// ABOUTME: Root application component with auth-gated routing.
// ABOUTME: Wraps routes in AuthProvider, redirects unauthenticated users to login.

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UnifiedThemeProvider } from '@/components/UnifiedThemeProvider';
import Login from '@/pages/Login';
import React, { Suspense, lazy } from 'react';

const CreativeStudio = lazy(() => import('@/pages/CreativeStudio'));
const CreativeStudioAdmin = lazy(() => import('@/pages/CreativeStudioAdmin'));
const VinceControlPanel = lazy(() => import('@/pages/VinceControlPanel'));

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <pre className="text-sm text-left bg-muted p-4 rounded max-w-2xl overflow-auto whitespace-pre-wrap">{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <ErrorBoundary>
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><CreativeStudio /></ProtectedRoute>} />
        <Route path="/studio" element={<ProtectedRoute><CreativeStudio /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><CreativeStudioAdmin /></ProtectedRoute>} />
        <Route path="/vince" element={<ProtectedRoute><VinceControlPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
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
