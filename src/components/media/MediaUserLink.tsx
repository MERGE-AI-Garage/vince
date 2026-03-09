// ABOUTME: Reusable component for displaying user profile links in media library
// ABOUTME: Shows username and links to user profile page with hover styling

import { User } from 'lucide-react';

interface MediaUserLinkProps {
  userId: string;
  userName?: string | null;
  className?: string;
  showIcon?: boolean;
}

export function MediaUserLink({
  userId: _userId,
  userName,
  className = '',
  showIcon = false
}: MediaUserLinkProps) {
  const displayName = userName || 'Unknown User';

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={`Uploaded by ${displayName}`}
    >
      {showIcon && <User className="h-3 w-3" />}
      {displayName}
    </span>
  );
}
