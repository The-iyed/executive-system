import React, { useState } from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { getDefaultRouteForUser } from '@/modules/shared';

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

const Login = () => {
  const { login, isLoading, isSsoEnabled } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSsoLogin = async () => {
    setSubmitError(null);
    try {
      await login();
      // SSO redirects away; no navigation needed
    } catch (error: any) {
      setSubmitError(
        error?.message || 'فشل تسجيل الدخول عبر SSO. يرجى المحاولة مرة أخرى.'
      );
    }
  };

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
      const userData = await login(result.data as { email: string; password: string });
      if (userData) {
        navigate(getDefaultRouteForUser(userData.use_cases, userData.roles), { replace: true });
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
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-row-reverse bg-[#ECF0F1] justify-center items-center" dir="rtl">
      {/* Branding panel — desktop only */}
      <div
        className="w-[43%] my-6 h-[90vh] hidden lg:flex flex-col rounded-l-[14px] overflow-hidden relative flex-shrink-0"
        style={{
          backgroundImage: `url('/assets/bg-auth.svg')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Login form */}
      <div
        className="min-h-screen min-h-[100dvh] w-full lg:w-[50%] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-6 sm:py-10 rounded-none lg:rounded-r-[14px] overflow-y-auto"
      >
        <div className="w-full max-w-[420px] sm:max-w-[520px] text-right">
          {/* Responsive: ministry logo + calendar block in one row (justify-between, reversed). Desktop: calendar block only. */}
          <div className="flex flex-row-reverse justify-between items-start gap-4 mb-1 lg:block lg:mb-0">
    
            <img
              src="/assets/ministry.svg"
              alt="وزارة البلديات والإسكان"
              className="h-12 w-auto object-contain flex-shrink-0 invert lg:hidden"
            />
                    <div>
              {/* Calendar section: icon + title (calendar.svg to left of title in RTL) */}
              <div className="flex items-center gap-2 sm:gap-3 justify-end flex-row-reverse mb-1">
                <span className="text-black font-bold text-xl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                  المنصة الموحدة
                </span>
                <img
                  src="/assets/calendar.svg"
                  alt=""
                  className="w-8 h-8 sm:w-[34px] sm:h-[34px] flex-shrink-0"
                  width={34}
                  height={34}
                />
              </div>
              <p className="text-gray-600 text-sm mb-4 sm:mb-6" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                للمكتب التنفيذي
              </p>
            </div>
          </div>

          <h3 className="text-black font-bold text-xl sm:text-2xl mb-2" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            مرحباً بك،
          </h3>
          <p className="text-gray-700 text-sm mb-6 sm:mb-8 leading-relaxed" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
            قم بتسجيل الدخول للوصول إلى حسابك وإدارة اجتماعاتك بكل سهولة
          </p>

          {isSsoEnabled ? (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={handleSsoLogin}
                disabled={isLoading}
                className="w-full h-12 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: TEAL_DARK, fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
              >
                {isLoading ? 'جاري التحويل...' : 'تسجيل الدخول عبر SSO'}
              </button>
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-right text-sm text-red-600" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                    {submitError}
                  </p>
                </div>
              )}
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-900 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
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
              <label htmlFor="password" className="text-sm font-medium text-gray-900 text-right" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
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
                <p className="text-right text-sm text-red-600" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}>
                  {submitError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: TEAL_DARK, fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
