import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { Button } from "@gl/components/ui/button";
import { Input } from "@gl/components/ui/input";
import { Label } from "@gl/components/ui/label";
import { useAuth } from "@gl/contexts/AuthContext";
import { loginSchema, type LoginFormData } from "@gl/lib/validations/auth";
import calendarIcon from "@gl/assets/icons/calendar-icon.svg";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setSubmitError(null);
    try {
      await login({
        email_or_username: data.email,
        password: data.password,
      });
      navigate("/");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى."
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Platform branding */}
      <div className="flex items-center gap-2">
        <img src={calendarIcon} alt="" className="size-8" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">المنصة الموحّدة</span>
          <span className="text-xs text-muted-foreground">للمكتب التنفيذي</span>
        </div>
      </div>

      {/* Welcome */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight">مرحباً بك,</h1>
        <p className="text-sm text-muted-foreground">
          قم بتسجيل الدخول للوصول إلى حسابك وإدارة اجتماعاتك بكل سهولة.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            placeholder="أدخل بريدك الإلكتروني"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message as string}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message as string}
            </p>
          )}
        </div>

        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl"
        >
          تسجيل الدخول
        </Button>
      </form>
    </div>
  );
}

export { LoginForm };
