import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { register } from "@/features/auth/store/authThunks";
import { setRegisterDraft } from "@/features/auth/store/authSlice";
import { getRecaptchaToken } from "@/utils/recaptcha";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import SocialAuthSection from "@/features/auth/components/SocialAuthSection";
import PhoneAuthSection from "../components/PhoneAuthSection";

export const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { status, error, registerDraft } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState(registerDraft);

  const isLoading = status === "loading";

  // Calculate completion percentage for the scroll / completion indicator
  const filledFields = [form.name, form.email, form.password].filter(
    (val) => val.trim().length > 0,
  ).length;
  const progressPercentage = (filledFields / 3) * 100;

  const isFormValid =
    form.name.trim() && form.email.trim() && form.password.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || isLoading) return;

    const normalizedForm = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
    };

    try {
      const recaptchaToken = await getRecaptchaToken('register')

      await dispatch(register({ ...normalizedForm, recaptchaToken })).unwrap();

      navigate("/login", { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "requiresVerification" in err) {
        const payload = err as unknown as {
          requiresVerification: boolean;
          email: string;
        };
        navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`, {
          replace: true,
        });
      }
    }
  };

  useEffect(() => {
    dispatch(setRegisterDraft(form));
  }, [dispatch, form]);

  return (
    <div className="min-h-screen bg-[#f4fbf7] px-4 py-6 flex flex-col items-center justify-center relative">
      {/* Top Scroll / Form Completion Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-[#10b981] transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <Card className="w-full max-w-md p-6 sm:p-7 relative shadow-sm border border-emerald-100 bg-white rounded-2xl">
        {/* Profile Avatar Badge Icon */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#e6f4ea] border-4 border-white flex items-center justify-center shadow-sm">
          <svg
            className="w-6 h-6 text-[#10b981]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center mt-4 mb-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Create an account
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Join us and start shopping today
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-3 flex items-start gap-2 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle
              className="mt-[1px] h-4 w-4 shrink-0 text-red-500"
              aria-hidden
            />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Must be at least 8 characters
            </p>
          </div>

          {/* reCAPTCHA Notice */}
          <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <div className="text-emerald-600 text-base">🛡️</div>
            <div className="text-[11px] text-gray-600">
              <span className="font-medium text-gray-700">
                Protected by Google reCAPTCHA
              </span>
            </div>
          </div>

          {/* Button */}
          <Button
            type="submit"
            loading={isLoading}
            disabled={!isFormValid || isLoading}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white transition-colors"
          >
            Create Account
          </Button>

          {/* Social Register */}
          <div className="pt-1">
            <SocialAuthSection />
          </div>

          {/* Phone Authentication Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Or
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Phone Authentication */}
          <PhoneAuthSection />
        </form>

        {/* Footer */}
        <p className="mt-4 text-xs text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-black hover:underline">
            Login
          </Link>
        </p>

        {/* Legal */}
        <p className="mt-2 text-[10px] text-center text-gray-400">
          This site is protected by reCAPTCHA and the Google
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline mx-1"
          >
            Privacy Policy
          </a>
          and
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="underline ml-1"
          >
            Terms of Service
          </a>
          apply.
        </p>
      </Card>
    </div>
  );
};
