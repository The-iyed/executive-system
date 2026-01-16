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

const Login = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (field: keyof LoginFormData, value: string) => {
    // Validate individual field using the schema shape
    const fieldSchema = field === 'email' 
      ? loginSchema.shape.email 
      : loginSchema.shape.password;
    
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
    if (field === 'email') {
      validateField('email', email);
    } else if (field === 'password') {
      validateField('password', password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate the entire form
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof LoginFormData;
        if (field) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    // Handle login
    try {
      const userData = await login(result.data);
      // Ensure user data is loaded before navigation
      if (userData) {
        // Navigate to user's default route based on use cases
        const defaultRoute = getDefaultRouteForUser(userData.use_cases);
        navigate(defaultRoute, { replace: true });
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
    <div className="w-full h-full flex items-center justify-center px-4 sm:px-6 md:px-8">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 sm:gap-5 md:gap-6 w-full max-w-[725px] bg-[#FFFFFF] p-4 sm:p-5 md:p-6 rounded-[11.3561px]"
        style={{
          boxShadow: '0px 2.52357px 20.8195px rgba(58, 168, 124, 0.25)',
        }}
        dir="rtl"
      >
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label 
            htmlFor="email"
            className="text-right text-sm font-medium text-gray-900"
          >
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                validateField('email', e.target.value);
              }
            }}
            onBlur={() => handleBlur('email')}
            placeholder="أدخل بريدك الإلكتروني"
            className={`w-full h-12 px-4 rounded-lg border bg-white text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.email && touched.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 focus:ring-[#048F86]'
            }`}
            dir="rtl"
          />
          {errors.email && touched.email && (
            <p className="text-right text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label 
            htmlFor="password"
            className="text-right text-sm font-medium text-gray-900"
          >
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) {
                validateField('password', e.target.value);
              }
            }}
            onBlur={() => handleBlur('password')}
            placeholder="أدخل كلمة المرور"
            className={`w-full h-12 px-4 rounded-lg border bg-white text-right text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.password && touched.password
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-200 focus:ring-[#048F86]'
            }`}
            dir="rtl"
          />
          {errors.password && touched.password && (
            <p className="text-right text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-right text-sm text-red-600">{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-lg text-white font-medium text-sm shadow-sm transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(90deg, #048F86 -7%, #6DCDCD 100%)',
          }}
        >
          {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  );
};

export default Login;