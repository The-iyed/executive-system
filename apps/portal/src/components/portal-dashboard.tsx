import React, { useState } from 'react';
import {
  Scale,
  FileText,
  Users,
  Brain,
  ClipboardList,
  CircleDot,
} from 'lucide-react';
import { ServiceCard, ServiceCardProps } from './service-card';
import { FilterTabs, FilterTab } from './filter-tabs';
import { SearchBox } from './search-box';
import { SanadAiIcon } from './sanad-ai-icon';

export const services: ServiceCardProps[] = [
  // {
  //   icon: BookOpen,
  //   category: 'التشريعات',
  //   title: 'النشر والاستطلاع',
  //   description:
  //     'تستهدف هذه الخدمة نشر التشريعات الجديدة أو المعدلة بالإضافة إلى إجراء استطلاعات حول الآراء والمقترحات المتعلقة بالتشريعات الحالية.',
  //   appKey: 'legislation-publish',
  // },
  // {
  //   icon: Scale,
  //   category: 'التشريعات',
  //   title: 'الوثائق النظامية',
  //   description:
  //     'تشمل هذه الخدمة تقديم المعلومات حول الوثائق النظامية وتعديلاتها، بما يتيح للمستفيدين الوصول إلى المعلومة والاطلاع على التعديلات القانونية.',
  //   appKey: 'legislation-documents',
  // },
  // {
  //   icon: FileText,
  //   category: 'القضايا',
  //   title: 'السوابق والأحكام القضائية',
  //   description:
  //     'تتيح هذه الخدمة إمكانية الاطلاع على نتائج تحليل الأحكام والسوابق القضائية، بما يسهم في تعزيز الاستفادة منها وتطوير المعرفة القانونية.',
  //   appKey: 'cases-precedents',
  // },
  // {
  //   icon: Gavel,
  //   category: 'القضايا',
  //   title: 'التنفيذ',
  //   description: 'تتيح هذه الخدمة رفع مطالبات التنفيذ لصالح الجهة.',
  //   appKey: 'cases-enforcement',
  // },
  // {
  //   icon: FileCheck,
  //   category: 'القضايا',
  //   title: 'الدعاوى القضائية',
  //   description: 'تتيح هذه الخدمة رفع الدعاوى، ومتابعة حالة سير القضية.',
  //   appKey: 'cases-lawsuits',
  // },
  // {
  //   icon: ClipboardList,
  //   category: 'الاستشارات القانونية',
  //   title: 'طلب استشارة قانونية',
  //   description:
  //     'تتيح هذه الخدمة استلام طلب الاستشارة القانونية لدراسة ومراجعة المعاملات وإبداء الرأي النظامي حيالها.',
  //   appKey: 'consultations-request',
  // },
  // {
  //   icon: FileText,
  //   category: 'الاستشارات القانونية',
  //   title: 'النماذج القانونية',
  //   description:
  //     'تقدم هذه الخدمة نماذج جاهزة للعقود ومذكرات التفاهم وكراسات الشروط، مما يسهل على المستخدمين إعداد الوثائق القانونية اللازمة بطريقة صحيحة ومهنية.',
  //   appKey: 'consultations-templates',
  // },
  // {
  //   icon: Users,
  //   category: 'لجان هيئة الخبراء',
  //   title: 'أعمال لجان هيئة الخبراء',
  //   description:
  //     'تتيح هذه الخدمة تشكيل لجان هيئة الخبراء ومتابعة أعمال اللجان والمصادقة على النتائج',
  //   appKey: 'committees-works',
  // },
  {
    icon: SanadAiIcon,
    category: 'سند AI',
    title: 'سند AI',
    description:
      'تتيح هذ الخدمة للمعنيين الاستفادة من خدمات الذكاء الاصطناعي، في تطوير وتحليل الأعمال القانونية، من خلال قاعدة معرفية شاملة.',
    appKey: 'sanad-ai',
  },
];

const filterTabs: FilterTab[] = [
  { id: 'all', label: 'الكل', icon: CircleDot },
  { id: 'cases', label: 'القضايا', icon: Scale },
  { id: 'legislation', label: 'التشريعات', icon: FileText },
  { id: 'consultations', label: 'الاستشارات القانونية', icon: ClipboardList },
  { id: 'committees', label: 'لجان هيئة الخبراء', icon: Users },
  { id: 'sanad-ai', label: 'سند AI', icon: Brain },
];

interface PortalDashboardProps {
  onOpenApp?: (appName: string) => void;
}

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ onOpenApp }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate which categories have services
  const availableCategories = new Set(services.map(service => service.category));
  
  // Filter tabs to only show those with available services
  const availableTabs = filterTabs.filter(tab => {
    if (tab.id === 'all') return true; // Always show "All" tab
    
    const categoryMap: Record<string, string> = {
      cases: 'القضايا',
      legislation: 'التشريعات',
      consultations: 'الاستشارات القانونية',
      committees: 'لجان هيئة الخبراء',
      'sanad-ai': 'سند AI',
    };
    
    return availableCategories.has(categoryMap[tab.id]);
  });

  const filteredServices = services.filter((service) => {
    // Filter by tab
    if (activeTab !== 'all') {
      const categoryMap: Record<string, string> = {
        cases: 'القضايا',
        legislation: 'التشريعات',
        consultations: 'الاستشارات القانونية',
        committees: 'لجان هيئة الخبراء',
        'sanad-ai': 'سند AI',
      };
      if (service.category !== categoryMap[activeTab]) {
        return false;
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="w-full max-w-[1605px] mx-auto flex flex-col gap-4 sm:gap-8 items-end pt-4 sm:pt-8 px-4 sm:px-0" dir="rtl" style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}>
      {/* Header Section - Responsive layout */}
      <div className="w-full max-w-[1605px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-10" dir="rtl">
        {/* Page Title - Responsive font size */}
        <h1 className="font-bold text-black text-right text-[20px] leading-[30px] sm:text-[24px] sm:leading-[38px]">
          الخدمات الإلكترونية
        </h1>

        {/* Search Box - Full width on mobile */}
        <div className="flex justify-end w-full sm:w-auto">
          <SearchBox value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {/* Filter Tabs Container - Responsive */}
      <div className="w-full max-w-[1605px] bg-white overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <FilterTabs
          tabs={availableTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Services Flex Wrap - Responsive gap */}
      <div className="w-full max-w-[1605px] flex flex-wrap justify-start gap-4 sm:gap-6" dir="rtl">
        {filteredServices.map((service, index) => (
          <ServiceCard
            key={index}
            {...service}
            onStart={() => {
              if (service.appKey && onOpenApp) {
                onOpenApp(service.appKey);
              }
            }}
          />
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="w-full text-center py-12 text-muted-foreground" dir="rtl">
          <p className="text-right">لا توجد خدمات متاحة</p>
        </div>
      )}
    </div>
  );
};
