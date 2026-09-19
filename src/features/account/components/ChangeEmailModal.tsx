import React, { useEffect, useState } from "react";
import { X, Mail, Loader2, AlertCircle } from "lucide-react";
import { authFeatureApi } from "@/features/auth/api/authApi";

interface ChangeEmailModalProps {
  isOpen: boolean;
  currentEmail: string;
  onClose: () => void;
  onSuccess?: (newEmail: string) => void;
}

const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  currentEmail,
  onClose,
  onSuccess,
}) => {
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setNewEmail("");
      setOtp("");
      setStep("email");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim();

    if (step === "email" && !cleanEmail) {
      setError("Please enter your new email address.");
      return;
    }

    if (step === "email" && !validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (
      step === "email" &&
      cleanEmail.toLowerCase() === currentEmail.toLowerCase()
    ) {
      setError("New email must be different from current email.");
      return;
    }

    if (step === "otp" && !/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (step === "email") {
        await authFeatureApi.requestEmailChange(cleanEmail);
        setStep("otp");
        return;
      }

      const response = await authFeatureApi.verifyEmailChange(otp);
      onSuccess?.(response.data?.data?.user?.email ?? cleanEmail);
      onClose();
    } catch (err: unknown) {
      const apiMessage =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      const message = err instanceof Error ? err.message : undefined;
      setError(
        apiMessage || message || "Failed to update email. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-email-title"
        className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-7 z-10 transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-4">
          <h2
            id="change-email-title"
            className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
          >
            {step === "email" ? "Change Email" : "Verify New Email"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Current Email Block */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-500">
              Current email
            </label>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 font-mono tracking-tight">
              {currentEmail}
            </p>
          </div>

          {/* New Email Input Block */}
          <div>
            <label
              htmlFor="new-email-input"
              className="block text-xs sm:text-sm font-medium text-slate-700"
            >
              {step === "email" ? "New email" : "Verification code"}
            </label>
            <div className="relative mt-2 flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="new-email-input"
                type={step === "email" ? "email" : "tel"}
                value={step === "email" ? newEmail : otp}
                onChange={(e) => {
                  if (step === "email") {
                    setNewEmail(e.target.value);
                  } else {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  }
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder={
                  step === "email"
                    ? "Enter your new email address"
                    : "Enter 6-digit code"
                }
                className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                  error
                    ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                }`}
                autoFocus
              />
            </div>

            {error && (
              <p className="mt-2 text-xs text-rose-500 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading || (step === "email" ? !newEmail.trim() : !otp.trim())
              }
              className="px-6 py-2.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {step === "email" ? "Confirm Email Change" : "Verify & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeEmailModal;
