import React, { useState, useEffect } from 'react';
import { TooltipText } from './tooltip-text';
import { EditSaveButton } from './edit-save-button';
import { FONT_FAMILY } from '../constants';
import type { CaseDetail, EditingState } from '../types';
import type { CaseDetailsTabType } from '../../../components/case-details-tabs';

interface CaseDetailCardProps {
  detail: CaseDetail;
  selectedTab: CaseDetailsTabType;
  editingState: EditingState | null;
  onEdit: () => void;
  onSave: () => void;
}

export const CaseDetailCard: React.FC<CaseDetailCardProps> = ({
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
    <div className="bg-white rounded-[22px] p-6 transition-all duration-200 w-full box-shadow-[0_4.499px_89.98px_0_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-3 mb-2 min-w-0 w-full">
        <div className="flex-1 min-w-0 overflow-hidden">
          <TooltipText
            text={detail.title}
            className="text-base font-bold text-right text-[#101828] overflow-hidden w-full cursor-default line-clamp-2"
            maxLines={2}
            as="h3"
          />
        </div>
        <div className="flex-shrink-0 flex-grow-0">
          <EditSaveButton
            isEditing={isEditing}
            onEdit={onEdit}
            onSave={handleSave}
          />
        </div>
      </div>
      <div className="mt-2 min-w-0">
        {!isEditing ? (
          <TooltipText
            text={description}
            className="text-sm text-[#475467] text-right leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
          />
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
