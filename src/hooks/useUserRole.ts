import { useAuth, UserRole } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user, userRole, loading } = useAuth();

  // Role is considered "loaded" when userRole has been fetched (not null)
  // Once fetched, userRole will be 'admin', 'board_admin', or 'user' (defaults to 'user' if not found)
  const isRoleLoaded = userRole !== null;

  const isAdmin = userRole === 'admin';
  const isBoardAdmin = userRole === 'board_admin';
  const isUser = userRole === 'user';
  const canEdit = isAdmin;
  // Board admins and admins can both edit board content (text fields, status, etc.)
  const canEditBoard = isAdmin || isBoardAdmin;

  return {
    user,
    userRole,
    loading,
    isRoleLoaded,
    isAdmin,
    isBoardAdmin,
    isUser,
    canEdit,
    canEditBoard,
  };
};