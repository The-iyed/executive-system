import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { step1Schema, type Step1FormData } from './schema';
import { FormField, FormInput, FormSelect, FormDatePicker, FormTable, FormTextArea, FormSwitch } from './components';
import { ActionButtons } from '@shared';
import {
  MEETING_CATEGORY_OPTIONS,
  MEETING_REASON_OPTIONS,
  RELATED_TOPIC_OPTIONS,
  MEETING_CLASSIFICATION_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  SECTOR_OPTIONS,
} from './constants';

interface Step1Props {
  onNext?: () => void;
  onPrevious?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
}

const Step1: React.FC<Step1Props> = ({ onNext, onPrevious, onCancel, onSaveDraft }) => {
  const [formData, setFormData] = useState<Partial<Step1FormData>>({
    meetingGoals: [],
    meetingAgenda: [],
    ministerSupport: [],
    relatedDirectives: [],
    wasDiscussedPreviously: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Step1FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step1FormData, boolean>>>({});
  const [tableErrors, setTableErrors] = useState<Record<string, Record<string, string>>>({});
  const [tableTouched, setTableTouched] = useState<Record<string, Record<string, boolean>>>({});

  // Placeholder styling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input::placeholder,
      input[data-placeholder],
      textarea::placeholder {
        font-style: normal !important;
        font-weight: 400 !important;
        font-size: 16px !important;
        color: #667085 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const validateField = (field: keyof Step1FormData, value: any) => {
    const fieldSchema = step1Schema.shape[field];
    if (!fieldSchema) return;

    const result = fieldSchema.safeParse(value);

    if (result.success) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setErrors((prev) => ({
        ...prev,
        [field]: result.error.errors[0]?.message || '',
      }));
    }
  };

  const handleBlur = (field: keyof Step1FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleChange = (field: keyof Step1FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // Table handlers
  const handleAddGoal = () => {
    const newGoal = { id: nanoid(), goal: '' };
    setFormData((prev) => ({
      ...prev,
      meetingGoals: [...(prev.meetingGoals || []), newGoal],
    }));
  };

  const handleDeleteGoal = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      meetingGoals: (prev.meetingGoals || []).filter((g) => g.id !== id),
    }));
    setTableErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const handleUpdateGoal = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      meetingGoals: (prev.meetingGoals || []).map((g) =>
        g.id === id ? { ...g, [field]: value } : g
      ),
    }));
    // Validate
    if (field === 'goal' && value === '') {
      setTableErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: 'الهدف مطلوب' },
      }));
    } else {
      setTableErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[id]) {
          delete newErrors[id][field];
          if (Object.keys(newErrors[id]).length === 0) {
            delete newErrors[id];
          }
        }
        return newErrors;
      });
    }
  };

  const handleAddAgenda = () => {
    const newAgenda = { id: nanoid(), agenda: '', duration: '' };
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: [...(prev.meetingAgenda || []), newAgenda],
    }));
  };

  const handleDeleteAgenda = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: (prev.meetingAgenda || []).filter((a) => a.id !== id),
    }));
  };

  const handleUpdateAgenda = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      meetingAgenda: (prev.meetingAgenda || []).map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleAddSupport = () => {
    const newSupport = { id: nanoid(), support: '' };
    setFormData((prev) => ({
      ...prev,
      ministerSupport: [...(prev.ministerSupport || []), newSupport],
    }));
  };

  const handleDeleteSupport = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      ministerSupport: (prev.ministerSupport || []).filter((s) => s.id !== id),
    }));
    setTableErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const handleUpdateSupport = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      ministerSupport: (prev.ministerSupport || []).map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
    // Validate
    if (field === 'support' && value === '') {
      setTableErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: 'الدعم مطلوب' },
      }));
    } else {
      setTableErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[id]) {
          delete newErrors[id][field];
          if (Object.keys(newErrors[id]).length === 0) {
            delete newErrors[id];
          }
        }
        return newErrors;
      });
    }
  };

  const handleAddDirective = () => {
    const newDirective = {
      id: nanoid(),
      directive: '',
      previousMeeting: '',
      directiveDate: '',
      directiveStatus: '',
      dueDate: '',
      responsible: '',
    };
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: [...(prev.relatedDirectives || []), newDirective],
    }));
  };

  const handleDeleteDirective = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: (prev.relatedDirectives || []).filter((d) => d.id !== id),
    }));
  };

  const handleUpdateDirective = (id: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      relatedDirectives: (prev.relatedDirectives || []).map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  return (
    <div className="w-full flex flex-col gap-8">
      <form className="space-y-8 flex flex-col items-center">
        {/* Existing form fields */}
        <div className="w-full flex flex-col items-center gap-4">
          {/* Row 1 */}
          <div
            className="w-[1085px] h-[70px] flex flex-row-reverse items-start gap-4"
          >
            <FormField
              label="نوع الاجتماع"
              required
              error={touched.meetingType ? errors.meetingType : undefined}
            >
              <FormInput
                value={formData.meetingType || ''}
                onChange={(e) => handleChange('meetingType', e.target.value)}
                onBlur={() => handleBlur('meetingType')}
                placeholder="-------"
                error={!!(touched.meetingType && errors.meetingType)}
              />
            </FormField>
            <FormField
              label="موضوع الاجتماع"
              required
              error={touched.meetingSubject ? errors.meetingSubject : undefined}
            >
              <FormInput
                value={formData.meetingSubject || ''}
                onChange={(e) => handleChange('meetingSubject', e.target.value)}
                onBlur={() => handleBlur('meetingSubject')}
                placeholder="-------"
                error={!!(touched.meetingSubject && errors.meetingSubject)}
              />
            </FormField>
          </div>

          {/* Row 2 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="مبرر اللقاء"
              error={touched.meetingReason ? errors.meetingReason : undefined}
            >
              <FormSelect
                value={formData.meetingReason}
                onValueChange={(value) => handleChange('meetingReason', value)}
                options={MEETING_REASON_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingReason && errors.meetingReason)}
              />
            </FormField>
            <FormField
              label="فئة الاجتماع"
              required
              error={touched.meetingCategory ? errors.meetingCategory : undefined}
            >
              <FormSelect
                value={formData.meetingCategory}
                onValueChange={(value) => handleChange('meetingCategory', value)}
                options={MEETING_CATEGORY_OPTIONS}
                placeholder="-------"
                error={!!(touched.meetingCategory && errors.meetingCategory)}
              />
            </FormField>
          </div>

          {/* Row 3 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="تاريخ الاستحقاق"
              error={touched.dueDate ? errors.dueDate : undefined}
            >
              <FormDatePicker
                value={formData.dueDate}
                onChange={(value) => handleChange('dueDate', value)}
                onBlur={() => handleBlur('dueDate')}
                placeholder="dd:mm:yyyy"
                error={!!(touched.dueDate && errors.dueDate)}
              />
            </FormField>
            <FormField
              label="الموضوع المرتبط"
              error={touched.relatedTopic ? errors.relatedTopic : undefined}
            >
              <FormSelect
                value={formData.relatedTopic}
                onValueChange={(value) => handleChange('relatedTopic', value)}
                options={RELATED_TOPIC_OPTIONS}
                placeholder="-------"
                error={!!(touched.relatedTopic && errors.relatedTopic)}
              />
            </FormField>
          </div>

          {/* Row 4 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="تصنيف الاجتماع"
              required
              error={touched.meetingClassification2 ? errors.meetingClassification2 : undefined}
            >
              <FormSelect
                value={formData.meetingClassification2}
                onValueChange={(value) => handleChange('meetingClassification2', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingClassification2 && errors.meetingClassification2)}
              />
            </FormField>
            <FormField
              label="تصنيف الاجتماع"
              required
              error={touched.meetingClassification1 ? errors.meetingClassification1 : undefined}
            >
              <FormSelect
                value={formData.meetingClassification1}
                onValueChange={(value) => handleChange('meetingClassification1', value)}
                options={MEETING_CLASSIFICATION_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingClassification1 && errors.meetingClassification1)}
              />
            </FormField>
          </div>

          {/* Row 5 */}
          <div
            className="flex flex-row-reverse items-start"
            style={{
              width: '1085px',
              height: '70px',
              gap: '16px',
            }}
          >
            <FormField
              label="القطاع"
              error={touched.sector ? errors.sector : undefined}
            >
              <FormSelect
                value={formData.sector}
                onValueChange={(value) => handleChange('sector', value)}
                options={SECTOR_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.sector && errors.sector)}
              />
            </FormField>
            <FormField
              label="سرية الاجتماع"
              required
              error={touched.meetingConfidentiality ? errors.meetingConfidentiality : undefined}
            >
              <FormSelect
                value={formData.meetingConfidentiality}
                onValueChange={(value) => handleChange('meetingConfidentiality', value)}
                options={CONFIDENTIALITY_OPTIONS}
                placeholder="تصنيف الاجتماع"
                error={!!(touched.meetingConfidentiality && errors.meetingConfidentiality)}
              />
            </FormField>
          </div>
        </div>

        {/* Table 1: Meeting Goals */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="الهدف من الاجتماع"
              required
              columns={[
                { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
                { id: 'goal', header: 'الهدف', type: 'text', placeholder: 'ملخص مختصر يوضح الهدف والنتائج المتوقعة' },
                { id: 'action', header: 'إجراء', width: 'w-20' },
              ]}
              rows={formData.meetingGoals || []}
              onAddRow={handleAddGoal}
              onDeleteRow={handleDeleteGoal}
              onUpdateRow={handleUpdateGoal}
              addButtonLabel="إضافة هدف"
              errors={tableErrors}
              touched={tableTouched}
            />
          </div>
        </div>

        {/* Table 2: Meeting Agenda */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="أجندة الاجتماع"
              columns={[
                { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
                { id: 'agenda', header: 'الأجندة', type: 'text', placeholder: '' },
                { id: 'duration', header: 'مدة العرض', type: 'text', placeholder: '' },
                { id: 'action', header: 'إجراء', width: 'w-20' },
              ]}
              rows={formData.meetingAgenda || []}
              onAddRow={handleAddAgenda}
              onDeleteRow={handleDeleteAgenda}
              onUpdateRow={handleUpdateAgenda}
              addButtonLabel="إضافة أجندة"
            />
          </div>
        </div>

        {/* Table 3: Minister Support */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="الدعم المطلوب من الوزير"
              required
              columns={[
                { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
                { id: 'support', header: 'الدعم', type: 'text', placeholder: '' },
                { id: 'action', header: 'إجراء', width: 'w-20' },
              ]}
              rows={formData.ministerSupport || []}
              onAddRow={handleAddSupport}
              onDeleteRow={handleDeleteSupport}
              onUpdateRow={handleUpdateSupport}
              addButtonLabel="إضافة دعم"
              errors={tableErrors}
              touched={tableTouched}
            />
          </div>
        </div>

        {/* Toggle Switch and Date Picker */}
        <div className="w-full flex justify-center">
          <div
            className="w-[1085px] h-[70px] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-6 w-full h-full">
              <FormSwitch
                checked={formData.wasDiscussedPreviously || false}
                onCheckedChange={(checked) => handleChange('wasDiscussedPreviously', checked)}
                label="هل تمت مناقشة الموضوع سابقاً؟"
              />
              {formData.wasDiscussedPreviously && (
                <FormField
                  label="تاريخ الاجتماع السابق"
                  error={touched.previousMeetingDate ? errors.previousMeetingDate : undefined}
                >
                  <FormDatePicker
                    value={formData.previousMeetingDate}
                    onChange={(value) => handleChange('previousMeetingDate', value)}
                    onBlur={() => handleBlur('previousMeetingDate')}
                    placeholder="dd:mm:yyyy"
                    error={!!(touched.previousMeetingDate && errors.previousMeetingDate)}
                  />
                </FormField>
              )}
            </div>
          </div>
        </div>

        {/* Table 4: Related Directives */}
        <div className="w-full flex justify-center">
          <div style={{ width: '1085px' }}>
            <FormTable
              title="التوجيه المرتبط"
              columns={[
                { id: 'itemNumber', header: 'رقم البند', width: 'w-24' },
                { id: 'directive', header: 'التوجيه', type: 'text', placeholder: '' },
                { id: 'previousMeeting', header: 'الاجتماع السابق', type: 'text', placeholder: '' },
                { id: 'directiveDate', header: 'تاريخ التوجيه', type: 'date', placeholder: 'dd:mm:yyyy' },
                { id: 'directiveStatus', header: 'حالة التوجيه', type: 'text', placeholder: '' },
                { id: 'dueDate', header: 'تاريخ الاستحقاق', type: 'date', placeholder: 'dd:mm:yyyy' },
                { id: 'responsible', header: 'المسؤول', type: 'text', placeholder: '' },
                { id: 'action', header: 'إجراء', width: 'w-20' },
              ]}
              rows={formData.relatedDirectives || []}
              onAddRow={handleAddDirective}
              onDeleteRow={handleDeleteDirective}
              onUpdateRow={handleUpdateDirective}
              addButtonLabel="إضافة توجيه مرتبط"
            />
          </div>
        </div>

        {/* Notes TextArea */}
        <div className="w-full flex justify-center">
          <div
            className="flex flex-col gap-2"
            style={{ width: '1085px' }}
          >
            <label
              className="text-right text-[14px] font-medium text-[#344054]"
            >
              ملاحظات
            </label>
            <FormTextArea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="ملاحظات...."
            />
          </div>
        </div>
            <ActionButtons
              onCancel={onCancel}
              onSaveDraft={onSaveDraft}
              onNext={onNext}
            />
      </form>
    </div>
  );
};

export default Step1;
