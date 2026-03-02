import React from 'react';
import EditIcon from '@/modules/shared/assets/edit-icon.svg';

export interface EditButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const EditButton: React.FC<EditButtonProps> = ({
  onClick,
  label = 'تعديل',
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-[138px] h-[40px] flex items-center justify-center gap-3 px-4 py-2 rounded-[85px] transition-colors ${className}`}
      style={{
        background: 'linear-gradient(180deg, #3C6FD1 0%, #048F86 0.01%, #6DCDCD 100%)',
      }}
    >
      <img src={EditIcon} alt={label} className="w-4 h-4" />
      <span className="text-white text-[16px] font-bold">{label}</span>
    </button>
  );
};
