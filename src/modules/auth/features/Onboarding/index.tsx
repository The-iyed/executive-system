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

/** Submit verified onboarding data. Backend may PATCH /api/auth/me or a dedicated onboarding endpoint. */
export async function submitOnboardingApi(
  payload: OnboardingFormData
): Promise<void> {
  await axiosInstance.patch('/api/auth/me', payload);
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
    if (!form.full_name?.trim()) newErrors.full_name = 'الاسم الكامل مطلوب';
    if (!form.email?.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'البريد الإلكتروني غير صحيح';
    if (!form.id_number?.trim()) newErrors.id_number = 'رقم الهوية مطلوب';
    if (!form.mobile?.trim()) newErrors.mobile = 'رقم الجوال مطلوب';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await submitOnboardingApi(form);
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
    'h-[26px] px-2 py-1.5 text-right text-[9.42px] leading-[14px] bg-[#F8FBFF] border border-[#EBF3FD] rounded-[4.71px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#044D4E]/30 focus:border-[#044D4E]';
  const inputClassIdMobile =
    'h-[26px] px-2 py-1.5 text-right text-[9.42px] leading-[14px] bg-white border border-[#D0D5DD] rounded-[4.71px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#044D4E]/30 focus:border-[#044D4E]';
  const labelClass = 'text-[8.24px] leading-[12px] text-[#344054] font-normal';

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col justify-center items-center p-0 gap-6 bg-[#ECF0F1]"
      dir="rtl"
      style={{ fontFamily: "'Almarai', sans-serif" }}
    >
      {/* Frame 2147241214: flex column, center, gap 24px, max-width 678px */}
      <div
        className="flex flex-col justify-center items-center p-0 gap-6 w-full max-w-[678px]"
        style={{ gap: 24 }}
      >
        {/* Logo + title block (Frame 2147240061 / 2147240274) */}
        <div className="flex flex-row items-center gap-4" style={{ transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}>
          <Logo />
        </div>

        {/* Frame 2147241213: instruction + form */}
        <div className="flex flex-col items-start w-full gap-[18px]">
          <p
            className="w-full text-center font-bold text-[#1F1F1F] text-[14.81px] leading-[17px]"
            style={{ fontFamily: "'Almarai', sans-serif" }}
          >
            {INSTRUCTION}
          </p>

          {/* Frame 2147241212: form fields in 2 rows, 2 columns */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start w-full gap-[9px]"
          >
            {/* Row 1: الاسم الكامل | البريد الإلكتروني */}
            <div className="flex flex-row items-start w-full gap-[14px] flex-wrap">
              <div className="flex flex-col items-end gap-[3.5px] flex-1 min-w-0">
                <label className={labelClass}>{LABELS.full_name}</label>
                <Input
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  className={inputClass}
                  dir="rtl"
                  placeholder={LABELS.full_name}
                />
                {errors.full_name && (
                  <span className="text-[10px] text-red-500">{errors.full_name}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-[3.5px] flex-1 min-w-0">
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
                  <span className="text-[10px] text-red-500">{errors.email}</span>
                )}
              </div>
            </div>

            {/* Row 2: رقم الهوية | رقم الجوال (no توثيق buttons) */}
            <div className="flex flex-row items-start w-full gap-[14px] flex-wrap">
              <div className="flex flex-col items-end gap-[3.5px] flex-1 min-w-0">
                <label className={labelClass}>{LABELS.id_number}</label>
                <Input
                  value={form.id_number}
                  onChange={(e) => update('id_number', e.target.value)}
                  className={inputClassIdMobile}
                  dir="rtl"
                  placeholder={LABELS.id_number}
                />
                {errors.id_number && (
                  <span className="text-[10px] text-red-500">{errors.id_number}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-[3.5px] flex-1 min-w-0">
                <label className={labelClass}>{LABELS.mobile}</label>
                <Input
                  value={form.mobile}
                  onChange={(e) => update('mobile', e.target.value)}
                  className={inputClassIdMobile}
                  dir="rtl"
                  placeholder={LABELS.mobile}
                />
                {errors.mobile && (
                  <span className="text-[10px] text-red-500">{errors.mobile}</span>
                )}
              </div>
            </div>

            {submitError && (
              <p className="w-full text-right text-sm text-red-600">{submitError}</p>
            )}

            {/* Main submit button (replaces the two توثيق buttons) */}
            <div className="w-full flex justify-center pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#044D4E] hover:bg-[#044D4E]/90 text-white rounded px-4 py-2.5 text-[9.47px] leading-[12px] font-normal"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'توثيق'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
