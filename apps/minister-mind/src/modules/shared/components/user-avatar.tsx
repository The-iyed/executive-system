import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@sanad-ai/ui';
import { useAuth } from '@auth';
import Avatar from '../assets/Avatar.svg';

export interface UserAvatarProps {
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  className = ''
}) => {
  const { user } = useAuth();
  
  const name =  user?.username || '';
  const email = user?.email || '';
  
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-3 ${className}`}>
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
    </TooltipProvider>
  );
};