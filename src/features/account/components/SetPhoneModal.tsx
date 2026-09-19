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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanPhone = phone.trim();
    const normalizedPhone = cleanPhone.replace(/[\s-]/g, "");

    if (!cleanPhone || !/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
      setError("Please enter a valid phone number (7-15 digits).");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await authFeatureApi.updateProfile({ phone: cleanPhone });
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
              Phone number
            </label>
            <div className="relative mt-2">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                id="set-phone-input"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setError(null);
                }}
                placeholder="Enter your phone number"
                disabled={isLoading}
                autoFocus
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
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
