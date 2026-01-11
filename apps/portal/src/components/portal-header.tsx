import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ChevronDown, Menu, X } from 'lucide-react';
import mainLogo from '../assets/mainlogo.svg';

export const PortalHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="w-full sticky top-0 z-50" dir="rtl">
      {/* Header - Dark Teal (#045859) */}
      <div className="bg-[#045859] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-1.5">
          <div className="flex items-center justify-between h-[58px] gap-4 sm:gap-16">
            {/* Header Right (RTL: appears on right) - Logo and Navigation Menu */}
            <div className="flex items-center gap-3  min-w-0">
              {/* Logo */}
              <img 
                src={mainLogo} 
                alt="المنصة القانونية الموحدة" 
                className="h-[32px] sm:h-[38px] w-auto flex-shrink-0"
              />
              
              {/* Navigation Menu - Hidden on mobile */}
           
            </div>
              <div className="hidden lg:flex items-center justify-center px-3 bg-[#06494A] rounded-full">
                <nav className="flex items-center">
                  <a
                    href="#"
                    className="px-3 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white transition-colors"
                  >
                    الإثراء المعرفي
                  </a>
                  <a
                    href="#"
                    className="px-3 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white transition-colors"
                  >
                    تواصل معنا
                  </a>
                  <Link
                    to="/docs"
                    className={location.pathname === '/docs' 
                      ? "px-3 py-3 text-sm leading-6 font-normal text-white transition-colors"
                      : "px-3 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white transition-colors"
                    }
                  >
                    التوثيق
                  </Link>
                  <Link
                    to="/"
                    className={location.pathname === '/' 
                      ? "px-3 py-3 text-sm leading-6 font-normal text-white transition-colors"
                      : "px-3 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white transition-colors"
                    }
                  >
                    الخدمات الإلكترونية
                  </Link>
                  <a
                    href="#"
                    className="px-3 py-3 text-sm leading-6 font-normal text-white/20 hover:text-white transition-colors"
                  >
                    الصفحة الرئيسية
                  </a>
                </nav>
              </div>

            {/* Header Left (RTL: appears on left) - User Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* User Info Container - Compact on mobile */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#06494A] rounded-full">
                {/* User Info */}
                <div className="flex flex-col items-end">
                  <span className="text-sm leading-5 text-white font-normal">
                    عبدالله القحطاني
                  </span>
                  <span className="text-[10px] leading-4 text-white/80 font-normal">
                    مستشار
                  </span>
                </div>
                
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-[#00A79D]" />
                </div>
                <ChevronDown className="w-4 h-4 text-white" />
              </div>

              {/* Mobile: Just show user icon */}
              <div className="sm:hidden flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#06494A] flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-[#06494A] transition-colors flex-shrink-0"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu - Slide down */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-[#06494A] mt-2 pt-4 pb-4">
              <nav className="flex flex-col gap-2">
                <a
                  href="#"
                  className="px-4 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white hover:bg-[#06494A] rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  الإثراء المعرفي
                </a>
                <a
                  href="#"
                  className="px-4 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white hover:bg-[#06494A] rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  تواصل معنا
                </a>
                <Link
                  to="/docs"
                  className={location.pathname === '/docs'
                    ? "px-4 py-3 text-sm leading-6 font-normal text-white hover:bg-[#06494A] rounded-lg transition-colors"
                    : "px-4 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white hover:bg-[#06494A] rounded-lg transition-colors"
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  التوثيق
                </Link>
                <Link
                  to="/"
                  className={location.pathname === '/'
                    ? "px-4 py-3 text-sm leading-6 font-normal text-white hover:bg-[#06494A] rounded-lg transition-colors"
                    : "px-4 py-3 text-sm leading-6 font-normal text-white/40 hover:text-white hover:bg-[#06494A] rounded-lg transition-colors"
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  الخدمات الإلكترونية
                </Link>
                <a
                  href="#"
                  className="px-4 py-3 text-sm leading-6 font-normal text-white/20 hover:text-white hover:bg-[#06494A] rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  الصفحة الرئيسية
                </a>
                {/* Mobile User Info */}
                <div className="mt-4 pt-4 border-t border-[#06494A] px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#00A79D]" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm leading-5 text-white font-normal">
                        عبدالله القحطاني
                      </span>
                      <span className="text-[10px] leading-4 text-white/80 font-normal">
                        مستشار
                      </span>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
