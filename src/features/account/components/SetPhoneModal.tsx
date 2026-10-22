import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2, Phone, X } from "lucide-react";
import axios from "axios";
import { authFeatureApi } from "@/features/auth/api/authApi";

interface SetPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phone: string) => void;
}

const SetPhoneModal: React.FC<SetPhoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isLoading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 9 digits maximum (Myanmar mobile numbers are 8-9 digits after +95)
    const limitedDigits = digitsOnly.slice(0, 9);

    setPhone(limitedDigits);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const digitsOnly = phone.replace(/\D/g, "");

    // Validate Myanmar mobile number: must be 8-9 digits and start with 9
    if (digitsOnly.length < 8 || digitsOnly.length > 9) {
      setError("Myanmar mobile number must be 8-9 digits. Example: 912345678");
      return;
    }

    if (!digitsOnly.startsWith("9")) {
      setError("Myanmar mobile number must start with 9. Example: 912345678");
      return;
    }

    // Normalize to E.164 format: +95 + digits
    const normalizedPhone = "+95" + digitsOnly;

    setError(null);
    setIsLoading(true);

    try {
      const response = await authFeatureApi.updateProfile({ phone: normalizedPhone });
      const savedPhone = response.data?.data?.user?.phone ?? normalizedPhone;
      onSuccess?.(savedPhone);
      onClose();
    } catch (caughtError: unknown) {
      const apiMessage = axios.isAxiosError(caughtError)
        ? caughtError.response?.data?.message
        : undefined;
      setError(
        apiMessage ||
        (caughtError instanceof Error
          ? caughtError.message
          : "Failed to add phone number. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={isLoading ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-phone-title"
        className="relative z-10 w-full max-w-[460px] rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-7"
      >
        <div className="flex items-center justify-between pb-4">
          <h2
            id="set-phone-title"
            className="text-lg font-bold text-slate-900 sm:text-xl"
          >
            Add Phone Number
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-slate-500">
            Add a phone number to help secure and recover your account.
          </p>
          <div>
            <label
              htmlFor="set-phone-input"
              className="text-sm font-medium text-slate-700"
            >
              Mobile number
            </label>
            <div className="mt-2 flex items-center">
              <div className="flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                +95
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="set-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  onPaste={(event) => {
                    event.preventDefault();
                    const pastedText = event.clipboardData.getData('text');
                    handlePhoneChange(pastedText);
                  }}
                  placeholder="912345678"
                  disabled={isLoading}
                  autoFocus
                  maxLength={9}
                  className="w-full rounded-r-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Enter 8-9 digit Myanmar mobile number (starts with 9)
            </p>
            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-500">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !phone.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Phone Number
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPhoneModal;
