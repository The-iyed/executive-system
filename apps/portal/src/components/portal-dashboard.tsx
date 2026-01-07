import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  FileText,
  Gavel,
  Users,
  Brain,
  FileCheck,
  ClipboardList,
  CircleDot,
} from 'lucide-react';
import { ServiceCard, ServiceCardProps } from './service-card';
import { FilterTabs, FilterTab } from './filter-tabs';
import { SearchBox } from './search-box';

const services: ServiceCardProps[] = [
  {
    icon: BookOpen,
    category: 'التشريعات',
    title: 'النشر والاستطلاع',
    description:
      'تستهدف هذه الخدمة نشر التشريعات الجديدة أو المعدلة بالإضافة إلى إجراء استطلاعات حول الآراء والمقترحات المتعلقة بالتشريعات الحالية.',
  },
  {
    icon: Scale,
    category: 'التشريعات',
    title: 'الوثائق النظامية',
    description:
      'تشمل هذه الخدمة تقديم المعلومات حول الوثائق النظامية وتعديلاتها، بما يتيح للمستفيدين الوصول إلى المعلومة والاطلاع على التعديلات القانونية.',
  },
  {
    icon: FileText,
    category: 'القضايا',
    title: 'السوابق والأحكام القضائية',
    description:
      'تتيح هذه الخدمة إمكانية الاطلاع على نتائج تحليل الأحكام والسوابق القضائية، بما يسهم في تعزيز الاستفادة منها وتطوير المعرفة القانونية.',
  },
  {
    icon: Gavel,
    category: 'القضايا',
    title: 'التنفيذ',
    description: 'تتيح هذه الخدمة رفع مطالبات التنفيذ لصالح الجهة.',
  },
  {
    icon: FileCheck,
    category: 'القضايا',
    title: 'الدعاوى القضائية',
    description: 'تتيح هذه الخدمة رفع الدعاوى، ومتابعة حالة سير القضية.',
  },
  {
    icon: ClipboardList,
    category: 'الاستشارات القانونية',
    title: 'طلب استشارة قانونية',
    description:
      'تتيح هذه الخدمة استلام طلب الاستشارة القانونية لدراسة ومراجعة المعاملات وإبداء الرأي النظامي حيالها.',
  },
  {
    icon: FileText,
    category: 'الاستشارات القانونية',
    title: 'النماذج القانونية',
    description:
      'تقدم هذه الخدمة نماذج جاهزة للعقود ومذكرات التفاهم وكراسات الشروط، مما يسهل على المستخدمين إعداد الوثائق القانونية اللازمة بطريقة صحيحة ومهنية.',
  },
  {
    icon: Users,
    category: 'لجان هيئة الخبراء',
    title: 'أعمال لجان هيئة الخبراء',
    description:
      'تتيح هذه الخدمة تشكيل لجان هيئة الخبراء ومتابعة أعمال اللجان والمصادقة على النتائج',
  },
  {
    icon: Brain,
    category: 'سند AI',
    title: 'سند AI',
    description:
      'تتيح هذ الخدمة للمعنيين الاستفادة من خدمات الذكاء الاصطناعي، في تطوير وتحليل الأعمال القانونية، من خلال قاعدة معرفية شاملة.',
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

export const PortalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="w-full max-w-[1605px] mx-auto flex flex-col gap-8 items-end pt-8" dir="rtl">
      {/* Header Section */}
      <div className="w-full flex items-center justify-between gap-10">
        {/* Search Box */}
        <div className="flex-1 flex justify-end">
          <SearchBox value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-black whitespace-nowrap" style={{ fontFamily: 'Frutiger LT Arabic, sans-serif' }}>
          الخدمات الإلكترونية
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="w-full bg-white">
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Services Grid - 5 columns matching Figma */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 auto-rows-fr">
        {filteredServices.map((service, index) => (
          <div key={index} className="flex justify-end">
            <ServiceCard {...service} />
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="w-full text-center py-12 text-muted-foreground">
          <p>لا توجد خدمات متاحة</p>
        </div>
      )}
    </div>
  );
};
