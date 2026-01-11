import React from 'react';
import EditIcon from '../../../assets/edit-03.svg';
import { FONT_FAMILY } from '../constants';

interface EditSaveButtonProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  className?: string;
}

export const EditSaveButton: React.FC<EditSaveButtonProps> = ({
  isEditing,
  onEdit,
  onSave,
  className = '',
}) => {
  if (!isEditing) {
    return (
      <button
        onClick={onEdit}
        className={`hidden flex items-center justify-center w-6 h-6 p-0 border-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        aria-label="تعديل"
      >
        <img src={EditIcon} alt="تعديل" className="w-6 h-6" />
      </button>
    );
  }

  return (
    <button
      onClick={onSave}
      className={`flex items-center justify-center w-[70px] h-[35px] px-[15px] rounded-[5px] border-[0.2px] border-[#D8D8D8] hover:opacity-90 transition-opacity cursor-pointer ${className}`}
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
        حفظ
      </span>
    </button>
  );
};
