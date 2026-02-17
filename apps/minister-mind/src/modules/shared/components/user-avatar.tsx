import React from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@sanad-ai/ui';
import { useAuth } from '@auth';

export interface UserAvatarProps {
  className?: string;
  /** Header mode: only show circular avatar, keep dropdown for logout */
  compact?: boolean;
}

function getInitials(name: string, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  return '?';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  className = '',
  compact = false,
}) => {
  const { user, logout } = useAuth();

  const name = user?.username || '';
  const email = user?.email || '';
  const initials = getInitials(name, email);

  const handleLogout = () => {
    logout();
  };

  const avatarNode = (
    <div
      className={`flex items-center justify-center rounded-full flex-shrink-0 bg-[#048F86] text-white font-semibold ${compact ? 'w-10 h-10 text-sm' : 'w-[43px] h-[43px] text-base'}`}
      aria-hidden
    >
      {initials}
    </div>
  );

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`flex items-center gap-3 cursor-pointer p-0 border-0 bg-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#048F86]/50 ${compact ? 'rounded-full overflow-hidden flex-shrink-0' : ''} ${className}`}
            aria-label={name || 'المستخدم'}
          >
            {avatarNode}
            {!compact && (
              <div className="flex flex-col min-w-0 flex-1 max-w-[150px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h2 className="text-lg font-semibold text-white leading-tight truncate max-w-full text-right">
                      {name}
                    </h2>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{name}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-white/95 leading-tight truncate max-w-full text-right">
                      {email}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{email}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold">{name}</h4>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};
