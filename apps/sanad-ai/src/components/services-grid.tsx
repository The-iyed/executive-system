import React from 'react';
import { ServiceCard } from './service-card';
import { AnalyzerIcon, BalanceIcon, ArticleIcon, FileIcon } from './service-icons';
import { BarChart3Icon } from 'lucide-react';

export interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
  isComingSoon?: boolean;
  isDisabled?: boolean;
  url?: string;
}

export const ServicesGrid: React.FC = () => {
  const handleServiceClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const services: Service[] = [
    {
      title: 'تحليل الأحكام',
      description: 'تقدم هذه الخدمة تحليلًا للأحكام القضائية النهائية والتنفيذية، بما يرفع كفاءة الأعمال ويحد من خسارة القضايا مستقبلًا وتعزيز فرص الكسب.',
      icon: <AnalyzerIcon />,
      url: 'https://rulings-analyst-app.momrahai.com/',
    },
    {
      title: 'محلل الرؤى والتوقعات',
      description: 'تتيح هذه الخدمة تحليل البيانات القانونية والإحصائية، واستخراج الرؤى والتوقعات لدعم اتخاذ القرارات الاستراتيجية.',
      icon: <BarChart3Icon />,
      url: 'https://legal-stats.momrahai.com/',
    },

    {
      title: 'المذكرة القانونية',
      description: 'أداة ذكية تعتمد على منظومة وكلاء قانونيين رقميين تعمل بتقنيات الذكاء الاصطناعي لتحليل القضايا وصياغة لوائح الرد بدقة و موثوقية.',
      icon: <BalanceIcon />,
      url: 'https://legal-assistant-v2.momrahai.com/',
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
                onClick={service.url ? () => handleServiceClick(service.url) : undefined}
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
            onClick={service.url ? () => handleServiceClick(service.url) : undefined}
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

