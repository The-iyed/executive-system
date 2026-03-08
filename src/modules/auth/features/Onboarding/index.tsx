import React, { useState } from 'react';
import { Logo } from '@/modules/shared/components/logo';
import { Input, Button } from '@/lib/ui';
import { User } from '@/modules/auth/data/authApi';
import axiosInstance from '@/modules/auth/utils/axios';

const INSTRUCTION =
  'نرجو التحقق من توثيق بياناتكم لاستعمالها عند التواصل معكم من خلال المنصة:';

const LABELS = {
  full_name: 'الاسم الكامل',
  email: 'البريد الإلكتروني',
  id_number: 'رقم الهوية',
  mobile: 'رقم الجوال',
} as const;

export interface OnboardingFormData {
  full_name: string;
  email: string;
  id_number: string;
  mobile: string;
}

export interface RegisterPayload {
  national_id: string;
  email: string;
}

/** POST /api/auth/register – save رقم الهوية + email. */
export async function submitOnboardingApi(
  payload: RegisterPayload
): Promise<void> {
  await axiosInstance.post('/api/auth/register', payload);
}

interface OnboardingProps {
  user: User;
  onSuccess?: () => void;
}

export default function Onboarding({ user, onSuccess }: OnboardingProps) {
  const [form, setForm] = useState<OnboardingFormData>({
    full_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '',
    email: user.email || '',
    id_number: '',
    mobile: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (field: keyof OnboardingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};
    if (!form.email?.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'البريد الإلكتروني غير صحيح';
    if (!form.id_number?.trim()) newErrors.id_number = 'رقم الهوية مطلوب';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await submitOnboardingApi({
        national_id: form.id_number.trim(),
        email: form.email.trim(),
      });
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'h-11 px-3 text-right text-sm bg-[#F8FBFF] border border-[#EBF3FD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#044D4E]/30 focus:border-[#044D4E] w-full';
  const inputClassIdMobile =
    'h-11 px-3 text-right text-sm bg-white border border-[#D0D5DD] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#044D4E]/30 focus:border-[#044D4E] w-full';
  const inputDisabledClass =
    'h-11 px-3 text-right text-sm bg-gray-100 border border-[#D0D5DD] rounded-lg w-full cursor-not-allowed opacity-80';
  const labelClass = 'text-sm text-[#344054] font-normal text-left';

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col justify-center items-center p-6 gap-8 bg-[#ECF0F1]"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* Main content: flex column, center, max-width 678px */}
      <div className="flex flex-col justify-center items-center w-full max-w-[678px] gap-8">
        {/* Logo + title — column layout in onboarding */}
        <div className="flex flex-row items-center gap-4">
          <Logo variant="column" />
        </div>

        {/* Instruction + form */}
        <div className="flex flex-col items-start w-full gap-6">
          <p className="w-full text-center font-bold text-[#1F1F1F] text-base leading-snug">
            {INSTRUCTION}
          </p>

          {/* Form: 2 rows × 2 columns, RTL order (first field right, second left) */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start w-full gap-5"
          >
            {/* Row 1: الاسم الكامل (disabled) | البريد الإلكتروني (editable) */}
            <div className="flex flex-row items-start w-full gap-4 flex-wrap">
              <div className="flex flex-col items-start gap-1.5 flex-1 min-w-[200px]">
                <label className={labelClass}>{LABELS.full_name}</label>
                <Input
                  value={form.full_name}
                  readOnly
                  disabled
                  className={inputDisabledClass}
                  dir="rtl"
                  placeholder={LABELS.full_name}
                />
                {errors.full_name && (
                  <span className="text-xs text-red-500 text-left">{errors.full_name}</span>
                )}
              </div>
              <div className="flex flex-col items-start gap-1.5 flex-1 min-w-[200px]">
                <label className={labelClass}>{LABELS.email}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className={inputClass}
                  dir="rtl"
                  placeholder={LABELS.email}
                />
                {errors.email && (
                  <span className="text-xs text-red-500 text-left">{errors.email}</span>
                )}
              </div>
            </div>

            {/* Row 2: رقم الهوية (editable) | رقم الجوال (disabled) */}
            <div className="flex flex-row items-start w-full gap-4 flex-wrap">
              <div className="flex flex-col items-start gap-1.5 flex-1 min-w-[200px]">
                <label className={labelClass}>{LABELS.id_number}</label>
                <Input
                  value={form.id_number}
                  onChange={(e) => update('id_number', e.target.value)}
                  className={inputClassIdMobile}
                  dir="rtl"
                  placeholder={LABELS.id_number}
                />
                {errors.id_number && (
                  <span className="text-xs text-red-500 text-left">{errors.id_number}</span>
                )}
              </div>
              <div className="flex flex-col items-start gap-1.5 flex-1 min-w-[200px]">
                <label className={labelClass}>{LABELS.mobile}</label>
                <Input
                  value={form.mobile}
                  readOnly
                  disabled
                  className={inputDisabledClass}
                  dir="rtl"
                  placeholder={LABELS.mobile}
                />
                {errors.mobile && (
                  <span className="text-xs text-red-500 text-left">{errors.mobile}</span>
                )}
              </div>
            </div>

            {submitError && (
              <p className="w-full text-left text-sm text-red-600">{submitError}</p>
            )}

            {/* Main submit button */}
            <div className="w-full flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#044D4E] hover:bg-[#044D4E]/90 text-white rounded-lg px-8 py-3 text-sm font-medium"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
