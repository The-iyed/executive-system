import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/lib/ui/components/sheet';
import { NavItem } from './navigation-actions';
import { Logo } from './logo';

interface MobileNavDrawerProps {
  items: NavItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  items,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNav = (path?: string) => {
    if (path) {
      navigate(path);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b border-gray-100">
          <SheetTitle className="flex justify-end">
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-3 mt-2" dir="rtl">
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.path)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-colors duration-150 cursor-pointer text-right
                  ${active
                    ? 'bg-[var(--color-primary-700)] text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon && (
                  <Icon icon={item.icon} width={20} height={20} />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export const MobileMenuTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
    aria-label="القائمة"
  >
    <Menu className="w-5 h-5" />
  </button>
);
