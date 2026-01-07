import React from 'react';
import { Bell, Settings, Square, User, Menu } from 'lucide-react';

export const PortalHeader: React.FC = () => {
  return (
    <header className="w-full sticky top-0 z-50 shadow-sm" dir="rtl">
      {/* Top Bar - Dark Teal (#045859) */}
      <div className="bg-[#045859] text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Right: User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium leading-tight text-white">عبدالله القحطاني</span>
                <span className="text-xs leading-tight text-white/80 mt-0.5">مستشار</span>
              </div>
            </div>

            {/* Left: Logo and Icons */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center border-l border-white/20 pl-4 ml-4">
                <span className="text-sm font-semibold text-white whitespace-nowrap">المنصة القانونية الموحدة</span>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5">
                <button 
                  className="w-12 h-12 rounded-full bg-[#06494a] hover:bg-[#06494a]/90 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button 
                  className="w-12 h-12 rounded-full bg-[#06494a] hover:bg-[#06494a]/90 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="الإعدادات"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  className="w-12 h-12 rounded-full bg-[#06494a] hover:bg-[#06494a]/90 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="القائمة"
                >
                  <Square className="w-5 h-5" />
                </button>
                <button 
                  className="w-12 h-12 rounded-full bg-[#06494a] hover:bg-[#06494a]/90 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                  aria-label="القائمة الرئيسية"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Lighter Teal (#00A79D) */}
      <div className="bg-[#00A79D] text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <nav className="flex items-center h-12">
            <a
              href="#"
              className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors text-white/60 hover:text-white relative"
            >
              الإثراء المعرفي
            </a>
            <a
              href="#"
              className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors text-white/60 hover:text-white relative"
            >
              تواصل معنا
            </a>
            <a
              href="#"
              className="px-5 py-2.5 text-sm font-medium bg-white/20 hover:bg-white/25 transition-colors text-white relative border-b-2 border-white"
            >
              الخدمات الإلكترونية
            </a>
            <a
              href="#"
              className="px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors text-white/60 hover:text-white relative"
            >
              الصفحة الرئيسية
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
