import React, { useEffect, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, X } from "lucide-react";
import axios from "axios";
import { authFeatureApi } from "@/features/auth/api/authApi";

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmation("");
      setShowPassword(false);
      setShowConfirmation(false);
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

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await authFeatureApi.setPassword(password, confirmation);
      onSuccess?.();
      onClose();
    } catch (caughtError: unknown) {
      const apiMessage = axios.isAxiosError(caughtError)
        ? caughtError.response?.data?.message
        : undefined;
      setError(
        apiMessage ||
          (caughtError instanceof Error
            ? caughtError.message
            : "Failed to set password. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={isLoading ? undefined : onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-password-title"
        className="relative z-10 w-full max-w-[460px] rounded-2xl border border-slate-100 bg-white p-6 shadow-xl sm:p-7"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2
              id="set-password-title"
              className="text-lg font-bold text-slate-900 sm:text-xl"
            >
              Set Password
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a password for your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-5">
          {[
            {
              id: "set-password-input",
              label: "New password",
              value: password,
              setValue: setPassword,
              visible: showPassword,
              setVisible: setShowPassword,
              placeholder: "At least 8 characters",
            },
            {
              id: "set-password-confirmation",
              label: "Confirm password",
              value: confirmation,
              setValue: setConfirmation,
              visible: showConfirmation,
              setVisible: setShowConfirmation,
              placeholder: "Re-enter your password",
            },
          ].map((field) => (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className="text-sm font-medium text-slate-700"
              >
                {field.label}
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id={field.id}
                  type={field.visible ? "text" : "password"}
                  value={field.value}
                  onChange={(event) => {
                    field.setValue(event.target.value);
                    setError(null);
                  }}
                  placeholder={field.placeholder}
                  disabled={isLoading}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => field.setVisible((visible) => !visible)}
                  className="absolute right-3 top-2.5 text-slate-400"
                  aria-label={`Show ${field.label}`}
                >
                  {field.visible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-rose-500">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
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
              disabled={isLoading || !password || !confirmation}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Set Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordModal;
