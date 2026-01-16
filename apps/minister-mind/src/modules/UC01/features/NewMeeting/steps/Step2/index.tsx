import React, { useCallback } from 'react';
import { FormTable, type FormTableColumn } from '../Step1/components';
import { ActionButtons, AIGenerateButton } from '@shared';
import { useStep2 } from './useStep2';

interface Step2Props {
  draftId: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
}

const Step2: React.FC<Step2Props> = ({ draftId, onNext, onCancel, onSaveDraft }) => {
  const handleSuccess = useCallback(() => {
    // Success is handled by parent component
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Step2 error:', error);
    // TODO: Show error toast/notification
  }, []);

  const {
    formData,
    errors,
    touched,
    // isSubmitting,
    handleAddAttendee,
    handleDeleteAttendee,
    handleUpdateAttendee,
    submitStep,
  } = useStep2({
    draftId,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const handleNextClick = useCallback(async () => {
    await submitStep(false);
    onNext?.();
  }, [submitStep, onNext]);

  const handleSaveDraftClick = useCallback(async () => {
    await submitStep(true);
    onSaveDraft?.();
  }, [submitStep, onSaveDraft]);

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
            rows={formData.invitees || []}
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
            onSaveDraft={handleSaveDraftClick}
            onNext={handleNextClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Step2;
