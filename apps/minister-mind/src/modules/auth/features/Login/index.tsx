import React, { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@auth';
import { getDefaultRouteForUser } from '@shared';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('يرجى إدخال بريد إلكتروني صحيح'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const TEAL_DARK = '#1f4848';

/** Ministry emblem placeholder (shield outline) - replace src with actual ministry logo asset if available */
const MinistryEmblem = () => (
  <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  </div>
);

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (field: keyof LoginFormData, value: string) => {
    const fieldSchema = field === 'email' ? loginSchema.shape.email : loginSchema.shape.password;
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

  const handleBlur = (field: keyof LoginFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') validateField('email', email);
    else if (field === 'password') validateField('password', password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setTouched({ email: true, password: true });
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof LoginFormData;
        if (field) fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      const userData = await login(result.data);
      if (userData) {
        navigate(getDefaultRouteForUser(userData.use_cases), { replace: true });
      }
    } catch (error: any) {
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#ECF0F1] flex-row-reverse justify-center items-center" dir="rtl">
      {/* Left column - Branding with bg-auth.svg */}
      <div
        className="w-[43%] my-6 h-[90vh] hidden lg:flex flex-col rounded-l-[14px] overflow-hidden relative"
        style={{

          backgroundImage: `url('/assets/bg-auth.svg')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
       
      </div>

      {/* Right column - Login form */}
      <div
        className="min-h-screen w-[50%] flex justify-start items-center px-6 py-10 rounded-r-[14px] lg:rounded-r-none"
      >
        {/* Mobile: brief branding bar */}
        <div className="lg:hidden flex items-center gap-2 justify-end py-3 mb-4 rounded-lg" style={{ backgroundColor: TEAL_DARK }}>
          <MinistryEmblem />
          <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Almarai', sans-serif" }}>
            وزارة البلديات والإسكان
          </span>
        </div>
        <div className="w-full max-w-[520px] text-right">
          {/* Calendar section: icon + title (calendar.svg to left of title in RTL) */}
          <div className="flex items-center gap-3 justify-end flex-row-reverse mb-1">
            <span className="text-black font-bold text-xl" style={{ fontFamily: "'Almarai', sans-serif" }}>
              المنصة الموحدة
            </span>
            <img
              src="/assets/calendar.svg"
              alt=""
              className="w-[34px] h-[34px] flex-shrink-0"
              width={34}
              height={34}
            />
          </div>
          <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: "'Almarai', sans-serif" }}>
            للمكتب التنفيذي
          </p>

          <h3 className="text-black font-bold text-2xl mb-2" style={{ fontFamily: "'Almarai', sans-serif" }}>
            مرحباً بك،
          </h3>
          <p className="text-gray-700 text-sm mb-8" style={{ fontFamily: "'Almarai', sans-serif" }}>
            قم بتسجيل الدخول للوصول إلى حسابك وإدارة اجتماعاتك بكل سهولة
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) validateField('email', e.target.value);
                }}
                onBlur={() => handleBlur('email')}
                placeholder="أدخل بريدك الإلكتروني"
                className={`w-full h-12 px-4 rounded-lg border bg-white text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.email && touched.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#1f4848]'
                }`}
                dir="rtl"
              />
              {errors.email && touched.email && (
                <p className="text-right text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-900 text-right" style={{ fontFamily: "'Almarai', sans-serif" }}>
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) validateField('password', e.target.value);
                }}
                onBlur={() => handleBlur('password')}
                placeholder="أدخل كلمة المرور"
                className={`w-full h-12 px-4 rounded-lg border bg-white text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.password && touched.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-[#1f4848]'
                }`}
                dir="rtl"
              />
              {errors.password && touched.password && (
                <p className="text-right text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-right text-sm text-red-600" style={{ fontFamily: "'Almarai', sans-serif" }}>
                  {submitError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: TEAL_DARK, fontFamily: "'Almarai', sans-serif" }}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
