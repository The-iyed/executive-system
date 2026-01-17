import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Button, HoverCard, HoverCardTrigger, HoverCardContent } from '@sanad-ai/ui';
import { useAuth } from '@auth';
import Avatar from '../assets/Avatar.svg';

export interface UserAvatarProps {
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  className = ''
}) => {
  const { user, logout } = useAuth();
  
  const name =  user?.username || '';
  const email = user?.email || '';
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <TooltipProvider>
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className={`flex items-center gap-3 cursor-pointer ${className}`}>
            <img 
              src={Avatar} 
              alt="User Avatar" 
              className="w-[43px] h-[43px] rounded-full flex-shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1 max-w-[150px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="text-lg font-semibold text-white leading-tight truncate max-w-full">
                    {name}
                  </h2>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{name}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-white/95 leading-tight truncate max-w-full">
                    {email}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{email}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-56" align="end" sideOffset={8}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold">{name}</h4>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="sm"
              className="w-full mt-2"
            >
              تسجيل الخروج
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </TooltipProvider>
  );
};