import { useState, useEffect } from "react";
import { AlertCircle, Lock } from "lucide-react";
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
      const recaptchaToken = await getRecaptchaToken("register");

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

  // Keep register draft in Redux so values survive remounts (but reset on full reload).
  useEffect(() => {
    // storing password in-memory only (Redux is not persisted) so it clears on page reload
    // and is cleared automatically when registration succeeds.
    dispatch(setRegisterDraft(form));
  }, [dispatch, form]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Create an account
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Join us and start shopping today
        </p>

        <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-xs font-semibold text-emerald-700">Your Privacy Matters</p>
          </div>
          <p className="mt-1 text-xs leading-4 tracking-tight text-gray-600">
            We use your information to create your account, process
            
            orders, provide customer support, and keep your account secure.
          </p>
          <Link
            to="/privacy"
            className="mt-1 inline-flex items-center text-xs font-medium text-emerald-700 hover:underline"
          >
            Privacy Policy
            <span aria-hidden className="ml-1">›</span>
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mt-4 flex items-start gap-2 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700"
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
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500">Must be at least 8 characters</p>
          {/* reCAPTCHA Notice */}
          <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-blue-600 text-lg">🛡️</div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-700">
                Protected by Google reCAPTCHA
              </p>
              <p>We use reCAPTCHA to prevent spam and abuse.</p>
            </div>
          </div>

          {/* Button (same as Navbar color) */}
          <Button
            type="submit"
            loading={isLoading}
            disabled={!isFormValid || isLoading}
          >
            Create Account
          </Button>

          {/* Social Register */}
          <SocialAuthSection />
          {/* Phone Authentication Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />

            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Or
            </span>

            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Phone Authentication */}
          <PhoneAuthSection />
        </form>

        {/* Footer */}
        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-black hover:underline">
            Login
          </Link>
        </p>

        {/* Legal */}
        <p className="mt-4 text-[10px] text-center text-gray-400">
          This site is protected by reCAPTCHA and the Google
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            className="underline mx-1"
          >
            Privacy Policy
          </a>
          and
          <a
            href="https://policies.google.com/terms"
            target="_blank"
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
