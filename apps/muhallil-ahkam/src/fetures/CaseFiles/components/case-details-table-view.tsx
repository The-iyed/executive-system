import React from 'react';
import { Loader } from '@sanad-ai/ui';
import { CaseDetailTableRow } from './case-detail-table-row';
import { FONT_FAMILY, EMPTY_STATE_MESSAGES, TABLE_COLUMN_WIDTHS } from '../constants';
import type { CaseDetail, EditingState } from '../types';
import type { CaseDetailsTabType } from '../../../components/case-details-tabs';

interface CaseDetailsTableViewProps {
  details: CaseDetail[];
  selectedTab: CaseDetailsTabType;
  editingState: EditingState | null;
  isLoading: boolean;
  onEdit: (detailId: string) => void;
  onSave: () => void;
}

export const CaseDetailsTableView: React.FC<CaseDetailsTableViewProps> = ({
  details,
  selectedTab,
  editingState,
  isLoading,
  onEdit,
  onSave,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#EAECF0] overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-[#00A79D]" />
        </div>
      ) : details.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p
            className="text-sm text-[#666] text-right"
            style={{ fontFamily: FONT_FAMILY }}
          >
            {EMPTY_STATE_MESSAGES.noDetails}
          </p>
        </div>
      ) : (
        <table className="w-full table-fixed" dir="rtl">
          <thead className="bg-[#F9FAFB] border-b border-[#EAECF0]">
            <tr>
              <th
                className={`px-4 py-3 text-right text-sm font-bold text-[#101828] ${TABLE_COLUMN_WIDTHS.title}`}
                style={{ fontFamily: FONT_FAMILY }}
              >
                العنوان
              </th>
              <th
                className={`px-4 py-3 text-right text-sm font-bold text-[#101828] ${TABLE_COLUMN_WIDTHS.description}`}
                style={{ fontFamily: FONT_FAMILY }}
              >
                الوصف
              </th>
            </tr>
          </thead>
          <tbody>
            {details.map((detail) => (
              <CaseDetailTableRow
                key={`${detail.id}:${selectedTab}`}
                detail={detail}
                selectedTab={selectedTab}
                editingState={editingState}
                onEdit={() => onEdit(detail.id)}
                onSave={onSave}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
