import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { FormTable, type FormTableColumn, type FormTableRow } from '../Step1/components';
import { ActionButtons, AIGenerateButton } from '@shared';

interface Step3Props {
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
}

const Step3: React.FC<Step3Props> = ({ onNext, onPrevious, onCancel, onSaveDraft }) => {
  const [attendees, setAttendees] = useState<FormTableRow[]>([]);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<string, Record<string, boolean>>>({});

  const columns: FormTableColumn[] = [
    {
      id: 'itemNumber',
      header: 'رقم البند',
      width: 'w-[70px]',
    },
    {
      id: 'name',
      header: 'الإسم',
      type: 'text',
      placeholder: '-------',
    },
    {
      id: 'position',
      header: 'المنصب',
      type: 'text',
      placeholder: '-------',
    },
    {
      id: 'mobile',
      header: 'الجوال',
      type: 'text',
      placeholder: '-------',
    },
    {
      id: 'email',
      header: 'البريد الإلكتروني',
      type: 'text',
      placeholder: '-------',
    },
    {
      id: 'isMainAttendee',
      header: 'الحضور أساسي',
      type: 'switch',
      label: false,
      width: 'w-[110px]',
    },
    {
      id: 'action',
      header: 'إجراء',
      width: 'w-[60px]',
    },
  ];

  const handleAddAttendee = () => {
    const newAttendee: FormTableRow = {
      id: nanoid(),
      name: '',
      position: '',
      mobile: '',
      email: '',
      isMainAttendee: false,
    };
    setAttendees((prev) => [...prev, newAttendee]);
  };

  const handleDeleteAttendee = (id: string) => {
    setAttendees((prev) => prev.filter((a) => a.id !== id));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    setTouched((prev) => {
      const newTouched = { ...prev };
      delete newTouched[id];
      return newTouched;
    });
  };

  const handleUpdateAttendee = (id: string, field: string, value: any) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: true,
      },
    }));
  };

  const handleAIGenerate = () => {
    console.log('AI Generate clicked');
    // TODO: Implement AI generation logic
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-center">
        <div className="w-[1085px] flex flex-col gap-6">
          {/* Table */}
          <div className="relative">
          <FormTable
            title=" قائمة المدعوين"
            columns={columns}
            rows={attendees}
            onAddRow={handleAddAttendee}
            onDeleteRow={handleDeleteAttendee}
            onUpdateRow={handleUpdateAttendee}
            addButtonLabel="إضافة مدعو جديد"
            errors={errors}
            touched={touched}
            />

          {/* AI Generate Button */}
          <div className="absolute -bottom-[4px] right-[175px]">
            <AIGenerateButton onClick={handleAIGenerate} />
          </div>
         </div>

          {/* Action Buttons */}
          <ActionButtons
            onCancel={onCancel}
            onSaveDraft={onSaveDraft}
            onNext={onNext}
          />
        </div>
      </div>
    </div>
  );
};

export default Step3;
