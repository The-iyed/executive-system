import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@sanad-ai/ui';
import { Home, ChevronLeft } from 'lucide-react';
import { PdfCard } from '../../components';
import { CaseDetailsTabs, type CaseDetailsTabType } from '../../components/case-details-tabs';
import EditIcon from '../../assets/edit-03.svg';
import { PATH } from '../../routes/path';

const FONT_FAMILY = '"Frutiger LT Arabic", "Cairo", "Tajawal", sans-serif';

interface CaseDetail {
  id: string;
  title: string;
  description: string;
}

interface CaseFile {
  name: string;
  size: string;
}

const mockCaseFiles: CaseFile[] = [
  { name: 'حكم المحكمة العليا', size: '5.3MB' },
  { name: 'الحكم الابتدائي', size: '5.3MB' },
  { name: 'حكم الاستئناف', size: '5.3MB' },
];

const mockCaseDetails: CaseDetail[] = [
  { id: '1', title: 'إسم الجهة', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '2', title: 'الأمانة', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '3', title: 'المنطقة', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '4', title: 'المحكمة الابتدائية', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '5', title: 'المنطقة', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '6', title: 'الأمانة', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '7', title: 'رقم القضية 1', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '8', title: 'السنة 1', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '9', title: 'تاريخ قيد القضية 1', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '10', title: 'الصفة 1', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '11', title: 'تاريخ الحكم 1', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
  { id: '12', title: 'قيمة الحكم 1', description: 'كيف أطلع على لوائح وأنظمة الوزارة الخاصة بالموارد البشرية؟' },
];

const DetailCard: React.FC<{ detail: CaseDetail }> = ({ detail }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(detail.description);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Save the updated description
  };

  return (
    <div
      className={`bg-white rounded-[22px] p-6 transition-all duration-200 w-full box-shadow-[0_4.499px_89.98px_0_rgba(0,0,0,0.08)] ${
        isEditing ? 'h-auto' : 'h-auto'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2 min-w-0 w-full">
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3
            className="text-base font-bold text-right text-[#101828] overflow-hidden text-ellipsis whitespace-nowrap w-full"
            style={{ fontFamily: FONT_FAMILY }}
            title={detail.title}
          >
            {detail.title}
          </h3>
        </div>
        <div className="flex-shrink-0 flex-grow-0">
          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="flex items-center justify-center w-6 h-6 p-0 border-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="تعديل"
            >
              <img src={EditIcon} alt="تعديل" className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center justify-center w-[70px] h-[35px] px-[15px] rounded-[5px] border-[0.2px] border-[#D8D8D8] hover:opacity-90 transition-opacity cursor-pointer"
              style={{
                background: 'linear-gradient(0deg, #00A79D 0%, #00A79D 100%), #F8F8F8',
              }}
            >
              <span
                className="text-white text-right text-base font-bold"
                style={{
                  fontFamily: FONT_FAMILY,
                  lineHeight: '30.428px',
                }}
              >
                تعديل
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 min-w-0">
        {!isEditing ? (
          <p
            className="text-sm text-[#475467] text-right leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              fontFamily: FONT_FAMILY,
            }}
            title={description}
          >
            {description}
          </p>
        ) : (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full p-2 text-sm text-right text-[#666] border border-[#D8D8D8] rounded-[5px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00A79D] focus:ring-offset-1"
            style={{
              fontFamily: FONT_FAMILY,
              minHeight: '60px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          />
        )}
      </div>
    </div>
  );
};

const CaseFiles: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<CaseDetailsTabType>('analysis');

  return (
    <div className="w-full min-h-full px-12 pt-8 pb-8" dir="rtl">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList className="flex items-center gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink
              href={PATH.CASES}
              onClick={(e) => {
                e.preventDefault();
                navigate(PATH.CASES);
              }}
              className="flex items-center gap-1 text-[#666] hover:text-[#1A1A1A] transition-colors"
            >
              <Home className="w-4 h-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronLeft className="w-4 h-4 text-[#666]" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage
              className="text-[#1A1A1A] font-medium"
              style={{ fontFamily: FONT_FAMILY }}
            >
              تفاصيل القضية
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Case Files Section */}
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-right mb-4 text-[#1A1A1A]"
          style={{ fontFamily: FONT_FAMILY }}
        >
          ملفات القضية
        </h2>
        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
          {mockCaseFiles.map((file, index) => (
            <PdfCard
              key={index}
              name={file.name}
              size={file.size}
            />
          ))}
        </div>
      </div>

      {/* Case Details Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-6 mb-4">
          <h2
            className="text-2xl font-bold text-right text-[#1A1A1A]"
            style={{ fontFamily: FONT_FAMILY }}
          >
            تفاصيل القضية
          </h2>
          <div className="flex-shrink-0">
            <CaseDetailsTabs
              value={selectedTab}
              onValueChange={setSelectedTab}
            />
          </div>
        </div>
      </div>

      {/* Detail Cards Grid */}
      <div className="bg-[radial-gradient(ellipse_at_center,_#f4f4f4_0%,_#f4f4f4_45%,_#ffffff_100%)]
    shadow-[0_8px_24px_rgba(0,0,0,0.04)]
    rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCaseDetails.map((detail) => (
          <DetailCard key={detail.id} detail={detail} />
        ))}
      </div>
    </div>
  );
};

export default CaseFiles;