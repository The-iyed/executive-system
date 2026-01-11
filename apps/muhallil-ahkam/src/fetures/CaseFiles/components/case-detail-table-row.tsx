import React, { useState, useEffect } from 'react';
import { TooltipText } from './tooltip-text';
import { EditSaveButton } from './edit-save-button';
import { FONT_FAMILY, TABLE_COLUMN_WIDTHS } from '../constants';
import type { CaseDetail, EditingState } from '../types';
import type { CaseDetailsTabType } from '../../../components/case-details-tabs';

interface CaseDetailTableRowProps {
  detail: CaseDetail;
  selectedTab: CaseDetailsTabType;
  editingState: EditingState | null;
  onEdit: () => void;
  onSave: () => void;
}

export const CaseDetailTableRow: React.FC<CaseDetailTableRowProps> = ({
  detail,
  selectedTab,
  editingState,
  onEdit,
  onSave,
}) => {
  const isEditing = editingState?.id === detail.id && editingState?.tab === selectedTab;
  const [description, setDescription] = useState(detail.description);

  useEffect(() => {
    if (!isEditing) {
      setDescription(detail.description);
    }
  }, [detail.description, isEditing]);

  const handleSave = () => {
    if (selectedTab === "analysis") {
      console.log("save analysis", { detail, description });
    }
    // TODO: Implement actual save logic here (API call)
    onSave();
  };

  return (
    <tr className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors">
      <td className={`px-4 py-3 align-top ${TABLE_COLUMN_WIDTHS.title}`}>
        <TooltipText
          text={detail.title}
          className="text-base font-bold text-right text-[#101828] overflow-hidden w-full cursor-default line-clamp-2"
          maxLines={2}
          as="h3"
        />
      </td>
      <td className={`px-4 py-3 align-top ${TABLE_COLUMN_WIDTHS.description}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 w-full">
            {!isEditing ? (
              <TooltipText
                text={description}
                className="text-sm text-[#475467] text-right leading-relaxed overflow-hidden w-full cursor-default line-clamp-3"
                maxLines={3}
                preserveWhitespace
              />
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm text-right text-[#666] border border-[#D8D8D8] rounded-[5px] resize-none focus:outline-none focus:ring-2 focus:ring-[#00A79D] focus:ring-offset-1"
                style={{
                  fontFamily: FONT_FAMILY,
                  minHeight: '80px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              />
            )}
          </div>
          <div className="flex-shrink-0">
            <EditSaveButton
              isEditing={isEditing}
              onEdit={onEdit}
              onSave={handleSave}
            />
          </div>
        </div>
      </td>
    </tr>
  );
};
