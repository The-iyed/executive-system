import React from 'react';
import { CaseDetailsTabs, type CaseDetailsTabType } from '../../../components/case-details-tabs';
import { ViewToggle } from './view-toggle';
import { FONT_FAMILY } from '../constants';
import type { ViewMode } from '../types';

interface CaseDetailsHeaderProps {
  selectedTab: CaseDetailsTabType;
  viewMode: ViewMode;
  onTabChange: (tab: CaseDetailsTabType) => void;
  onViewChange: (view: ViewMode) => void;
}

export const CaseDetailsHeader: React.FC<CaseDetailsHeaderProps> = ({
  selectedTab,
  viewMode,
  onTabChange,
  onViewChange,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-6 mb-4">
        <h2
          className="text-2xl font-bold text-right text-[#1A1A1A]"
          style={{ fontFamily: FONT_FAMILY }}
        >
          تفاصيل القضية
        </h2>
        <div className="flex items-center gap-4">
          <ViewToggle viewMode={viewMode} onViewChange={onViewChange} />
          <div className="flex-shrink-0">
            <CaseDetailsTabs value={selectedTab} onValueChange={onTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
};
