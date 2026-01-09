import React from 'react';
import { ServiceCard } from './service-card';
import { AnalyzerIcon, CompareIcon, BalanceIcon, ArticleIcon, FileIcon, DiligenceIcon } from './service-icons';

export interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  isComingSoon?: boolean;
  isDisabled?: boolean;
}

export const ServicesGrid: React.FC = () => {
  const services: Service[] = [
    {
      title: 'تحليل الأحكام',
      description: 'تقدم هذه الخدمة تحليلًا للأحكام القضائية النهائية والتنفيذية، بما يرفع كفاءة الأعمال ويحد من خسارة القضايا مستقبلًا وتعزيز فرص الكسب.',
      icon: <AnalyzerIcon />,
    },
    {
      title: 'المقارنات المعيارية',
      description: 'تهدف الخدمة إلى تمكين المعنيين من الاطلاع على الممارسات التشريعية الدولية، وتحليل ومقارنة التشريعات المعتمدة، وتقديم المستخلصات والتوصيات ذات الصلة.',
      icon: <CompareIcon />,
    },
    {
      title: 'المرجع القانوني',
      description: 'تتيح هذه الخدمة تقديم البيانات للمستفيدين بناءً على استفساراتهم، مع تزويدهم بالمراجع ذات الصلة.',
      icon: <BalanceIcon />,
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
    {
      title: 'دراسة الدعاوى القضائية',
      description: 'تتيح هذه الخدمة تقديم البيانات للمستفيدين بناءً على استفساراتهم، مع تزويدهم بالمراجع ذات الصلة.',
      icon: <DiligenceIcon />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-1.5 sm:gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 w-full">
        {services.slice(0, 3).map((service, index) => (
          <ServiceCard key={index} {...service} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 w-full">
        {services.slice(3, 6).map((service, index) => (
          <ServiceCard key={index + 3} {...service} />
        ))}
      </div>
    </div>
  );
};

