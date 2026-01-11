import React from 'react';
import { Loader } from '@sanad-ai/ui';
import { CaseDetailCard } from './case-detail-card';
import { FONT_FAMILY, EMPTY_STATE_MESSAGES } from '../constants';
import type { CaseDetail, EditingState } from '../types';
import type { CaseDetailsTabType } from '../../../components/case-details-tabs';

interface CaseDetailsGridViewProps {
  details: CaseDetail[];
  selectedTab: CaseDetailsTabType;
  editingState: EditingState | null;
  isLoading: boolean;
  onEdit: (detailId: string) => void;
  onSave: () => void;
}

export const CaseDetailsGridView: React.FC<CaseDetailsGridViewProps> = ({
  details,
  selectedTab,
  editingState,
  isLoading,
  onEdit,
  onSave,
}) => {
  return (
    <div className="bg-[radial-gradient(ellipse_at_center,_#f4f4f4_0%,_#f4f4f4_45%,_#ffffff_100%)] shadow-[0_8px_24px_rgba(0,0,0,0.04)] rounded-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-[200px]">
      {isLoading ? (
        <div className="col-span-full flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-[#00A79D]" />
        </div>
      ) : details.length === 0 ? (
        <div className="col-span-full flex items-center justify-center py-12">
          <p
            className="text-sm text-[#666] text-right"
            style={{ fontFamily: FONT_FAMILY }}
          >
            {EMPTY_STATE_MESSAGES.noDetails}
          </p>
        </div>
      ) : (
        details.map((detail) => (
          <CaseDetailCard
            key={`${detail.id}:${selectedTab}`}
            detail={detail}
            selectedTab={selectedTab}
            editingState={editingState}
            onEdit={() => onEdit(detail.id)}
            onSave={onSave}
          />
        ))
      )}
    </div>
  );
};
