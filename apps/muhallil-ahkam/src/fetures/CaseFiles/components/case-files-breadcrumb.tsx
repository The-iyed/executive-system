import React from 'react';
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
import { PATH } from '../../../routes/path';
import { FONT_FAMILY } from '../constants';

export const CaseFilesBreadcrumb: React.FC = () => {
  const navigate = useNavigate();

  return (
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
  );
};
