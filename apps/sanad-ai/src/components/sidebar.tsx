import React, { useState, useMemo } from 'react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarInput,
  Button,
  useSidebar,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@sanad-ai/ui';

import SanadAiIcon from '../assets/sanad-ai-icon.svg';
import LayoutIcon from '../assets/layout-alt-02.svg';
import SearchLgIcon from '../assets/search-lg.svg';
import EditeIcon from '../assets/edit-05.svg';
import BackgroundImage from '../assets/bg.png';

// Constants
const SIDEBAR_STYLES = {
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 100%), linear-gradient(90deg, rgba(5, 88, 89, 1) 0%, rgba(5, 88, 89, 1) 100%)',
} as const;


// Reusable Sidebar Toggle Button Component
export interface SidebarToggleButtonProps {
  className?: string;
  size?: 'default' | 'small' | 'large';
}

export const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({
  className = '',
  size = 'default',
}) => {
  const { toggleSidebar } = useSidebar();

  const sizeClasses = {
    default: 'w-[40px] h-[40px]',
    small: 'w-[32px] h-[32px]',
    large: 'w-[48px] h-[48px]',
  };

  const iconSizeClasses = {
    default: 'w-4 h-4',
    small: 'w-3 h-3',
    large: 'w-5 h-5',
  };

  return (
    <button
      onClick={toggleSidebar}
      className={`flex ${sizeClasses[size]} p-2 justify-center items-center aspect-square rounded-[6px] bg-[#00A79D] hover:bg-[#00A79D]/90 transition-colors flex-shrink-0 ${className}`}
      aria-label="Toggle Sidebar"
    >
      <img 
        src={LayoutIcon} 
        alt="القائمة" 
        className={iconSizeClasses[size]} 
      />
    </button>
  );
};

const SidebarHeader: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <div 
        className="flex w-[40px] h-[40px] justify-center items-center flex-shrink-0"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.37)',
        }}
      >
        <img 
          src={SanadAiIcon} 
          alt="SANAD AI" 
          className="w-[18px] h-[18px]"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between gap-2 mb-6">
      <SidebarToggleButton />
      
      <h1
        className="flex-1 text-left text-white text-[18px] font-bold leading-[24px]"
      >
        SANAD AI
      </h1>

      <div 
        className="flex w-[40px] h-[40px] justify-center items-center flex-shrink-0"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.37)',
        }}
      >
        <img 
          src={SanadAiIcon} 
          alt="SANAD AI" 
          className="w-[18px] h-[18px]"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>
    </div>
  );
};

// Search Input Component
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="w-full relative">
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10">
        <img src={SearchLgIcon} alt="بحث" className="w-full h-full" />
      </div>
      <SidebarInput
        type="text"
        placeholder="البحث في المحادثة ..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[38px] pr-8 pl-2 rounded-[6px] border-[0.2px] border-[#D8D8D8] bg-white text-right text-[14px] font-bold leading-[20px] placeholder:text-[#BBB] focus-visible:ring-0 focus-visible:outline-none"
        style={{
          boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.08)',
        }}
      />
    </div>
  );
};

// Icon Button Component (for collapsed state)
const IconButton: React.FC<{
  icon: string;
  alt: string;
  onClick?: () => void;
  bgColor?: string;
  shape?: 'square' | 'circle' | 'rectangle';
}> = ({ icon, alt, onClick, bgColor = '#4A8C8C', shape = 'square' }) => {
  const shapeClasses = {
    square: 'rounded-[6px]',
    circle: 'rounded-full',
    rectangle: 'rounded-[6px]',
  };

  return (
    <button
      onClick={onClick}
      className={`flex w-[40px] h-[40px] justify-center items-center hover:opacity-90 transition-opacity flex-shrink-0 ${shapeClasses[shape]}`}
      style={{ backgroundColor: bgColor }}
      aria-label={alt}
    >
      <img src={icon} alt={alt} className="w-4 h-4" />
    </button>
  );
};

// New Chat Button Component
const NewChatButton: React.FC<{ onNewChat?: () => void; isLoading?: boolean }> = ({ onNewChat, isLoading = false }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleNewChat = () => {
    if (!isLoading) {
      onNewChat?.();
    }
  };

  if (isCollapsed) {
    return (
      <IconButton
        icon={EditeIcon}
        alt="محادثة جديدة"
        bgColor="#4A8C8C"
        shape="square"
        onClick={handleNewChat}
      />
    );
  }

  return (
    <Button
      className="w-full h-[38px] flex items-center gap-2 pl-2 rounded-[6px] bg-[#00A79D] hover:bg-[#00A79D]/90 text-white text-right text-[14px] font-bold leading-[20px] justify-start border-0 disabled:opacity-70"
      style={{
        background: 'linear-gradient(90deg, rgba(0, 167, 157, 1) 0%, rgba(0, 167, 157, 1) 100%), linear-gradient(90deg, rgba(248, 248, 248, 1) 0%, rgba(248, 248, 248, 1) 100%)',
      }}
      onClick={handleNewChat}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 flex-shrink-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="truncate">جارٍ الإنشاء...</span>
        </>
      ) : (
        <>
          <div className="w-4 h-4 flex-shrink-0">
            <img src={EditeIcon} alt="محادثة جديدة" className="w-full h-full" />
          </div>
          <span className="truncate">محادثة جديدة</span>
        </>
      )}
    </Button>
  );
};

