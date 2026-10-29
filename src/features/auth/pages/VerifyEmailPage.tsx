import { useState, useEffect, useRef } from "react";
import { AlertCircle, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  verifyEmail,
  resendVerification,
} from "@/features/auth/store/authThunks";
import { markEmailVerified } from "@/features/auth/store/authSlice";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const VerifyEmailPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { status, error, requiresVerification } = useAppSelector((s) => s.auth);

  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get("email") || "";
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : null;

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [expiryTimer, setExpiryTimer] = useState(300);
  const [expired, setExpired] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  const isLoading = status === "loading";

  useEffect(() => {
    if (!email && !requiresVerification) {
      navigate("/register", { replace: true });
    }
  }, [email, requiresVerification, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  useEffect(() => {
    if (expired || expiryTimer <= 0) return;
    if (expiryTimer === 0) {
      setExpired(true);
      setOtp(Array(6).fill(""));
      return;
    }
    const id = setInterval(() => setExpiryTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [expiryTimer, expired]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6 || isLoading) return;

    try {
      await dispatch(verifyEmail({ token: code })).unwrap();
      dispatch(markEmailVerified());
      navigate(safeReturnTo ?? "/login", { replace: true });
    } catch {
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resending || resendTimer > 0 || !email) return;
    setResending(true);
    setResendMessage("");
    try {
      await dispatch(resendVerification({ email })).unwrap();
      setResendTimer(60);
      setExpiryTimer(300);
      setExpired(false);
      setOtp(Array(6).fill(""));
      setResendMessage("Code resent!");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setResendMessage(typeof err === "string" ? err : "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && !value) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      return;
    }
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        <Mail className="mx-auto h-10 w-10 text-gray-400" />

        <h1 className="mt-4 text-2xl font-semibold text-gray-900 text-center">
          Verify your email
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Enter the 6-digit code sent to{" "}
          <strong className="text-gray-900">{email}</strong>
        </p>

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

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <label className="text-sm font-medium block">Verification Code</label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                required
                className="w-12 h-14 border rounded text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            ))}
          </div>

          {expired && (
            <p className="text-xs text-red-600 text-center">
              Code expired. Resend a new one.
            </p>
          )}

          {!expired && (
            <p className="text-xs text-gray-500 text-center">
              Code expires in {Math.floor(expiryTimer / 60)}:
              {String(expiryTimer % 60).padStart(2, "0")}
            </p>
          )}

          <Button
            type="submit"
            loading={isLoading}
            disabled={expired || otp.some((d) => !d) || isLoading}
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-6 text-center">
          {resendMessage && (
            <p
              className={`text-xs mb-2 ${
                resendMessage === "Code resent!"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {resendMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendTimer > 0}
            className="text-sm font-medium text-black hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendTimer > 0
              ? `Resend code in ${resendTimer}s`
              : "Didn't receive the code? Resend"}
          </button>
        </div>
      </Card>
    </div>
  );
};
