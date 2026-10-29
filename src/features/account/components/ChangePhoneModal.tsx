import React, { useEffect, useState } from "react";
import { X, Phone, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";
import { authFeatureApi } from "@/features/auth/api/authApi";

interface ChangePhoneModalProps {
  isOpen: boolean;
  currentPhone?: string;
  onClose: () => void;
  onSuccess?: (newPhone: string) => void;
}

const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({
  isOpen,
  currentPhone = "Not set",
  onClose,
  onSuccess,
}) => {
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state on open or close
  useEffect(() => {
    if (isOpen) {
      setNewPhone("");
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

  const validatePhone = (phone: string) => {
    // Allows Myanmar phone format: +95 or 0 prefix, 7-10 digits
    const cleaned = phone.replace(/[\s-]/g, "");
    return /^(\+95|0)?[0-9]{7,10}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim();

    // Normalize phone number for Myanmar
    let normalizedPhone = cleanPhone.replace(/[\s-]/g, "");

    // Add +95 prefix if not present
    if (!normalizedPhone.startsWith("+")) {
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+95" + normalizedPhone.substring(1);
      } else if (normalizedPhone.startsWith("95")) {
        normalizedPhone = "+" + normalizedPhone;
      } else if (normalizedPhone.startsWith("9")) {
        normalizedPhone = "+95" + normalizedPhone;
      } else {
        normalizedPhone = "+95" + normalizedPhone;
      }
    }

    if (!cleanPhone) {
      setError("Please enter your new phone number.");
      return;
    }

    if (!validatePhone(cleanPhone)) {
      setError("Please enter a valid Myanmar phone number (7-10 digits). Example: 0912345678 or +95912345678");
      return;
    }

    if (normalizedPhone === currentPhone || cleanPhone === currentPhone) {
      setError("New phone number must be different from current phone number.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await authFeatureApi.updateProfile({
        phone: normalizedPhone,
      });
      const savedPhone = response.data?.data?.user?.phone ?? normalizedPhone;

      onSuccess?.(savedPhone);
      onClose();
    } catch (err: unknown) {
      const apiMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;

      setError(
        apiMessage ||
        (err instanceof Error
          ? err.message
          : "Failed to update phone number. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-phone-title"
        className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-7 z-10 transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-4">
          <h2
            id="change-phone-title"
            className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
          >
            Change Phone Number
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
          {/* Current Phone */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-500">
              Current phone number
            </label>
            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-800 font-mono tracking-tight">
              {currentPhone}
            </p>
          </div>

          {/* New Phone Number Input */}
          <div>
            <label
              htmlFor="new-phone-input"
              className="block text-xs sm:text-sm font-medium text-slate-700"
            >
              New phone number
            </label>
            <div className="relative mt-2 flex items-center">
              <Phone className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="new-phone-input"
                type="tel"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder="Enter your new phone number (e.g. 0912345678 or +95912345678)"
                className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${error
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

          {/* Action Buttons */}
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
              disabled={isLoading || !newPhone.trim()}
              className="px-6 py-2.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Phone Number Change
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePhoneModal;