// Conversation Item Component
interface ConversationItemProps {
  title: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ title, isActive, onClick, onDelete }) => {
  const titleRef = React.useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const checkTruncation = () => {
      if (titleRef.current) {
        const isTextTruncated = titleRef.current.scrollWidth > titleRef.current.clientWidth;
        setIsTruncated(isTextTruncated);
      }
    };

    // Use a small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkTruncation, 0);
    
    // Re-check on window resize
    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [title]);

  const titleElement = (
    <p
      ref={titleRef}
      className="text-white text-[14px] font-normal leading-[20px] truncate"
      dir="auto"
    >
      {title}
    </p>
  );

  return (
    <div
      className={`w-full h-[42px] flex items-center gap-2 px-3 rounded-[4px] transition-colors group ${
        isActive ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'
      }`}
      dir="rtl"
    >
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-2 min-w-0"
      >
        <div className="w-2 h-2 flex-shrink-0 flex items-center justify-center">
          <span className="text-white text-[8px] leading-[20px]">.</span>
        </div>
        <div className="flex-1 text-right min-w-0">
          {isTruncated ? (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  {titleElement}
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs z-[10000] bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${BackgroundImage})`,
                  }}
                >
                  <p className="break-words whitespace-normal">{title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            titleElement
          )}
        </div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white text-xs px-2"
          aria-label="Delete conversation"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Search Icon Button (for collapsed state)
const SearchIconButton: React.FC = () => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!isCollapsed) {
    return null;
  }

  return (
    <IconButton
      icon={SearchLgIcon}
      alt="بحث"
      bgColor="#FFFFFF"
      shape="square"
      onClick={() => {}}
    />
  );
};

// Conversations List Component
interface ConversationsListProps {
  conversations: Array<{ conversation_id: string; name: string }>;
  currentConversationId?: string | null;
  onSelectConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  isLoading?: boolean;
}

const ConversationSkeleton: React.FC = () => {
  return (
    <div className="w-full h-[48px] rounded-lg bg-white/10 animate-pulse flex items-center gap-3 px-3">
      <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0" />
      <div className="flex-1 h-4 rounded bg-white/20" />
      <div className="w-6 h-6 rounded bg-white/20 flex-shrink-0" />
    </div>
  );
};

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isLoading = false,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-1">
        {[...Array(5)].map((_, index) => (
          <ConversationSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="w-full text-center py-4">
        <p className="text-white/60 text-sm" >
          لا توجد محادثات
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-1">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.conversation_id}
          title={conv.name}
          isActive={currentConversationId === conv.conversation_id}
          onClick={() => onSelectConversation?.(conv.conversation_id)}
          onDelete={onDeleteConversation ? () => onDeleteConversation(conv.conversation_id) : undefined}
        />
      ))}
    </div>
  );
};

// Main Sidebar Component
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  conversations?: Array<{ conversation_id: string; name: string }>;
  currentConversationId?: string | null;
  onSelectConversation?: (conversationId: string) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  onUpdateConversation?: (conversationId: string, name: string) => void;
  isLoadingConversations?: boolean;
  isCreatingConversation?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoadingConversations = false,
  isCreatingConversation = false,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    
    const query = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) =>
      conv.name.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  return (
    <ShadcnSidebar
      side="right"
      variant="floating"
      collapsible="icon"
      className={`fixed top-[13px] right-[13px] h-[calc(100vh-26px)] rounded-[20px] border-0 transition-all duration-300 ${
        // On mobile, always show collapsed sidebar (smaller width)
        // On larger screens, respect the collapsed state
        isCollapsed 
          ? 'w-[60px] sm:w-[60px]' 
          : 'w-[60px] sm:w-[300px]'
      }`}
      style={{
        ...SIDEBAR_STYLES,
        boxShadow: '0px 4px 21.1px 0px rgba(255, 255, 255, 0.24)',
      }}
      dir="rtl"
    >
      <SidebarContent
        className={`flex flex-col h-full ${
          isCollapsed 
            ? 'items-center gap-6 p-3' 
            : 'gap-3 p-3'
        }`}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          [data-sidebar="content"]::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        <SidebarHeader />

        {!isCollapsed ? (
          <div className="w-full flex flex-col gap-2 flex-1 min-h-0">
            <SearchInput value={searchQuery} onChange={setSearchQuery} />
            <NewChatButton onNewChat={onNewConversation} isLoading={isCreatingConversation} />
            
            <div className="flex-1 overflow-y-auto min-h-0" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              <style>{`
                .conversations-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="conversations-scroll">
                <ConversationsList
                  conversations={filteredConversations}
                  currentConversationId={currentConversationId}
                  onSelectConversation={onSelectConversation}
                  onDeleteConversation={onDeleteConversation}
                  isLoading={isLoadingConversations}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <SidebarToggleButton />
            <SearchIconButton />
            <NewChatButton onNewChat={onNewConversation} isLoading={isCreatingConversation} />
          </div>
        )}
      </SidebarContent>
    </ShadcnSidebar>
  );
};
