import React from 'react';
import { SharedLayout } from '@shared';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <div className="relative min-h-screen w-full">
      <style>{`
        .children-container,
        .children-background {
          display: none !important;
        }
      `}</style>
      <SharedLayout
        headerClassName="h-[250px]"
        bgHeaderClassName="h-[310px]"
        children={null}
        welcomeSection={{
          title: 'مرحباً بك،',
          description: 'قم بتسجيل الدخول للوصول إلى حسابك وإدارة اجتماعاتك بكل سهولة',
        }}
      />
    
      {/* <div
        className="fixed pointer-events-none z-[5]"
        style={{
          width: '787.27px',
          height: '823.36px',
          left: '-578.12px',
          top: '-51.55px',
          background: '#DFEEF5',
          filter: 'blur(117.833px)',
          transform: 'rotate(90deg)',
        }}
      /> */}
      {/* Background right */}
      {/* <div
        className="fixed pointer-events-none z-[5]"
        style={{
          width: '787.27px',
          height: '823.36px',
          left: '974.33px',
          top: '184.11px',
          background: 'rgba(245, 255, 211, 0.5)',
          filter: 'blur(117.833px)',
          transform: 'rotate(90deg)',
        }}
      /> */}
      
      {/* White Card Container */}
      <div
        className="fixed bottom-[12px] left-1/2 -translate-x-1/2 rounded-[14px] bg-[#FFFFFF] h-[calc(100vh-375px)]"
        style={{
          boxShadow: '0px 0px 14.2px rgba(0, 0, 0, 0.08)',
          width: 'calc(100% - 24px)',
        }}
      >
        {children}
      </div>
    </div>
  );
};