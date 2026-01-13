import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactQuery from '@tanstack/react-query';
import { ServiceCard } from './service-card';
import { AnalyzerIcon, BalanceIcon, ArticleIcon, FileIcon } from './service-icons';
import { BarChart3Icon } from 'lucide-react';
// Import types to ensure Window interface is extended
import '@sanad-ai/config';

export interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  isComingSoon?: boolean;
  isDisabled?: boolean;
  url?: string;
}

export const ServicesGrid: React.FC = () => {
  const [isLegalStatsLoading] = React.useState(false);
  const [isLegalAssistantLoading, setIsLegalAssistantLoading] = React.useState(false);
  const [isMuhallilAhkamLoading, setIsMuhallilAhkamLoading] = React.useState(false);

  // Preload scripts on component mount
  React.useEffect(() => {
    // Expose React, ReactDOM, and ReactQuery as globals for UMD bundles
    // This must happen BEFORE the UMD bundles load
    if (typeof window !== 'undefined') {
      (window as any).React = React;
      (window as any).ReactDOM = ReactDOM;
      (window as any).ReactQuery = ReactQuery;
    }

    // Add style isolation CSS to prevent package styles from affecting our app
    const styleId = 'sanad-ai-package-isolation';
    if (!document.getElementById(styleId)) {
      const isolationStyle = document.createElement('style');
      isolationStyle.id = styleId;
      isolationStyle.textContent = `
      /* Packages will manage their own isolated containers */
      /* Prevent any global styles from packages affecting Sanad AI */
      body:not(:has(#muhallil-ahkam-container)) {
        /* Sanad AI styles remain unaffected when packages are not open */
      }
      `;
      document.head.appendChild(isolationStyle);
    }

    // Load Legal Stats script - ISOLATED from other scripts
    // This script loading is completely independent and won't be affected by other script failures
    const legalStatsScriptId = 'legal-stats-script';
    if (!document.getElementById(legalStatsScriptId)) {
      try {
        const legalStatsScript = document.createElement('script');
        legalStatsScript.id = legalStatsScriptId;
        legalStatsScript.src = 'https://legal-stats.momrahai.com/legal-analyst.umd.js';
        legalStatsScript.async = true;
        // Note: crossOrigin is NOT set - script tags don't need CORS headers unless you're reading their content
        // Removing crossOrigin prevents CORS errors while still allowing the script to execute
        
        // Error handler - isolated, won't affect other scripts
        legalStatsScript.onerror = (error) => {
          console.error('[Sanad AI] Failed to load legal-stats script:', error);
          // Don't throw or affect other scripts - just log the error
        };
        
        // Success handler - verify API is available
        legalStatsScript.onload = () => {
          try {
            // Verify that the API is actually exposed on window
            // The script might expose it as legalStats, StatsBot, or AiStatsBot
            const statsBot = (window as any).legalStats || (window as any).AiStatsBot || (window as any).StatsBot;
            if (statsBot && typeof statsBot.open === 'function') {
              // Alias to AiStatsBot for consistency across the codebase
              if (!(window as any).AiStatsBot) {
                (window as any).AiStatsBot = statsBot;
                if ((window as any).legalStats) {
                  console.log('[Sanad AI] legal-stats script exposed as legalStats, aliasing to AiStatsBot');
                } else if ((window as any).StatsBot) {
                  console.log('[Sanad AI] legal-stats script exposed as StatsBot, aliasing to AiStatsBot');
                }
              }
              console.log('[Sanad AI] legal-stats script loaded successfully and API is available');
            } else {
              console.warn('[Sanad AI] legal-stats script loaded but API is not available');
              console.warn('[Sanad AI] window.legalStats:', (window as any).legalStats);
              console.warn('[Sanad AI] window.AiStatsBot:', (window as any).AiStatsBot);
              console.warn('[Sanad AI] window.StatsBot:', (window as any).StatsBot);
            }
          } catch (error) {
            console.error('[Sanad AI] Error during legal-stats script execution:', error);
            // Don't throw - just log the error
          }
        };
        
        document.body.appendChild(legalStatsScript);
      } catch (error) {
        console.error('[Sanad AI] Error setting up legal-stats script:', error);
        // Don't throw - just log the error so it doesn't affect other scripts
      }
    }

    // Load Legal Assistant script - ISOLATED from legal-stats
    // This script loading is completely independent and won't affect legal-stats
    const legalAssistantScriptId = 'legal-assistant-script';
    if (!document.getElementById(legalAssistantScriptId)) {
      try {
        const legalAssistantScript = document.createElement('script');
        legalAssistantScript.id = legalAssistantScriptId;
        legalAssistantScript.src = 'https://legal-assistant-v2.momrahai.com/legal-assistant-v1.1.umd.js';
        legalAssistantScript.async = true;
        legalAssistantScript.crossOrigin = 'anonymous';
        
        // Error handler - isolated, won't affect legal-stats or other scripts
        legalAssistantScript.onerror = (error) => {
          // Use warn instead of error to indicate it's non-critical
          console.warn('[Sanad AI] Legal Assistant script failed to load (this is optional):', error);
          setIsLegalAssistantLoading(false);
          // Don't throw - just log and continue
        };
        
        // Success handler
        legalAssistantScript.onload = () => {
          try {
            // Verify API is available
            if ((window as any).LegalAssistant && typeof (window as any).LegalAssistant.open === 'function') {
              console.log('[Sanad AI] legal-assistant script loaded successfully and API is available');
            } else {
              console.warn('[Sanad AI] legal-assistant script loaded but window.LegalAssistant is not available');
            }
            setIsLegalAssistantLoading(false);
          } catch (error) {
            console.warn('[Sanad AI] Error during legal-assistant script execution:', error);
            setIsLegalAssistantLoading(false);
            // Don't throw - just log and continue
          }
        };
        
        document.body.appendChild(legalAssistantScript);
      } catch (error) {
        // Use warn instead of error - this is optional functionality
        console.warn('[Sanad AI] Error setting up legal-assistant script (this is optional):', error);
        setIsLegalAssistantLoading(false);
        // Don't throw - just log and continue so it doesn't affect other scripts
      }
    }

    // Load Muhallil Ahkam script
    const muhallilAhkamScriptId = 'muhallil-ahkam-script';
    if (!document.getElementById(muhallilAhkamScriptId)) {
      const muhallilAhkamScript = document.createElement('script');
      muhallilAhkamScript.id = muhallilAhkamScriptId;
      // Use portal base URL if available, otherwise use the external URL
      const portalBaseUrl = import.meta.env.VITE_PORTAL_BASE_URL || 'https://legal-portal.momrahai.com';
      muhallilAhkamScript.src = `${portalBaseUrl}/muhallil-ahkam.js`;
      muhallilAhkamScript.async = true;
      muhallilAhkamScript.onerror = () => {
        console.error('Failed to load Muhallil Ahkam script from:', muhallilAhkamScript.src);
        setIsMuhallilAhkamLoading(false);
      };
      document.body.appendChild(muhallilAhkamScript);
    }
  }, []);

  const handleServiceClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleMuhallilAhkamClick = () => {
    // Check if MuhallilAhkam is already available
    const muhallilAhkam = window.MuhallilAhkam;
    if (muhallilAhkam && typeof muhallilAhkam.open === 'function') {
      try {
        // Package manages its own isolated container
        muhallilAhkam.open();
      } catch (error) {
        console.error('Error opening Muhallil Ahkam:', error);
        setIsMuhallilAhkamLoading(false);
      }
      return;
    }

    // Set loading state and wait for script to be ready
    setIsMuhallilAhkamLoading(true);

    const openWhenReady = () => {
      const loadedMuhallilAhkam = window.MuhallilAhkam;
      if (loadedMuhallilAhkam && typeof loadedMuhallilAhkam.open === 'function') {
        setIsMuhallilAhkamLoading(false);
        try {
          // Package manages its own isolated container
          loadedMuhallilAhkam.open();
        } catch (error) {
          console.error('Error opening Muhallil Ahkam:', error);
          setIsMuhallilAhkamLoading(false);
        }
        return true;
      }
      return false;
    };

    // Try to open immediately
    if (openWhenReady()) {
      return;
    }

    // Wait for script to load if it's still loading
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds at 50ms intervals
    const checkInterval = setInterval(() => {
      attempts++;
      if (openWhenReady()) {
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        setIsMuhallilAhkamLoading(false);
        console.error('Muhallil Ahkam failed to load after 5 seconds. Check if the script is loading correctly.');
      }
    }, 50);
  };

  const handleLegalStatsClick = () => {
    // Helper to get the stats bot API (check all possible names)
    const getStatsBot = () => {
      return (window as any).legalStats || (window as any).AiStatsBot || (window as any).StatsBot;
    };

    // Check if stats bot is already available
    const statsBot = getStatsBot();
    if (statsBot && typeof statsBot.open === 'function') {
      try {
        statsBot.open();
      } catch (error) {
        console.error('[Sanad AI] Error calling legal stats bot open():', error);
        // Don't throw - just log the error
      }
      return;
    }

    // Wait for script to load and initialize
    let attempts = 0;
    const maxAttempts = 100; // 5 seconds at 50ms intervals
    const checkInterval = setInterval(() => {
      attempts++;
      const bot = getStatsBot();
      if (bot && typeof bot.open === 'function') {
        clearInterval(checkInterval);
        try {
          bot.open();
        } catch (error) {
          console.error('[Sanad AI] Error calling legal stats bot open():', error);
          // Don't throw - just log the error
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('[Sanad AI] Stats bot failed to load. Make sure the script is loaded correctly.');
        console.error('[Sanad AI] window.legalStats:', (window as any).legalStats);
        console.error('[Sanad AI] window.AiStatsBot:', (window as any).AiStatsBot);
        console.error('[Sanad AI] window.StatsBot:', (window as any).StatsBot);
        // Don't throw - just log the error
      }
    }, 50);
  };

  const handleLegalAssistantClick = () => {
    // Check if LegalAssistant is already available
    const legalAssistant = window.LegalAssistant;
    if (legalAssistant && typeof legalAssistant.open === 'function') {
      legalAssistant.open();
      return;
    }

    // Set loading state and wait for script to be ready
    setIsLegalAssistantLoading(true);

    const openWhenReady = () => {
      const loadedLegalAssistant = window.LegalAssistant;
      if (loadedLegalAssistant && typeof loadedLegalAssistant.open === 'function') {
        setIsLegalAssistantLoading(false);
        loadedLegalAssistant.open();
        return true;
      }
      return false;
    };

    // Try to open immediately
    if (openWhenReady()) {
      return;
    }

    // Wait for script to load if it's still loading
    const checkInterval = setInterval(() => {
      if (openWhenReady()) {
        clearInterval(checkInterval);
      }
    }, 50);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      setIsLegalAssistantLoading(false);
    }, 5000);
  };

  const services: Service[] = [
    {
      title: 'تحليل الأحكام',
      description: 'تقدم هذه الخدمة تحليلًا للأحكام القضائية النهائية والتنفيذية، بما يرفع كفاءة الأعمال ويحد من خسارة القضايا مستقبلًا وتعزيز فرص الكسب.',
      icon: <AnalyzerIcon />,
      // No URL - handled by handleMuhallilAhkamClick
    },
    {
      title: 'محلل الرؤى والتوقعات',
      description: 'تتيح هذه الخدمة تحليل البيانات القانونية والإحصائية، واستخراج الرؤى والتوقعات لدعم اتخاذ القرارات الاستراتيجية.',
      icon: <BarChart3Icon />,
      // No URL - handled by handleLegalStatsClick
    },

    {
      title: 'المذكرة القانونية',
      description: 'أداة ذكية تعتمد على منظومة وكلاء قانونيين رقميين تعمل بتقنيات الذكاء الاصطناعي لتحليل القضايا وصياغة لوائح الرد بدقة و موثوقية.',
      icon: <BalanceIcon />,
      // No URL - handled by handleLegalAssistantClick
    },
    {
      title: 'صياغة المستندات والمراسلات',
      description: 'يتم من خلال هذه الخدمة إعداد وصياغة المستندات والمراسلات القانونية وتدقيقها بدقة ووضوح.',
      icon: <ArticleIcon />,
      isComingSoon: true,
      isDisabled: true,
    },
    {
      title: 'تحليل التشريعات',
      description: 'تساعد هذه الخدمة المستفيدين من تقديم المتطلبات اللازمة من دراسة مشاريع القوانين واللوائح التنظيمية، وتقديم المقترحات اللازمة.',
      icon: <FileIcon />,
      isComingSoon: true,
      isDisabled: true,
    },

  ];

  const firstRowServices = services.slice(0, 3);
  const secondRowServices = services.slice(3, 6);

  const renderServiceRow = (rowServices: Service[], startIndex: number) => {
    const isTwoCards = rowServices.length === 2;
    
    if (isTwoCards) {
      return (
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 w-full">
          {rowServices.map((service, index) => (
            <div 
              key={startIndex + index} 
              className="w-full sm:w-[calc(50%-0.25rem)] lg:w-[calc(33.333%-0.5rem)]"
            >
              <ServiceCard 
                {...service} 
                isLoading={
                  service.title === 'تحليل الأحكام'
                    ? isMuhallilAhkamLoading
                    : service.title === 'محلل الرؤى والتوقعات' 
                      ? isLegalStatsLoading
                      : service.title === 'المذكرة القانونية'
                        ? isLegalAssistantLoading
                        : false
                }
                onClick={
                  service.title === 'تحليل الأحكام'
                    ? handleMuhallilAhkamClick
                    : service.title === 'محلل الرؤى والتوقعات' 
                      ? handleLegalStatsClick
                      : service.title === 'المذكرة القانونية'
                        ? handleLegalAssistantClick
                        : service.url 
                          ? () => handleServiceClick(service.url) 
                          : undefined
                }
              />
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 w-full">
        {rowServices.map((service, index) => (
          <ServiceCard 
            key={startIndex + index} 
            {...service} 
            isLoading={
              service.title === 'تحليل الأحكام'
                ? isMuhallilAhkamLoading
                : service.title === 'محلل الرؤى والتوقعات' 
                  ? isLegalStatsLoading
                  : service.title === 'المذكرة القانونية'
                    ? isLegalAssistantLoading
                    : false
            }
            onClick={
              service.title === 'تحليل الأحكام'
                ? handleMuhallilAhkamClick
                : service.title === 'محلل الرؤى والتوقعات' 
                  ? handleLegalStatsClick
                  : service.title === 'المذكرة القانونية'
                    ? handleLegalAssistantClick
                    : service.url 
                      ? () => handleServiceClick(service.url) 
                      : undefined
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2">
      {renderServiceRow(firstRowServices, 0)}
      {renderServiceRow(secondRowServices, 3)}
    </div>
  );
};

